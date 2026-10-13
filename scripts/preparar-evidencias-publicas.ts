import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { projectRoot } from "@/lib/persistencia";

type ApprovalItem = {
  id: string;
  execucao_id?: string;
  arquivo: string;
  publicar: boolean;
  titulo: string;
  nivel_associacao: "execucao" | "grupo" | "criterio";
  criterios_ids: string[];
  risco: string;
  justificativa: string;
};

type Approval = {
  schema_version: number;
  revisado_em: string;
  revisor: string;
  execucao_id: string;
  grupo_id: string;
  decisao_geral: string;
  itens: ApprovalItem[];
};

const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const readJson = async <T>(file: string) => JSON.parse(await readFile(file, "utf8")) as T;
const sanitizeUrl = (value: string) => {
  const url = new URL(value);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url.toString();
};

async function listImages(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await listImages(full));
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) found.push(full);
  }
  return found;
}

async function localChromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browsersRoot = path.join(projectRoot, ".tools", "playwright-browsers");
  const versions = await readdir(browsersRoot).catch(() => []);
  const shell = versions.find((item) => item.startsWith("chromium_headless_shell-"));
  if (!shell) return undefined;
  const candidate = path.join(browsersRoot, shell, process.platform === "win32" ? "chrome-win" : "chrome-linux", process.platform === "win32" ? "headless_shell.exe" : "headless_shell");
  return stat(candidate).then(() => candidate).catch(() => undefined);
}

const approvalPath = path.join(projectRoot, "private", "aprovacao-evidencias.json");
const approval = await readJson<Approval>(approvalPath);
if (approval.schema_version !== 1 || !approval.execucao_id || !approval.grupo_id) throw new Error("Manifesto privado de aprovação inválido.");
if (!approval.itens.length || approval.itens.some((item) => !item.id || !item.justificativa)) throw new Error("A allowlist precisa conter IDs e justificativas explícitas.");
if (new Set(approval.itens.map((item) => item.id)).size !== approval.itens.length) throw new Error("IDs duplicados na allowlist.");

const dataRoot = path.join(projectRoot, "public", "data");
const executionIds = [...new Set(approval.itens.filter((item) => item.publicar).map((item) => item.execucao_id ?? approval.execucao_id))];
for (const executionId of executionIds) {
  const targetRoot = path.join(projectRoot, "public", "evidencias", approval.grupo_id, executionId);
  if (!targetRoot.startsWith(path.join(projectRoot, "public", "evidencias") + path.sep)) throw new Error("Destino público inesperado.");
  await rm(targetRoot, { recursive: true, force: true });
  await mkdir(path.join(targetRoot, "miniaturas"), { recursive: true });
}
await mkdir(dataRoot, { recursive: true });

const executablePath = await localChromiumExecutable();
const browser = await chromium.launch(executablePath ? { headless: true, executablePath } : { headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
const published = [];

try {
  for (const item of approval.itens.filter((entry) => entry.publicar)) {
    const executionId = item.execucao_id ?? approval.execucao_id;
    const executionRoot = path.join(projectRoot, "private", "execucoes", executionId);
    const relative = item.arquivo.replaceAll("\\", "/");
    if (!relative.startsWith("screenshots/") || relative.includes("..") || path.extname(relative).toLowerCase() !== ".png") throw new Error(`Fonte fora do escopo: ${relative}`);
    const rawEvents = await readFile(path.join(executionRoot, "eventos.jsonl"), "utf8").catch(() => "");
    const events = rawEvents.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    const content = await readJson<any>(path.join(executionRoot, "conteudo-visivel.json")).catch(() => null);
    const evidenceEvents = new Map(events.filter((entry) => entry.tipo === "evidencia_capturada").map((entry) => [String(entry.arquivo).replaceAll("\\", "/"), entry]));
    for (const record of content?.registros ?? []) evidenceEvents.set(String(record.screenshot), { url: record.url_final, timestamp_utc: record.capturado_em_utc, sha256: record.screenshot_sha256 });
    const event = evidenceEvents.get(relative);
    if (!event) throw new Error(`Captura sem evento técnico correspondente: ${relative}`);
    const source = path.resolve(executionRoot, relative);
    if (!source.startsWith(path.resolve(executionRoot) + path.sep)) throw new Error("Caminho privado inválido.");
    const original = await readFile(source);
    const originalHash = hash(original);
    if (originalHash !== event.sha256) throw new Error(`Hash original divergente em ${item.id}.`);

    const publicName = `${item.id.toLowerCase()}.png`;
    const thumbName = `${item.id.toLowerCase()}-thumb.png`;
    const targetRoot = path.join(projectRoot, "public", "evidencias", approval.grupo_id, executionId);
    const publicPath = path.join(targetRoot, publicName);
    const thumbPath = path.join(targetRoot, "miniaturas", thumbName);
    await copyFile(source, publicPath);
    await page.setContent(`<style>*{box-sizing:border-box}html,body{margin:0;width:640px;height:360px;background:#eef2f6;overflow:hidden}img{display:block;width:640px;height:360px;object-fit:cover;object-position:top}</style><img alt="" src="data:image/png;base64,${original.toString("base64")}">`);
    await page.locator("img").waitFor({ state: "visible" });
    await page.screenshot({ path: thumbPath, type: "png" });
    const derived = await readFile(publicPath);
    const thumb = await readFile(thumbPath);
    published.push({
      id: item.id,
      execucaoId: executionId,
      grupoId: approval.grupo_id,
      criteriosIds: item.criterios_ids,
      nivelAssociacao: item.nivel_associacao,
      titulo: item.titulo,
      descricao: item.justificativa,
      urlOrigem: sanitizeUrl(event.url),
      capturadoEm: event.timestamp_utc,
      arquivo: `/evidencias/${approval.grupo_id}/${executionId}/${publicName}`,
      miniatura: `/evidencias/${approval.grupo_id}/${executionId}/miniaturas/${thumbName}`,
      statusRevisao: "aprovado",
      saneada: false,
      sha256Original: originalHash,
      sha256Publicado: hash(derived),
      sha256Miniatura: hash(thumb),
      tamanhoBytes: derived.length,
      tamanhoMiniaturaBytes: thumb.length,
    });
  }
} finally {
  await browser.close();
}

const allRawImages = await listImages(path.join(projectRoot, "private", "execucoes"));
const payload = {
  schemaVersion: 1,
  revisadoEm: approval.revisado_em,
  geradoEm: published.map((item) => item.capturadoEm).sort().at(-1) ?? null,
  nota: "Capturas de páginas públicas aprovadas após inspeção visual. Comprovam navegação técnica, não atendimento ao critério.",
  totais: { encontradas: allRawImages.length, aprovadas: published.length, publicadas: published.length, retidas: allRawImages.length - published.length },
  retencao: "Capturas de execuções de descoberta não foram allowlisted por serem redundantes; originais, traces e registros brutos permanecem privados.",
  evidencias: published,
};
const serialized = `${JSON.stringify(payload, null, 2)}\n`;
await writeFile(path.join(projectRoot, "data", "evidencias-publicas.json"), serialized, "utf8");
await writeFile(path.join(dataRoot, "evidencias-publicas.json"), serialized, "utf8");
console.log(`Evidências públicas preparadas: ${published.length} aprovadas de ${allRawImages.length} capturas encontradas; ${allRawImages.length - published.length} retidas.`);
