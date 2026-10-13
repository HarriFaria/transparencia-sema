import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import panel from "../data/resultados-coletas.json" with { type: "json" };
import publicEvidence from "../data/evidencias-publicas.json" with { type: "json" };
import publicPanel from "../data/painel-publico.json" with { type: "json" };

const root = process.cwd();
const executionId = "q11-coleta-2026-10-09T15-53-09-274Z-fab24357";
const executionRoot = path.join(root, "private", "execucoes", executionId);

test("extrato corresponde à coleta real preservada", async () => {
  const events = (await readFile(path.join(executionRoot, "eventos.jsonl"), "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  const summary = JSON.parse(await readFile(path.join(executionRoot, "resumo.json"), "utf8"));
  const map = JSON.parse(await readFile(path.join(executionRoot, "mapa-links.json"), "utf8"));
  const screenshots = (await readdir(path.join(executionRoot, "screenshots"))).filter((file) => file.endsWith(".png"));
  const exported = panel.execucoes.find((item) => item.execucao_id === executionId);

  assert.equal(events.length, 43);
  assert.equal(map.links.length, 9);
  assert.equal(summary.criterios.length, 10);
  assert.equal(screenshots.length, 10);
  assert.equal(exported?.navegacoes.length, events.filter((item) => item.tipo === "navegacao").length);
  assert.equal(exported?.evidencias.length, events.filter((item) => item.tipo === "evidencia_capturada").length);
  assert.deepEqual(exported?.criterios_associados, [...summary.criterios].sort());
});

test("indicadores distinguem coleta, verificação e resultado final", () => {
  assert.equal(panel.totais.execucoes, 4);
  assert.equal(panel.totais.execucoes_concluidas, 3);
  assert.equal(panel.totais.criterios_com_coleta_tecnica, 10);
  assert.equal(panel.totais.criterios_efetivamente_verificados, 0);
  assert.equal(panel.totais.criterios_sem_verificacao, 73);
  assert.equal(panel.totais.resultados_preliminares, 0);
  assert.equal(panel.totais.resultados_finais_validados, 0);
  assert.equal(panel.questoes.find((item) => item.questao === 1)?.com_coleta_tecnica, 10);
  assert.equal(panel.questoes.find((item) => item.questao === 2)?.com_coleta_tecnica, 0);
  assert.equal(panel.questoes.find((item) => item.questao === 3)?.com_coleta_tecnica, 0);
  assert.equal(Object.values(panel.criterios).every((item) => item.resultado_final === null), true);
  assert.equal(Object.values(panel.criterios).filter((item) => item.situacao === "nao_verificado").length, 63);
});

test("cópias aprovadas existem e preservam os hashes", async () => {
  assert.equal(publicEvidence.totais.encontradas, 43);
  assert.equal(publicEvidence.totais.publicadas, 18);
  assert.equal(publicEvidence.totais.retidas, 25);
  for (const evidence of publicEvidence.evidencias) {
    const file = path.join(root, "public", evidence.arquivo.replace(/^\//, ""));
    const hash = createHash("sha256").update(await readFile(file)).digest("hex");
    assert.equal(hash, evidence.sha256Publicado);
    await readFile(path.join(root, "public", evidence.miniatura.replace(/^\//, "")));
  }
});

test("snapshot público mantém resultados finais vazios", () => {
  assert.equal(publicPanel.resultados.validados, 0);
  assert.equal(publicPanel.resultados.atendidos, 0);
  assert.equal(publicPanel.resultados.parciais, 0);
  assert.equal(publicPanel.resultados.naoAtendidos, 0);
  assert.equal(publicPanel.resultados.naoApurados, 73);
  assert.equal(publicEvidence.evidencias.filter((item) => item.nivelAssociacao === "criterio").length, 10);
  assert.equal(publicEvidence.evidencias.filter((item) => item.nivelAssociacao !== "criterio").every((item) => item.criteriosIds.length === 0), true);
});

test("extrato não expõe caminhos locais nem artefatos restritos", () => {
  const serialized = JSON.stringify(panel);
  assert.doesNotMatch(serialized, /[A-Z]:\\/i);
  assert.doesNotMatch(serialized, /trace\.zip|eventos\.jsonl|private[\\/]/i);
  assert.doesNotMatch(JSON.stringify(publicEvidence), /[A-Z]:\\|arquivoOriginalLocal|private[\\/]/i);
});
