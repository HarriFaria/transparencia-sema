import { cp, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { atomicWriteJson, ensureDir, projectRoot, sha256Text, utcNow, withFileLock } from "@/lib/persistencia";
import { finalResultSchema } from "@/lib/schemas";

const reviewsRoot = path.join(projectRoot, "private", "revisoes");
const destination = path.join(projectRoot, "data", "resultados-publicados.json");
const found: Array<Record<string, any>> = [];
for (const criterionDirectory of await readdir(reviewsRoot, { withFileTypes: true }).catch(() => [])) {
  if (!criterionDirectory.isDirectory()) continue;
  const directory = path.join(reviewsRoot, criterionDirectory.name);
  for (const file of await readdir(directory)) if (file.endsWith(".json")) found.push(JSON.parse(await readFile(path.join(directory, file), "utf8")));
}
const latest = new Map<string, Record<string, any>>();
for (const review of found.sort((a, b) => String(a.criada_em_utc).localeCompare(String(b.criada_em_utc)))) {
  const { sha256_conteudo, ...body } = review;
  if (sha256Text(JSON.stringify(body)) !== sha256_conteudo) throw new Error(`Integridade da revisão inválida: ${review.revisao_id}`);
  finalResultSchema.parse(review.resultado_final);
  latest.set(review.criterio_id, review);
}
const sanitized = [...latest.values()].map((review) => ({
  criterio_id: review.criterio_id,
  revisao_id: review.revisao_id,
  execucao_id: review.execucao_id,
  publicada_em_utc: utcNow(),
  primeira_verificacao: { data: review.primeira_verificacao.data, hora: review.primeira_verificacao.hora, endereco_ou_justificativa: review.primeira_verificacao.endereco_ou_justificativa, responsavel: review.primeira_verificacao.responsavel, status_operacional: review.primeira_verificacao.status_operacional, evidencias: review.primeira_verificacao.evidencias.map((item: any) => ({ sha256: item.sha256 })) },
  segunda_verificacao: review.segunda_verificacao ? { data: review.segunda_verificacao.data, hora: review.segunda_verificacao.hora, endereco_ou_justificativa: review.segunda_verificacao.endereco_ou_justificativa, responsavel: review.segunda_verificacao.responsavel, status_operacional: review.segunda_verificacao.status_operacional, evidencias: review.segunda_verificacao.evidencias.map((item: any) => ({ sha256: item.sha256 })) } : null,
  responsavel_validacao: review.responsavel_validacao,
  captura_tela_anexada: review.captura_tela_anexada,
  resultado_final: review.resultado_final,
  observacoes_achado: review.observacoes_achado,
  sha256_revisao: review.sha256_conteudo,
}));

await withFileLock(destination, async () => {
  if (await readFile(destination).then(() => true).catch(() => false)) {
    const backupDir = path.join(projectRoot, "private", "backups", "publicacoes");
    await ensureDir(backupDir);
    await cp(destination, path.join(backupDir, `resultados-publicados-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
  }
  await atomicWriteJson(destination, sanitized);
});
console.log(`Publicação local sanitizada: ${sanitized.length} resultado(s) aprovado(s). Nenhum deploy foi acionado.`);
