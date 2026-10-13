import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

const required = [
  path.join(projectRoot, "data", "painel-publico.json"),
  path.join(projectRoot, "data", "evidencias-publicas.json"),
  path.join(projectRoot, "public", "data", "painel-publico.json"),
  path.join(projectRoot, "public", "data", "evidencias-publicas.json"),
];
for (const file of required) await access(file).catch(() => { throw new Error(`Snapshot público ausente: ${path.relative(projectRoot, file)}. Execute npm run prepare:public localmente.`); });
const manifest = JSON.parse(await readFile(required[1], "utf8"));
for (const item of manifest.evidencias) {
  const file = path.join(projectRoot, "public", item.arquivo.replace(/^\//, ""));
  const bytes = await readFile(file);
  if (createHash("sha256").update(bytes).digest("hex") !== item.sha256Publicado) throw new Error(`Evidência pública inválida: ${item.id}`);
}
console.log(`Build autorizado com snapshot sanitizado e ${manifest.evidencias.length} evidências públicas verificadas.`);
