import assert from "node:assert/strict";
import {runGeneration,parseModelJson,completedSections,friendlyGenerationError} from "../dist/generation-core.js";
import {resolveRequestPolicy} from "../dist/model-policy.js";
import {createAppServer} from "../server.mjs";
import {generationFixture} from "./generation-fixtures.mjs";

const output=value=>({content:JSON.stringify(value),finishReason:"stop",usage:{completionTokens:100}});
function runner(fixture, override) {
  const calls=[];
  let checkpoint;
  const request=async args=>{
    calls.push(args);
    return (await override?.(args,calls)) ?? output(fixture.respond(args));
  };
  return {calls,request,get checkpoint(){return checkpoint;},run:extra=>runGeneration({...fixture,request,retryDelay:0,onCheckpoint:value=>{checkpoint=value;},...extra})};
}

assert.deepEqual(parseModelJson('{"a":[{"b":"第一段\n第二段"} {"b":"第三段"},],}'),{a:[{b:"第一段\n第二段"},{b:"第三段"}]});
assert.throws(()=>parseModelJson('{"a":"尚未完成'),/格式/);
assert.equal(completedSections('{"sections":[{"heading":"甲","content":"完整"},{"heading":"乙","content":"未完').length,1);
const policy=resolveRequestPolicy({provider:"deepseek",model:"deepseek-v4-pro",thinking:"enabled",reasoningEffort:"high"},{phase:"section"});
assert.ok(policy.maxTokens>6000);
assert.equal(policy.config.reasoningEffort,"low");
assert.equal(resolveRequestPolicy({provider:"deepseek",thinking:"enabled"},{phase:"repair"}).config.thinking,"disabled");
assert.equal(resolveRequestPolicy({provider:"custom"},{phase:"draft",maxTokens:999999}).maxTokens,8192);

for (const id of ["project","expert","course","case","activity","quiz","copy","evaluation"]) {
  const fixture=generationFixture(id);
  const run=runner(fixture);
  const result=await run.run();
  assert.deepEqual([...result.sections].map(s=>s.heading),[...fixture.spec.sections]);
  assert.equal(result.qualityChecks.length,fixture.engine.qualityCriteria.length);
  assert.equal(run.calls.filter(c=>c.phase==="review").length,1);
}

// Token exhaustion, including zero body after reasoning, must retry just that
// chapter with more room. Successful earlier chapters are not regenerated.
{
  const fixture=generationFixture();
  let first=true;
  const run=runner(fixture,args=>{
    if (args.responseSchema.schema.properties.heading?.enum?.[0]==="分镜脚本" && first) {first=false;return {content:"",finishReason:"length",usage:{completionTokens:6000,reasoningTokens:6000}};}
  });
  await run.run();
  const detail=run.calls.filter(c=>c.responseSchema.schema.properties.heading?.enum?.[0]==="分镜脚本");
  assert.equal(detail.length,2);
  assert.ok(detail[1].maxTokens>detail[0].maxTokens);
  assert.equal(run.calls.filter(c=>c.responseSchema.schema.properties.heading?.enum?.[0]==="微课定位").length,1);
}

// A failed small whole-result generation switches to chapters and recovers
// complete sections from its prefix rather than throwing all work away.
{
  const fixture=generationFixture("expert");
  const firstSection=fixture.complete().sections[0];
  const run=runner(fixture,args=>args.phase==="draft" ? {content:`{"sections":[${JSON.stringify(firstSection)},{"heading":"未完","content":"`,finishReason:"length"} : undefined);
  const result=await run.run();
  assert.equal(result.sections.length,fixture.spec.sections.length);
  assert.equal(run.calls.filter(c=>c.phase==="draft").length,1);
  assert.equal(run.calls.filter(c=>c.responseSchema.schema.properties.heading?.enum?.[0]===firstSection.heading).length,0);
}

// Unescaped quotations need one format-only repair. The final professional
// validator still runs; syntactic repair alone never marks a result complete.
{
  const fixture=generationFixture(); let malformed=true;
  const run=runner(fixture,args=>{
    const heading=args.responseSchema.schema.properties.heading?.enum?.[0];
    if (heading==="分镜脚本" && malformed) { malformed=false; return {content:'{"heading":"分镜脚本","content":"经理说"不要评价人格"，然后改写行为。"}',finishReason:"stop"}; }
  });
  await run.run();
  assert.ok(run.calls.some(c=>c.phase==="repair"));
}

// Preserve the checkpoint through a pause and a reload-like JSON round trip.
{
  const fixture=generationFixture(); const controller=new AbortController();
  const run=runner(fixture,args=>{
    if (args.responseSchema.schema.properties.heading?.enum?.[0]==="内容结构") {controller.abort();throw new DOMException("Aborted","AbortError");}
  });
  await assert.rejects(()=>run.run({signal:controller.signal}),{name:"AbortError"});
  assert.ok(run.checkpoint.parts["section:0"]);
  assert.ok(run.checkpoint.parts["section:1"]);
  const resume=runner(fixture);
  await resume.run({checkpoint:JSON.parse(JSON.stringify(run.checkpoint))});
  assert.equal(resume.calls.some(c=>["微课定位","单一学习目标"].includes(c.responseSchema.schema.properties.heading?.enum?.[0])),false);
  const changed=runner({...fixture,signature:"changed-input"});
  await changed.run({checkpoint:run.checkpoint});
  assert.ok(changed.calls.some(c=>c.phase==="plan"));
}

// A failed review cannot erase successful chapters, or silently publish them
// without a successful fact/boundary review on the next explicit resume.
{
  const fixture=generationFixture();
  const run=runner(fixture,args=>args.phase==="review" || args.phase==="repair" ? {content:'{"broken":',finishReason:"stop"} : undefined);
  await assert.rejects(()=>run.run());
  assert.equal(Object.keys(run.checkpoint.parts).filter(k=>k.startsWith("section:")).length,6);
  const resume=runner(fixture);
  await resume.run({checkpoint:run.checkpoint});
  assert.equal(resume.calls.length,1);
  assert.equal(resume.calls[0].phase,"review");
}

// Full long materials: the tail is read, and later stages use extracted evidence
// instead of repeatedly re-sending a huge raw field in the planning reference.
{
  const fixture=generationFixture("course",{material:"材料事实。".repeat(8000)+"TAIL_EVIDENCE"});
  const run=runner(fixture);
  await run.run();
  assert.ok(run.calls.filter(c=>c.phase==="source").length>=3);
  const plan=run.calls.find(c=>c.phase==="plan");
  assert.ok(plan.messages[1].content.includes("TAIL_EVIDENCE"));
  assert.ok(plan.messages.every(m=>m.content.length<24000));
}

{
  const fixture=generationFixture("quiz",{quantity:"30"});
  const run=runner(fixture);
  const result=await run.run();
  assert.equal(run.calls.filter(c=>c.phase==="batch").length,6);
  assert.equal((result.sections.find(s=>s.heading==="题目与答案").content.match(/### 第 \d+ 题/g)||[]).length,30);
}
{
  const fixture=generationFixture("quiz",{quantity:"12"});
  const run=runner(fixture,args=>{
    if (args.phase==="batch") {const v=fixture.respond(args);return output({...v,questions:v.questions.slice(0,3),shortage:"材料只支持三个不同的证据点，请补充制度或案例后扩充。"});}
  });
  const result=await run.run();
  assert.equal(run.calls.filter(c=>c.phase==="batch").length,1);
  assert.ok(result.warnings.some(w=>w.includes("3 道")));
}
{
  const fixture=generationFixture(); let first=true;
  const run=runner(fixture,()=>{if(first){first=false;throw Object.assign(new Error("busy"),{code:"SERVICE_BUSY",retryable:true});}});
  await run.run(); assert.equal(run.calls.filter(c=>c.phase==="plan").length,2);
  const auth=runner(fixture,()=>{throw Object.assign(new Error("bad key"),{code:"AUTH",retryable:false});});
  await assert.rejects(()=>auth.run(),{code:"AUTH"}); assert.equal(auth.calls.length,1);
  assert.ok(!friendlyGenerationError(new SyntaxError("Expected ',' or ']' at 5653")).includes("5653"));
}

// Real HTTP gateway round trip: JSON mode, dynamic budgets, and termination &
// usage metadata must reach the engine, even when the content is nonempty.
let body;
const server=createAppServer({requestModel:async (_url,options)=>{
  body=JSON.parse(options.body);
  return {ok:true,status:200,text:async()=>JSON.stringify({choices:[{finish_reason:"length",message:{content:'{"sections":['}}],usage:{completion_tokens:12288,completion_tokens_details:{reasoning_tokens:11000}}})};
}});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
try {
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/model/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config:{provider:"deepseek",baseUrl:"https://api.deepseek.com",model:"deepseek-v4-pro",apiKey:"test-key",thinking:"enabled",reasoningEffort:"high"},phase:"section",maxTokens:20000,messages:[{role:"user",content:"生成 JSON"}]})});
  const result=await response.json();
  assert.equal(body.response_format.type,"json_object");
  assert.equal(body.max_tokens,20000);
  assert.equal(body.reasoning_effort,"low");
  assert.equal(result.finishReason,"length");
  assert.equal(result.usage.reasoningTokens,11000);
  assert.equal(result.content,'{"sections":[');
} finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

console.log("生成恢复回归通过：八工具完整流程、空正文与截断、局部格式修复、断点续作、审稿失败恢复、长材料尾段、30题分批与材料不足、限流重试、鉴权停止、DeepSeek真实网关协议。");
