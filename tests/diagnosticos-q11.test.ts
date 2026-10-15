import test from "node:test";
import assert from "node:assert/strict";
import diagnostics from "../data/diagnosticos-preliminares.json" with { type: "json" };

const byId = new Map(diagnostics.diagnosticos.map((item) => [item.criterioId, item]));
const q11 = diagnostics.diagnosticos.filter((item) => item.criterioId.startsWith("Q1.1."));

test("diagnósticos preservam os dez critérios reais de Q1.1", () => {
  assert.equal(q11.length, 10);
  assert.deepEqual(q11.map((item) => item.criterioId), Array.from({ length: 10 }, (_, index) => `Q1.1.${index + 1}`));
  assert.equal(diagnostics.diagnosticos.every((item) => item.resultadoFinal === null), true);
});

test("HTTP 200 ou página de menu não implica completude", () => {
  assert.equal(byId.get("Q1.1.1")?.completude, "parcial");
  assert.equal(byId.get("Q1.1.6")?.completude, "parcial");
});

test("homepage de grupo não é usada como prova individual", () => {
  const ids = diagnostics.diagnosticos.flatMap((item) => item.observacoes.flatMap((observation) => observation.evidenciasIds));
  assert.equal(ids.includes("EV-Q11-001"), false);
  assert.equal(ids.includes("EV-Q11-003"), false);
  assert.equal(ids.includes("EV-Q11-010"), false);
});

test("ausência de data não comprova atualidade", () => {
  assert.equal(byId.get("Q1.1.1")?.atualidade, "sem_data_comprovada");
  assert.equal(byId.get("Q1.1.10")?.atualidade, "sem_data_comprovada");
});

test("não localização gera segunda verificação, não resultado final", () => {
  const works = byId.get("Q1.1.9");
  assert.equal(works?.localizacao, "nao_localizada_nesta_busca");
  assert.equal(works?.necessidadeSegundaVerificacao, true);
  assert.equal(works?.aderenciaPreliminar, "insuficiente_para_concluir");
  assert.equal(works?.resultadoFinal, null);
});
