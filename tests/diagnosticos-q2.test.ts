import test from "node:test";
import assert from "node:assert/strict";
import diagnostics from "../data/diagnosticos-preliminares.json" with { type: "json" };
import criteria from "../data/criterios.json" with { type: "json" };

const q2 = diagnostics.diagnosticos.filter((item) => item.criterioId.startsWith("Q2."));
const q2Criteria = criteria.criterios.filter((item) => item.questao === 2);
const byId = new Map(q2.map((item) => [item.criterioId, item]));

test("diagnósticos Q2 cobrem os 24 critérios oficiais sem conclusão automática", () => {
  assert.equal(q2.length, 24);
  assert.deepEqual(q2.map((item) => item.criterioId), q2Criteria.map((item) => item.id));
  assert.equal(q2.every((item) => item.resultadoFinal === null && item.situacaoValidacao === "aguardando_validacao_humana"), true);
});

test("lacunas do Q2 permanecem preliminares e exigem segunda verificação", () => {
  for (const id of ["Q2.5.3", "Q2.7.2", "Q2.7.3"]) {
    const item = byId.get(id);
    assert.equal(item?.necessidadeSegundaVerificacao, true);
    assert.equal(item?.resultadoFinal, null);
  }
});

test("presença de interface não é promovida a comprovação de resultado", () => {
  assert.equal(byId.get("Q2.3.2")?.completude, "parcial");
  assert.equal(byId.get("Q2.3.3")?.localizacao, "inconclusiva");
  assert.equal(byId.get("Q2.3.3")?.aderenciaPreliminar, "insuficiente_para_concluir");
});

test("séries ambientais preservam os indícios de desatualização", () => {
  assert.equal(byId.get("Q2.2.1")?.atualidade, "indicio_desatualizacao");
  assert.equal(byId.get("Q2.2.3")?.aderenciaPreliminar, "indicios_de_lacuna");
});
