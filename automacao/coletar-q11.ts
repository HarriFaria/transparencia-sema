import { chromium, type Page } from "playwright";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { appendJsonl, atomicWriteJson, ensureDir, executionId, projectRoot, sha256File, utcNow } from "@/lib/persistencia";
import { classifyLinks } from "@/automacao/adaptadores/sema";

type Mode = "descoberta" | "coleta";
type PortalConfig = { nome: string; homepage: string; dominios_permitidos: string[]; url_verificada_em: string; fonte_da_verificacao: string; timeout_ms: number; intervalo_entre_acoes_ms: number; maximo_paginas_por_execucao: number };

const mode = (process.argv[2] ?? "descoberta") as Mode;
if (!(["descoberta", "coleta"] as string[]).includes(mode)) throw new Error("Modo válido: descoberta ou coleta");

const configPath = path.join(projectRoot, "automacao", "config.portais.json");
const criteriaPath = path.join(projectRoot, "data", "criterios.json");
const config = JSON.parse(await readFile(configPath, "utf8")) as { portais: { sema: PortalConfig } };
const portal = config.portais.sema;
const operator = process.env.AUDITOR_NOME?.trim();
if (!operator) throw new Error("Defina AUDITOR_NOME com a identificação explícita do operador antes da execução.");
const id = executionId(`q11-${mode}`);
const executionDir = path.join(projectRoot, "private", "execucoes", id);
const screenshotsDir = path.join(executionDir, "screenshots");
const eventsPath = path.join(executionDir, "eventos.jsonl");
await ensureDir(screenshotsDir);

const manifest: Record<string, unknown> = {
  schema_version: 1, execucao_id: id, grupo: "Q1.1", modo: mode, criado_em_utc: utcNow(), fuso_visualizacao: "America/Cuiaba",
  operador: operator, homepage: portal.homepage,
  configuracao: { arquivo: "automacao/config.portais.json", sha256: await sha256File(configPath) },
  criterios: { arquivo: "data/criterios.json", sha256: await sha256File(criteriaPath) },
  metodologia: "Navegação iniciada na homepage; nenhuma classificação final é produzida automaticamente.",
};
await atomicWriteJson(path.join(executionDir, "manifest.json"), manifest);

async function event(tipo: string, data: Record<string, unknown> = {}) { await appendJsonl(eventsPath, { timestamp_utc: utcNow(), fuso_visualizacao: "America/Cuiaba", tipo, ...data }); }
async function capture(page: Page, name: string, criteria: string[]) {
  const filePath = path.join(screenshotsDir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  const hash = await sha256File(filePath);
  await event("evidencia_capturada", { criterios: criteria, arquivo: path.relative(executionDir, filePath).replaceAll("\\", "/"), sha256: hash, url: page.url(), bruta: true });
  return { filePath, hash };
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Cuiaba", userAgent: "TCEMT-Auditoria-SEMA/1.0 (coleta pública assistida; contato institucional)" });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  const page = await context.newPage();
  page.setDefaultTimeout(portal.timeout_ms);
  page.on("requestfailed", (request) => void event("requisicao_falhou", { url: request.url(), metodo: request.method(), erro: request.failure()?.errorText }));
  page.on("response", (response) => { if (response.status() >= 400) void event("resposta_http_erro", { url: response.url(), status: response.status() }); });

  await event("execucao_iniciada", { modo: mode, homepage: portal.homepage });
  const response = await page.goto(portal.homepage, { waitUntil: "domcontentloaded" });
  await event("homepage_aberta", { url_solicitada: portal.homepage, url_final: page.url(), status_http: response?.status() ?? null, titulo: await page.title() });
  await page.waitForTimeout(portal.intervalo_entre_acoes_ms);
  await capture(page, "000-homepage", ["Q1.1.1", "Q1.1.2", "Q1.1.3", "Q1.1.4", "Q1.1.5", "Q1.1.6", "Q1.1.7", "Q1.1.8", "Q1.1.9", "Q1.1.10"]);

  const rawLinks = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => ({ texto: (anchor.textContent ?? "").trim(), url: (anchor as HTMLAnchorElement).href })).filter((item) => item.url.startsWith("http")));
  const map = classifyLinks(rawLinks);
  await atomicWriteJson(path.join(executionDir, "mapa-links.json"), { schema_version: 1, gerado_em_utc: utcNow(), homepage: portal.homepage, links: map });
  await event("mapa_links_gerado", { total_links_pagina: rawLinks.length, candidatos_q11: map.length });

  if (mode === "coleta") {
    for (const [index, candidate] of map.slice(0, portal.maximo_paginas_por_execucao).entries()) {
      const host = new URL(candidate.url).hostname;
      if (!portal.dominios_permitidos.includes(host)) { await event("mudanca_dominio_nao_seguida", { ...candidate, dominio: host }); continue; }
      await page.goto(portal.homepage, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(portal.intervalo_entre_acoes_ms);
      const before = page.url();
      const locator = page.locator("a[href]").filter({ hasText: candidate.texto }).first();
      try {
        if (await locator.count()) await locator.click({ timeout: portal.timeout_ms });
        else await page.goto(candidate.url, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("domcontentloaded");
        await event("navegacao", { criterios: candidate.criterios, texto_link: candidate.texto, url_antes: before, url_depois: page.url(), url_candidata: candidate.url, mudanca_dominio: new URL(before).hostname !== new URL(page.url()).hostname });
        await capture(page, `${String(index + 1).padStart(3, "0")}-${candidate.criterios.join("-")}`, candidate.criterios);
      } catch (error) {
        await event("falha_navegacao", { criterios: candidate.criterios, url: candidate.url, limitacao_tecnica: true, erro: error instanceof Error ? error.message : String(error) });
        await capture(page, `${String(index + 1).padStart(3, "0")}-falha`, candidate.criterios).catch(() => undefined);
      }
      await page.waitForTimeout(portal.intervalo_entre_acoes_ms);
    }
  }
  await context.tracing.stop({ path: path.join(executionDir, "trace.zip") });
  await event("execucao_concluida", { conclusao_fiscalizacao: null, revisao_humana_necessaria: true });
  await atomicWriteJson(path.join(executionDir, "resumo.json"), { execucao_id: id, modo: mode, candidatos: map.length, criterios: [...new Set(map.flatMap((item) => item.criterios))], resultado_final: null, aviso: "Candidatos de navegação não equivalem a atendimento do critério." });
  console.log(JSON.stringify({ execucao_id: id, diretorio: executionDir, modo: mode, candidatos: map.length }, null, 2));
} catch (error) {
  await event("execucao_interrompida", { limitacao_tecnica: true, erro: error instanceof Error ? error.message : String(error), resultado_final: null });
  throw error;
} finally { await browser?.close(); }
