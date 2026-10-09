import test from "node:test";
import assert from "node:assert/strict";
import { reviewInputSchema } from "../lib/schemas";

test("resultado final aceita somente três valores", () => {
  const base = { criterio_id: "Q1.1.1", execucao_id: "exec-1", primeira_verificacao: { data: "2026-10-09", hora: "10:00", endereco_ou_justificativa: "https://example.test", responsavel: "Auditor A", status_operacional: "localizado", evidencias: [] }, responsavel_validacao: "Auditora B", captura_tela_anexada: true, observacoes_achado: "", declaracao_revisao_humana: true };
  assert.equal(reviewInputSchema.safeParse({ ...base, resultado_final: "Atendido" }).success, true);
  assert.equal(reviewInputSchema.safeParse({ ...base, resultado_final: "Pendente" }).success, false);
});
