import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const sourceRoot = path.resolve(appRoot, "../Cubos");
const publicRoot = path.resolve(appRoot, "public/assets/cubes");

await rm(publicRoot, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });

const entries = await readdir(sourceRoot, { withFileTypes: true });
const imageFiles = entries
  .filter((entry) => entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name))
  .sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { numeric: true }));

for (const imageFile of imageFiles) {
  await cp(
    path.join(sourceRoot, imageFile.name),
    path.join(publicRoot, imageFile.name),
  );
}

console.log(`Synced ${imageFiles.length} cube images into public/assets/cubes.`);
