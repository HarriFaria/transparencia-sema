import { readFile } from "node:fs/promises";
import path from "node:path";
import { finalResultSchema } from "@/lib/schemas";
import type { ReviewConflict, ReviewEvent } from "@/lib/revisoes";
import { atomicWriteJson, projectRoot, sha256Text, utcNow, withFileLock } from "@/lib/persistencia";

const selected = process.argv.flatMap((value, index) => value === "--revision" && process.argv[index + 1] ? [process.argv[index + 1]] : []);
if (!selected.length) throw new Error("Informe cada revisão expressamente autorizada: npm run publish:reviews -- --revision <rev-id>");
const statePath = path.join(projectRoot, "data", "validacoes", "consolidado.json");
const state = JSON.parse(await readFile(statePath, "utf8")) as { revisions: ReviewEvent[]; conflicts: ReviewConflict[]; resolutions: Record<string, string> };

const records = selected.map((revisionId) => {
  const review = state.revisions.find((entry) => entry.revision_id === revisionId);
  if (!review) throw new Error(`Revisão não encontrada: ${revisionId}`);
  if (review.estado !== "validado" || !review.validado_pelo_auditor || !review.parecer) throw new Error(`Revisão não conclusiva: ${revisionId}`);
  if (review.segunda_verificacao_pendente) throw new Error(`Segunda verificação pendente: ${revisionId}`);
  if (!review.revisao_independente_declarada) throw new Error(`Declaração independente ausente: ${revisionId}`);
  const unresolved = state.conflicts.some((conflict) => conflict.criterio_id === review.criterio_id && state.resolutions[review.criterio_id] !== revisionId);
  if (unresolved) throw new Error(`Conflito não resolvido para ${review.criterio_id}.`);
  return {
    criterio_id: review.criterio_id,
    revisao_id: review.revision_id,
    execucao_id: review.execucao_id,
    diagnostico_id: review.diagnostico_id,
    validado_em_utc: review.registrado_em,
    publicado_em_utc: utcNow(),
    resultado_final: finalResultSchema.parse(review.parecer),
    observacoes_achado: review.justificativa,
    revisao_independente_declarada: true,
    rastreabilidade: "Autodeclaração sem identificação ou autenticação pessoal; não constitui homologação institucional verificada.",
    sha256_revisao: sha256Text(JSON.stringify(review)),
  };
});

if (new Set(records.map((entry) => entry.criterio_id)).size !== records.length) throw new Error("Selecione apenas uma revisão por critério.");
const destination = path.join(projectRoot, "data", "resultados-publicados.json");
await withFileLock(destination, () => atomicWriteJson(destination, records));
await atomicWriteJson(path.join(projectRoot, "data", "validacoes-publicadas.json"), { schema_version: 1, gerado_em: utcNow(), total: records.length, resultados: records });
console.log(`Snapshot público gerado com ${records.length} resultado(s) expressamente autorizado(s).`);
