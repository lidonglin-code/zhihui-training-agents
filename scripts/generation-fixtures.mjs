import fs from "node:fs";
import vm from "node:vm";
import {parseModelJson} from "../dist/generation-core.js";

export function generationFixture(id = "course", overrides = {}) {
  const sandbox={window:{},parseModelJson};
  vm.createContext(sandbox);
  for (const file of ["tools-data.js","workflow-data.js","theory-data.js","engine-data.js"]) {
    vm.runInContext(fs.readFileSync(new URL(`../dist/${file}`,import.meta.url),"utf8"),sandbox);
  }
  const app=fs.readFileSync(new URL("../dist/app.js",import.meta.url),"utf8");
  vm.runInContext(app.slice(app.indexOf("function normalizeQualityStatus("),app.indexOf("let discardedStoredResults")),sandbox);
  const spec=sandbox.window.TOOL_SPECS[id], engine=sandbox.window.ENGINE_PROMPTS[id];
  const values={...spec.sample,...overrides};
  sandbox.specs=sandbox.window.TOOL_SPECS;
  sandbox.theories=sandbox.window.THEORY_GUIDES;
  sandbox.engines=sandbox.window.ENGINE_PROMPTS;
  sandbox.sessions={[id]:{attachments:[],result:null}};
  vm.runInContext(app.slice(app.indexOf("function buildMessages("),app.indexOf("function readableModelText(")),sandbox);
  const product=sandbox.window.PRODUCTS.find(p=>p.id===id);
  const content=heading=>`### ${heading}的执行安排\n\n**材料依据：** 本测试只采用用户提供的绩效反馈材料，区分行为事实与人格评价。\n\n1. 先明确要观察的具体行为，再让学习者完成一次改写练习。\n\n**待确认：** 实施人员与试测条件需要使用者核对。`;
  const complete=()=>({title:`${product.name}专业成果`,summary:"本成果围绕用户材料中的真实任务形成可执行方案，区分事实与设计建议，实施前仍需核对现场条件和材料依据。",sections:spec.sections.map(heading=>({heading,content:content(heading)})),qualityChecks:engine.qualityCriteria.map(([item])=>({item,status:"待确认",evidence:"方案提供了具体任务与核验路径，但实际执行条件和应用效果仍需人工确认。"})),warnings:["实施前请由使用者核对企业事实、素材授权和试测条件。"]});
  const resultSchema=sandbox.resultResponseSchema(spec,engine);
  const validateResult=value=>sandbox.parseModelResult(JSON.stringify(value),spec,engine);
  const validateSection=(value,heading)=>{
    if (value.heading!==heading) throw new Error("章节标题不正确");
    return {heading,content:sandbox.requireUsefulText(value.content,heading,30)};
  };
  const respond=args=>{
    const properties=args.responseSchema.schema.properties;
    if (properties.notes) return {notes:"本段原始材料的事实、约束与来源均应完整保留；需要区分行为事实和人格评价，不把设计建议当作已实施的事实。"+(args.messages[1]?.content.includes("TAIL_EVIDENCE") ? " 尾段依据：TAIL_EVIDENCE。" : "")};
    if (properties.alignment) return {title:complete().title,summary:complete().summary,alignment:"单一目标是把人格评价改写为可观察行为事实。目标学员和使用时刻来自用户输入；整体时长按用户指定分配。各章节保持相同术语与达标标准，不添加未经确认的人员、制度或效果承诺。"};
    if (properties.heading) { const heading=properties.heading.enum[0]; return {heading,content:content(heading)}; }
    if (properties.questions) {
      const range=args.messages[0].content.match(/只生成第 (\d+)—(\d+) 题/);
      return {questions:Array.from({length:Number(range[2])-Number(range[1])+1},(_,i)=>({number:Number(range[1])+i,question:`第 ${Number(range[1])+i} 个绩效反馈场景中，经理应如何区分可观察的行为事实与人格评价？请选择或写出符合材料规则的表达。`,answer:"描述具体情境和可观察行为，并与员工确认下一步行动。",explanation:"材料要求区分行为事实、解释和评价；具体情境与动作可共同核对，人格标签不能直接作为行为证据。",source:"命题材料第一段：行为事实、解释和评价的区分。"})),shortage:""};
    }
    if (properties.corrections) return {summary:complete().summary,qualityChecks:complete().qualityChecks,warnings:complete().warnings,corrections:[]};
    return complete();
  };
  return {id,spec,engine,values,baseMessages:sandbox.buildMessages(product,values),signature:`fixture-${id}-${values.quantity || "normal"}`,config:{provider:"deepseek",model:"deepseek-v4-pro",thinking:"enabled",reasoningEffort:"high"},resultSchema,validateResult,validateSection,respond,complete,content};
}
