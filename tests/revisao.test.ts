import test from "node:test";
import assert from "node:assert/strict";
import { REVIEW_SCHEMA_VERSION, REVIEW_TIMEZONE, latestReview, reviewEventSchema, validateConclusion } from "../lib/revisoes";

const review = {
  schema_version: REVIEW_SCHEMA_VERSION,
  revision_id: "rev-test-0001",
  base_revision_id: null,
  criterio_id: "Q1.1.1",
  diagnostico_id: "Q1.1.1:exec-1",
  execucao_id: "exec-1",
  registrado_em: "2026-10-13T14:00:00.000Z",
  timezone: REVIEW_TIMEZONE,
  estado: "validado" as const,
  parecer: "Não atendido" as const,
  justificativa: "Conteúdo obrigatório incompleto.",
  validado_pelo_auditor: true,
  revisao_independente_declarada: true,
  diagnostico_visualizado: true,
  evidencias_disponiveis: true,
  segunda_verificacao_pendente: false,
  motivo_reabertura: null,
};

test("revisão válida não armazena identidade pessoal", () => {
  const parsed = reviewEventSchema.parse(review);
  const serialized = JSON.stringify(parsed);
  assert.equal(serialized.includes("responsavel"), false);
  assert.equal(serialized.includes("nome"), false);
  assert.equal(serialized.includes("email"), false);
  assert.equal(serialized.includes("matricula"), false);
});

test("resultado final aceita somente três valores", () => {
  assert.equal(reviewEventSchema.safeParse(review).success, true);
  assert.equal(reviewEventSchema.safeParse({ ...review, parecer: "Pendente" }).success, false);
});

test("não localizado bloqueia conclusão enquanto segunda verificação estiver pendente", () => {
  const errors = validateConclusion({ checked: true, parecer: "Não atendido", justificativa: "Não localizado.", diagnosticoVisualizado: true, evidenciasDisponiveis: true, segundaVerificacaoPendente: true, revisaoIndependenteDeclarada: true });
  assert.ok(errors.some((entry) => entry.includes("segunda verificação")));
});

test("checkbox não significa resultado positivo", () => {
  const errors = validateConclusion({ checked: true, parecer: "Não atendido", justificativa: "Ausência confirmada.", diagnosticoVisualizado: true, evidenciasDisponiveis: true, segundaVerificacaoPendente: false, revisaoIndependenteDeclarada: true });
  assert.deepEqual(errors, []);
});

test("histórico preserva eventos e identifica o mais recente", () => {
  const reopened = { ...review, revision_id: "rev-test-0002", base_revision_id: review.revision_id, registrado_em: "2026-10-13T15:00:00.000Z", estado: "reaberto" as const, validado_pelo_auditor: false, motivo_reabertura: "Nova evidência." };
  assert.equal(latestReview([reopened, review], review.criterio_id)?.revision_id, reopened.revision_id);
});
