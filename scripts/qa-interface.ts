import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:4173";
const output = path.resolve(process.env.QA_SCREENSHOT_DIR ?? "private/qa-q11");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const errors: string[] = [];
const failedResponses: string[] = [];
const watch = (page: Page) => {
  page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
};
const assertNoOverflow = async (page: Page, label: string) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (overflow) throw new Error(`Overflow horizontal em ${label}.`);
};
const open = async (page: Page, route: string) => {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  if (!response || response.status() !== 200) throw new Error(`${route} retornou ${response?.status() ?? "sem resposta"}.`);
};

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  watch(desktop);
  await open(desktop, "/");
  await desktop.getByText("34", { exact: true }).first().waitFor();
  await assertNoOverflow(desktop, "homepage desktop");
  await desktop.screenshot({ path: path.join(output, "homepage-desktop.png"), fullPage: true });

  await open(desktop, "/criterios/");
  await desktop.getByLabel("Buscar na matriz").fill("Q1.1.9");
  await desktop.getByText("1 de 73 critérios exibidos").waitFor();
  const filteredStatus = desktop.locator(".matrix-row .badge").first();
  await filteredStatus.waitFor();
  if ((await filteredStatus.innerText()).trim() !== "Análise preliminar") throw new Error(`Situação inesperada para Q1.1.9: ${await filteredStatus.innerText()}`);
  await desktop.screenshot({ path: path.join(output, "matriz-filtro-q119-desktop.png"), fullPage: true });

  await open(desktop, "/resultados/");
  const evidenceCount = await desktop.locator(".evidence-tile").count();
  if (evidenceCount !== 33) throw new Error(`Esperadas 33 evidências; obtidas ${evidenceCount}.`);
  await desktop.getByLabel("Critério comprovado").selectOption("Q1.1.2");
  await desktop.getByText("3 capturas públicas disponíveis").waitFor();
  await desktop.locator(".evidence-preview").first().click();
  await desktop.getByRole("dialog").waitFor();
  await desktop.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>(".lightbox-image img");
    return Boolean(image?.complete && image.naturalWidth > 0);
  });
  await desktop.screenshot({ path: path.join(output, "resultados-lightbox-desktop.png"), fullPage: false });
  await desktop.keyboard.press("Escape");

  await open(desktop, "/criterios/Q1.1.9/");
  await desktop.getByText("Não localizada nesta busca", { exact: true }).waitFor();
  await desktop.getByText("Obrigatória em outra data", { exact: true }).waitFor();
  await desktop.getByText("Não apurado", { exact: true }).first().waitFor();
  await desktop.screenshot({ path: path.join(output, "criterio-q119-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  watch(mobile);
  await open(mobile, "/criterios/");
  await mobile.getByLabel("Situação operacional").selectOption("analise_preliminar");
  await mobile.getByText("34 de 73 critérios exibidos").waitFor();
  await assertNoOverflow(mobile, "matriz mobile");
  await mobile.screenshot({ path: path.join(output, "matriz-analise-mobile.png"), fullPage: true });

  await open(mobile, "/criterios/Q2.1.1/");
  await mobile.getByText("Conteúdo confrontado com o requisito", { exact: true }).waitFor();
  await mobile.getByText("aguardando validação", { exact: true }).waitFor();
  await assertNoOverflow(mobile, "critério Q2 analisado mobile");
  await mobile.screenshot({ path: path.join(output, "criterio-q211-mobile.png"), fullPage: true });

  if (errors.length) throw new Error(`Erros de console: ${errors.join(" | ")}`);
  const relevantFailures = failedResponses.filter((entry) => !entry.endsWith("/favicon.ico"));
  if (relevantFailures.length) throw new Error(`Respostas HTTP com erro: ${relevantFailures.join(" | ")}`);
  console.log(`QA aprovada: 33 evidências, filtros desktop/mobile, análises Q1.1 e Q2 e lightbox funcional.`);
} finally {
  await browser.close();
}
