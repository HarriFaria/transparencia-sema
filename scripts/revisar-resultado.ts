import { readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { reviewInputSchema } from "@/lib/schemas";
import { atomicWriteJson, projectRoot, sha256Text, utcNow, withFileLock } from "@/lib/persistencia";

function argument(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }
const inputArg = argument("--input");
if (!inputArg) throw new Error("Uso: npm run review -- --input <arquivo-json-local>");
const inputPath = path.resolve(inputArg);
const parsed = reviewInputSchema.parse(JSON.parse(await readFile(inputPath, "utf8")));

if (parsed.responsavel_validacao.localeCompare(parsed.primeira_verificacao.responsavel, "pt-BR", { sensitivity: "base" }) === 0) {
  throw new Error("O responsável pela validação deve ser diferente do responsável pelo primeiro levantamento.");
}
if (parsed.primeira_verificacao.status_operacional === "nao_localizado") {
  if (!parsed.segunda_verificacao) throw new Error("Item não localizado exige segunda verificação em outra data.");
  if (parsed.segunda_verificacao.data <= parsed.primeira_verificacao.data) throw new Error("A segunda verificação deve ocorrer em data posterior; a metodologia não fixa número mínimo de dias.");
}
if (parsed.resultado_final === "Não atendido" && !parsed.captura_tela_anexada) {
  throw new Error("Resultado 'Não atendido' exige captura de tela anexada.");
}

const executionDir = path.join(projectRoot, "private", "execucoes", parsed.execucao_id);
await readFile(path.join(executionDir, "manifest.json"), "utf8").catch(() => { throw new Error(`Execução não encontrada: ${parsed.execucao_id}`); });
const reviewId = `rev-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const createdAt = utcNow();
const body = { schema_version: 1, revisao_id: reviewId, criada_em_utc: createdAt, fuso_visualizacao: "America/Cuiaba", autenticacao: "nome_declarado_sem_autenticacao_forte", ...parsed };
const record = { ...body, sha256_conteudo: sha256Text(JSON.stringify(body)) };
const directory = path.join(projectRoot, "private", "revisoes", parsed.criterio_id);
await withFileLock(path.join(directory, "revisoes"), () => atomicWriteJson(path.join(directory, `${reviewId}.json`), record));
console.log(JSON.stringify({ revisao_id: reviewId, criterio_id: parsed.criterio_id, resultado_final: parsed.resultado_final, aviso: "O nome declarado não constitui autenticação forte." }, null, 2));
