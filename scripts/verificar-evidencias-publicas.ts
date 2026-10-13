import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

const manifest = JSON.parse(await readFile(path.join(projectRoot, "data", "evidencias-publicas.json"), "utf8"));
if (manifest.totais.aprovadas !== manifest.evidencias.length || manifest.totais.publicadas !== manifest.evidencias.length) throw new Error("Contagens do manifesto público divergentes.");
const declared = new Set<string>();
for (const item of manifest.evidencias) {
  for (const [field, expected] of [["arquivo", item.sha256Publicado], ["miniatura", item.sha256Miniatura]] as const) {
    const relative = item[field].replace(/^\//, "");
    if (relative.includes("..") || !relative.startsWith("evidencias/")) throw new Error(`Caminho público inválido em ${item.id}.`);
    const bytes = await readFile(path.join(projectRoot, "public", relative));
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== expected) throw new Error(`Hash publicado divergente em ${item.id}/${field}.`);
    declared.add(relative.replaceAll("\\", "/"));
  }
}

async function listFiles(directory: string, prefix = ""): Promise<string[]> {
  const values: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) values.push(...await listFiles(path.join(directory, entry.name), relative));
    else values.push(relative);
  }
  return values;
}
const actual = await listFiles(path.join(projectRoot, "public", "evidencias"), "evidencias");
for (const file of actual) if (!declared.has(file)) throw new Error(`Arquivo público não declarado: ${file}`);
if (actual.length !== declared.size) throw new Error("Quantidade de arquivos públicos divergente.");
console.log(`Evidências públicas verificadas: ${manifest.evidencias.length} capturas e ${manifest.evidencias.length} miniaturas, sem referências ausentes.`);
