import { access, copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(projectRoot, "..");
const sourceRoot = join(workspaceRoot, "zhihui-intro-site");
const outputRoot = join(workspaceRoot, "zhihui-intro-site-lite");
const ids = ["expert", "project", "course", "case", "activity", "quiz", "evaluation", "copy"];
const assetSource = join(sourceRoot, "assets");
const assetOutput = join(outputRoot, "assets");

try {
  await access(outputRoot);
  throw new Error(`目标文件夹已存在，为避免覆盖请先检查：${outputRoot}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

await mkdir(join(assetOutput, "characters", "agents-v1"), { recursive: true });
await mkdir(join(assetOutput, "brand"), { recursive: true });

async function writeWebp(source, destination, width, height, quality) {
  const image = await loadImage(source);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);
  await writeFile(destination, canvas.toBuffer("image/webp", quality));
}

for (const id of ids) {
  const imageDir = join(assetSource, "characters", "agents-v1");
  const outputDir = join(assetOutput, "characters", "agents-v1");
  await writeWebp(join(imageDir, `${id}.png`), join(outputDir, `${id}.webp`), 896, 1344, 88);
  await writeWebp(join(imageDir, `${id}.png`), join(outputDir, `${id}-hero.webp`), 512, 768, 84);
  // CSS uses only this image's alpha channel as a mask; WebP keeps that alpha lossless.
  await writeWebp(join(imageDir, `${id}-wordfield-v1.png`), join(outputDir, `${id}-wordfield-v1.webp`), 896, 1344, 90);
}

await writeWebp(
  join(assetSource, "brand", "zhihui-wordmark-angular-v2.png"),
  join(assetOutput, "brand", "zhihui-wordmark-angular-v2.webp"),
  900,
  450,
  95
);
let html = await readFile(join(sourceRoot, "index.html"), "utf8");
html = html.replaceAll("zhihui-wordmark-angular-v2.png", "zhihui-wordmark-angular-v2.webp");
const heroStart = html.indexOf('<div class="hero-photo"');
const heroEnd = html.indexOf("</div>", heroStart);
if (heroStart < 0 || heroEnd < 0) throw new Error("找不到首屏人物容器");
const hero = html.slice(heroStart, heroEnd)
  .replace(/agents-v1\/(expert|project|course|case|activity|quiz|evaluation|copy)\.png/g, "agents-v1/$1-hero.webp")
  .replace(/<img src=/g, '<img decoding="async" src=');
html = html.slice(0, heroStart) + hero + html.slice(heroEnd);
html = html.replace(/-wordfield-v1\.png/g, "-wordfield-v1.webp");
html = html.replace(
  /<img class="generated-person" src="([^"]+)\.png" alt="([^"]+)">/g,
  '<img class="generated-person" src="$1.webp" alt="$2" loading="lazy" decoding="async">'
);
if (/assets\/characters\/agents-v1\/[^"']+\.png/.test(html)) {
  throw new Error("HTML 中仍有未替换的人物或字形 PNG 引用");
}
await writeFile(join(outputRoot, "index.html"), html);

let app = await readFile(join(sourceRoot, "app.js"), "utf8");
app = app.replaceAll("-wordfield-v1.png", "-wordfield-v1.webp");
app = app.replace(
  'alt="${product.name}高清人物形象">',
  'alt="${product.name}高清人物形象" loading="lazy" decoding="async">'
);
await writeFile(join(outputRoot, "app.js"), app);

let toolsData = await readFile(join(sourceRoot, "tools-data.js"), "utf8");
toolsData = toolsData.replace(
  /agents-v1\/(expert|project|course|case|activity|quiz|evaluation|copy)\.png/g,
  "agents-v1/$1.webp"
);
await writeFile(join(outputRoot, "tools-data.js"), toolsData);
await copyFile(join(sourceRoot, "styles.css"), join(outputRoot, "styles.css"));
await copyFile(join(sourceRoot, "README.md"), join(outputRoot, "README.md"));

const sourceFiles = ids.flatMap(id => [
  join(assetSource, "characters", "agents-v1", `${id}.png`),
  join(assetSource, "characters", "agents-v1", `${id}-wordfield-v1.png`)
]);
sourceFiles.push(join(assetSource, "brand", "zhihui-wordmark-angular-v2.png"));
const outputFiles = ids.flatMap(id => [
  join(assetOutput, "characters", "agents-v1", `${id}.webp`),
  join(assetOutput, "characters", "agents-v1", `${id}-hero.webp`),
  join(assetOutput, "characters", "agents-v1", `${id}-wordfield-v1.webp`)
]);
outputFiles.push(join(assetOutput, "brand", "zhihui-wordmark-angular-v2.webp"));
const sumBytes = async files => (await Promise.all(files.map(file => stat(file)))).reduce((sum, item) => sum + item.size, 0);
console.log(JSON.stringify({
  outputRoot,
  originalImagesMB: +(await sumBytes(sourceFiles) / 1024 / 1024).toFixed(2),
  optimizedImagesMB: +(await sumBytes(outputFiles) / 1024 / 1024).toFixed(2)
}, null, 2));
