// Provider/model IDs stay in provider-data.js. These are conservative application
// ceilings, not claims about the providers' maximum context or output lengths.
export const POLICY_REVIEWED = "2026-10-26";
export const GENERATION_PHASES = new Set(["source", "plan", "draft", "section", "batch", "review", "repair"]);

export function resolveRequestPolicy(config, {phase, maxTokens, attempt = 0} = {}) {
  const provider = String(config?.provider || "");
  const known = ["deepseek", "siliconflow", "siliconflow-fast", "siliconflow-budget", "siliconflow-free", "zhipu", "qwen", "kimi", "openai"].includes(provider);
  const ceiling = provider === "deepseek" ? 32768 : known ? 16384 : 8192;
  const effective = {...config};
  if (GENERATION_PHASES.has(phase) && known) {
    // Mechanical formatting never needs the user's maximum reasoning setting.
    const mechanical = phase === "repair" || phase === "source";
    if (mechanical && (provider === "deepseek" || provider.startsWith("siliconflow") || provider === "qwen")) {
      effective.thinking = "disabled";
      effective.reasoningEffort = provider === "qwen" ? "none" : "low";
    } else if (effective.thinking === "enabled" || provider === "kimi" || provider === "openai" || (provider === "zhipu" && /^glm-5\.3/i.test(config.model))) {
      effective.reasoningEffort = "low";
    }
  }
  const base = {source:4096, plan:4096, draft:12288, section:6144, batch:6144, review:8192, repair:8192}[phase] || 6000;
  const thinking = effective.thinking === "enabled" || provider === "kimi" || provider === "openai" || (provider === "zhipu" && /^glm-5\.3/i.test(config.model));
  const automatic = (thinking ? Math.max(base + 4096, 12288) : base) * (attempt > 0 ? 1.5 : 1);
  const desired = Number.isFinite(Number(maxTokens)) && Number(maxTokens) > 0 ? Number(maxTokens) : automatic;
  return {config:effective, maxTokens:Math.max(512, Math.min(ceiling, Math.ceil(desired))), ceiling};
}
