import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, strFromU8 } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const projectRoot = fileURLToPath(new URL("./", import.meta.url));
const root = join(projectRoot, "dist");
const prdRoot = join(projectRoot, "..", "PRD");
const port = Number(process.env.PORT || 4173);
const maxFileBytes = 8 * 1024 * 1024;
const maxExtractedChars = 180_000;
const mime = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".json":"application/json; charset=utf-8",".md":"text/markdown; charset=utf-8"};

function json(res, status, payload) {
  res.writeHead(status, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
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
  const files = unzipSync(new Uint8Array(buffer));
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

async function callModel(config, messages, maxTokens = 6000, options = {}) {
  if (!config?.baseUrl || !config?.model || !config?.apiKey) throw new Error("模型配置不完整");
  const controller = new AbortController();
  const providerHost = new URL(config.baseUrl).hostname;
  const providerId = String(config.provider || "");
  const isSiliconFlow = providerId.startsWith("siliconflow") || providerHost === "api.siliconflow.cn";
  const timeout = setTimeout(() => controller.abort(), options.isTest ? 120_000 : 240_000);
  const tokenField = providerHost === "api.openai.com"
    ? {max_completion_tokens:maxTokens}
    : {max_tokens:maxTokens};
  const responseSchema = safeResponseSchema(options.responseSchema);
  const formatField = options.jsonMode && isSiliconFlow
    ? {response_format:responseSchema ? {type:"json_schema",json_schema:responseSchema} : {type:"json_object"}}
    : {};
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
    response = await fetch(endpoint(config.baseUrl), {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${config.apiKey}`},
      body:JSON.stringify({model:config.model,messages,...tokenField,...formatField,...thinkingField}),
      signal:controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("模型响应超时，请稍后重试或减少输入材料");
    throw error;
  } finally { clearTimeout(timeout); }
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = null; }
  if (!response.ok) throw new Error(data?.error?.message || data?.message || `模型服务返回 ${response.status}`);
  const choice = data?.choices?.[0];
  const content = modelMessageText(choice?.message);
  if (!content && options.allowReasoning && choice?.message?.reasoning_content) return "模型已成功响应";
  if (!content && choice?.finish_reason === "length") throw new Error("模型已响应，但输出在形成正文前达到 Token 上限");
  if (!content) throw new Error("模型服务没有返回可读取正文");
  return content;
}

async function serveFile(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";
  const isPrd = pathname.startsWith("/PRD/");
  const base = isPrd ? prdRoot : root;
  const relative = normalize(isPrd ? pathname.slice(5) : pathname).replace(/^([/\\])+/, "");
  const file = join(base, relative);
  if (file !== base && !file.startsWith(`${base}/`)) return json(res, 403, {error:"禁止访问"});
  try {
    const info = await stat(file);
    const target = info.isDirectory() ? join(file, "index.html") : file;
    const content = await readFile(target);
    res.writeHead(200, {"Content-Type":mime[extname(target)] || "application/octet-stream","Cache-Control":"no-cache"});
    res.end(content);
  } catch { json(res, 404, {error:"未找到页面"}); }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/files/extract") {
      const payload = await readJson(req);
      const extracted = await extractFile(payload);
      return json(res, 200, {ok:true,...extracted});
    }
    if (req.method === "POST" && req.url === "/api/model/test") {
      const {config} = await readJson(req);
      const content = await callModel(config, [{role:"user",content:"只回复：连接成功"}], 512, {allowReasoning:true,isTest:true});
      return json(res, 200, {ok:true,content});
    }
    if (req.method === "POST" && req.url === "/api/model/chat") {
      const {config,messages,maxTokens,responseSchema} = await readJson(req);
      if (!Array.isArray(messages) || !messages.length) return json(res, 400, {error:"缺少分析内容"});
      const safeMaxTokens = Math.max(1000, Math.min(8000, Number(maxTokens) || 6000));
      const content = await callModel(config, messages, safeMaxTokens, {jsonMode:true,responseSchema});
      return json(res, 200, {ok:true,content});
    }
    if (req.method === "GET" || req.method === "HEAD") return serveFile(req, res);
    json(res, 405, {error:"不支持的请求"});
  } catch (error) {
    json(res, 502, {error:error instanceof Error ? error.message : "本地服务错误"});
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`新境企业培训 AI 工具已启动：http://127.0.0.1:${port}`);
});
