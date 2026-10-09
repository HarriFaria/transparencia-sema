import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { atomicWriteJson, ensureDir, projectRoot, utcNow } from "@/lib/persistencia";

const executionsRoot = path.join(projectRoot, "private", "execucoes");
const exportsRoot = path.join(projectRoot, "exports");
const evidences: Array<Record<string, unknown>> = [];
const executions: Array<Record<string, unknown>> = [];

for (const entry of await readdir(executionsRoot, { withFileTypes: true }).catch(() => [])) {
  if (!entry.isDirectory()) continue;
  const directory = path.join(executionsRoot, entry.name);
  const manifest = await readFile(path.join(directory, "manifest.json"), "utf8").then(JSON.parse).catch(() => null);
  const summary = await readFile(path.join(directory, "resumo.json"), "utf8").then(JSON.parse).catch(() => null);
  executions.push({ execucao_id: entry.name, modo: manifest?.modo ?? null, criado_em_utc: manifest?.criado_em_utc ?? null, concluida: Boolean(summary), resultado_final: summary?.resultado_final ?? null });
  const lines = await readFile(path.join(directory, "eventos.jsonl"), "utf8").then((value) => value.split(/\r?\n/).filter(Boolean)).catch(() => []);
  for (const line of lines) {
    const event = JSON.parse(line);
    if (event.tipo !== "evidencia_capturada") continue;
    const evidencePath = path.join(directory, event.arquivo);
    const bytes = await readFile(evidencePath).catch(() => null);
    const actualHash = bytes ? createHash("sha256").update(bytes).digest("hex") : null;
    evidences.push({
      execucao_id: entry.name,
      timestamp_utc: event.timestamp_utc,
      criterios: event.criterios,
      url: event.url,
      arquivo_execucao: event.arquivo,
      tamanho_bytes: bytes ? (await stat(evidencePath)).size : null,
      sha256_registrado: event.sha256,
      sha256_verificado: actualHash,
      integridade_confirmada: actualHash === event.sha256,
      bruta: event.bruta === true,
    });
  }
}

await ensureDir(exportsRoot);
const payload = {
  schema_version: 1,
  gerado_em_utc: utcNow(),
  aviso: "Índice local restrito. Evidências técnicas não constituem resultado de fiscalização.",
  totais: { execucoes: executions.length, evidencias: evidences.length, integras: evidences.filter((item) => item.integridade_confirmada).length },
  execucoes: executions,
  evidencias: evidences,
};
await atomicWriteJson(path.join(exportsRoot, "indice-evidencias.json"), payload);
const header = ["execucao_id", "timestamp_utc", "criterios", "url", "arquivo_execucao", "tamanho_bytes", "sha256_registrado", "integridade_confirmada", "bruta"];
const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const rows = evidences.map((item) => header.map((key) => escape(key === "criterios" ? (item[key] as string[]).join(",") : item[key])).join(";"));
await writeFile(path.join(exportsRoot, "indice-evidencias.csv"), `\uFEFF${header.join(";")}\n${rows.join("\n")}\n`, "utf8");
console.log(`Índice local: ${evidences.length} evidência(s), ${payload.totais.integras} hash(es) confirmado(s), ${executions.length} execução(ões).`);
