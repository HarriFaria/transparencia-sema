import test from "node:test";
import assert from "node:assert/strict";
import criteriaData from "../data/criterios.json" with { type: "json" };
import groupsData from "../data/grupos.json" with { type: "json" };
import routeData from "../data/roteiro.json" with { type: "json" };
import published from "../data/resultados-publicados.json" with { type: "json" };

test("catálogo respeita os totais metodológicos", () => {
  assert.equal(criteriaData.criterios.length, 73);
  assert.equal(new Set(criteriaData.criterios.map((item) => item.id)).size, 73);
  assert.equal(groupsData.grupos.length, 17);
  assert.equal(routeData.passos.length, 66);
  assert.deepEqual([1, 2, 3].map((q) => criteriaData.criterios.filter((item) => item.questao === q).length), [35, 24, 14]);
});

test("linha de exemplo e resultados fictícios não foram importados", () => {
  assert.equal(criteriaData.criterios.some((item) => String(item.ordem) === "Ex."), false);
  assert.equal(criteriaData.criterios.every((item) => item.resultado_final === null), true);
  assert.deepEqual(published, []);
});
