import { z } from "zod";
import type { ResultadoFinal } from "@/lib/types";

export const REVIEW_STORAGE_KEY = "sema-transparencia:revisoes:v1";
export const REVIEW_SCHEMA_VERSION = 1 as const;
export const REVIEW_TIMEZONE = "America/Cuiaba" as const;

export const reviewStateSchema = z.enum(["revisado_sem_conclusao", "validado", "reaberto"]);
export const reviewEventSchema = z.object({
  schema_version: z.literal(REVIEW_SCHEMA_VERSION),
  revision_id: z.string().regex(/^rev-[a-zA-Z0-9-]+$/),
  base_revision_id: z.string().regex(/^rev-[a-zA-Z0-9-]+$/).nullable(),
  criterio_id: z.string().regex(/^Q[123]\.\d+\.\d+$/),
  diagnostico_id: z.string().min(3).nullable(),
  execucao_id: z.string().min(3).nullable(),
  registrado_em: z.iso.datetime(),
  timezone: z.literal(REVIEW_TIMEZONE),
  estado: reviewStateSchema,
  parecer: z.enum(["Atendido", "Não atendido", "Atendido parcialmente"]).nullable(),
  justificativa: z.string().max(10000),
  validado_pelo_auditor: z.boolean(),
  revisao_independente_declarada: z.boolean(),
  diagnostico_visualizado: z.boolean(),
  evidencias_disponiveis: z.boolean(),
  segunda_verificacao_pendente: z.boolean(),
  motivo_reabertura: z.string().max(4000).nullable(),
});

export const reviewConflictSchema = z.object({
  criterio_id: z.string(),
  local_revision_id: z.string(),
  imported_revision_id: z.string(),
  detectado_em: z.iso.datetime(),
});

export const localReviewStoreSchema = z.object({
  schema_version: z.literal(REVIEW_SCHEMA_VERSION),
  revisions: z.array(reviewEventSchema),
  conflicts: z.array(reviewConflictSchema),
  last_exported_hash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
});

export const reviewExportSchema = z.object({
  schema_version: z.literal(REVIEW_SCHEMA_VERSION),
  tipo: z.literal("sema-validacoes-locais"),
  exportado_em: z.iso.datetime(),
  timezone: z.literal(REVIEW_TIMEZONE),
  aviso: z.string(),
  revisions: z.array(reviewEventSchema),
  conflicts: z.array(reviewConflictSchema),
  sha256_conteudo: z.string().regex(/^[a-f0-9]{64}$/),
});

export type ReviewEvent = z.infer<typeof reviewEventSchema>;
export type ReviewConflict = z.infer<typeof reviewConflictSchema>;
export type LocalReviewStore = z.infer<typeof localReviewStoreSchema>;
export type ReviewExport = z.infer<typeof reviewExportSchema>;

export const emptyReviewStore = (): LocalReviewStore => ({
  schema_version: REVIEW_SCHEMA_VERSION,
  revisions: [],
  conflicts: [],
  last_exported_hash: null,
});

export function latestReview(revisions: ReviewEvent[], criterioId: string) {
  return revisions
    .filter((entry) => entry.criterio_id === criterioId)
    .sort((a, b) => a.registrado_em.localeCompare(b.registrado_em))
    .at(-1) ?? null;
}

export function reviewStatus(review: ReviewEvent | null, hasConflict = false) {
  if (hasConflict) return "Conflito pendente";
  if (!review || review.estado === "reaberto") return "Pendente de revisão";
  return review.estado === "validado" ? "Validado" : "Revisado sem conclusão";
}

export function validateConclusion(input: {
  checked: boolean;
  parecer: ResultadoFinal | "";
  justificativa: string;
  diagnosticoVisualizado: boolean;
  evidenciasDisponiveis: boolean;
  segundaVerificacaoPendente: boolean;
  revisaoIndependenteDeclarada: boolean;
}) {
  const errors: string[] = [];
  if (!input.checked) errors.push("Marque “Validado pelo auditor” para confirmar a ação humana.");
  if (!input.parecer) errors.push("Selecione o resultado oficial.");
  if (!input.diagnosticoVisualizado) errors.push("O diagnóstico precisa estar disponível e ter sido visualizado.");
  if (!input.evidenciasDisponiveis) errors.push("Não há evidência disponível para uma conclusão oficial.");
  if (input.segundaVerificacaoPendente) errors.push("A segunda verificação em outra data ainda está pendente.");
  if (!input.revisaoIndependenteDeclarada) errors.push("Confirme a declaração de revisão independente.");
  if ((input.parecer === "Não atendido" || input.parecer === "Atendido parcialmente") && input.justificativa.trim().length < 3) {
    errors.push("Informe a justificativa para o resultado selecionado.");
  }
  return errors;
}

export function makeRevisionId() {
  return `rev-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
}

export function canonicalExportBody(value: Omit<ReviewExport, "sha256_conteudo">) {
  return JSON.stringify(value);
}

export async function sha256Browser(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
