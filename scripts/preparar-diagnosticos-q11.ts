import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { diagnosticosQ11Schema } from "@/lib/diagnosticos";
import { projectRoot } from "@/lib/persistencia";

const readJson = async <T>(file: string) => JSON.parse(await readFile(file, "utf8")) as T;
const sourcePath = path.join(projectRoot, "data", "diagnosticos-preliminares.json");
const payload = diagnosticosQ11Schema.parse(await readJson<unknown>(sourcePath));
const ids = new Set(payload.diagnosticos.map((item) => item.criterioId));
if (ids.size !== 10 || [...ids].some((id) => !/^Q1\.1\.(?:[1-9]|10)$/.test(id))) throw new Error("Diagnósticos Q1.1 incompletos ou duplicados.");
if (payload.diagnosticos.some((item) => item.resultadoFinal !== null)) throw new Error("Diagnóstico preliminar não pode preencher resultado final.");

const approval = await readJson<any>(path.join(projectRoot, "private", "aprovacao-evidencias.json"));
const publicEvidence = await readJson<any>(path.join(projectRoot, "data", "evidencias-publicas.json"));
const evidenceById = new Map(approval.itens.map((item: any) => [item.id, item]));
const publishedById = new Map(publicEvidence.evidencias.map((item: any) => [item.id, item]));
const privateHistory = {
  ...payload,
  historicoPrivado: true,
  diagnosticos: payload.diagnosticos.map((diagnostico) => ({
    ...diagnostico,
    observacoes: diagnostico.observacoes.map((observacao) => ({
      ...observacao,
      evidencias: observacao.evidenciasIds.map((id) => {
        const item: any = evidenceById.get(id);
        const published: any = publishedById.get(id);
        if (!item) throw new Error(`Evidência não encontrada na allowlist: ${id}`);
        if (!published) throw new Error(`Evidência não encontrada no manifesto público: ${id}`);
        const execucaoId = item.execucao_id ?? approval.execucao_id;
        return { id, sha256: published.sha256Original, url: observacao.url, instante: observacao.consultadoEm, trecho: observacao.trecho, caminhoRelativoPrivado: `private/execucoes/${execucaoId}/${item.arquivo}` };
      }),
    })),
  })),
};

await mkdir(path.join(projectRoot, "private", "diagnosticos-q11"), { recursive: true });
await writeFile(path.join(projectRoot, "private", "diagnosticos-q11", `${payload.execucaoId}.json`), `${JSON.stringify(privateHistory, null, 2)}\n`, "utf8");
await mkdir(path.join(projectRoot, "public", "data"), { recursive: true });
await writeFile(path.join(projectRoot, "public", "data", "diagnosticos-preliminares.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Diagnósticos Q1.1 validados: ${payload.totais.analisados}; resultados finais preenchidos: 0.`);
