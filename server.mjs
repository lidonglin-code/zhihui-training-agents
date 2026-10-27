import http from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { guardLocalRequest, redactProviderError, secureModelRequest, validateModelUrl } from "./server-security.mjs";
import {resolveRequestPolicy} from "./dist/model-policy.js";
import { unzipSync, strFromU8 } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const projectRoot = fileURLToPath(new URL("./", import.meta.url));
const root = join(projectRoot, "dist");
const port = Number(process.env.PORT || 4173);
const maxFileBytes = 8 * 1024 * 1024;
const maxExtractedChars = 180_000;
const mime = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".json":"application/json; charset=utf-8",".md":"text/markdown; charset=utf-8"};

function json(res, status, payload) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || "")) throw new Error("请求必须使用 application/json");
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16_000_000) throw new Error("请求内容过大");
  }
  return JSON.parse(body || "{}");
}

function decodeXml(value) {
  return value
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function extractDocx(buffer) {
  const files = unzipSync(new Uint8Array(buffer), {filter:file => {
    if (file.name !== "word/document.xml") return false;
    if (file.originalSize > 16 * 1024 * 1024) throw new Error("Word 解压后的正文过大");
    return true;
  }});
  const documentXml = files["word/document.xml"];
  if (!documentXml) throw new Error("无法读取这个 Word 文件的正文");
  const xml = strFromU8(documentXml);
  return decodeXml(xml
    .replace(/<w:tab\b[^>]*\/?\s*>/g, "\t")
    .replace(/<w:br\b[^>]*\/?\s*>/g, "\n")
    .replace(/<\/w:p>/g, "\n\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<[^>]+>/g, ""));
}

async function extractPdf(buffer) {
  const loadingTask = getDocument({data:new Uint8Array(buffer),useSystemFonts:true,disableFontFace:true});
  const document = await loadingTask.promise;
  const pages = [];
  try {
    for (let index = 1; index <= document.numPages; index += 1) {
      const page = await document.getPage(index);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        pageText += item.str;
        pageText += item.hasEOL ? "\n" : " ";
      }
      pages.push(`【第 ${index} 页】\n${pageText.trim()}`);
      page.cleanup();
      if (pages.join("\n\n").length > maxExtractedChars) break;
    }
  } finally { await loadingTask.destroy(); }
  const text = pages.join("\n\n").trim();
  if (!text) throw new Error("没有从 PDF 中识别到文字；扫描版 PDF 请先进行 OCR");
  return text;
}

async function extractFile(payload) {
  const name = basename(String(payload?.name || "未命名文件"));
  const extension = extname(name).toLowerCase();
  const supported = new Set([".txt", ".md", ".csv", ".json", ".pdf", ".docx"]);
  if (!supported.has(extension)) throw new Error("暂不支持这种文件格式");
  const buffer = Buffer.from(String(payload?.data || ""), "base64");
  if (!buffer.length) throw new Error("文件内容为空");
  if (buffer.length > maxFileBytes) throw new Error("单个文件不能超过 8 MB");
  let text;
  if (extension === ".docx") text = extractDocx(buffer);
  else if (extension === ".pdf") text = await extractPdf(buffer);
  else text = buffer.toString("utf8");
  text = text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
  const truncated = text.length > maxExtractedChars;
  if (truncated) text = `${text.slice(0, maxExtractedChars)}\n\n【文件内容较长，已在本机截取前 ${maxExtractedChars.toLocaleString("zh-CN")} 字】`;
  return {name,text,characters:text.length,truncated,extension};
}

function endpoint(baseUrl) {
  if (/\/chat\/completions\/?$/i.test(baseUrl)) return baseUrl;
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("chat/completions", base).toString();
}

function modelMessageText(message) {
  if (typeof message?.content === "string" && message.content.trim()) return message.content;
  if (Array.isArray(message?.content)) {
    const text = message.content.map(item => typeof item === "string" ? item : item?.text || "").filter(Boolean).join("\n").trim();
    if (text) return text;
  }
  return "";
}

function safeResponseSchema(value) {
  if (!value || typeof value !== "object" || typeof value.name !== "string" || !value.schema || typeof value.schema !== "object") return null;
  return JSON.stringify(value).length <= 60_000 ? value : null;
}

async function callModel(config, messages, maxTokens = 6000, options = {}, requestModel = secureModelRequest) {
  if (!config?.baseUrl || !config?.model || !config?.apiKey) throw new Error("模型配置不完整");
  validateModelUrl(config.baseUrl);
  const modelUrl = validateModelUrl(endpoint(config.baseUrl));
  const policy = resolveRequestPolicy(config,{phase:options.phase,maxTokens});
  config = policy.config;
  maxTokens = policy.maxTokens;
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener("abort",cancel,{once:true});
  if (options.signal?.aborted) cancel();
  const providerHost = new URL(config.baseUrl).hostname;
  const providerId = String(config.provider || "");
  const isSiliconFlow = providerId.startsWith("siliconflow") || providerHost === "api.siliconflow.cn";
  const timeout = setTimeout(() => controller.abort(), options.isTest ? 120_000 : 240_000);
  const tokenField = providerHost === "api.openai.com"
    ? {max_completion_tokens:maxTokens}
    : {max_tokens:maxTokens};
  const responseSchema = safeResponseSchema(options.responseSchema);
  const supportsJson = isSiliconFlow || providerId === "deepseek" || (providerId === "qwen" && /^qwen3\.[78]-(?:plus|max|flash)/i.test(config.model));
  const formatField = options.jsonMode && supportsJson
    ? {response_format:isSiliconFlow && responseSchema ? {type:"json_schema",json_schema:responseSchema} : {type:"json_object"}} : {};
  let thinkingField = {};
  const wantsThinking = config.thinking === "enabled";
  const reasoningEffort = String(config.reasoningEffort || "").trim();
  if (isSiliconFlow) {
    thinkingField = {enable_thinking:options.isTest ? false : wantsThinking};
  } else if (providerId === "deepseek") {
    const enabled = options.isTest ? false : wantsThinking;
    thinkingField = {thinking:{type:enabled ? "enabled" : "disabled"}};
    if (enabled && reasoningEffort) thinkingField.reasoning_effort = reasoningEffort;
  } else if (providerId === "zhipu") {
    const alwaysThinking = /^glm-5\.3/i.test(config.model);
    const enabled = alwaysThinking || wantsThinking;
    thinkingField = {thinking:{type:enabled ? "enabled" : "disabled"}};
    if (enabled) thinkingField.reasoning_effort = options.isTest ? "low" : (reasoningEffort || "low");
  } else if (providerId === "qwen") {
    thinkingField = {reasoning_effort:options.isTest ? "none" : (reasoningEffort || (wantsThinking ? "medium" : "none"))};
  } else if (providerId === "kimi" || providerId === "openai") {
    if (reasoningEffort) thinkingField = {reasoning_effort:options.isTest ? "low" : reasoningEffort};
  }
  let response;
  try {
    response = await requestModel(modelUrl.toString(), {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${config.apiKey}`},
      body:JSON.stringify({model:config.model,messages,...tokenField,...formatField,...thinkingField}),
      signal:controller.signal
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = null; }
    if (!response.ok) {
      const message = redactProviderError(data?.error?.message || data?.message || `模型服务返回 ${response.status}`,config.apiKey);
      const code = /余额不足|insufficient.*(?:balance|quota)|quota.*exceeded/i.test(message) ? "BALANCE"
        : response.status === 401 ? "AUTH" : response.status === 402 ? "BALANCE"
        : response.status === 429 || response.status >= 500 ? "SERVICE_BUSY"
        : /model.*(?:not found|unavailable|does not exist)|模型.*(?:不存在|不可用)/i.test(message) ? "MODEL_UNAVAILABLE" : "MODEL_ERROR";
      throw Object.assign(new Error(message),{code,retryable:code === "SERVICE_BUSY"});
    }
    if (!data) throw Object.assign(new Error("模型服务返回的响应无法读取"),{code:"NETWORK",retryable:true});
    const choice = data?.choices?.[0];
    const content = modelMessageText(choice?.message);
    const finishReason = choice?.finish_reason || "stop";
    const integer = value => Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;
    const result = {content,finishReason,usage:{promptTokens:integer(data.usage?.prompt_tokens),completionTokens:integer(data.usage?.completion_tokens),reasoningTokens:integer(data.usage?.completion_tokens_details?.reasoning_tokens)},budget:{maxTokens,reasoningEffort:config.reasoningEffort || "default"}};
    if (options.isTest) {
      if (!content && options.allowReasoning && choice?.message?.reasoning_content && finishReason !== "length") return {...result,content:"模型已成功响应"};
      if (!content && finishReason === "length") throw Object.assign(new Error("连接已到达模型，但检测回复达到输出上限，请稍后重试"),{code:"OUTPUT_TRUNCATED",retryable:true});
    }
    // A partial body is returned with explicit termination metadata. It must
    // never be mistaken for a complete deliverable by the generation engine.
    if (!content && finishReason !== "length") throw Object.assign(new Error("模型服务没有返回可读取正文"),{code:finishReason === "content_filter" ? "CONTENT_FILTER" : "EMPTY_OUTPUT",retryable:finishReason !== "content_filter"});
    return result;
  } catch (error) {
    if (error?.name === "AbortError") throw Object.assign(new Error("模型响应超时，已完成内容可保留后继续"),{code:"TIMEOUT",retryable:true});
    throw Object.assign(new Error(redactProviderError(error?.message,config.apiKey)),{code:error.code && /^[A-Z_]{3,30}$/.test(error.code) ? error.code : "NETWORK",retryable:error.retryable ?? !error.code});
  } finally { clearTimeout(timeout); options.signal?.removeEventListener("abort",cancel); }
}

async function serveFile(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";
  const base = root;
  const relative = normalize(pathname).replace(/^([/\\])+/, "");
  if (relative.split(/[/\\]/).some(part => part.startsWith("."))) return json(res, 403, {error:"禁止访问"});
  const file = join(base, relative);
  if (file !== base && !file.startsWith(`${base}/`)) return json(res, 403, {error:"禁止访问"});
  try {
    const info = await stat(file);
    const target = info.isDirectory() ? join(file, "index.html") : file;
    const actual = await realpath(target);
    if (!actual.startsWith(`${await realpath(base)}/`)) return json(res, 403, {error:"禁止访问"});
    const content = await readFile(actual);
    res.writeHead(200, {"Content-Type":mime[extname(target)] || "application/octet-stream","Cache-Control":"no-cache"});
    res.end(content);
  } catch { json(res, 404, {error:"未找到页面"}); }
}

export function createAppServer({requestModel = secureModelRequest} = {}) {
return http.createServer(async (req, res) => {
  const requestAbort=new AbortController();
  res.once("close",()=>requestAbort.abort());
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  try {
    const denied = guardLocalRequest(req);
    if (denied) return json(res, 403, {error:denied});
    if (req.method === "POST" && req.url === "/api/files/extract") {
      const payload = await readJson(req);
      const extracted = await extractFile(payload);
      return json(res, 200, {ok:true,...extracted});
    }
    if (req.method === "POST" && req.url === "/api/model/test") {
      const {config} = await readJson(req);
      const result = await callModel(config, [{role:"user",content:"只回复：连接成功"}], 512, {allowReasoning:true,isTest:true,signal:requestAbort.signal}, requestModel);
      return json(res, 200, {ok:true,...result});
    }
    if (req.method === "POST" && req.url === "/api/model/chat") {
      const {config,messages,maxTokens,responseSchema,phase} = await readJson(req);
      if (!Array.isArray(messages) || !messages.length) return json(res, 400, {error:"缺少分析内容"});
      const safeMaxTokens = resolveRequestPolicy(config,{phase,maxTokens}).maxTokens;
      const result = await callModel(config, messages, safeMaxTokens, {jsonMode:true,responseSchema,phase,signal:requestAbort.signal}, requestModel);
      return json(res, 200, {ok:true,...result});
    }
    if (req.method === "GET" || req.method === "HEAD") return serveFile(req, res);
    json(res, 405, {error:"不支持的请求"});
  } catch (error) {
    if (res.destroyed) return;
    json(res, 502, {error:error instanceof Error ? redactProviderError(error.message) : "本地服务错误",code:error.code || "LOCAL_ERROR",retryable:Boolean(error.retryable)});
  }
});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) createAppServer().listen(port, "127.0.0.1", () => {
  console.log(`新境企业培训 AI 工具已启动：http://127.0.0.1:${port}`);
});
