import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

const painel = JSON.parse(await readFile(path.join(projectRoot, "data", "painel-publico.json"), "utf8"));
const evidence = JSON.parse(await readFile(path.join(projectRoot, "data", "evidencias-publicas.json"), "utf8"));
const diagnostics = JSON.parse(await readFile(path.join(projectRoot, "data", "diagnosticos-preliminares.json"), "utf8"));
const publishedReviewsText = await readFile(path.join(projectRoot, "data", "validacoes-publicadas.json"), "utf8");
const publishedReviews = JSON.parse(publishedReviewsText);
if (painel.escopo.criterios !== 73 || painel.escopo.grupos !== 17 || painel.escopo.passos !== 66) throw new Error("Snapshot público perdeu invariantes oficiais.");
if (painel.resultados.validados === 0 && (painel.resultados.atendidos || painel.resultados.parciais || painel.resultados.naoAtendidos || painel.resultados.naoApurados !== 73)) throw new Error("Estado vazio de resultados finais inválido.");
if (diagnostics.diagnosticos.length !== 10 || diagnostics.diagnosticos.some((item: any) => item.resultadoFinal !== null)) throw new Error("Diagnósticos preliminares inválidos.");
if (JSON.stringify(diagnostics).match(/private[\\/]|[A-Z]:\\/i)) throw new Error("Snapshot de diagnósticos expõe caminho privado.");
if (!Array.isArray(publishedReviews.resultados) || publishedReviews.total !== publishedReviews.resultados.length) throw new Error("Snapshot de validações inválido.");
if (/"(?:responsavel_validacao|auditor_nome|matricula|e-?mail|assinatura)"\s*:/i.test(publishedReviewsText)) throw new Error("Snapshot de validações contém campo de identidade pessoal.");
for (const item of evidence.evidencias) {
  const bytes = await readFile(path.join(projectRoot, "public", item.arquivo.replace(/^\//, "")));
  if (createHash("sha256").update(bytes).digest("hex") !== item.sha256Publicado) throw new Error(`Integridade inválida: ${item.id}`);
}

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: projectRoot }).toString("utf8").split("\0").filter(Boolean);
const forbiddenTracked = tracked.filter((file) => /^(private|exports|arquivos)\//i.test(file) || /\.(pdf|docx|xlsx|jsonl|zip)$/i.test(file));
if (forbiddenTracked.length) throw new Error(`Arquivos restritos rastreados pelo Git:\n${forbiddenTracked.join("\n")}`);

async function walk(directory: string): Promise<string[]> {
  const info = await stat(directory).catch(() => null);
  if (!info) return [];
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full)); else found.push(full);
  }
  return found;
}
const roots = [path.join(projectRoot, "public"), path.join(projectRoot, "out")];
const files = (await Promise.all(roots.map(walk))).flat();
const forbiddenBuild = files.filter((file) => /\.(pdf|docx|xlsx|jsonl|zip|log)$/i.test(file));
if (forbiddenBuild.length) throw new Error(`Artefatos proibidos no conjunto público:\n${forbiddenBuild.join("\n")}`);
const textFiles = files.filter((file) => /\.(html|js|css|json|txt|xml)$/i.test(file));
const leaks = [/C:\\Users\\/i, /\/Users\//i, /private[\\/]+execucoes/i, /trace\.zip/i, /arquivoOriginalLocal/i];
for (const file of textFiles) {
  const text = await readFile(file, "utf8");
  const match = leaks.find((pattern) => pattern.test(text));
  if (match) throw new Error(`Possível exposição (${match}) em ${path.relative(projectRoot, file)}.`);
}
console.log(`Publicação verificada: ${tracked.length} arquivos rastreados, ${evidence.evidencias.length} prints aprovados e nenhum artefato restrito no bundle.`);
