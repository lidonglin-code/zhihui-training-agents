// BEGIN STATIC CONTENT SOURCE
// The introduction's narrative order is independent of the workbench's tool order.
const introductionNumbers = {
  project: "01",
  expert: "02",
  case: "03",
  course: "04",
  quiz: "05",
  activity: "06",
  copy: "07",
  evaluation: "08"
};
const products = (window.PRODUCTS || [])
  .map(product => ({
    ...product,
    number: introductionNumbers[product.id] || product.number
  }))
  .sort((left, right) => Number(left.number) - Number(right.number));

const accents = {
  indigo: "#aaa6d3",
  cyan: "#75a8b5",
  coral: "#c98f82",
  amber: "#c1a373",
  violet: "#ad9aca",
  blue: "#83a2c7",
  plum: "#b18eaa",
  mint: "#79a48f"
};

const wordfieldPalettes = {
  expert: ["#c6c2dc", "#6f7f9b", "#85839f", "#aebfda"],
  project: ["#b7d0d5", "#5e8391", "#6f91a0", "#a2c8d2"],
  course: ["#c5d2e3", "#8b6f84", "#7f91aa", "#c4a3ba"],
  case: ["#d0beb5", "#866b60", "#88736c", "#c9a797"],
  activity: ["#ddb7b0", "#9d6678", "#9b7471", "#d6a3b2"],
  quiz: ["#b0c3d6", "#5d7e9f", "#6e89a5", "#aac8e4"],
  evaluation: ["#cbb3c7", "#87647f", "#8d7188", "#c8a5c1"],
  copy: ["#d8c4a5", "#8a704b", "#927a58", "#d8c195"]
};

const stories = {
  expert: {
    tagline: "把高手说不清的经验，变成别人做得到的判断。",
    summary: "从访谈、复盘和真实事件中还原情境线索、判断规则、关键动作与适用边界。它不是替专家总结几条金句，而是把隐性经验变成可追溯、可复用的组织资产。",
    scenes: ["已有专家访谈或复盘材料，需要形成经验素材包"],
    outputs: ["关键事件与证据锚点", "判断规则与任务做法图", "待追问问题与适用边界"]
  },
  project: {
    tagline: "先判断是不是培训问题，再设计一套真正能落地的项目。",
    summary: "从培训需求出发，连接业务问题、岗位行为、学习内容、实践任务、主管支持和评估证据。培训只是干预组合的一部分，不会被默认成所有问题的答案。",
    scenes: ["领导提出一句“做一期培训”，需要形成可立项方案"],
    outputs: ["立项判断与三层需求", "目标、内容与干预组合", "实施运营、评估与风险"]
  },
  course: {
    tagline: "把一个真实小任务，做成能练、能反馈、能制作的微课。",
    summary: "先判断任务是否适合微课，再把单一目标、时间预算、分镜脚本、主动练习、解释性反馈和发布检查组织成一份制作包。短，不等于把内容压缩得更密。",
    scenes: ["把常见岗位问题做成 3–10 分钟微课"],
    outputs: ["微课定位与单一目标", "带时间码的逐镜脚本", "练习反馈、资产与发布清单"]
  },
  case: {
    tagline: "把真实工作事件，做成让学员练习判断的教学案例。",
    summary: "围绕一个具体主角、具体时刻和具体选择，编排事实、约束与合理分歧。学员版停在决策点，讲师版则提供可执行的讨论路径、追问、板书与时间。",
    scenes: ["把业务故事或访谈材料转成课堂案例"],
    outputs: ["决策焦点与事实库", "不泄题的学员版案例", "讲师笔记、板书与带课时间表"]
  },
  activity: {
    tagline: "不是再找一个热闹游戏，而是编排一次可观察的学习。",
    summary: "从学员要做出的可观察产出出发，在人数、时间、场地和材料约束下选择活动机制，生成逐分钟运行脚本、观察证据、结构化复盘与现场 Plan B。",
    scenes: ["在一段课程中加入练习、讨论或模拟"],
    outputs: ["机制选择与达标规准", "逐分钟讲师运行单", "复盘反馈、迁移动作与 Plan B"]
  },
  quiz: {
    tagline: "把课程材料，变成有依据、带解析、可审查的题库。",
    summary: "系统先在后台建立能力—证据蓝图，再生成题干、答案、解析、来源与干扰项依据。高风险、低证据、重复或有歧义的题目会进入人工复核队列。",
    scenes: ["把课程、制度或 SOP 快速转成可审核题库"],
    outputs: ["能力—证据蓝图", "带答案解析和来源的题库", "质量问题与人工复核队列"]
  },
  evaluation: {
    tagline: "从真正想知道的问题出发，设计能支持决策的评估方案。",
    summary: "从谁要依据结果做什么决定开始，设计结果—行为—学习—体验证据链，形成最小可行的数据计划、采集工具和解释边界。不是每个项目都机械做满四层。",
    scenes: ["决定项目是否续办、扩展或修改"],
    outputs: ["评估问题与证据链", "方法、对象、时点和责任人", "工具草案与归因边界"]
  },
  copy: {
    tagline: "不是把通知写得好看，而是推动一个明确行动。",
    summary: "从活动材料中提取对象、行动、截止时间、入口和参与收益，诊断行动阻力，再按首发、提醒、临期等时点生成真正适配渠道的完整文案与发布检查。",
    scenes: ["发布招募、报名、开课提醒、作业催交或课后跟进"],
    outputs: ["活动事实与阻力判断", "2–4 条分阶段完整文案", "触达节奏与发布检查"]
  }
};

function imagePath(path) {
  const assetKey = path.replace(/^\.\/assets\//, "");
  return window.XINJING_OFFLINE_ASSETS?.[assetKey] || `../assets/${assetKey}`;
}

function renderProducts() {
  const index = document.querySelector("#productIndex");
  const container = document.querySelector("#productStories");
  if (index.querySelector("[data-index-link]") && container.querySelector("[data-product-story]")) return;
  index.innerHTML = products.map(product => `
    <a href="#${product.id}" data-index-link="${product.id}" aria-label="${product.number} ${product.name}" title="${product.name}">
      <i>${product.number}</i><b>${product.name.slice(0, 4)}</b>
    </a>`).join("");

  container.innerHTML = products.map(product => {
    const story = stories[product.id];
    const shortSummary = `${story.summary.split("。")[0]}。`;
    const desktopBreakAfter = {
      course: "能练、",
      evaluation: "，",
      activity: "，"
    }[product.id];
    const taglineMarkup = product.id === "project"
      ? story.tagline.replace("，", "，<br>")
      : desktopBreakAfter
        ? story.tagline.replace(desktopBreakAfter, `${desktopBreakAfter}<br class="desktop-tagline-break">`)
        : story.tagline;
    const [wordMain, wordRole, wordMainDark, wordRoleDark] = wordfieldPalettes[product.id];
    const wordfieldPath = imagePath(`./assets/characters/agents-v1/${product.id}-wordfield-v1.png`);
    const wordfieldStyle = `--wordfield-image:url('${wordfieldPath}')`;
    const portraitMarkup = `<span class="generated-wordfield generated-wordfield--back" style="${wordfieldStyle}" aria-hidden="true"></span>
         <span class="generated-wordfield generated-wordfield--role" style="${wordfieldStyle}" aria-hidden="true"></span>
         <img class="generated-person" src="${imagePath(product.image)}" alt="${product.name}高清人物形象">
         <span class="generated-wordfield generated-wordfield--front generated-wordfield--front-mid" style="${wordfieldStyle}" aria-hidden="true"></span>
         <span class="generated-wordfield generated-wordfield--front generated-wordfield--front-low" style="${wordfieldStyle}" aria-hidden="true"></span>`;
    return `
      <article class="product-story product-story--generated-art" id="${product.id}" style="--product-accent:${accents[product.accent] || accents.indigo};--word-main:${wordMain};--word-role:${wordRole};--word-main-dark:${wordMainDark};--word-role-dark:${wordRoleDark}" data-product-story>
        <div class="product-visual">
          <div class="portrait-frame">${portraitMarkup}</div>
        </div>
        <div class="product-copy">
          <h3 class="visually-hidden">${product.name}</h3>
          <span class="product-kicker">${product.number} / ${product.category}</span>
          <p class="tagline"><span>${taglineMarkup}</span></p>
          <p class="summary">${shortSummary}</p>
          <div class="product-essentials">
            <div><span>适合</span><p>${story.scenes[0]}</p></div>
            <div><span>成果</span><p>${story.outputs.join(" · ")}</p></div>
          </div>
          <div class="product-actions">
            <a class="button" href="../#${product.id}">进入${product.name}</a>
          </div>
        </div>
      </article>`;
  }).join("");
}
// END STATIC CONTENT SOURCE

// Decode the first product's lettering before it enters the viewport. The portrait
// is already used in the hero, but this mask image first appears in the product area.
let firstWordfieldImage;
function prepareFirstProductArtwork() {
  if (!products.length) return;
  firstWordfieldImage = new Image();
  firstWordfieldImage.src = imagePath(`./assets/characters/agents-v1/${products[0].id}-wordfield-v1.png`);
  firstWordfieldImage.decode?.().catch(() => {});
}

function bindScrollState() {
  const header = document.querySelector(".site-header");
  const index = document.querySelector("#productIndex");
  const storyNodes = document.querySelectorAll("[data-product-story]");
  const links = document.querySelectorAll("[data-index-link]");
  let activeId = "";
  const setActive = id => {
    if (id === activeId) return;
    activeId = id;
    links.forEach(link => link.classList.toggle("active", link.dataset.indexLink === id));
    if (!id || index.scrollWidth <= index.clientWidth) return;
    const activeLink = document.querySelector(`[data-index-link="${id}"]`);
    const offset = activeLink.getBoundingClientRect().left - index.getBoundingClientRect().left;
    index.scrollTo({ left: index.scrollLeft + offset - index.clientWidth * .43, behavior: "smooth" });
  };
  let scrollFrame = 0;
  const updateScrollState = () => {
    scrollFrame = 0;
    header.classList.toggle("scrolled", window.scrollY > 18);
    let current = "";
    storyNodes.forEach(story => {
      const rect = story.getBoundingClientRect();
      if (rect.top <= Math.min(innerHeight * .46, 360) && rect.bottom > 180) current = story.id;
    });
    setActive(current);
  };
  const onScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollState);
  };
  addEventListener("scroll", onScroll, { passive: true });
  updateScrollState();
}

function bindProductNavigation() {
  document.querySelector("#productIndex").addEventListener("click", event => {
    const link = event.target.closest("[data-index-link]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.dataset.indexLink);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start"
    });
  });
}

renderProducts();
prepareFirstProductArtwork();
bindProductNavigation();
bindScrollState();
