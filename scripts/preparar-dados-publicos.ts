import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

const readJson = async <T>(file: string) => JSON.parse(await readFile(file, "utf8")) as T;
const criterios = (await readJson<{ criterios: any[] }>(path.join(projectRoot, "data", "criterios.json"))).criterios;
const grupos = (await readJson<{ grupos: any[] }>(path.join(projectRoot, "data", "grupos.json"))).grupos;
const roteiro = await readJson<{ total_passos: number }>(path.join(projectRoot, "data", "roteiro.json"));
const resultados = await readJson<any[]>(path.join(projectRoot, "data", "resultados-publicados.json"));
const coletas = await readJson<any>(path.join(projectRoot, "data", "resultados-coletas.json"));
const evidencias = await readJson<any>(path.join(projectRoot, "data", "evidencias-publicas.json"));

const ids = criterios.map((item) => item.id);
const byQuestion = [1, 2, 3].map((questao) => criterios.filter((item) => item.questao === questao).length);
if (criterios.length !== 73 || new Set(ids).size !== 73 || byQuestion.join("/") !== "35/24/14") throw new Error("Invariantes da matriz oficial inválidas.");
if (grupos.length !== 17 || roteiro.total_passos !== 66) throw new Error("Invariantes do roteiro oficial inválidas.");
if (resultados.some((item) => !["Atendido", "Não atendido", "Atendido parcialmente"].includes(item.resultado_final))) throw new Error("Resultado final público inválido.");

const count = (value: string) => resultados.filter((item) => item.resultado_final === value).length;
const ultimaValidacaoEm = resultados.map((item) => item.validado_em_utc ?? item.publicado_em_utc ?? null).filter(Boolean).sort().at(-1) ?? null;
const evidenceByCriterion = new Map<string, number>();
for (const evidence of evidencias.evidencias) for (const id of evidence.criteriosIds) evidenceByCriterion.set(id, (evidenceByCriterion.get(id) ?? 0) + 1);
const situacoes = Object.fromEntries(criterios.map((item) => {
  const collected = coletas.criterios[item.id];
  const final = resultados.find((entry) => entry.criterio_id === item.id);
  const timestamps = (collected?.navegacoes ?? []).map((entry: any) => entry.timestamp_utc).filter(Boolean).sort();
  return [item.id, {
    situacaoOperacional: final ? "validado" : collected?.situacao === "coleta_tecnica_sem_verificacao" ? "coleta_realizada" : "nao_iniciado",
    resultadoFinal: final?.resultado_final ?? null,
    evidenciasPublicas: evidenceByCriterion.get(item.id) ?? 0,
    ultimaVerificacao: final?.validado_em_utc ?? timestamps.at(-1) ?? null,
  }];
}));

const painel = {
  schemaVersion: 1,
  geradoEm: [coletas.gerado_em_utc, evidencias.geradoEm].filter(Boolean).sort().at(-1),
  escopo: { criterios: 73, questoes: { "1": 35, "2": 24, "3": 14 }, grupos: 17, passos: 66 },
  resultados: {
    validados: resultados.length,
    atendidos: count("Atendido"),
    parciais: count("Atendido parcialmente"),
    naoAtendidos: count("Não atendido"),
    naoApurados: criterios.length - resultados.length,
    percentualOficial: criterios.length ? Number(((count("Atendido") / criterios.length) * 100).toFixed(1)) : 0,
  },
  coleta: {
    ultimaColetaEm: coletas.ultima_execucao?.encerrado_em_utc ?? coletas.ultima_execucao?.criado_em_utc ?? null,
    ultimaValidacaoEm,
    gruposComColeta: coletas.totais.grupos_com_coleta,
    criteriosComColetaTecnica: coletas.totais.criterios_com_coleta_tecnica,
    evidenciasRegistradas: coletas.totais.evidencias_registradas,
    evidenciasPublicadas: evidencias.totais.publicadas,
    execucoes: coletas.totais.execucoes,
  },
  situacoes,
};

const serialized = `${JSON.stringify(painel, null, 2)}\n`;
await writeFile(path.join(projectRoot, "data", "painel-publico.json"), serialized, "utf8");
await mkdir(path.join(projectRoot, "public", "data"), { recursive: true });
await writeFile(path.join(projectRoot, "public", "data", "painel-publico.json"), serialized, "utf8");
console.log(`Snapshot público preparado: ${painel.escopo.criterios} critérios, ${painel.resultados.validados} validados e ${painel.coleta.evidenciasPublicadas} capturas publicadas.`);
