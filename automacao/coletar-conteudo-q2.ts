import { chromium } from "playwright";
import path from "node:path";
import { atomicWriteJson, ensureDir, executionId, projectRoot, sha256File, utcNow } from "@/lib/persistencia";

const operatorId = process.env.COLETA_OPERADOR_ID?.trim() || "coleta-local";
const homepage = "https://www.sema.mt.gov.br/";

const targets = [
  { id: "portal-transparencia", grupo: "Q2.1", criterios: ["Q2.1.1", "Q2.1.2", "Q2.1.3", "Q2.1.4", "Q2.1.5", "Q2.1.6", "Q2.1.7", "Q2.1.8", "Q2.7.1"], url: "https://www.sema.mt.gov.br/transparencia" },
  { id: "simlam", grupo: "Q2.1", criterios: ["Q2.1.1", "Q2.1.2", "Q2.1.3"], url: "https://www.sema.mt.gov.br/transparencia/index.php/sistemas/simlam" },
  { id: "geoportal", grupo: "Q2.1", criterios: ["Q2.1.3", "Q2.1.4", "Q2.1.5", "Q2.7.1"], url: "https://www.sema.mt.gov.br/transparencia/index.php/sistemas/simgeo" },
  { id: "autos-infracao", grupo: "Q2.1", criterios: ["Q2.1.1", "Q2.1.2", "Q2.1.5", "Q2.1.7"], url: "https://sema.mt.gov.br/transparencia/index.php/gestao-ambiental/julgamento-e-arrecadacao-multas" },
  { id: "editais-decisoes", grupo: "Q2.1", criterios: ["Q2.1.2", "Q2.1.5", "Q2.1.7"], url: "https://sema.mt.gov.br/transparencia/index.php/gestao-ambiental/editais-notificacoes-e-decisoes-administrativas-de-autos-de-infracao" },
  { id: "tacs-iomat", grupo: "Q2.1", criterios: ["Q2.1.6"], url: "https://iomat.mt.gov.br/legislacao/diario_oficial/2535/2026/3/page%3A22" },
  { id: "eia-rima", grupo: "Q2.1", criterios: ["Q2.1.8"], url: "https://www.sema.mt.gov.br/transparencia/index.php/gestao-ambiental/eia-rima" },
  { id: "qualidade-ar", grupo: "Q2.2", criterios: ["Q2.2.1", "Q2.2.3"], url: "https://www.sema.mt.gov.br/transparencia/index.php/gestao-ambiental/monitoramento-ambiental/qualidade-do-ar" },
  { id: "qualidade-agua", grupo: "Q2.2", criterios: ["Q2.2.2", "Q2.2.3"], url: "https://www.sema.mt.gov.br/transparencia/index.php/gestao-ambiental/monitoramento-ambiental/qualidade-da-agua" },
  { id: "simcar", grupo: "Q2.3", criterios: ["Q2.3.1", "Q2.3.2", "Q2.3.3"], url: "https://www.sema.mt.gov.br/site/index.php/simcar" },
  { id: "simcar-publico", grupo: "Q2.3", criterios: ["Q2.3.1", "Q2.3.2", "Q2.3.3"], url: "https://monitoramento.sema.mt.gov.br/simcar/tecnico.app/publico/car" },
  { id: "unidades-conservacao", grupo: "Q2.4", criterios: ["Q2.4.1"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-de-conservacao/unidades-de-conserva%C3%A7%C3%A3o-estaduais" },
  { id: "compensacao-ambiental", grupo: "Q2.4", criterios: ["Q2.4.2"], url: "https://www.sema.mt.gov.br/transparencia/index.php/gestao-ambiental/compensacao-ambiental" },
  { id: "busca-femam", grupo: "Q2.5", criterios: ["Q2.5.1", "Q2.5.2", "Q2.5.3"], url: "https://www.sema.mt.gov.br/site/index.php/component/search/?searchword=FEMAM&searchphrase=all&Itemid=435" },
  { id: "recursos-hidricos", grupo: "Q2.6", criterios: ["Q2.6.1", "Q2.6.2"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/recursos-hidricos" },
  { id: "sinima-pnla", grupo: "Q2.7", criterios: ["Q2.7.2", "Q2.7.3"], url: "https://www.gov.br/mma/pt-br/acesso-a-informacao/informacoes-ambientais" },
] as const;

const execucaoId = executionId("q2-conteudo");
const execucaoDir = path.join(projectRoot, "private", "execucoes", execucaoId);
const screenshotsDir = path.join(execucaoDir, "screenshots");
await ensureDir(screenshotsDir);

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Cuiaba", viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(30_000);
const registros: Array<Record<string, unknown>> = [];

try {
  for (const target of targets) {
    const iniciadoEm = utcNow();
    let homepageStatus: number | null = null;
    let status: number | null = null;
    let erro: string | null = null;
    try {
      const homeResponse = await page.goto(homepage, { waitUntil: "domcontentloaded" });
      homepageStatus = homeResponse?.status() ?? null;
      const response = await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(1_200);
    } catch (cause) {
      erro = cause instanceof Error ? cause.message : String(cause);
    }

    const arquivo = path.join(screenshotsDir, `${target.id}.png`);
    await page.screenshot({ path: arquivo, fullPage: true });
    const textoVisivel = (await page.locator("body").innerText().catch(() => "")).replace(/\r/g, "").trim();
    const linksVisiveis = await page.locator("a[href]").evaluateAll((anchors) => anchors
      .map((anchor) => ({ texto: (anchor.textContent ?? "").replace(/\s+/g, " ").trim(), url: (anchor as HTMLAnchorElement).href }))
      .filter((link) => link.texto && link.url.startsWith("http")));
    registros.push({
      id: target.id,
      grupo_id: target.grupo,
      criterios: target.criterios,
      iniciado_em_utc: iniciadoEm,
      capturado_em_utc: utcNow(),
      trilha: [homepage, target.url],
      homepage_status_http: homepageStatus,
      url_solicitada: target.url,
      url_final: page.url(),
      status_http: status,
      titulo: await page.title().catch(() => ""),
      texto_visivel: textoVisivel,
      links_visiveis: linksVisiveis,
      texto_sha256: await crypto.subtle.digest("SHA-256", new TextEncoder().encode(textoVisivel)).then((value) => Buffer.from(value).toString("hex")),
      screenshot: `screenshots/${target.id}.png`,
      screenshot_sha256: await sha256File(arquivo),
      erro_tecnico: erro,
      resultado_final: null,
    });
  }
} finally {
  await browser.close();
}

await atomicWriteJson(path.join(execucaoDir, "conteudo-visivel.json"), {
  schema_version: 1,
  execucao_id: execucaoId,
  questao: 2,
  grupos_ids: ["Q2.1", "Q2.2", "Q2.3", "Q2.4", "Q2.5", "Q2.6", "Q2.7"],
  metodo: "Navegacao controlada iniciada na homepage, seguida de leitura do texto visivel e captura integral de fontes oficiais do Q2.",
  operador_id: operatorId,
  gerado_em_utc: utcNow(),
  resultado_final: null,
  registros,
});

console.log(JSON.stringify({ execucao_id: execucaoId, paginas: registros.length, diretorio: execucaoDir }, null, 2));
