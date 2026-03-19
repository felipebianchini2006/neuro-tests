import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const sourceRoot = path.resolve(appRoot, "public/assets/puzzles");
const generatedRoot = path.resolve(sourceRoot, "generated");
const manifestPath = path.resolve(
  appRoot,
  "src/lib/content/puzzle-manifest.generated.ts",
);
const helperScript = path.resolve(appRoot, "scripts/extract-puzzle-pieces.py");

const pythonCommand = process.platform === "win32" ? "python" : "python3";

await rm(generatedRoot, { recursive: true, force: true });
await mkdir(generatedRoot, { recursive: true });

const manifestJson = execFileSync(
  pythonCommand,
  [helperScript, sourceRoot, generatedRoot],
  {
    cwd: appRoot,
    encoding: "utf8",
  },
);

const manifest = JSON.parse(manifestJson);
const fileContent = `export const generatedPuzzleSources = ${JSON.stringify(
  manifest,
  null,
  2,
)} as const;\n`;

await writeFile(manifestPath, fileContent, "utf8");

console.log(
  `Generated ${manifest.length} Armar Objetos manifests and extracted piece PNGs into ${generatedRoot}.`,
);
