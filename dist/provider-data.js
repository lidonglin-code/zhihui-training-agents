window.MODEL_TIERS = {
  economy:{id:"economy",name:"经济",description:"更省费用，适合试用和简单任务"},
  balanced:{id:"balanced",name:"均衡",description:"质量、速度与费用更平衡",recommended:true},
  quality:{id:"quality",name:"高质量",description:"更强模型与更深分析，费用较高"}
};

window.MODEL_PROVIDERS = [
  {
    id:"deepseek", name:"DeepSeek", url:"https://api.deepseek.com", model:"deepseek-flash",
    hint:"DeepSeek 官方接口，适合中文专业内容、分析与结构化生成。需要你自己的 DeepSeek API Key。",
    tiers:{
      economy:{model:"deepseek-flash",thinking:"disabled",reasoningEffort:"low",detail:"DeepSeek Flash · 快速模式"},
      balanced:{model:"deepseek-flash",thinking:"enabled",reasoningEffort:"low",detail:"DeepSeek Flash · 适度思考"},
      quality:{model:"deepseek-v4-pro",thinking:"enabled",reasoningEffort:"high",detail:"DeepSeek V4 Pro · 增强思考"}
    }
  },
  {
    id:"siliconflow", name:"硅基流动", url:"https://api.siliconflow.cn/v1", model:"Qwen/Qwen3.5-35B-A3B",
    hint:"一个 API Key 可调用硅基流动平台上的不同模型；系统会按所选档位指定模型，而不是由 Key 决定。",
    tiers:{
      economy:{model:"stepfun-ai/Step-3.5-Flash",thinking:"disabled",reasoningEffort:"low",detail:"Step-3.5-Flash · 快速生成"},
      balanced:{model:"Qwen/Qwen3.5-35B-A3B",thinking:"disabled",reasoningEffort:"low",detail:"Qwen3.5-35B-A3B · 稳定生成"},
      quality:{model:"Qwen/Qwen3.5-397B-A17B",thinking:"enabled",reasoningEffort:"high",detail:"Qwen3.5-397B-A17B · 深度生成"}
    }
  },
  {id:"siliconflow-fast",name:"硅基流动 · Step-3.5-Flash（手动备选）",url:"https://api.siliconflow.cn/v1",model:"stepfun-ai/Step-3.5-Flash",hint:"偏重速度与低成本的通用模型。"},
  {id:"siliconflow-budget",name:"硅基流动 · Ling-mini-2.0（手动备选）",url:"https://api.siliconflow.cn/v1",model:"inclusionAI/Ling-mini-2.0",hint:"成本较低，但复杂方法论和严格结构任务的稳定性不作为本工具默认选择。"},
  {id:"siliconflow-free",name:"硅基流动 · Xing4.0-29B（手动备选）",url:"https://api.siliconflow.cn/v1",model:"XingChenAGI/Xing4.0-29B",hint:"免费通用对话模型，复杂任务可能响应较慢。"},
  {
    id:"zhipu", name:"智谱 AI", url:"https://open.bigmodel.cn/api/paas/v4", model:"glm-5.3-flash",
    hint:"智谱官方 GLM 模型接口。经济档使用免费文本模型，其他档位使用当前新一代模型。",
    tiers:{
      economy:{model:"glm-4.7-flash",thinking:"disabled",reasoningEffort:"low",detail:"GLM-4.7-Flash · 免费文本模型"},
      balanced:{model:"glm-5.3-flash",thinking:"enabled",reasoningEffort:"low",detail:"GLM-5.3-Flash · 轻量思考"},
      quality:{model:"glm-5.3",thinking:"enabled",reasoningEffort:"max",detail:"GLM-5.3 · 深度思考"}
    }
  },
  {
    id:"qwen", name:"阿里云百炼", url:"https://dashscope.aliyuncs.com/compatible-mode/v1", model:"qwen3.7-plus",
    hint:"通义千问官方接口。需要北京地域的百炼 API Key；其他地域可在高级设置中替换接口地址。",
    tiers:{
      economy:{model:"qwen3.8-flash",thinking:"disabled",reasoningEffort:"none",detail:"Qwen3.8-Flash · 快速生成"},
      balanced:{model:"qwen3.7-plus",thinking:"enabled",reasoningEffort:"medium",detail:"Qwen3.7-Plus · 均衡推理"},
      quality:{model:"qwen3.8-max",thinking:"enabled",reasoningEffort:"high",detail:"Qwen3.8-Max · 增强推理"}
    }
  },
  {
    id:"kimi", name:"Kimi", url:"https://api.moonshot.cn/v1", model:"kimi-k3",
    hint:"Kimi 官方模型接口，适合中文内容、长文档和复杂分析。",
    tiers:{
      economy:{model:"kimi-k2.6",thinking:"enabled",reasoningEffort:"low",detail:"Kimi K2.6 · 轻量推理"},
      balanced:{model:"kimi-k3",thinking:"enabled",reasoningEffort:"low",detail:"Kimi K3 · 轻量推理"},
      quality:{model:"kimi-k3",thinking:"enabled",reasoningEffort:"max",detail:"Kimi K3 · 深度推理"}
    }
  },
  {
    id:"openai", name:"OpenAI", url:"https://api.openai.com/v1", model:"gpt-5-mini", hint:"需要你自己的 OpenAI API Key。",
    tiers:{
      economy:{model:"gpt-5-nano",thinking:"enabled",reasoningEffort:"low",detail:"GPT-5 nano · 低推理强度"},
      balanced:{model:"gpt-5-mini",thinking:"enabled",reasoningEffort:"medium",detail:"GPT-5 mini · 中等推理强度"},
      quality:{model:"gpt-5.1",thinking:"enabled",reasoningEffort:"high",detail:"GPT-5.1 · 高推理强度"}
    }
  },
  {id:"custom",name:"其他 OpenAI 兼容接口",url:"",model:"",hint:"请填写服务商提供的 Base URL、模型名称和 API Key。"}
];
