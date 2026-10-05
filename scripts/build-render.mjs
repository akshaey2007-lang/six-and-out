import {build} from "vite";
import ts from "typescript";
import {fileURLToPath} from "node:url";
import {readFile, mkdir, writeFile} from "node:fs/promises";

const root = new URL("../", import.meta.url);
await build({configFile: fileURLToPath(new URL("vite.render.config.ts", root))});
const source = await readFile(new URL("lib/game.ts", root), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022},
  reportDiagnostics: true,
});
if (compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) {
  throw new Error("Could not compile the shared cricket rules.");
}
await mkdir(new URL(".render-server/", root), {recursive: true});
await writeFile(new URL(".render-server/game.mjs", root), compiled.outputText);
console.log("Render frontend and shared match rules built.");
