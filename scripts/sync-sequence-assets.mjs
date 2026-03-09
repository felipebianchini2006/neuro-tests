import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const sourceRoot = path.resolve(appRoot, "../Figuras/Arranjo de Figuras");
const publicRoot = path.resolve(appRoot, "public/assets/sequence");
const manifestPath = path.resolve(
  appRoot,
  "src/lib/content/sequence-manifest.generated.ts",
);
const manifestDir = path.dirname(manifestPath);

const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

function toPublicPath(...segments) {
  return segments.map(encodeURIComponent).join("/");
}

const entries = await readdir(sourceRoot, { withFileTypes: true });
const storyDirs = entries.filter((entry) => entry.isDirectory());

await rm(publicRoot, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });
await mkdir(manifestDir, { recursive: true });

const manifest = [];

for (const storyDir of storyDirs.sort((left, right) => collator.compare(left.name, right.name))) {
  const storySourceDir = path.join(sourceRoot, storyDir.name);
  const storyPublicDir = path.join(publicRoot, storyDir.name);
  await cp(storySourceDir, storyPublicDir, { recursive: true });

  const files = await readdir(storySourceDir, { withFileTypes: true });
  const frameFiles = files
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => /\.(png|jpe?g)$/i.test(fileName))
    .sort((left, right) => collator.compare(left, right));

  manifest.push({
    id: storyDir.name,
    title: storyDir.name,
    frameSources: frameFiles.map(
      (fileName) => `/assets/sequence/${toPublicPath(storyDir.name, fileName)}`,
    ),
  });
}

const fileContent = `export const generatedSequenceSources = ${JSON.stringify(
  manifest,
  null,
  2,
)} as const;\n`;

await writeFile(manifestPath, fileContent, "utf8");

console.log(
  `Synced ${manifest.length} stories into public/assets/sequence and refreshed the generated manifest.`,
);
