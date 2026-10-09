import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import panel from "../data/resultados-coletas.json" with { type: "json" };

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

test("cópias autorizadas existem e preservam os hashes", async () => {
  const evidenceRoot = path.join(root, "public", "evidencias-autorizadas");
  const manifest = JSON.parse(await readFile(path.join(evidenceRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.destino, "local");
  assert.equal(manifest.aprovacao_externa, null);
  assert.equal(manifest.arquivos.length, 10);
  for (const evidence of panel.ultima_execucao!.evidencias.filter((item) => item.visualizacao_autorizada)) {
    const file = path.join(root, "public", evidence.url_visualizacao!.replace(/^\//, ""));
    const hash = createHash("sha256").update(await readFile(file)).digest("hex");
    assert.equal(hash, evidence.sha256);
  }
});

test("extrato não expõe caminhos locais nem artefatos restritos", () => {
  const serialized = JSON.stringify(panel);
  assert.doesNotMatch(serialized, /[A-Z]:\\/i);
  assert.doesNotMatch(serialized, /trace\.zip|eventos\.jsonl|private[\\/]/i);
});
