import { readFile } from "node:fs/promises";
import path from "node:path";
import { reviewExportSchema, latestReview, canonicalExportBody, type ReviewConflict, type ReviewEvent } from "@/lib/revisoes";
import { appendJsonl, atomicWriteJson, projectRoot, sha256Text, utcNow, withFileLock } from "@/lib/persistencia";

function argument(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
function argumentsFor(name: string) { return process.argv.flatMap((value, index) => value === name && process.argv[index + 1] ? [process.argv[index + 1]] : []); }

const inputArg = argument("--input");
if (!inputArg) throw new Error("Uso: npm run merge:reviews -- --input <validacoes.json> [--resolve Q1.1.1=rev-id]");

const criteria = JSON.parse(await readFile(path.join(projectRoot, "data", "criterios.json"), "utf8")).criterios as Array<{ id: string }>;
const knownIds = new Set(criteria.map((entry) => entry.id));
const imported = reviewExportSchema.parse(JSON.parse(await readFile(path.resolve(inputArg), "utf8")));
const { sha256_conteudo, ...exportBody } = imported;
if (sha256Text(canonicalExportBody(exportBody)) !== sha256_conteudo) throw new Error("Integridade inválida: o SHA-256 do arquivo exportado não confere.");
if (imported.revisions.some((entry) => !knownIds.has(entry.criterio_id))) throw new Error("A exportação contém critério fora da matriz oficial.");

const directory = path.join(projectRoot, "data", "validacoes");
const statePath = path.join(directory, "consolidado.json");
const logPath = path.join(directory, "historico.jsonl");
const current = await readFile(statePath, "utf8").then((value) => JSON.parse(value) as { schema_version: 1; revisions: ReviewEvent[]; conflicts: ReviewConflict[]; resolutions: Record<string, string>; atualizado_em: string }).catch(() => ({ schema_version: 1 as const, revisions: [], conflicts: [], resolutions: {}, atualizado_em: utcNow() }));
const revisions = [...current.revisions];
const conflicts = [...current.conflicts];

for (const entry of imported.revisions) {
  const sameId = revisions.find((candidate) => candidate.revision_id === entry.revision_id);
  if (sameId) {
    if (JSON.stringify(sameId) !== JSON.stringify(entry)) conflicts.push({ criterio_id: entry.criterio_id, local_revision_id: sameId.revision_id, imported_revision_id: entry.revision_id, detectado_em: utcNow() });
    continue;
  }
  const local = latestReview(revisions, entry.criterio_id);
  if (local && entry.base_revision_id !== local.revision_id && local.base_revision_id !== entry.revision_id) conflicts.push({ criterio_id: entry.criterio_id, local_revision_id: local.revision_id, imported_revision_id: entry.revision_id, detectado_em: utcNow() });
  revisions.push(entry);
}

const resolutions = { ...current.resolutions };
for (const token of argumentsFor("--resolve")) {
  const separator = token.indexOf("=");
  const criterioId = token.slice(0, separator);
  const revisionId = token.slice(separator + 1);
  if (separator < 0 || !revisions.some((entry) => entry.criterio_id === criterioId && entry.revision_id === revisionId)) throw new Error(`Resolução inválida: ${token}`);
  resolutions[criterioId] = revisionId;
}

const uniqueConflicts = conflicts.filter((entry, index, list) => list.findIndex((candidate) => candidate.criterio_id === entry.criterio_id && candidate.local_revision_id === entry.local_revision_id && candidate.imported_revision_id === entry.imported_revision_id) === index);
const merged = { schema_version: 1 as const, revisions, conflicts: uniqueConflicts, resolutions, atualizado_em: utcNow() };
await withFileLock(statePath, async () => {
  await atomicWriteJson(statePath, merged);
  await appendJsonl(logPath, { evento: "importacao", registrado_em: utcNow(), arquivo_sha256: sha256_conteudo, revisoes_recebidas: imported.revisions.map((entry) => entry.revision_id), conflitos: uniqueConflicts.length, resolucoes: resolutions });
});

console.log(JSON.stringify({ revisoes: revisions.length, conflitos: uniqueConflicts.length, resolvidos: Object.keys(resolutions).length, aviso: "Registros consolidados localmente sem identidade pessoal. Nenhum resultado foi publicado." }, null, 2));
