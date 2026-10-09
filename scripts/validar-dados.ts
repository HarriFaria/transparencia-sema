import { readFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

const criteriaData = JSON.parse(await readFile(path.join(projectRoot, "data", "criterios.json"), "utf8"));
const groupsData = JSON.parse(await readFile(path.join(projectRoot, "data", "grupos.json"), "utf8"));
const routeData = JSON.parse(await readFile(path.join(projectRoot, "data", "roteiro.json"), "utf8"));
const published = JSON.parse(await readFile(path.join(projectRoot, "data", "resultados-publicados.json"), "utf8"));
const criteria = criteriaData.criterios as Array<{ id: string; questao: number; grupo_id: string; passos_roteiro: string[]; resultado_final: unknown }>;
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
assert(criteria.length === 73, `Esperados 73 critérios; encontrados ${criteria.length}`);
assert(new Set(criteria.map((item) => item.id)).size === 73, "IDs de critérios não são únicos");
assert(groupsData.grupos.length === 17, "Esperados 17 grupos");
assert(routeData.passos.length === 66, "Esperados 66 passos");
for (const [question, expected] of [[1, 35], [2, 24], [3, 14]] as const) assert(criteria.filter((item) => item.questao === question).length === expected, `Questão ${question} diverge de ${expected}`);
const stepIds = new Set(routeData.passos.map((step: { id: string }) => step.id));
for (const criterion of criteria) {
  assert(groupsData.grupos.some((group: { id: string }) => group.id === criterion.grupo_id), `Grupo ausente: ${criterion.grupo_id}`);
  assert(criterion.passos_roteiro.every((step) => stepIds.has(step)), `Passo inválido em ${criterion.id}`);
  assert(criterion.resultado_final === null, `Resultado fictício no catálogo: ${criterion.id}`);
}
assert(Array.isArray(published), "resultados-publicados.json deve ser array");
console.log("Dados válidos: 73 critérios únicos, 17 grupos, 66 passos, distribuição 35/24/14 e referências consistentes.");
