window.TOOL_SPECS = {
  project: {
    intro:"输入培训需求，AI 用绩效改进视角判断问题，并产出一套可以继续立项和执行的项目方案。",
    fields:[
      {id:"need",label:"培训需求或背景",type:"textarea",required:true,rows:10,placeholder:"粘贴需求邮件、访谈记录，或直接描述业务问题与培训设想……",hint:"尽量写出为什么现在要做，以及希望工作中发生什么变化。"},
      {id:"audience",label:"目标人群",type:"text",required:true,placeholder:"例如：60 名新任一线经理"},
      {id:"outcome",label:"最希望看到的变化",type:"text",required:true,placeholder:"例如：能独立完成一次高质量绩效反馈"},
      {id:"cycle",label:"计划周期",type:"text",placeholder:"例如：8 周"},
      {id:"constraints",label:"已知限制",type:"textarea",rows:4,placeholder:"例如：预算、时间或管理者支持；没有可不填"}
    ],
    sample:{need:"公司过去一年晋升了约 60 名一线经理。业务反馈他们仍习惯亲自解决问题，不会授权，也很少进行绩效反馈。HR 希望设计一个项目，帮助他们在 90 天内完成角色转变。业务主管能投入的时间有限。",audience:"入岗 6 个月内的新任一线经理",outcome:"能通过目标澄清、授权和反馈推动团队完成工作",cycle:"90 天",constraints:"集中学习不超过 2 天；需要业务主管参与，但每月最多投入 1 小时"},
    sections:["项目判断","项目目标","内容与方法","实施流程","运营与支持","评估与风险"],
    prompt:"依据 HPT 绩效改进、目标—证据设计与培训迁移工作。先把业务结果转成期望绩效和可观察行为，再判断差距来自知识技能、流程工具、反馈激励、资源环境还是管理支持；明确培训能解决、只能部分解决或不能解决的部分，并给出必要的非培训措施。70-20-10 仅作学习生态检查，不凑比例。不要把课程目录冒充培训项目，不编造组织数据和利益相关者承诺。"
  },
  expert: {
    intro:"把访谈、复盘或案例材料交给 AI，直接形成可复核、可复用的经验资产。",
    fields:[
      {id:"material",label:"经验材料",type:"textarea",required:true,rows:12,placeholder:"粘贴访谈逐字稿、复盘记录、真实事件或操作说明……",hint:"材料不必整理，保留当事人的原话和事件细节更有价值。"},
      {id:"topic",label:"这次想萃取什么",type:"text",required:true,placeholder:"例如：大客户续约谈判中的风险判断"},
      {id:"asset",label:"希望得到的成果",type:"select",options:["经验提纲","决策规则卡","岗位操作指南","访谈追问提纲"]},
      {id:"audience",label:"成果给谁使用",type:"text",placeholder:"例如：新入职客户经理"}
    ],
    sample:{material:"一次重点客户续约前，客户突然要求把交付范围扩大 30%，但不调整价格。资深客户经理没有马上谈价格，而是先询问新范围对应的业务节点、上线时间和失败影响。他发现客户真正担心的是董事会前无法展示成果，于是把需求拆成必须在董事会前完成的最小范围，以及可以二期交付的增强范围。最终双方保留原价格完成第一阶段，并签署了二期补充协议。",topic:"复杂续约场景中的范围判断与谈判",asset:"决策规则卡",audience:"有 1—2 年经验的客户经理"},
    sections:["萃取结论","关键情境与线索","专家判断规则","关键动作","风险边界与待验证项"],
    prompt:"以 CIT 选择关键事件，用 CDM 沿时间线深挖决策点，并用 ACTA 将隐性认知整理成任务结构和判断规则。不是概括材料，而是还原专家当时看见的线索、形成的判断、考虑的选项、作出的取舍和采取的动作。单一事件只能形成经验假设；必须标记证据、反例、适用条件和待专家确认项，材料不足时提出少量高价值追问。"
  },
  course: {
    intro:"围绕一个小任务生成可制作的微课方案，而不是把一门大课简单压缩。",
    fields:[
      {id:"material",label:"主题或已有材料",type:"textarea",required:true,rows:10,placeholder:"粘贴讲义、SOP、案例，或描述希望制作的微课……",hint:"一次微课最好只解决一个真实、具体的小问题。"},
      {id:"audience",label:"目标学员",type:"text",required:true,placeholder:"例如：第一次带团队的新经理"},
      {id:"moment",label:"使用时机",type:"text",required:true,placeholder:"例如：第一次绩效反馈面谈前"},
      {id:"duration",label:"目标时长",type:"select",options:["3 分钟","5 分钟","8 分钟","10 分钟"]},
      {id:"format",label:"期望形式",type:"select",options:["短视频","竖版互动微课","图文卡片","操作演示","音频 + 文字稿"]}
    ],
    sample:{material:"绩效反馈中，经理经常直接说‘你不够主动’，导致员工防御。希望教会经理把人格评价改写成可以讨论的行为事实，并提出下一步期待。",audience:"第一次带团队的新经理",moment:"进行绩效反馈面谈前",duration:"5 分钟",format:"竖版互动微课"},
    sections:["微课定位","单一学习目标","内容结构","分镜脚本","练习与反馈","发布检查"],
    prompt:"依据微学习、逆向设计、认知负荷、多媒体学习与形成性评价工作。先确认学习者、设备和使用时刻，再只保留一个可观察行为和一个达标标准；设计情境钩子、最小必要解释、正反示范、主动练习、解释性反馈和迁移动作。分镜必须具体到画面、旁白、屏显文字与交互，分钟预算必须成立，发布前必须保留人工核验和试测。"
  },
  case: {
    intro:"把真实事件变成有决策张力的教学案例，同时输出学员版和讲师教学指引。",
    fields:[
      {id:"story",label:"真实事件或故事材料",type:"textarea",required:true,rows:12,placeholder:"写清发生了什么、参与角色、关键冲突、当时掌握的信息和最后结果……",hint:"系统会隐藏真实结果，寻找适合课堂讨论的决策停止线。"},
      {id:"ability",label:"希望练习的能力",type:"text",required:true,placeholder:"例如：风险沟通与范围谈判"},
      {id:"audience",label:"目标学员",type:"text",placeholder:"例如：项目经理"},
      {id:"protagonist",label:"案例主角",type:"text",placeholder:"角色或岗位即可；留空由 AI 判断"}
    ],
    sample:{story:"项目上线前两周，客户要求新增三个功能，并表示这些功能是领导验收时必须展示的。合同中没有这些功能，开发团队已经连续加班，项目经理担心直接拒绝会影响续约，但接受又可能导致核心功能延期。真实结果是项目经理和客户重新划分了验收范围。",ability:"范围谈判与利益相关者沟通",audience:"有 2—3 年经验的项目经理",protagonist:"客户项目经理林清"},
    sections:["案例定位","学员版案例","讨论问题","讲师教学指引","事实与风险检查"],
    prompt:"依据决策型案例教学法工作。先明确教学目的并判断事件是否具有真实决策张力，再确定具体主角、时间点、约束、合理分歧和必须作出的决定；学员版停在决策点，只提供主角当时可获得的信息，不泄露真实结果或标准答案。讲师版给出教学目标、讨论路径、可能观点、分析框架、板书、真实结果和揭示节奏。区分事实、观点、改编、推断与待补证内容，并提醒匿名化和授权。"
  },
  activity: {
    intro:"输入学习产出、人数和时间，AI 直接生成讲师可以照着运行的课堂活动。",
    fields:[
      {id:"output",label:"学员最后要做出什么",type:"textarea",required:true,rows:6,placeholder:"例如：每名学员把一条人格评价改写成包含事实、影响和期待的反馈记录",hint:"请写成一个能看见、能检查的动作或作品。"},
      {id:"people",label:"人数",type:"text",required:true,placeholder:"例如：24 人"},
      {id:"minutes",label:"可用时间（分钟）",type:"number",required:true,min:5,max:240,value:"25"},
      {id:"conditions",label:"现场条件",type:"textarea",rows:4,placeholder:"例如：线下固定桌椅；学员互不熟悉；不能分享敏感真实案例"}
    ],
    sample:{output:"每名学员把一条人格评价改写成包含行为事实、影响和下一步期待的反馈记录，并根据同伴反馈完成一次修订",people:"24 人",minutes:"25",conditions:"线下培训，固定桌椅；学员是新任经理；不要求公开分享真实下属姓名"},
    sections:["活动定位","达标产出","活动流程","逐分钟讲师脚本","复盘与反馈","现场备选"],
    prompt:"依据建构性对齐、ICAP、体验学习与结构化复盘工作。先定义每名学员必须交付的可观察产出和达标标准，再确认人数、时间、场地、材料、熟悉度、可达性与心理安全限制，最后选择真正产生目标认知活动的机制。逐分钟脚本必须写清讲师动作、学员动作、产出、观察证据和转场，所有分钟数之和不能超过用户给定时间，并提供压缩版和 Plan B。"
  },
  quiz: {
    intro:"粘贴课程内容，自动生成有依据、有答案、有解析、能检查质量的题目。",
    fields:[
      {id:"material",label:"命题内容",type:"textarea",required:true,rows:12,placeholder:"粘贴课程讲义、制度、SOP、产品资料或知识材料……",hint:"题目只依据你提供的材料，不会编造专业事实。"},
      {id:"purpose",label:"测评用途",type:"select",options:["练习反馈","结业达标","认证","选拔"]},
      {id:"audience",label:"答题对象",type:"text",required:true,placeholder:"例如：新任经理"},
      {id:"quantity",label:"题目数量",type:"number",required:true,min:1,max:30,value:"8"},
      {id:"preference",label:"题型偏好",type:"select",options:["由 AI 按内容决定","单选题为主","情境题为主","混合题型"]}
    ],
    sample:{material:"有效绩效反馈应区分行为事实、解释和评价。描述事实时要指出具体时间、场景和可观察行为，避免‘不积极’‘能力差’等人格判断。反馈后应与员工共同确认下一步行动、标准和复盘时间。",purpose:"练习反馈",audience:"第一次带团队的新经理",quantity:"6",preference:"情境题为主"},
    sections:["命题蓝图","题目与答案","逐题解析","质量检查"],
    prompt:"依据证据中心设计 ECD、测评蓝图和题项审查工作。先划定材料可命题范围并建立可定位的材料锚点，再定义能力主张、可观察证据、内容分布和认知层级，选择匹配题型。每道题必须围绕具体材料依据同步生成题干、选项或评分要点、答案、解析、来源定位和设计难度，禁止先凭常识出题再补来源。材料不足时减题并说明；认证、选拔或合规用途必须进入人工复核和试测。"
  },
  copy: {
    intro:"输入活动信息，直接得到首发、提醒和临期等可发布文案。",
    fields:[
      {id:"information",label:"活动信息",type:"textarea",required:true,rows:11,placeholder:"粘贴活动方案、旧通知，或写清活动、对象、时间、要求、入口和联系人……",hint:"缺少的事实会标记待确认，不会由 AI 自行编造。"},
      {id:"task",label:"现在要推动什么",type:"select",options:["招募报名","开课提醒","课前任务","作业催交","课后跟进"]},
      {id:"channel",label:"主要渠道",type:"select",options:["项目群","私信","邮件","领导转发"]},
      {id:"tone",label:"文案语气",type:"select",options:["专业、直接","温暖、鼓励","简洁、紧迫"]}
    ],
    sample:{information:"新任管理者 90 天成长营将在下周一开班。首批 40 名学员需要在本周五 20:00 前完成 8 分钟课前诊断，并提交 1 个真实管理难题。提交内容会匿名进入首课案例池，不用于绩效评价。入口：https://example.com/check；联系人：学习发展部小林。",task:"课前任务",channel:"项目群",tone:"专业、直接"},
    sections:["活动事实","首发文案","提醒文案","临期文案","发布检查与触达建议"],
    prompt:"依据 COM-B、EAST 与阶段化触达工作。先提取活动事实并确定一个主要行为，判断受众可能卡在能力、机会还是动机；如果阻力来自权限、流程、入口、时间或管理支持，必须给出文案之外的运营动作。再按目标人群、渠道和时点生成真正不同的首发、提醒和临期文案。每条文案只推动一个主要行动，不得虚构日期、名额、价格、链接、联系人、领导背书或收益承诺；信息不足时明确标记待确认。"
  },
  evaluation: {
    intro:"围绕一个真实管理决策，生成够用、可执行的评估方案和采集工具。",
    fields:[
      {id:"project",label:"培训项目与目标",type:"textarea",required:true,rows:10,placeholder:"描述培训对象、内容、希望发生的变化和实施方式……",hint:"不需要先选择评估模型，AI 会根据你的决策需求设计。"},
      {id:"decision",label:"这次评估最想回答什么",type:"select",options:["是否续办","哪里需要改","学员有没有用起来","如何向管理层汇报"]},
      {id:"existing",label:"已经有什么数据",type:"textarea",rows:4,placeholder:"例如：报名、出勤、满意度；没有可以不填"},
      {id:"deadline",label:"什么时候需要结果",type:"text",placeholder:"例如：四周内"}
    ],
    sample:{project:"两天的新任经理绩效反馈训练营，共 60 人。目标是让学员能够完成反馈前准备、反馈对话和后续跟进。课程包含情境练习和同伴反馈。",decision:"是否续办",existing:"课前情境测评、出勤数据和课后满意度",deadline:"四周内形成第一版结论"},
    sections:["评估决策与项目逻辑","关键评估问题","数据采集方案","可直接使用的工具","结果解释边界"],
    prompt:"依据利用导向评估、项目逻辑、培训迁移与贡献分析工作。先明确评估将支持谁做什么决策，再描述项目活动、预期变化、关键假设、迁移条件和外部因素；据此提出 2—4 个关键评估问题。判断已有数据能说明什么、不能说明什么，只补最少的关键证据。方案必须给出对象、方法、时点、责任人、样本和投入，并生成可直接使用的工具。不得把满意度当学习效果，不得把相关性写成培训造成的因果。"
  }
};
