import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import vm from "node:vm";
import {createAppServer} from "../server.mjs";

const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL("../dist/provider-data.js", import.meta.url), "utf8"), context, {filename:"dist/provider-data.js"});

const zhipu = context.window.MODEL_PROVIDERS.find(provider => provider.id === "zhipu");
assert.ok(zhipu, "缺少智谱模型预设");
assert.equal(zhipu.url, "https://open.bigmodel.cn/api/paas/v4", "智谱 Base URL 不正确");
assert.equal(zhipu.model, "glm-5.3-flash", "智谱均衡档模型标识不正确");
assert.equal(zhipu.tiers.economy.model, "glm-4.7-flash", "智谱经济档免费模型标识不正确");
assert.equal(zhipu.tiers.quality.model, "glm-5.3", "智谱高质量档模型标识不正确");
const deepseek = context.window.MODEL_PROVIDERS.find(provider => provider.id === "deepseek");
assert.ok(deepseek, "缺少 DeepSeek 模型预设");
assert.equal(deepseek.url, "https://api.deepseek.com", "DeepSeek Base URL 不正确");
assert.equal(deepseek.model, "deepseek-flash", "DeepSeek 推荐模型标识不正确");
assert.equal(deepseek.tiers.balanced.model, "deepseek-flash", "DeepSeek 均衡档模型不正确");
assert.equal(deepseek.tiers.quality.model, "deepseek-v4-pro", "DeepSeek 高质量档模型不正确");
const siliconflow = context.window.MODEL_PROVIDERS.find(provider => provider.id === "siliconflow");
assert.ok(siliconflow, "缺少硅基流动模型预设");
assert.equal(siliconflow.url, "https://api.siliconflow.cn/v1", "硅基流动 Base URL 不正确");
assert.equal(siliconflow.model, "Qwen/Qwen3.5-35B-A3B", "硅基流动推荐模型标识不正确");
assert.equal(siliconflow.tiers.quality.model, "Qwen/Qwen3.5-397B-A17B", "硅基流动高质量档模型不正确");
const siliconflowFast = context.window.MODEL_PROVIDERS.find(provider => provider.id === "siliconflow-fast");
assert.equal(siliconflowFast?.model, "stepfun-ai/Step-3.5-Flash", "硅基流动快速备选模型标识不正确");
const siliconflowBudget = context.window.MODEL_PROVIDERS.find(provider => provider.id === "siliconflow-budget");
assert.equal(siliconflowBudget?.model, "inclusionAI/Ling-mini-2.0", "硅基流动最低成本备选模型标识不正确");
const siliconflowFree = context.window.MODEL_PROVIDERS.find(provider => provider.id === "siliconflow-free");
assert.equal(siliconflowFree?.model, "XingChenAGI/Xing4.0-29B", "硅基流动免费备选模型标识不正确");
const qwen = context.window.MODEL_PROVIDERS.find(provider => provider.id === "qwen");
assert.equal(qwen?.url, "https://dashscope.aliyuncs.com/compatible-mode/v1", "阿里云百炼 Base URL 不正确");
assert.equal(qwen?.model, "qwen3.7-plus", "阿里云百炼推荐模型标识不正确");
const kimi = context.window.MODEL_PROVIDERS.find(provider => provider.id === "kimi");
assert.equal(kimi?.url, "https://api.moonshot.cn/v1", "Kimi Base URL 不正确");
assert.equal(kimi?.model, "kimi-k3", "Kimi 推荐模型标识不正确");
const openai = context.window.MODEL_PROVIDERS.find(provider => provider.id === "openai");
assert.equal(openai?.url, "https://api.openai.com/v1", "OpenAI Base URL 不正确");
const quickProviders = [deepseek,siliconflow,zhipu,qwen,kimi,openai];
const tierIds = ["economy","balanced","quality"];
for (const provider of quickProviders) {
  assert.ok(provider?.tiers, `${provider?.name || "未知厂商"}缺少档位配置`);
  for (const tierId of tierIds) {
    const tier = provider.tiers[tierId];
    assert.ok(tier?.model, `${provider.name}的${tierId}档缺少模型`);
    assert.ok(["enabled","disabled"].includes(tier.thinking), `${provider.name}的${tierId}档思考模式不正确`);
    assert.ok(tier.reasoningEffort, `${provider.name}的${tierId}档缺少推理强度`);
  }
}
const appSource = fs.readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
assert.match(appSource, /访问量过大\|繁忙\|限流/, "页面必须区分服务繁忙与配置错误");
assert.match(appSource, /apiKeyInput["']\)\.value = ""/, "切换服务商时必须清空旧 API Key");
assert.match(appSource, /selectedTier = "balanced"/, "模型连接必须默认使用均衡档");
assert.match(appSource, /实际调用模型/, "页面必须透明显示实际调用模型");

const received = [];
const mock = http.createServer(async (req,res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw || "{}");
  assert.ok(req.url.endsWith("/chat/completions"), `非预期请求路径：${req.url}`);
  assert.equal(req.headers.authorization, "Bearer test-key");
  received.push({url:req.url,body});
  res.writeHead(200,{"Content-Type":"application/json"});
  res.end(JSON.stringify({choices:[{message:{role:"assistant",content:body.messages[0].content === "只回复：连接成功" ? "连接成功" : '{"ok":true}'}}]}));
});

await new Promise(resolve => mock.listen(0,"127.0.0.1",resolve));
const mockPort = mock.address().port;
// Inject a mock transport in this test process; the production server never accepts
// local model URLs or an environment variable that disables address protection.
const app = createAppServer({requestModel:async (url, options) => {
  const original = new URL(url);
  return fetch(`http://127.0.0.1:${mockPort}${original.pathname}`, options);
}});
await new Promise(resolve => app.listen(0, "127.0.0.1", resolve));
const appPort = app.address().port;

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${appPort}/`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve,100));
  }
  assert.ok(ready, "本地服务未能启动");
  const schema = {name:"test_result",strict:true,schema:{type:"object",properties:{ok:{type:"boolean"}},required:["ok"],additionalProperties:false}};
  const assertControls = (provider,tier,isTest,body) => {
    if (provider.id === "siliconflow") {
      assert.equal(body.enable_thinking,isTest ? false : tier.thinking === "enabled",`${provider.name}思考开关错误`);
    } else if (provider.id === "deepseek") {
      assert.deepEqual(body.thinking,{type:isTest ? "disabled" : tier.thinking},`${provider.name}思考模式错误`);
      assert.equal(body.reasoning_effort,isTest || tier.thinking === "disabled" ? undefined : tier.reasoningEffort,`${provider.name}推理强度错误`);
    } else if (provider.id === "zhipu") {
      const enabled = /^glm-5\.3/i.test(tier.model) || tier.thinking === "enabled";
      assert.deepEqual(body.thinking,{type:enabled ? "enabled" : "disabled"},`${provider.name}思考模式错误`);
      assert.equal(body.reasoning_effort,enabled ? (isTest ? "low" : tier.reasoningEffort) : undefined,`${provider.name}推理强度错误`);
    } else if (provider.id === "qwen") {
      assert.equal(body.reasoning_effort,isTest ? "none" : tier.reasoningEffort,`${provider.name}推理强度错误`);
    } else if (provider.id === "kimi" || provider.id === "openai") {
      assert.equal(body.reasoning_effort,isTest ? "low" : tier.reasoningEffort,`${provider.name}推理强度错误`);
    }
  };

  for (const provider of quickProviders) {
    for (const tierId of tierIds) {
      const tier = provider.tiers[tierId];
      const config = {provider:provider.id,baseUrl:provider.url,model:tier.model,thinking:tier.thinking,reasoningEffort:tier.reasoningEffort,apiKey:"test-key"};
      const response = await fetch(`http://127.0.0.1:${appPort}/api/model/test`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config})});
      const result = await response.json();
      assert.equal(response.status,200,result.error || `${provider.name} ${tierId}档连接测试失败`);
      assert.equal(result.content,"连接成功");
      const testRequest = received.at(-1).body;
      assert.equal(testRequest.model,tier.model,`${provider.name} ${tierId}档模型路由错误`);
      assert.equal(provider.id === "openai" ? testRequest.max_completion_tokens : testRequest.max_tokens,512);
      assert.equal(testRequest.response_format,undefined);
      assertControls(provider,tier,true,testRequest);

      const chatResponse = await fetch(`http://127.0.0.1:${appPort}/api/model/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config,messages:[{role:"user",content:"生成 JSON"}],maxTokens:2000,responseSchema:schema})});
      const chatResult = await chatResponse.json();
      assert.equal(chatResponse.status,200,chatResult.error || `${provider.name} ${tierId}档生成测试失败`);
      assert.equal(chatResult.content,'{"ok":true}');
      const chatRequest = received.at(-1).body;
      assert.equal(chatRequest.model,tier.model,`${provider.name} ${tierId}档生成模型路由错误`);
      assert.equal(provider.id === "openai" ? chatRequest.max_completion_tokens : chatRequest.max_tokens,2000);
      if (provider.id === "siliconflow") {
        assert.equal(chatRequest.response_format.type,"json_schema");
        assert.equal(chatRequest.response_format.json_schema.name,"test_result");
      } else if (["deepseek","qwen"].includes(provider.id)) {
        assert.equal(chatRequest.response_format.type,"json_object");
      } else {
        assert.equal(chatRequest.response_format,undefined);
      }
      assertControls(provider,tier,false,chatRequest);
    }
    console.log(`✓ ${provider.name}：经济、均衡、高质量三档连接与生成请求通过`);
  }
  assert.equal(received.length,quickProviders.length * tierIds.length * 2,"模拟请求数量不完整");
  for (const provider of quickProviders) for (const tierId of tierIds) for (const phase of ["section","repair"]) {
    const tier=provider.tiers[tierId];
    const config={provider:provider.id,baseUrl:provider.url,model:tier.model,thinking:tier.thinking,reasoningEffort:tier.reasoningEffort,apiKey:"test-key"};
    const response=await fetch(`http://127.0.0.1:${appPort}/api/model/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config,phase,messages:[{role:"user",content:"生成 JSON"}],responseSchema:schema})});
    const result=await response.json();
    assert.equal(response.status,200,result.error);
    const request=received.at(-1).body;
    assert.equal(request.model,tier.model,"阶段处理不得擅自换模型");
    const tokens=provider.id==="openai" ? request.max_completion_tokens : request.max_tokens;
    assert.ok(tokens>=6144 && tokens<=32768,"阶段预算应与任务匹配并受上限约束");
    if (provider.id==="deepseek") {
      assert.equal(request.thinking.type,phase==="repair" ? "disabled" : tier.thinking);
      if (request.thinking.type==="enabled") assert.equal(request.reasoning_effort,"low");
      assert.equal(request.response_format.type,"json_object");
    } else if (provider.id==="siliconflow") {
      assert.equal(request.enable_thinking,phase==="repair" ? false : tier.thinking==="enabled");
      assert.equal(request.response_format.type,"json_schema");
    } else if (provider.id==="qwen") {
      assert.equal(request.reasoning_effort,phase==="repair" || tier.thinking==="disabled" ? "none" : "low");
      assert.equal(request.response_format.type,"json_object");
    } else if (provider.id==="kimi" || provider.id==="openai") assert.equal(request.reasoning_effort,"low");
    else if (provider.id==="zhipu" && request.thinking.type==="enabled") assert.equal(request.reasoning_effort,"low");
  }
  assert.equal(received.length,72);
  console.log(`六厂商模拟接入通过：共验证 ${received.length} 次请求，覆盖 18 组配置及章节生成、格式修复策略。`);
} finally {
  app.closeAllConnections();
  await new Promise(resolve => app.close(resolve));
  await new Promise(resolve => mock.close(resolve));
}
