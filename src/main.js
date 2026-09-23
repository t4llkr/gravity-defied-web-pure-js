import { startGravityDefiedApp } from "./app.js";
const root = document.getElementById("root");
if (!(root instanceof HTMLDivElement)) {
  throw new Error("Missing #root container");
}
startGravityDefiedApp(root).catch((error) => {
  const pre = document.createElement("pre");
  pre.className = "error-view";
  pre.textContent = error instanceof Error ? error.stack ?? error.message : String(error);
  root.replaceChildren(pre);
});
