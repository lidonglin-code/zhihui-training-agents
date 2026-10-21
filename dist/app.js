const tools = [
  {
    id: 'expert', number: '01', name: '专家经验萃取官', category: '经验萃取',
    intro: '给我一个萃取主题或一份访谈材料，提炼关键任务、判断依据与可复制经验。',
    prompt: '你想萃取哪方面的经验？', resultTitle: '萃取提纲与经验初稿', generate: '生成萃取提纲与经验初稿',
    fields: [
      { label: '萃取主题', type: 'input', value: '大客户销售如何判断项目是否值得投入' },
      { label: '经验使用对象', type: 'input', value: '入职 1 年以内的大客户销售' },
      { label: '访谈材料或专家描述', type: 'textarea', value: '专家提到：我不会只看客户说得有多积极，而会判断有没有真正的业务牵引人、决策链是否清晰，以及客户愿不愿意为下一步行动投入资源。' }
    ],
    quality: ['完整度 89%', '已区分事实、判断与待追问内容'],
    result: `
      <div class="result-block hero-block"><span class="block-label">核心经验命题</span><h3>客户的积极态度不等于真实机会</h3><p>专家真正判断的是：客户是否愿意为项目投入人、时间、信息与组织资源。</p></div>
      <div class="result-block"><div class="block-head"><span class="block-label">三类关键判断线索</span><button data-adjust>继续深挖</button></div><div class="signal-grid"><div><b>业务牵引</b><p>内部是否有人主动推动，并能说明不行动的业务代价。</p></div><div><b>决策可见</b><p>能否识别决策人、影响者、使用者与潜在反对者。</p></div><div><b>资源承诺</b><p>客户是否愿意安排会议、提供数据或投入试点人员。</p></div></div></div>
      <div class="result-block"><span class="block-label">专家与新手的差异</span><div class="compare"><div><small>新手容易</small><b>被口头热情吸引</b><p>把“感兴趣、回头聊”当作积极信号。</p></div><div><small>专家更看重</small><b>可观察的投入行为</b><p>用下一步承诺验证机会真实性。</p></div></div></div>
      <div class="result-block"><div class="block-head"><span class="block-label">建议继续追问</span><button data-adjust>生成下一问</button></div><ol><li>最近一次你主动放弃“看起来很有希望”的项目是什么？</li><li>当时哪个信号让你改变了判断？</li><li>如果是新人，他最可能忽略什么？</li></ol></div>`
  },
  {
    id: 'project', number: '02', name: '培训项目架构师', category: '项目设计',
    intro: '用一句话描述培训需求，获得目标、路径、运营与评估一体化的项目框架初稿。',
    prompt: '请描述你接到的培训需求', resultTitle: '培训项目框架初稿', generate: '生成项目框架初稿',
    fields: [
      { label: '培训需求', type: 'textarea', value: '公司今年晋升了 40 名新任管理者，希望用三个月帮助他们完成角色转变，减少团队管理中的被动救火。' },
      { label: '项目对象', type: 'input', value: '首次带团队、任职不满 6 个月的新任管理者' },
      { label: '项目周期', type: 'select', value: '3 个月', options: ['1 个月','2 个月','3 个月','6 个月'] }
    ],
    quality: ['可执行度 91%', '已识别培训与非培训措施'],
    result: `
      <div class="result-block hero-block"><span class="block-label">项目主线</span><h3>从个人贡献者到团队绩效负责人</h3><p>不以“学完管理知识”为目标，而以建立目标管理、任务授权、反馈辅导三项日常管理行为为主线。</p></div>
      <div class="result-block"><span class="block-label">问题判断</span><div class="decision"><b>培训可解决</b><p>缺少角色认知、管理动作和情境练习。</p><b>需要组织配合</b><p>上级需提供真实授权机会，并按统一行为标准进行观察反馈。</p></div></div>
      <div class="result-block"><div class="block-head"><span class="block-label">三个月培养路径</span><button data-adjust>调整节奏</button></div><div class="timeline"><div><em>01</em><b>角色校准</b><small>诊断 + 启动工作坊</small></div><div><em>02</em><b>关键动作</b><small>三次主题学习与演练</small></div><div><em>03</em><b>岗位实践</b><small>真实任务 + 上级反馈</small></div><div><em>04</em><b>成果复盘</b><small>案例答辩 + 行为复测</small></div></div></div>
      <div class="result-block"><span class="block-label">成功指标</span><ul><li>90% 学员完成三项岗位实践任务</li><li>直属上级观察到至少两项目标行为稳定出现</li><li>学员团队的任务返工与被动升级情况下降</li></ul></div>`
  },
  {
    id: 'course', number: '03', name: '课程开发教练', category: '课程设计',
    intro: '给我一个课程主题、对象和时长，先得到一份可继续开发的课程大纲初稿。',
    prompt: '你想开发什么课程？', resultTitle: '课程大纲初稿', generate: '生成课程大纲初稿',
    fields: [
      { label: '课程主题', type: 'input', value: '新任店长的员工激励' },
      { label: '目标学员', type: 'input', value: '有 0–1 年经验的新任店长' },
      { label: '课程时长', type: 'select', value: '2 小时', options: ['90 分钟','2 小时','半天','1 天'] },
      { label: '目前最想解决的问题', type: 'textarea', value: '店长习惯用奖金解决所有激励问题，不会根据员工状态选择合适的激励方式。' }
    ],
    quality: ['完整度 92%', '目标、内容、练习已对齐'],
    result: `
      <div class="result-block hero-block"><span class="block-label">课程定位</span><h3>从“统一激励”走向“因人施策”</h3><p>帮助新任店长识别员工状态与需求，选择恰当的非物质与物质激励方式。</p></div>
      <div class="result-block"><div class="block-head"><span class="block-label">学习目标</span><button data-adjust>调整</button></div><ul><li>识别三类常见员工状态背后的需求信号</li><li>根据情境选择匹配的激励策略</li><li>完成一次具体、可信的激励沟通</li></ul></div>
      <div class="result-block"><div class="block-head"><span class="block-label">课程结构 · 120 分钟</span><button data-adjust>调整时间</button></div><div class="module"><em>01</em><div><b>看见差异：为什么奖金不是万能答案</b><small>20 分钟 · 反例导入 + 快速诊断</small></div></div><div class="module"><em>02</em><div><b>判断需求：从行为线索读懂员工状态</b><small>35 分钟 · 三类员工案例分析</small></div></div><div class="module"><em>03</em><div><b>匹配策略：选择真正有效的激励方式</b><small>35 分钟 · 策略卡片 + 小组决策</small></div></div><div class="module"><em>04</em><div><b>说出激励：完成一次高质量沟通</b><small>30 分钟 · 示范 + 两人演练 + 反馈</small></div></div></div>`
  },
  {
    id: 'case', number: '04', name: '教学案例工坊', category: '案例开发',
    intro: '给我一个知识点或教学主题，生成可讨论、可复盘、可直接进课堂的完整教学案例。',
    prompt: '你想用案例讲清楚什么？', resultTitle: '完整教学案例', generate: '生成完整教学案例',
    fields: [
      { label: '教学主题', type: 'input', value: '跨部门沟通中的需求澄清' },
      { label: '目标学员', type: 'input', value: '项目经理与职能部门骨干' },
      { label: '希望学员思考的问题', type: 'textarea', value: '面对模糊、紧急且不断变化的需求，应该先澄清什么，而不是立刻承诺？' },
      { label: '案例类型', type: 'select', value: '两难决策案例', options: ['两难决策案例','反面案例','正反对比案例','角色扮演案例'] }
    ],
    quality: ['课堂适配 94%', '冲突、信息与决策点完整'],
    result: `
      <div class="result-block hero-block"><span class="block-label">案例标题</span><h3>“周五必须上线”：一封没有说清楚的紧急邮件</h3><p>建议讨论时间 20 分钟 · 适合 4–6 人小组</p></div>
      <div class="result-block story"><span class="block-label">学员版案例</span><p>周一上午，市场部负责人林悦给项目经理陈阳发来邮件：“总部领导周五来访，请务必在此之前上线客户数据看板，这是最高优先级。”陈阳的团队正在处理另一个关键版本，最快需要两周。市场部只提供了一张手绘草图，却希望陈阳当天下午确认交付……</p><p>下午会议前，技术负责人提醒陈阳：如果承诺周五上线，只能牺牲数据校验；如果直接拒绝，市场部会认为项目团队缺乏业务意识。</p></div>
      <div class="result-block"><div class="block-head"><span class="block-label">讨论问题</span><button data-adjust>增加追问</button></div><ol><li>陈阳此刻最不应该立即承诺什么？</li><li>在讨论方案前，他必须澄清哪四类信息？</li><li>如果你是陈阳，下午会议的第一句话会怎么说？</li></ol></div>
      <div class="result-block"><span class="block-label">讲师点评要点</span><div class="tag-row"><span>真实业务目的</span><span>最低成功标准</span><span>不可妥协约束</span><span>决策责任人</span></div><p>点评重点不在“答应还是拒绝”，而在能否把对方的紧急要求转化为可共同决策的问题。</p></div>`
  },
  {
    id: 'activity', number: '05', name: '课堂活动设计师', category: '活动设计',
    intro: '给出教学目标、人数和时间，获得一份包含步骤、话术与复盘问题的活动方案。',
    prompt: '这次活动要让学员学会什么？', resultTitle: '可直接使用的活动方案', generate: '生成课堂活动方案',
    fields: [
      { label: '教学目标', type: 'textarea', value: '让学员能够在绩效反馈中描述具体行为，而不是给员工贴标签。' },
      { label: '学员人数', type: 'select', value: '24 人', options: ['12 人以内','13–24 人','24 人','25–40 人','40 人以上'] },
      { label: '可用时间', type: 'select', value: '25 分钟', options: ['10 分钟','15 分钟','25 分钟','40 分钟'] },
      { label: '授课形式', type: 'select', value: '线下', options: ['线下','线上'] }
    ],
    quality: ['可操作性 96%', '时间、分组、话术与复盘齐全'],
    result: `
      <div class="result-block hero-block"><span class="block-label">推荐活动</span><h3>标签翻译器：把评价改写成行为</h3><p>24 人 · 4 人一组 · 25 分钟 · 无需特殊道具</p></div>
      <div class="result-block"><span class="block-label">活动步骤</span><div class="timeline vertical"><div><em>03′</em><b>识别标签</b><small>每组领取一句常见评价：“他态度不积极。”</small></div><div><em>07′</em><b>追问事实</b><small>用时间、场景、动作、影响四个维度补足信息。</small></div><div><em>08′</em><b>改写反馈</b><small>将标签改写成可观察、可讨论的行为描述。</small></div><div><em>07′</em><b>互评复盘</b><small>相邻小组用检查表给出反馈。</small></div></div></div>
      <div class="result-block"><div class="block-head"><span class="block-label">讲师引导语</span><button data-adjust>换一种说法</button></div><blockquote>“先不要急着评价这个员工。请把摄像机能够拍到的事实写下来：他在什么场景下，具体做了什么，产生了什么影响？”</blockquote></div>
      <div class="result-block"><span class="block-label">复盘问题</span><ul><li>哪一个词最容易让事实重新变成评价？</li><li>改写之后，员工更容易回应什么？</li><li>你下次反馈时准备删掉哪个标签词？</li></ul></div>`
  },
  {
    id: 'quiz', number: '06', name: '智能题库助手', category: '测评设计',
    intro: '给我一个主题或一份材料，生成带考点、答案、解析和难度标签的题目。',
    prompt: '你想围绕什么内容出题？', resultTitle: '带答案解析的题目', generate: '生成题目',
    fields: [
      { label: '测评主题', type: 'input', value: '绩效反馈中的 SBI 行为反馈法' },
      { label: '测评对象', type: 'input', value: '参加管理者培训的部门主管' },
      { label: '题目数量', type: 'select', value: '5 题', options: ['3 题','5 题','10 题','20 题'] },
      { label: '题目偏好', type: 'select', value: '情境应用为主', options: ['基础理解为主','情境应用为主','混合难度'] }
    ],
    quality: ['题目质量 93%', '答案唯一，干扰项有依据'],
    result: `
      <div class="result-block hero-block"><span class="block-label">题库概览</span><h3>5 题 · 3 个考点 · 情境应用为主</h3><p>考点覆盖：情境描述、行为事实、影响表达。</p></div>
      <div class="result-block question"><div class="question-meta"><span>单选题</span><span>中等</span><span>行为事实</span></div><h3>1. 哪一句最符合 SBI 中的“行为”描述？</h3><div class="options"><p>A. 你最近工作态度不够积极</p><p class="correct">B. 在昨天的项目会上，你连续三次打断同事发言</p><p>C. 你需要提高团队合作意识</p><p>D. 大家都觉得你比较强势</p></div><div class="analysis"><b>答案：B</b><p>它描述了特定场景中可观察的动作，没有推测动机或使用人格标签。</p></div></div>
      <div class="result-block question"><div class="question-meta"><span>情境单选</span><span>较难</span><span>完整应用</span></div><h3>2. 员工提交报告晚了两天，管理者首先应该怎样表达？</h3><div class="options"><p>A. 你总是缺乏时间观念</p><p>B. 以后不准再出现这种情况</p><p class="correct">C. 周一约定的报告在周三下午提交，使评审会议推迟了一天</p><p>D. 这件事让我非常失望</p></div><div class="analysis"><b>答案：C</b><p>同时包含具体情境、行为及其影响，为后续讨论原因和改进创造空间。</p></div></div>`
  },
  {
    id: 'evaluation', number: '07', name: '培训评估顾问', category: '效果评估',
    intro: '输入课程名称和培训目标，获得指标、工具、时间与责任人完整对应的评估方案。',
    prompt: '你准备评估哪个培训？', resultTitle: '培训评估方案', generate: '生成培训评估方案',
    fields: [
      { label: '课程或项目名称', type: 'input', value: '管理者绩效反馈训练营' },
      { label: '培训目标', type: 'textarea', value: '管理者能够在真实绩效沟通中描述具体行为、分析影响并与员工共创改进行动。' },
      { label: '评估周期', type: 'select', value: '培训后 60 天', options: ['仅培训当天','培训后 30 天','培训后 60 天','培训后 90 天'] }
    ],
    quality: ['证据完整度 90%', '学习、行为与业务证据已区分'],
    result: `
      <div class="result-block hero-block"><span class="block-label">评估重点</span><h3>不只问“满意吗”，而要验证“是否会用、是否在用”</h3><p>核心证据来自情境演练、真实谈话记录和直属上级行为观察。</p></div>
      <div class="result-block"><span class="block-label">评估矩阵</span><div class="matrix"><div class="matrix-head"><b>阶段</b><b>验证问题</b><b>证据与工具</b></div><div><strong>课前</strong><span>当前差距是什么？</span><span>情境题 + 自评基线</span></div><div><strong>课中</strong><span>是否真正掌握？</span><span>角色演练评分表</span></div><div><strong>30 天</strong><span>是否应用到工作？</span><span>谈话记录 + 员工反馈</span></div><div><strong>60 天</strong><span>行为是否稳定？</span><span>上级观察 + 案例复盘</span></div></div></div>
      <div class="result-block"><div class="block-head"><span class="block-label">核心行为观察项</span><button data-adjust>调整指标</button></div><ul class="check-list"><li>以具体场景和行为开场，而非人格评价</li><li>说明行为对任务、团队或客户的实际影响</li><li>邀请员工表达观点并共同确定下一步行动</li></ul></div>
      <div class="result-block"><span class="block-label">使用提醒</span><p>业务指标只作为辅助证据。单次课程无法独立解释全部绩效变化，应同步记录管理支持、任务机会和流程变化。</p></div>`
  },
  {
    id: 'copy', number: '08', name: '运营文案官', category: '项目运营',
    intro: '输入活动信息和当前阶段，获得符合培训场景、可直接发布的运营文案。',
    prompt: '你现在要发布什么信息？', resultTitle: '可直接发布的运营文案', generate: '生成运营文案',
    fields: [
      { label: '活动名称', type: 'input', value: '新任管理者 90 天成长营' },
      { label: '当前阶段', type: 'select', value: '开班前 3 天', options: ['招募阶段','开班前 3 天','学习进行中','催交作业','结业阶段'] },
      { label: '希望学员采取的行动', type: 'textarea', value: '完成课前诊断，并带来一个近期真实发生的团队管理难题。' },
      { label: '文案语气', type: 'select', value: '专业、有温度', options: ['专业、有温度','简洁直接','轻松活泼','正式严谨'] }
    ],
    quality: ['可发布度 97%', '行动、时间与入口清晰'],
    result: `
      <div class="result-block hero-block"><span class="block-label">推荐版本 · 班级群</span><h3>开班前，先带一个真实问题来</h3><p>各位伙伴，距离「新任管理者 90 天成长营」正式开始还有 3 天。这次学习不会从抽象理论出发，而会从你正在经历的管理难题开始。</p><p>请在明晚 20:00 前完成课前诊断，并准备一个近期真实发生、还没有完全解决的团队管理问题。它将成为你接下来 90 天的实践起点。</p><div class="copy-cta">现在行动：完成课前诊断 → 带来一个真实问题</div></div>
      <div class="result-block"><div class="block-head"><span class="block-label">精简提醒版</span><button data-adjust>换种语气</button></div><p>开班倒计时 3 天。请在明晚 20:00 前完成课前诊断，并带来一个真实的团队管理难题。我们不从标准答案开始，从你眼前的问题开始。</p></div>
      <div class="result-block"><span class="block-label">发送建议</span><div class="send-plan"><div><b>今天 17:30</b><p>发送推荐版本，说明任务意义。</p></div><div><b>截止前 3 小时</b><p>仅提醒未完成人员，使用精简版。</p></div></div></div>`
  }
];

let activeId = location.hash.replace('#', '') || 'course';
if (!tools.some(tool => tool.id === activeId)) activeId = 'course';

const workspace = document.querySelector('#workspace');
const toolNav = document.querySelector('#toolNav');
const crumbName = document.querySelector('#crumbName');
const toast = document.querySelector('#toast');
const modelDialog = document.querySelector('#modelDialog');

function fieldHTML(field, index) {
  const id = `field-${index}`;
  if (field.type === 'textarea') return `<label for="${id}">${field.label}<textarea id="${id}" rows="4">${field.value}</textarea></label>`;
  if (field.type === 'select') return `<label for="${id}">${field.label}<select id="${id}">${field.options.map(value => `<option ${value === field.value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`;
  return `<label for="${id}">${field.label}<input id="${id}" value="${field.value}" /></label>`;
}

function renderNav() {
  toolNav.innerHTML = tools.map(tool => `<button class="nav-item ${tool.id === activeId ? 'active' : ''}" data-tool="${tool.id}"><span>${tool.number}</span>${tool.name}</button>`).join('');
  toolNav.querySelectorAll('button').forEach(button => button.addEventListener('click', () => switchTool(button.dataset.tool)));
}

function renderWorkspace() {
  const tool = tools.find(item => item.id === activeId);
  crumbName.textContent = tool.name;
  workspace.innerHTML = `
    <div class="intro-row">
      <div><span class="eyebrow">${tool.number} · ${tool.category}</span><h1>${tool.name}</h1><p>${tool.intro}</p></div>
      <div class="tool-position"><b>${Number(tool.number)}</b><span>/ 8</span><small>独立工具 Demo</small></div>
    </div>
    <div class="work-grid">
      <section class="input-panel card">
        <div class="panel-title"><div><span>输入</span><h2>${tool.prompt}</h2></div><button class="text-button" id="resetExample">使用示例</button></div>
        <div class="form-fields">${tool.fields.map((field, index) => fieldHTML(field, index)).join('')}</div>
        <button class="primary-button" id="generateResult">${tool.generate}</button>
        <p class="microcopy">演示版使用内置示例，不会调用或保存 API Key。</p>
      </section>
      <section class="result-panel card">
        <div class="panel-title result-heading"><div><span>结果</span><h2>${tool.resultTitle}</h2></div><div class="result-actions"><button class="icon-button" data-copy>复制</button><button class="icon-button" data-export>导出</button></div></div>
        <div class="quality-strip"><b>${tool.quality[0]}</b><span>${tool.quality[1]}</span><button data-check>查看检查</button></div>
        <div id="resultContent" class="result-content">${tool.result}</div>
        <div class="sequence-nav"><button ${tool.number === '01' ? 'disabled' : ''} data-direction="prev">上一个工具</button><span>${tool.number} / 08</span><button ${tool.number === '08' ? 'disabled' : ''} data-direction="next">下一个工具</button></div>
      </section>
    </div>`;
  bindWorkspace(tool);
}

function switchTool(id) {
  activeId = id;
  history.replaceState(null, '', `#${id}`);
  document.querySelector('.sidebar').classList.remove('open');
  renderNav(); renderWorkspace();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function bindWorkspace(tool) {
  document.querySelector('#resetExample').addEventListener('click', () => { renderWorkspace(); showToast('已恢复示例内容'); });
  document.querySelector('#generateResult').addEventListener('click', event => {
    const panel = document.querySelector('#resultContent'); const button = event.currentTarget;
    button.textContent = '正在生成并检查…'; panel.classList.add('is-loading');
    setTimeout(() => { button.textContent = `重新${tool.generate}`; panel.classList.remove('is-loading'); showToast('已生成并完成质量检查'); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 850);
  });
  document.querySelector('[data-copy]').addEventListener('click', async () => { try { await navigator.clipboard.writeText(document.querySelector('#resultContent').innerText); showToast('结果已复制'); } catch { showToast('演示：结果已准备复制'); } });
  document.querySelector('[data-export]').addEventListener('click', () => showToast('正式版将导出为 Word 文档'));
  document.querySelector('[data-check]').addEventListener('click', () => showToast(`质量检查通过：${tool.quality[1]}`));
  document.querySelectorAll('[data-adjust]').forEach(button => button.addEventListener('click', () => { button.textContent = '已优化'; button.closest('.result-block').classList.add('adjusted'); showToast('已完成局部优化'); }));
  document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => { const index = tools.findIndex(item => item.id === activeId); switchTool(tools[index + (button.dataset.direction === 'next' ? 1 : -1)].id); }));
}

document.querySelector('#modelButton').addEventListener('click', () => modelDialog.showModal());
document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
document.querySelector('.dialog-close').addEventListener('click', () => modelDialog.close());
document.querySelector('#fakeConnect').addEventListener('click', () => { document.querySelector('#fakeConnect').textContent = '演示连接成功'; setTimeout(() => { modelDialog.close(); showToast('演示连接成功，未保存任何信息'); }, 650); });
window.addEventListener('hashchange', () => { const id = location.hash.replace('#', ''); if (tools.some(tool => tool.id === id)) switchTool(id); });

if (document.modelContext?.registerTool) {
  document.modelContext.registerTool({
    name: 'open_training_tool', title: '打开培训工具', description: '打开指定的新境培训智能工具 Demo。',
    inputSchema: { type: 'object', properties: { toolId: { type: 'string', enum: tools.map(tool => tool.id) } }, required: ['toolId'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) { if (!tools.some(tool => tool.id === input.toolId)) throw new Error('未知工具'); switchTool(input.toolId); return { opened: input.toolId, name: tools.find(tool => tool.id === input.toolId).name }; }
  });
}

renderNav(); renderWorkspace();
