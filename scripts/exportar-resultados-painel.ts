import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { atomicWriteJson, projectRoot, utcNow } from "@/lib/persistencia";
import type { EvidenciaPainel, ExecucaoPainel, NavegacaoColeta, ResultadoCriterioPainel } from "@/lib/types";

type JsonRecord = Record<string, any>;
type Selection = {
  schema_version: number;
  destino: "local" | "publicacao";
  execucao_id: string;
  justificativa: string;
  aprovacao_externa: string | null;
  arquivos: string[];
};

const executionsRoot = path.join(projectRoot, "private", "execucoes");
const publicRoot = path.join(projectRoot, "public");
const evidenceRoot = path.join(publicRoot, "evidencias-autorizadas");
const dataDestination = path.join(projectRoot, "data", "resultados-coletas.json");
const args = process.argv.slice(2);
const selectionFlag = args.indexOf("--selecao");
const selectionPath = selectionFlag >= 0 && args[selectionFlag + 1]
  ? path.resolve(projectRoot, args[selectionFlag + 1])
  : path.join(projectRoot, "config", "evidencias-painel.local.json");

const readJson = async (file: string) => JSON.parse(await readFile(file, "utf8"));
const parseJsonl = async (file: string) => (await readFile(file, "utf8"))
  .split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const hashBuffer = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const unique = <T>(values: T[]) => [...new Set(values)];

const selection = await readJson(selectionPath) as Selection;
if (selection.schema_version !== 1 || !["local", "publicacao"].includes(selection.destino)) throw new Error("Manifesto de seleção inválido.");
if (!selection.justificativa?.trim() || !Array.isArray(selection.arquivos) || !selection.arquivos.length) throw new Error("A seleção precisa de justificativa e arquivos explícitos.");
if (selection.destino === "publicacao" && (!selection.aprovacao_externa || selection.aprovacao_externa.trim().length < 8)) {
  throw new Error("Publicação exige aprovação externa expressa no manifesto de seleção.");
}

const criteriaData = await readJson(path.join(projectRoot, "data", "criterios.json"));
const criteriaCatalog = criteriaData.criterios as JsonRecord[];
const published = await readJson(path.join(projectRoot, "data", "resultados-publicados.json")) as JsonRecord[];
const publishedByCriterion = new Map(published.map((item) => [item.criterio_id, item]));
const selectionSet = new Set(selection.arquivos.map((file) => file.replaceAll("\\", "/")));
const selectedOutputs = new Map<string, string>();
const executions: ExecucaoPainel[] = [];

for (const entry of await readdir(executionsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = path.join(executionsRoot, entry.name);
  const manifest = await readJson(path.join(directory, "manifest.json"));
  const events = await parseJsonl(path.join(directory, "eventos.jsonl"));
  const summary = await readJson(path.join(directory, "resumo.json")).catch(() => null);
  const linkMap = await readJson(path.join(directory, "mapa-links.json")).catch(() => ({ links: [] }));
  const terminal = [...events].reverse().find((event) => ["execucao_concluida", "execucao_interrompida"].includes(event.tipo));
  const situation: ExecucaoPainel["situacao"] = terminal?.tipo === "execucao_concluida" ? "concluida" : terminal?.tipo === "execucao_interrompida" ? "interrompida" : "incompleta";

  const navigations: NavegacaoColeta[] = events.filter((event) => event.tipo === "navegacao").map((event) => ({
    timestamp_utc: event.timestamp_utc,
    texto_link: event.texto_link ?? null,
    url_candidata: event.url_candidata,
    url_final: event.url_depois,
    criterios: Array.isArray(event.criterios) ? event.criterios : [],
    observacao: event.url_depois === manifest.homepage
      ? "A navegação terminou na página inicial; isso não determina localização ou ausência da informação."
      : "A URL final foi registrada e capturada; o conteúdo do critério não foi classificado pelo robô.",
  }));

  const evidences: EvidenciaPainel[] = [];
  for (const event of events.filter((item) => item.tipo === "evidencia_capturada")) {
    const relativeFile = String(event.arquivo).replaceAll("\\", "/");
    if (!relativeFile.startsWith("screenshots/") || relativeFile.includes("..") || path.extname(relativeFile).toLowerCase() !== ".png") {
      throw new Error(`Evidência fora do escopo permitido: ${relativeFile}`);
    }
    const source = path.resolve(directory, relativeFile);
    if (!source.startsWith(`${path.resolve(directory)}${path.sep}`)) throw new Error("Caminho de evidência inválido.");
    const bytes = await readFile(source);
    const actualHash = hashBuffer(bytes);
    const selected = entry.name === selection.execucao_id && selectionSet.has(relativeFile);
    const outputName = `${actualHash.slice(0, 12)}-${path.basename(relativeFile)}`;
    if (selected) selectedOutputs.set(relativeFile, outputName);
    evidences.push({
      id: `${entry.name}-${actualHash.slice(0, 12)}`,
      execucao_id: entry.name,
      timestamp_utc: event.timestamp_utc,
      criterios: Array.isArray(event.criterios) ? event.criterios : [],
      url: event.url,
      sha256: event.sha256,
      integridade_confirmada: actualHash === event.sha256,
      visualizacao_autorizada: selected,
      url_visualizacao: selected ? `/evidencias-autorizadas/${outputName}` : null,
      compartilhada: Array.isArray(event.criterios) && event.criterios.length > 1,
    });
  }

  const errorGroups = new Map<string, { url: string; erro: string; ocorrencias: number }>();
  for (const event of events.filter((item) => item.tipo === "requisicao_falhou")) {
    const key = `${event.url}|${event.erro}`;
    const current = errorGroups.get(key) ?? { url: event.url, erro: event.erro, ocorrencias: 0 };
    current.ocorrencias += 1;
    errorGroups.set(key, current);
  }
  const criteriaAssociated = unique([
    ...(Array.isArray(summary?.criterios) ? summary.criterios : []),
    ...navigations.flatMap((item) => item.criterios),
    ...evidences.flatMap((item) => item.criterios),
  ]).sort();

  executions.push({
    execucao_id: entry.name,
    grupo: manifest.grupo ?? "Q1.1",
    modo: manifest.modo,
    criado_em_utc: manifest.criado_em_utc,
    encerrado_em_utc: terminal?.timestamp_utc ?? null,
    situacao: situation,
    homepage: manifest.homepage,
    candidatos: Number(summary?.candidatos ?? linkMap.links?.length ?? 0),
    criterios_associados: criteriaAssociated,
    navegacoes: navigations,
    evidencias: evidences,
    erros_tecnicos: [...errorGroups.values()],
    resultado_final: null,
  });
}

executions.sort((a, b) => b.criado_em_utc.localeCompare(a.criado_em_utc));
for (const selected of selectionSet) if (!selectedOutputs.has(selected)) throw new Error(`Evidência selecionada não localizada ou sem evento correspondente: ${selected}`);

const targetResolved = path.resolve(evidenceRoot);
if (path.dirname(targetResolved) !== path.resolve(publicRoot) || path.basename(targetResolved) !== "evidencias-autorizadas") throw new Error("Destino público inesperado.");
const temporaryRoot = `${targetResolved}.tmp-${process.pid}`;
await rm(temporaryRoot, { recursive: true, force: true });
await mkdir(temporaryRoot, { recursive: true });
const selectedExecution = path.join(executionsRoot, selection.execucao_id);
for (const [relativeFile, outputName] of selectedOutputs) {
  await copyFile(path.join(selectedExecution, relativeFile), path.join(temporaryRoot, outputName));
}
const publicManifest = {
  schema_version: 1,
  destino: selection.destino,
  execucao_id: selection.execucao_id,
  justificativa: selection.justificativa,
  aprovacao_externa: selection.aprovacao_externa,
  gerado_em_utc: utcNow(),
  arquivos: [...selectedOutputs.values()],
  hashes_sha256: Object.fromEntries(executions.flatMap((execution) => execution.evidencias)
    .filter((evidence) => evidence.visualizacao_autorizada && evidence.url_visualizacao)
    .map((evidence) => [path.basename(evidence.url_visualizacao!), evidence.sha256])),
};
await writeFile(path.join(temporaryRoot, "manifest.json"), `${JSON.stringify(publicManifest, null, 2)}\n`, "utf8");
await rm(targetResolved, { recursive: true, force: true });
await rename(temporaryRoot, targetResolved);

const completedCollections = executions.filter((item) => item.modo === "coleta" && item.situacao === "concluida");
const criteriaWithTechnicalCollection = new Set(completedCollections.flatMap((item) => item.criterios_associados));
const criteriaResults: Record<string, ResultadoCriterioPainel> = {};
for (const criterion of criteriaCatalog) {
  const final = publishedByCriterion.get(criterion.id);
  const relatedExecutions = executions.filter((execution) => execution.criterios_associados.includes(criterion.id));
  const relatedCollections = completedCollections.filter((execution) => execution.criterios_associados.includes(criterion.id));
  const navigations = relatedCollections.flatMap((execution) => execution.navegacoes.filter((item) => item.criterios.includes(criterion.id)));
  const evidences = relatedCollections.flatMap((execution) => execution.evidencias.filter((item) => item.criterios.includes(criterion.id)));
  criteriaResults[criterion.id] = {
    criterio_id: criterion.id,
    situacao: final ? "verificado" : relatedCollections.length ? "coleta_tecnica_sem_verificacao" : "nao_verificado",
    execucoes: relatedExecutions.map((item) => item.execucao_id),
    navegacoes: navigations,
    evidencias: evidences,
    informacao_encontrada: final?.observacoes_achado || null,
    primeira_verificacao: final?.primeira_verificacao ?? null,
    segunda_verificacao: final?.segunda_verificacao ?? null,
    resultado_final: final?.resultado_final ?? null,
    responsavel_validacao: final?.responsavel_validacao ?? null,
    observacao: final
      ? "Resultado registrado após revisão humana."
      : relatedCollections.length
        ? "Há coleta técnica associada, mas não existe registro de verificação do conteúdo do critério."
        : "Não há coleta técnica nem verificação registrada para este critério.",
  };
}

const verified = Object.values(criteriaResults).filter((item) => item.situacao === "verificado").length;
const payload = {
  schema_version: 1,
  gerado_em_utc: utcNow(),
  aviso: "Navegação e captura são sinais técnicos. Somente revisão humana registrada pode verificar um critério ou produzir resultado final.",
  totais: {
    execucoes: executions.length,
    execucoes_concluidas: executions.filter((item) => item.situacao === "concluida").length,
    grupos_com_coleta: unique(completedCollections.map((item) => item.grupo)).length,
    criterios_com_coleta_tecnica: criteriaWithTechnicalCollection.size,
    criterios_efetivamente_verificados: verified,
    criterios_sem_verificacao: criteriaCatalog.length - verified,
    resultados_preliminares: 0,
    resultados_finais_validados: published.length,
    evidencias_registradas: executions.reduce((sum, item) => sum + item.evidencias.length, 0),
    evidencias_autorizadas: selectedOutputs.size,
  },
  questoes: [1, 2, 3].map((question) => {
    const questionCriteria = criteriaCatalog.filter((item) => item.questao === question);
    const questionIds = new Set(questionCriteria.map((item) => item.id));
    const questionVerified = questionCriteria.filter((item) => criteriaResults[item.id].situacao === "verificado").length;
    return {
      questao: question,
      total: questionCriteria.length,
      com_coleta_tecnica: [...criteriaWithTechnicalCollection].filter((id) => questionIds.has(id)).length,
      verificados: questionVerified,
      pendentes: questionCriteria.length - questionVerified,
    };
  }),
  ultima_execucao: executions[0] ?? null,
  execucoes: executions,
  criterios: criteriaResults,
};

await atomicWriteJson(dataDestination, payload);
const copiedBytes = (await Promise.all([...selectedOutputs.values()].map((file) => stat(path.join(evidenceRoot, file))))).reduce((sum, item) => sum + item.size, 0);
console.log(`Extrato sanitizado: ${executions.length} execução(ões), ${payload.totais.evidencias_registradas} evidência(s), ${selectedOutputs.size} cópia(s) autorizada(s) (${copiedBytes} bytes).`);
