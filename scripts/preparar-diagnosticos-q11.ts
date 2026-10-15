import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { diagnosticosQ11Schema } from "@/lib/diagnosticos";
import { projectRoot } from "@/lib/persistencia";

const readJson = async <T>(file: string) => JSON.parse(await readFile(file, "utf8")) as T;
const sourcePath = path.join(projectRoot, "data", "diagnosticos-preliminares.json");
const payload = diagnosticosQ11Schema.parse(await readJson<unknown>(sourcePath));
const ids = new Set(payload.diagnosticos.map((item) => item.criterioId));
const q11 = payload.diagnosticos.filter((item) => item.criterioId.startsWith("Q1.1."));
const q2 = payload.diagnosticos.filter((item) => item.criterioId.startsWith("Q2."));
if (ids.size !== 34 || q11.length !== 10 || q2.length !== 24) throw new Error("Diagnósticos Q1.1 + Q2 incompletos ou duplicados.");
if (payload.diagnosticos.some((item) => item.resultadoFinal !== null)) throw new Error("Diagnóstico preliminar não pode preencher resultado final.");

const privateEntries = await readdir(path.join(projectRoot, "private"), { withFileTypes: true });
const approvalFiles = privateEntries.filter((entry) => entry.isFile() && /^aprovacao-evidencias(?:-[a-z0-9]+)?\.json$/i.test(entry.name));
const approvals = await Promise.all(approvalFiles.map((entry) => readJson<any>(path.join(projectRoot, "private", entry.name))));
const publicEvidence = await readJson<any>(path.join(projectRoot, "data", "evidencias-publicas.json"));
const evidenceById = new Map(approvals.flatMap((approval) => approval.itens.map((item: any) => [item.id, { approval, item }] as const)));
const publishedById = new Map(publicEvidence.evidencias.map((item: any) => [item.id, item]));
const privateHistory = {
  ...payload,
  historicoPrivado: true,
  diagnosticos: payload.diagnosticos.map((diagnostico) => ({
    ...diagnostico,
    observacoes: diagnostico.observacoes.map((observacao) => ({
      ...observacao,
      evidencias: observacao.evidenciasIds.map((id) => {
        const found: any = evidenceById.get(id);
        const published: any = publishedById.get(id);
        if (!found) throw new Error(`Evidência não encontrada nas allowlists: ${id}`);
        if (!published) throw new Error(`Evidência não encontrada no manifesto público: ${id}`);
        const execucaoId = found.item.execucao_id ?? found.approval.execucao_id;
        return { id, sha256: published.sha256Original, url: observacao.url, instante: observacao.consultadoEm, trecho: observacao.trecho, caminhoRelativoPrivado: `private/execucoes/${execucaoId}/${found.item.arquivo}` };
      }),
    })),
  })),
};

await mkdir(path.join(projectRoot, "private", "diagnosticos"), { recursive: true });
await writeFile(path.join(projectRoot, "private", "diagnosticos", `${payload.execucaoId}.json`), `${JSON.stringify(privateHistory, null, 2)}\n`, "utf8");
await mkdir(path.join(projectRoot, "public", "data"), { recursive: true });
await writeFile(path.join(projectRoot, "public", "data", "diagnosticos-preliminares.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Diagnósticos preliminares validados: ${payload.totais.analisados} (Q1.1: ${q11.length}; Q2: ${q2.length}); resultados finais preenchidos: 0.`);
