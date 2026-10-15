import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { projectRoot } from "@/lib/persistencia";

type ApprovalItem = {
  id: string;
  execucao_id?: string;
  grupo_id?: string;
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

const privateEntries = await readdir(path.join(projectRoot, "private"), { withFileTypes: true });
const approvalFiles = privateEntries.filter((entry) => entry.isFile() && /^aprovacao-evidencias(?:-[a-z0-9]+)?\.json$/i.test(entry.name));
const approvals = await Promise.all(approvalFiles.map((entry) => readJson<Approval>(path.join(projectRoot, "private", entry.name))));
if (!approvals.length || approvals.some((approval) => approval.schema_version !== 1 || !approval.execucao_id || !approval.grupo_id)) throw new Error("Manifesto privado de aprovação inválido.");
const approvedEntries = approvals.flatMap((approval) => approval.itens.map((item) => ({ approval, item })));
if (!approvedEntries.length || approvedEntries.some(({ item }) => !item.id || !item.justificativa)) throw new Error("As allowlists precisam conter IDs e justificativas explícitas.");
if (new Set(approvedEntries.map(({ item }) => item.id)).size !== approvedEntries.length) throw new Error("IDs duplicados nas allowlists.");

const dataRoot = path.join(projectRoot, "public", "data");
const publicationRoots = [...new Set(approvedEntries.filter(({ item }) => item.publicar).map(({ approval, item }) => `${item.grupo_id ?? approval.grupo_id}|${item.execucao_id ?? approval.execucao_id}`))];
const publicationGroups = [...new Set(publicationRoots.map((entry) => entry.split("|")[0]))];
for (const groupId of publicationGroups) {
  const groupRoot = path.join(projectRoot, "public", "evidencias", groupId);
  if (!groupRoot.startsWith(path.join(projectRoot, "public", "evidencias") + path.sep)) throw new Error("Grupo público inesperado.");
  await rm(groupRoot, { recursive: true, force: true });
}
for (const entry of publicationRoots) {
  const [groupId, executionId] = entry.split("|");
  const targetRoot = path.join(projectRoot, "public", "evidencias", groupId, executionId);
  if (!targetRoot.startsWith(path.join(projectRoot, "public", "evidencias") + path.sep)) throw new Error("Destino público inesperado.");
  await mkdir(path.join(targetRoot, "miniaturas"), { recursive: true });
}
await mkdir(dataRoot, { recursive: true });

const executablePath = await localChromiumExecutable();
const browser = await chromium.launch(executablePath ? { headless: true, executablePath } : { headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
const published = [];

try {
  for (const { approval, item } of approvedEntries.filter(({ item: entry }) => entry.publicar)) {
    const executionId = item.execucao_id ?? approval.execucao_id;
    const groupId = item.grupo_id ?? approval.grupo_id;
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
    const targetRoot = path.join(projectRoot, "public", "evidencias", groupId, executionId);
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
      grupoId: groupId,
      criteriosIds: item.criterios_ids,
      nivelAssociacao: item.nivel_associacao,
      titulo: item.titulo,
      descricao: item.justificativa,
      urlOrigem: sanitizeUrl(event.url),
      capturadoEm: event.timestamp_utc,
      arquivo: `/evidencias/${groupId}/${executionId}/${publicName}`,
      miniatura: `/evidencias/${groupId}/${executionId}/miniaturas/${thumbName}`,
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
  revisadoEm: approvals.map((approval) => approval.revisado_em).sort().at(-1),
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
