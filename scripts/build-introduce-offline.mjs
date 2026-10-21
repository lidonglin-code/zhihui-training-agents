import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const introduceDir = join(projectRoot, "dist", "introduce");
const assetDir = join(projectRoot, "dist", "assets");
const outputPath = resolve(projectRoot, "..", "新境智能体介绍页.html");

const ids = ["expert", "project", "course", "case", "activity", "quiz", "evaluation", "copy"];
const assetNames = [
  ...ids.flatMap(id => [`characters/agents-v1/${id}.png`, `characters/agents-v1/${id}-wordfield-v1.png`]),
  "brand/zhihui-wordmark-angular-v2.png"
];
const assets = {};

for (const name of assetNames) {
  const buffer = await readFile(join(assetDir, name));
  const mime = name.endsWith(".jpg") ? "image/jpeg" : "image/png";
  assets[name] = `data:${mime};base64,${buffer.toString("base64")}`;
}

const [sourceHtml, css, toolsData, app] = await Promise.all([
  readFile(join(introduceDir, "index.html"), "utf8"),
  readFile(join(introduceDir, "styles.css"), "utf8"),
  readFile(join(projectRoot, "dist", "tools-data.js"), "utf8"),
  readFile(join(introduceDir, "app.js"), "utf8")
]);

const escapeInlineScript = value => value.replace(/<\/script/gi, "<\\/script");
const offlineWordfieldCss = ids.map(id =>
  `--offline-wordfield-${id}:url('${assets[`characters/agents-v1/${id}-wordfield-v1.png`]}');`
).join("\n");

let html = sourceHtml
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>\n${css}\n:root {\n${offlineWordfieldCss}\n}\n</style>`)
  .replace(/src="\.\.\/assets\/([^\"]+)"/g, (_, assetKey) => {
    if (!assets[assetKey]) throw new Error(`离线资源缺失：${assetKey}`);
    return `data-offline-src="${assetKey}"`;
  })
  .replace(/--wordfield-image:url\('\.\.\/assets\/characters\/agents-v1\/([^']+)'\)/g, (_, name) => {
    const assetKey = `characters/agents-v1/${name}`;
    if (!assets[assetKey]) throw new Error(`离线资源缺失：${name}`);
    const id = name.replace(/-wordfield-v1\.png$/, "");
    return `--wordfield-image:var(--offline-wordfield-${id})`;
  })
  .replace(
    '<script src="../tools-data.js"></script>',
    `<script>\nwindow.XINJING_OFFLINE_ASSETS=${JSON.stringify(assets)};\ndocument.querySelectorAll("[data-offline-src]").forEach(image => { image.src = window.XINJING_OFFLINE_ASSETS[image.dataset.offlineSrc]; });\n${escapeInlineScript(toolsData)}\n</script>`
  )
  .replace('<script src="./app.js"></script>', `<script>\n${escapeInlineScript(app)}\n</script>`);

await writeFile(outputPath, html);
console.log(outputPath);
