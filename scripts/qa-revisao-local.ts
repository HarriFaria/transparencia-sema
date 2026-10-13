import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:4173";
const output = path.resolve(process.env.QA_SCREENSHOT_DIR ?? "private/qa-revisao-local");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });

async function open(route: string) {
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  if (!response || response.status() !== 200) throw new Error(`${route} retornou ${response?.status() ?? "sem resposta"}.`);
}

try {
  await open("/criterios/Q2.1.1/");
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Observação / justificativa").fill("Revisão iniciada; critério ainda sem diagnóstico técnico.");
  await page.getByRole("button", { name: "Salvar revisão" }).click();
  await page.locator(".auditor-review .badge").getByText("Revisado sem conclusão", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".auditor-review .badge").getByText("Revisado sem conclusão", { exact: true }).waitFor();

  await open("/criterios/Q1.1.2/");
  await page.getByLabel("Resultado proposto pelo auditor").selectOption({ label: "Atendido" });
  await page.getByLabel("Observação / justificativa").fill("Estrutura e organograma examinados no diagnóstico indicado.");
  await page.getByLabel(/Examinei o diagnóstico técnico/).check();
  await page.getByLabel(/Declaro que esta revisão/).check();
  await page.getByLabel(/Validado pelo auditor/).check();
  await page.getByRole("button", { name: "Validar critério" }).click();
  await page.locator(".auditor-review .badge").getByText("Validado", { exact: true }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".auditor-review .badge").getByText("Validado", { exact: true }).waitFor();
  if (!(await page.getByLabel(/Validado pelo auditor/).isChecked())) throw new Error("Checkbox não persistiu após recarregar.");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar validações" }).click();
  const download = await downloadPromise;
  const exportPath = path.join(output, "validacoes-exportadas.json");
  await download.saveAs(exportPath);
  await page.locator('input[type="file"]').setInputFiles(exportPath);
  await page.getByText("Importação concluída sem sobrescrita de histórico.", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "criterio-validado-localmente.png"), fullPage: true });

  await open("/criterios/Q1.1.9/");
  await page.getByText("Conclusão bloqueada:", { exact: false }).waitFor();
  if (!(await page.getByRole("button", { name: "Validar critério" }).isDisabled())) throw new Error("Q1.1.9 deveria bloquear conclusão antes da segunda verificação.");
  await page.getByLabel("Observação / justificativa").fill("Busca inicial inconclusiva; segunda verificação pendente.");
  await page.getByRole("button", { name: "Salvar revisão" }).click();
  await page.locator(".auditor-review .badge").getByText("Revisado sem conclusão", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "criterio-segunda-verificacao-bloqueada.png"), fullPage: true });

  await open("/");
  await page.locator(".local-review-summary").getByText("Revisões locais", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(output, "dashboard-revisoes-locais.png"), fullPage: true });
  if (errors.length) throw new Error(`Erros do navegador: ${errors.join(" | ")}`);
  console.log("QA de revisão aprovada: rascunho sem diagnóstico, validação persistente, exportação/importação e bloqueio de segunda verificação.");
} finally {
  await browser.close();
}
