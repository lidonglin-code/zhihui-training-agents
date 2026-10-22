import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";

const blockedV4 = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0",8], ["10.0.0.0",8], ["100.64.0.0",10], ["127.0.0.0",8],
  ["169.254.0.0",16], ["172.16.0.0",12], ["192.0.0.0",24], ["192.0.2.0",24],
  ["192.88.99.0",24], ["192.168.0.0",16], ["198.18.0.0",15], ["198.51.100.0",24],
  ["203.0.113.0",24], ["224.0.0.0",3]
]) blockedV4.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
const blockedV6 = new BlockList();
for (const [address, prefix] of [["2001::",23], ["2001:db8::",32], ["2002::",16], ["3fff::",20]]) {
  blockedV6.addSubnet(address, prefix, "ipv6");
}

export function isPublicAddress(address) {
  const family = isIP(address);
  if (family === 4) return !blockedV4.check(address, "ipv4");
  if (family === 6) return globalV6.check(address, "ipv6") && !blockedV6.check(address, "ipv6");
  return false;
}

export function validateModelUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error("请输入有效的 HTTPS 模型接口地址"); }
  if (url.protocol !== "https:") throw new Error("模型接口必须使用 HTTPS 加密连接");
  if (url.username || url.password || url.search || url.hash) throw new Error("接口地址不能包含账号、密码、查询参数或片段");
  if (url.port && url.port !== "443") throw new Error("模型接口仅支持 HTTPS 标准端口 443");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host.includes(".") || /(^|\.)(localhost|local|internal|lan|home|test|invalid|onion)\.?$/.test(host) || host.endsWith(".")) {
    throw new Error("模型接口必须是公网服务，不能使用本机或局域网地址");
  }
  if (isIP(host) && !isPublicAddress(host)) throw new Error("不能访问本机、局域网或保留地址");
  return url;
}

export async function resolvePublicHost(hostname, resolver = lookup) {
  const host = hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{address:host, family:isIP(host)}] : await resolver(host, {all:true, verbatim:true});
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) {
    throw new Error("模型接口解析到了本机、局域网或保留地址，已阻止请求");
  }
  return addresses;
}

export function redactProviderError(message, key) {
  let safe = String(message || "模型连接失败");
  if (key) {
    for (const value of new Set([String(key), encodeURIComponent(String(key))])) safe = safe.split(value).join("[已隐藏密钥]");
  }
  return safe.replace(/Bearer\s+[^\s"'<>]+/gi, "Bearer [已隐藏密钥]")
    .replace(/\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{8,}/g, "[已隐藏密钥]")
    .replace(/\/(?:Users|home)\/[^\s"'<>]+/g, "[本机路径]").slice(0, 500);
}

// Resolve once, reject every non-public answer, then pin that resolution to the TLS
// connection. A second DNS lookup at connect time would allow DNS rebinding.
export function createSecureModelRequest({resolveHost = resolvePublicHost, requestHttps = request} = {}) {
return async function requestModel(value, options) {
  const url = validateModelUrl(value);
  let dnsTimer;
  let addresses;
  try {
    addresses = await Promise.race([
      resolveHost(url.hostname),
      new Promise((_, reject) => { dnsTimer = setTimeout(() => reject(new Error("模型接口域名解析超时")), 10_000); })
    ]);
  } finally { clearTimeout(dnsTimer); }
  if (options.signal?.aborted) throw new Error("模型请求已取消");
  return new Promise((resolve, reject) => {
    const req = requestHttps(url, {
      method:options.method, headers:options.headers, signal:options.signal,
      lookup:(_hostname, lookupOptions, done) => {
        if (lookupOptions?.all) done(null, addresses);
        else done(null, addresses[0].address, addresses[0].family);
      }
    }, res => {
      const status = res.statusCode || 502;
      if (status >= 300 && status < 400) {
        res.resume();
        reject(new Error("模型接口发生重定向，已停止发送；请核对最终 HTTPS 接口地址"));
        return;
      }
      const chunks = [];
      let bytes = 0;
      res.on("data", chunk => {
        bytes += chunk.length;
        if (bytes > 4 * 1024 * 1024) res.destroy(new Error("模型响应过大"));
        else chunks.push(chunk);
      });
      res.on("end", () => resolve({ok:status >= 200 && status < 300, status, text:async () => Buffer.concat(chunks).toString("utf8")}));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end(options.body);
  });
};
}
export const secureModelRequest = createSecureModelRequest();

export function guardLocalRequest(req) {
  const port = req.socket.localPort;
  const hosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  if (!hosts.has(req.headers.host)) return "禁止使用非本机域名访问本地工作台";
  if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return "已阻止其他网站调用本地工作台";
  if (req.headers["sec-fetch-site"] === "cross-site") return "已阻止跨站请求";
  return "";
}
