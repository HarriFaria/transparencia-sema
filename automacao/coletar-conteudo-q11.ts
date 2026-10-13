import { chromium } from "playwright";
import path from "node:path";
import { atomicWriteJson, ensureDir, executionId, projectRoot, sha256File, utcNow } from "@/lib/persistencia";

const operatorId = process.env.COLETA_OPERADOR_ID?.trim() || "coleta-local";

const homepage = "https://www.sema.mt.gov.br/";
const targets = [
  { id: "competencias", criterios: ["Q1.1.1"], url: "https://www.sema.mt.gov.br/site/index.php/sema/quem-somos" },
  { id: "estrutura", criterios: ["Q1.1.2"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas" },
  { id: "organograma", criterios: ["Q1.1.2"], url: "https://www.sema.mt.gov.br/site/index.php/sema/quem-somos/organograma" },
  { id: "estrutura-documentos", criterios: ["Q1.1.2"], url: "https://www.sema.mt.gov.br/site/index.php/sema/quem-somos/estrutura" },
  { id: "contatos", criterios: ["Q1.1.3", "Q1.1.4", "Q1.1.5"], url: "https://www.sema.mt.gov.br/site/index.php/sema/%C3%BAltimos-avisos/5259-contatos-sema" },
  { id: "atendimento", criterios: ["Q1.1.3", "Q1.1.4", "Q1.1.5"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/atendimento-ao-cidadao" },
  { id: "ouvidoria", criterios: ["Q1.1.3", "Q1.1.4", "Q1.1.5"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/ouvidoria" },
  { id: "programas-projetos-estrategicos", criterios: ["Q1.1.6", "Q1.1.7", "Q1.1.8"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/programas-e-projetos-estrategicos" },
  { id: "programas-projetos-internacionais", criterios: ["Q1.1.6", "Q1.1.7", "Q1.1.8"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/unidade-de-programas-e-projetos-internacionais" },
  { id: "acoes-projetos-educacao", criterios: ["Q1.1.7", "Q1.1.8"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/educacao-ambiental/a%C3%A7%C3%B5es-e-projetos" },
  { id: "programa-rem", criterios: ["Q1.1.6", "Q1.1.7", "Q1.1.8", "Q1.1.9"], url: "https://www.sema.mt.gov.br/site/index.php/decisao-colegiada/comite-do-programa-rem" },
  { id: "planos-estaduais", criterios: ["Q1.1.6", "Q1.1.7", "Q1.1.8", "Q1.1.9"], url: "https://www.sema.mt.gov.br/site/index.php/planos-estaduais2" },
  { id: "projeto-eva", criterios: ["Q1.1.6", "Q1.1.7", "Q1.1.8", "Q1.1.9"], url: "https://www.sema.mt.gov.br/site/index.php/projeto-eva-encontro,-vozes,-ativa,-empoderamento,-valoriza%C3%A7%C3%A3o-e-acolhimento" },
  { id: "faq", criterios: ["Q1.1.10"], url: "https://www.sema.mt.gov.br/site/index.php/unidades-administrativas/educacao-ambiental/category/1077-perguntas-frequentes" },
] as const;

const execucaoId = executionId("q11-conteudo");
const execucaoDir = path.join(projectRoot, "private", "execucoes", execucaoId);
const screenshotsDir = path.join(execucaoDir, "screenshots");
await ensureDir(screenshotsDir);

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
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
      const response = await page.goto(target.url, { waitUntil: "domcontentloaded" });
      status = response?.status() ?? null;
      await page.waitForTimeout(1_000);
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
  grupo_id: "Q1.1",
  metodo: "Navegacao controlada iniciada na homepage, seguida de leitura do texto visivel e captura integral.",
  operador_id: operatorId,
  gerado_em_utc: utcNow(),
  resultado_final: null,
  registros,
});

console.log(JSON.stringify({ execucao_id: execucaoId, paginas: registros.length, diretorio: execucaoDir }, null, 2));
