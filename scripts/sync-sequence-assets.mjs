import { execFileSync } from "node:child_process";
import { access, cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const sourceRoot = path.resolve(appRoot, "../Figuras/Arranjo de Figuras");
const publicRoot = path.resolve(appRoot, "public/assets/sequence");
const manifestPath = path.resolve(
  appRoot,
  "src/lib/content/sequence-manifest.generated.ts",
);
const manifestDir = path.dirname(manifestPath);
const orderDerivationScript = path.resolve(appRoot, "scripts/derive-sequence-order.py");

const collator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});
const explicitStoryFrameFiles = {
  "1 - CAP": ["1.1  - CAP.jpg", "1.2 - CAP.jpg", "1.3 - CAP.jpg"],
  "2 - CHASE": ["1 - CHASE.jpg", "2 - CHASE.jpg", "3 - CHASE.jpg", "4 - CHASE.jpg", "5 - CHASE.jpg"],
  "3 - BAKE": ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
  "4 - OPENS": ["2.jpg", "4.jpg", "1.jpg", "3.jpg", "5.jpg"],
  "5 - HUNT": ["4.jpg", "3.jpg", "2.jpg", "5.png"],
  "6 - DREAMS": ["2D.jpg", "4R.jpg", "3E.jpg", "1A.jpg", "5M.jpg"],
  "7 - CLEAM": ["3.jpg", "5.jpg", "4.jpg", "2.jpg", "1.jpg"],
  "8 - CHOIR": ["2.jpg", "1.jpg", "3.jpg", "4.jpg", "5.jpg"],
  "9 - LUNCH": ["5.jpg", "1.jpg", "4.jpg", "2.jpg", "3.jpg"],
  "10 - SHARK": ["3.jpg", "1.jpg", "2.jpg", "4.jpg", "5.jpg"],
  "11 - SAMUEL": ["5.jpg", "4.jpg", "1.jpg", "3.jpg", "2.jpg", "6.jpg"],
};

function getFileLabel(fileName) {
  return fileName.replace(/\.[^.]+$/, "").replace(/\s+/g, " ").trim();
}

function isSortableSequenceFrame(label) {
  return /^\d+(?:\.\d+)?(?:[A-Za-z])?(?:\s*-\s*.*)?$/.test(label.trim());
}

function toPublicPath(...segments) {
  return segments.map(encodeURIComponent).join("/");
}

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function deriveFrameOrder(storyDirPath, guideFileName, frameFiles) {
  const pythonCommand = process.platform === "win32" ? "python" : "python3";
  const output = execFileSync(
    pythonCommand,
    [orderDerivationScript, storyDirPath, guideFileName, ...frameFiles],
    {
      cwd: appRoot,
      encoding: "utf8",
    },
  );
  const orderedFrameFiles = JSON.parse(output);

  if (
    !Array.isArray(orderedFrameFiles) ||
    orderedFrameFiles.length !== frameFiles.length ||
    orderedFrameFiles.some(
      (fileName) =>
        !frameFiles.includes(fileName) &&
        !fileName.startsWith("__derived-segment-"),
    )
  ) {
    throw new Error(
      `The derived order for "${storyDirPath}" is invalid: ${output}`,
    );
  }

  return orderedFrameFiles;
}

const assetSourceRoot = (await pathExists(sourceRoot)) ? sourceRoot : publicRoot;
const isUsingBundledAssets = assetSourceRoot === publicRoot;

const entries = await readdir(assetSourceRoot, { withFileTypes: true });
const storyDirs = entries.filter((entry) => entry.isDirectory());

if (!isUsingBundledAssets) {
  await rm(publicRoot, { recursive: true, force: true });
  await mkdir(publicRoot, { recursive: true });
}

await mkdir(manifestDir, { recursive: true });

const manifest = [];

for (const storyDir of storyDirs.sort((left, right) => collator.compare(left.name, right.name))) {
  const storySourceDir = path.join(assetSourceRoot, storyDir.name);
  const storyPublicDir = path.join(publicRoot, storyDir.name);

  if (!isUsingBundledAssets) {
    await cp(storySourceDir, storyPublicDir, { recursive: true });
  }

  const files = await readdir(storySourceDir, { withFileTypes: true });
  const imageFiles = files
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => !fileName.startsWith("__derived-segment-"))
    .filter((fileName) => /\.(png|jpe?g)$/i.test(fileName))
    .sort((left, right) => collator.compare(left, right));

  const sortableFiles = imageFiles.filter((fileName) =>
    isSortableSequenceFrame(getFileLabel(fileName)),
  );
  const guideFiles = imageFiles.filter((fileName) => !sortableFiles.includes(fileName));
  const naturalFrameFiles = sortableFiles.length > 0 ? sortableFiles : imageFiles;
  const explicitFrameFiles = explicitStoryFrameFiles[storyDir.name]?.filter((fileName) =>
    imageFiles.includes(fileName),
  );
  const frameFiles = explicitFrameFiles?.length
    ? explicitFrameFiles
    : guideFiles[0] && naturalFrameFiles.length > 1
      ? deriveFrameOrder(storyPublicDir, guideFiles[0], naturalFrameFiles)
      : naturalFrameFiles;

  manifest.push({
    id: storyDir.name,
    title: storyDir.name,
    guideSource: guideFiles[0]
      ? `/assets/sequence/${toPublicPath(storyDir.name, guideFiles[0])}`
      : null,
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
  `Synced ${manifest.length} stories from ${assetSourceRoot} and refreshed the generated manifest.`,
);
