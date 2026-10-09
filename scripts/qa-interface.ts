import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import criteriaData from "../data/criterios.json" with { type: "json" };

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:4173";
const output = path.resolve(process.env.QA_SCREENSHOT_DIR ?? ".tools/qa-resultados");
const uncollected = criteriaData.criterios.find((item) => item.questao === 2);
if (!uncollected) throw new Error("Critério sem coleta não encontrado.");
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await desktop.goto(`${baseUrl}/resultados/`, { waitUntil: "networkidle" });
  await desktop.getByRole("heading", { name: "Acompanhamento das verificações" }).waitFor();
  const evidenceCount = await desktop.locator(".evidence-card").count();
  if (evidenceCount !== 10) throw new Error(`Esperadas 10 evidências visíveis; obtidas ${evidenceCount}.`);
  for (const image of await desktop.locator(".evidence-card img").all()) await image.scrollIntoViewIfNeeded();
  await desktop.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".evidence-card img")].every((image) => image.complete));
  const brokenImages = await desktop.locator(".evidence-card img").evaluateAll((images) => images.filter((image) => !(image as HTMLImageElement).complete || (image as HTMLImageElement).naturalWidth === 0).length);
  if (brokenImages) throw new Error(`${brokenImages} evidência(s) não abriram.`);
  const desktopOverflow = await desktop.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (desktopOverflow) throw new Error("Overflow horizontal na página Resultados em desktop.");
  await desktop.screenshot({ path: path.join(output, "resultados-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(`${baseUrl}/resultados/`, { waitUntil: "networkidle" });
  await mobile.getByRole("heading", { name: "Acompanhamento das verificações" }).waitFor();
  for (const image of await mobile.locator(".evidence-card img").all()) await image.scrollIntoViewIfNeeded();
  await mobile.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>(".evidence-card img")].every((image) => image.complete && image.naturalWidth > 0));
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (mobileOverflow) throw new Error("Overflow horizontal na página Resultados em mobile.");
  await mobile.screenshot({ path: path.join(output, "resultados-mobile.png"), fullPage: true });

  await desktop.goto(`${baseUrl}/criterios/Q1.1.1/`, { waitUntil: "networkidle" });
  await desktop.getByText("Coleta técnica sem verificação", { exact: true }).first().waitFor();
  await desktop.getByText("Não determinada pela coleta técnica", { exact: false }).waitFor();

  await mobile.goto(`${baseUrl}/criterios/${uncollected.id}/`, { waitUntil: "networkidle" });
  await mobile.getByText("Não verificado", { exact: true }).first().waitFor();
  await mobile.screenshot({ path: path.join(output, "criterio-nao-verificado-mobile.png"), fullPage: true });

  console.log(`QA aprovada: desktop e mobile sem overflow, ${evidenceCount} evidências abertas e estados de critérios conferidos.`);
} finally {
  await browser.close();
}
