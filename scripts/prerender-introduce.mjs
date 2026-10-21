import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = join(projectRoot, "dist/introduce/index.html");
const appPath = join(projectRoot, "dist/introduce/app.js");
const [html, app, toolsData] = await Promise.all([
  readFile(htmlPath, "utf8"),
  readFile(appPath, "utf8"),
  readFile(join(projectRoot, "dist/tools-data.js"), "utf8")
]);

const endMarker = "// END STATIC CONTENT SOURCE";
const end = app.indexOf(endMarker);
if (end < 0) throw new Error("介绍页缺少静态内容结束标记");

const nodes = new Map([
  ["#productIndex", { innerHTML: "", querySelector: () => null }],
  ["#productStories", { innerHTML: "", querySelector: () => null }]
]);
const context = vm.createContext({
  window: {},
  document: { querySelector: selector => nodes.get(selector) }
});
vm.runInContext(toolsData, context, { filename: "tools-data.js" });
vm.runInContext(`${app.slice(0, end)}\nrenderProducts();`, context, { filename: "introduce/app.js" });

function replaceBetween(source, label, content) {
  const startMarker = `<!-- BEGIN ${label} -->`;
  const endMarker = `<!-- END ${label} -->`;
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start < 0 || end < start) throw new Error(`介绍页缺少 ${label} 标记`);
  return source.slice(0, start + startMarker.length) + content + source.slice(end);
}

let output = replaceBetween(html, "PRODUCT INDEX", nodes.get("#productIndex").innerHTML);
output = replaceBetween(output, "PRODUCT STORIES", nodes.get("#productStories").innerHTML);
await writeFile(htmlPath, output);
console.log(htmlPath);
