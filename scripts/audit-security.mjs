import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import http from "node:http";
import {readFile} from "node:fs/promises";
import {zipSync} from "fflate";
import {createAppServer} from "../server.mjs";
import {createSecureModelRequest, isPublicAddress, redactProviderError, resolvePublicHost, validateModelUrl} from "../server-security.mjs";

for (const ip of ["127.0.0.1","10.1.2.3","172.31.255.255","192.168.1.2","169.254.169.254","100.64.0.1","0.0.0.0","192.0.2.1","198.18.0.1","224.0.0.1","255.255.255.255","::1","::","fc00::1","fe80::1","::ffff:127.0.0.1","::ffff:192.168.1.1","2001:db8::1","2002:7f00:1::1","3fff::1"]) {
  assert.equal(isPublicAddress(ip), false, `不能放行保留地址 ${ip}`);
}
for (const ip of ["1.1.1.1","8.8.8.8","2606:4700:4700::1111"]) assert.equal(isPublicAddress(ip), true);
for (const url of ["http://api.deepseek.com","https://127.0.0.1","https://2130706433","https://0x7f000001","https://[::1]","https://localhost","https://metadata.local","https://service.internal","https://api.deepseek.com:444","https://user:pass@api.deepseek.com","https://api.deepseek.com?key=demo","https://api.deepseek.com#demo","file:///etc/passwd"]) {
  assert.throws(() => validateModelUrl(url), `不能放行不安全接口 ${url}`);
}
assert.equal(validateModelUrl("https://api.deepseek.com/v1").hostname,"api.deepseek.com");
await assert.rejects(() => resolvePublicHost("rebind.example", async () => [{address:"127.0.0.1",family:4}]));
await assert.rejects(() => resolvePublicHost("mixed.example", async () => [{address:"1.1.1.1",family:4},{address:"::1",family:6}]));
assert.deepEqual(await resolvePublicHost("public.example", async () => [{address:"1.1.1.1",family:4}]), [{address:"1.1.1.1",family:4}]);

let lookups = 0, connections = 0;
const redirectRequest = createSecureModelRequest({
  resolveHost:async () => { lookups++; return [{address:"1.1.1.1",family:4}]; },
  requestHttps:(url, options, callback) => {
    connections++;
    assert.equal(url.hostname,"public.example");
    options.lookup("public.example", {}, (error,address,family) => { assert.equal(error,null); assert.equal(address,"1.1.1.1"); assert.equal(family,4); });
    options.lookup("public.example", {all:true}, (error,addresses) => { assert.equal(error,null); assert.equal(addresses[0].address,"1.1.1.1"); });
    const req = new EventEmitter();
    req.end = () => {
      const res = new EventEmitter();
      res.statusCode = 307;
      res.headers = {location:"https://127.0.0.1/steal"};
      res.resume = () => {};
      callback(res);
    };
    return req;
  }
});
await assert.rejects(() => redirectRequest("https://public.example/v1", {method:"POST",headers:{},body:"{}"}), /重定向/);
assert.equal(lookups,1);
assert.equal(connections,1,"不允许跟随重定向");
const fakeKey = "security-fixture-key-not-a-real-credential";
assert.ok(!redactProviderError(`error ${fakeKey}; Bearer abcdefg`,fakeKey).includes(fakeKey));

let requests = 0;
const server = createAppServer({requestModel:async (_url, options) => {
  requests++;
  const key = options.headers.Authorization.slice(7);
  return {ok:false,status:401,text:async () => JSON.stringify({error:{message:`invalid ${key} ${encodeURIComponent(key)} Bearer ${key}`}})};
}});
await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
const post = (payload, headers={}) => fetch(`${base}/api/model/test`, {method:"POST",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify(payload)});
try {
  const home = await fetch(base);
  assert.equal(home.status,200);
  assert.equal(home.headers.get("referrer-policy"),"no-referrer");
  assert.equal(home.headers.get("x-frame-options"),"DENY");
  assert.match(home.headers.get("content-security-policy"), /connect-src 'self'/);
  const config = {baseUrl:"https://api.deepseek.com",model:"fixture",apiKey:fakeKey};
  assert.equal((await post({config},{Origin:"https://evil.example"})).status,403);
  assert.equal((await post({config},{Origin:"null"})).status,403);
  assert.equal((await post({config},{"Sec-Fetch-Site":"cross-site"})).status,403);
  const hostStatus = await new Promise((resolve,reject) => {
    const req = http.get(`${base}/`, {headers:{Host:`evil.example:${port}`}}, res => {res.resume();resolve(res.statusCode);}); req.on("error",reject);
  });
  assert.equal(hostStatus,403);
  const wrongType = await fetch(`${base}/api/model/test`,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({config})});
  assert.notEqual(wrongType.status,200);
  for (const url of ["http://127.0.0.1:1234/v1","https://192.168.1.1/v1","https://localhost/v1","https://api.deepseek.com?key=demo"]) {
    assert.notEqual((await post({config:{...config,baseUrl:url}})).status,200);
  }
  assert.equal(requests,0,"拒绝的请求不能到达模型服务");
  const echoed = await post({config},{Origin:base});
  const text = await echoed.text();
  assert.equal(requests,1);
  assert.ok(!text.includes(fakeKey),"错误信息不能回显用户密钥");
  assert.ok(!text.includes(encodeURIComponent(fakeKey)));
  for (const path of ["/.env","/.git/config","/PRD/private.md","/%2eenv"]) assert.notEqual((await fetch(base+path)).status,200);
  const extracted = await fetch(`${base}/api/files/extract`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"fixture.txt",data:Buffer.from("正常文件解析").toString("base64")})});
  assert.equal((await extracted.json()).text,"正常文件解析");
  const docx = zipSync({"word/document.xml":Buffer.from("<w:document><w:p><w:r><w:t>正常 Word 正文</w:t></w:r></w:p></w:document>"),"unrelated.xml":Buffer.from("不应提取")});
  const wordResponse = await fetch(`${base}/api/files/extract`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"fixture.docx",data:Buffer.from(docx).toString("base64")})});
  assert.equal((await wordResponse.json()).text,"正常 Word 正文");
  const css = await readFile(new URL("../dist/styles.css",import.meta.url),"utf8");
  assert.doesNotMatch(css,/fonts\.googleapis\.com|fonts\.gstatic\.com|@import/);
  console.log("安全回归通过：公网地址与 DNS 校验、连接目标固定、重定向阻断、跨站与 Host 防护、密钥脱敏、文件边界、离线字体。");
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
