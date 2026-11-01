// Report identifiers that cannot be resolved (TS 2304/2552) in given entry files' module graph
import ts from "/opt/npm-tools/node_modules/typescript/lib/typescript.js";
const files = process.argv.slice(2);
const program = ts.createProgram(files, { allowJs: true, checkJs: true, noEmit: true, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true, types: [], noResolve: false, allowImportingTsExtensions: false });
const diags = ts.getPreEmitDiagnostics(program).filter(d => [2304, 2552, 2448, 2449, 2454, 2305, 2307, 2614, 2724].includes(d.code));
const out = new Map();
for (const d of diags) { const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n"); const f = d.file ? d.file.fileName.split("/").slice(-2).join("/") : "?"; const k = `${d.code} ${f}: ${msg}`; out.set(k, (out.get(k) || 0) + 1); }
for (const [k, n] of [...out].sort()) console.log(n, k);
console.log("TOTAL", diags.length);
