import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = {window:{}};
vm.createContext(context);
for (const file of ["dist/tools-data.js","dist/workflow-data.js","dist/theory-data.js","dist/engine-data.js"]) {
  vm.runInContext(fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), context, {filename:file});
}

const {PRODUCTS, TOOL_SPECS, THEORY_GUIDES, ENGINE_PROMPTS} = context.window;
const ids = PRODUCTS.map(product => product.id);
assert.equal(ids.length, 8, "必须保留 8 个独立工具");
assert.deepEqual([...Object.keys(TOOL_SPECS)], [...ids], "工具输入定义与产品顺序不一致");
assert.deepEqual([...Object.keys(THEORY_GUIDES)].sort(), [...ids].sort(), "方法说明未覆盖全部产品");
assert.deepEqual([...Object.keys(ENGINE_PROMPTS)].sort(), [...ids].sort(), "系统提示词未覆盖全部产品");

for (const id of ids) {
  const spec = TOOL_SPECS[id];
  const theory = THEORY_GUIDES[id];
  const engine = ENGINE_PROMPTS[id];
  assert.ok(theory.problem && theory.principle && theory.outcome, `${id} 的完整方法说明不完整`);
  assert.ok(theory.methods.length >= 3, `${id} 的方法作用没有讲清楚`);
  assert.ok(theory.process.length >= 6, `${id} 的后台工作顺序过于简略`);
  assert.ok(theory.avoids.length >= 3 && theory.boundaries.length >= 3, `${id} 的质量边界不完整`);
  assert.ok(engine.workflow.length >= 5, `${id} 的系统提示词流程不完整`);
  assert.ok(engine.evidenceRules.length >= 3, `${id} 的证据规则不完整`);
  assert.ok(engine.qualityCriteria.length >= 4, `${id} 的质量门槛不完整`);
  for (const section of spec.sections) assert.ok(engine.sectionGuidance[section], `${id} 缺少“${section}”章节生成规则`);
}

const appSource = fs.readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
assert.match(appSource, /resultResponseSchema/, "生成请求必须携带成果结构 Schema");
assert.match(appSource, /parsed\.sections\.length !== spec\.sections\.length/, "生成结果必须校验章节数量");
assert.match(appSource, /unusableResultPattern/, "生成结果必须拦截占位词和内部协议说明");
assert.match(appSource, /模型连续两次未生成完整成果/, "自动返工失败后必须停止展示半成品");
assert.match(appSource, /严格的交付审稿人/, "生成成果展示前必须经过事实与一致性审稿");
assert.match(appSource, /用户未提供的角色、数量、频次、目标值、工具和责任安排/, "审稿必须识别模型擅自补充的组织事实与方案参数");
assert.match(appSource, /normalizeGeneratedText/, "可编辑成果必须兼容并整理模型历史输出");
assert.match(appSource, /renderInlineMarkdown/, "成果区必须安全渲染轻量 Markdown");
assert.match(appSource, /必须使用轻量 Markdown/, "系统提示词必须约束结构化 Markdown 输出");
assert.match(appSource, /讲师动作、学员动作/, "活动流程字段必须被要求逐项分行");

console.log(`方法与提示词契约通过：${ids.length} 个工具，${ids.reduce((sum,id)=>sum+THEORY_GUIDES[id].methods.length,0)} 个方法作用，${ids.reduce((sum,id)=>sum+ENGINE_PROMPTS[id].workflow.length,0)} 个后台步骤。`);
