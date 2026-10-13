import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

async function sourceFiles(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await sourceFiles(full));
    else if (/\.(ts|tsx|css)$/.test(entry.name)) found.push(full);
  }
  return found;
}

const files = [...await sourceFiles(path.join(projectRoot, "app")), ...await sourceFiles(path.join(projectRoot, "componentes")), ...await sourceFiles(path.join(projectRoot, "lib"))];
const problems: string[] = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  if (/href=["']#["']/.test(text)) problems.push(`${path.relative(projectRoot, file)}: link vazio`);
  if (/<img(?![^>]*\balt=)[^>]*>/s.test(text)) problems.push(`${path.relative(projectRoot, file)}: imagem sem texto alternativo`);
  if (/console\.log\(/.test(text)) problems.push(`${path.relative(projectRoot, file)}: console.log no código público`);
}
if (problems.length) throw new Error(`Lint do projeto falhou:\n${problems.join("\n")}`);
console.log(`Lint do projeto aprovado em ${files.length} arquivos de aplicação.`);
