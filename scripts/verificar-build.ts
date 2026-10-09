import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "@/lib/persistencia";

const evidenceRoot = path.join(projectRoot, "public", "evidencias-autorizadas");
const manifestPath = path.join(evidenceRoot, "manifest.json");
const files = await readdir(evidenceRoot).catch(() => []);
const destination = process.env.PAINEL_DESTINO;

if (!files.length) {
  if (destination === "local" || destination === "publicacao") throw new Error(`Build ${destination} exige as cópias de evidências e o manifesto correspondente.`);
  console.log("Build sem cópias de evidências no diretório público.");
  process.exit(0);
}

await access(manifestPath).catch(() => {
  throw new Error("Cópias de evidências sem manifest.json de autorização.");
});
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const actualFiles = files.filter((file) => file !== "manifest.json").sort();
const declaredFiles = Array.isArray(manifest.arquivos) ? [...manifest.arquivos].sort() : [];
if (JSON.stringify(actualFiles) !== JSON.stringify(declaredFiles)) throw new Error("Arquivos públicos não correspondem à seleção autorizada.");
for (const file of actualFiles) {
  const actualHash = createHash("sha256").update(await readFile(path.join(evidenceRoot, file))).digest("hex");
  if (manifest.hashes_sha256?.[file] !== actualHash) throw new Error(`Integridade inválida na evidência autorizada: ${file}`);
}

if (destination === "local" && manifest.destino === "local") {
  console.log(`Build local autorizado com ${manifest.arquivos?.length ?? 0} evidência(s) selecionada(s).`);
  process.exit(0);
}

if (destination === "publicacao" && manifest.destino === "publicacao" && typeof manifest.aprovacao_externa === "string" && manifest.aprovacao_externa.trim().length >= 8) {
  console.log("Build para publicação autorizado pelo manifesto expresso.");
  process.exit(0);
}

throw new Error("Build bloqueado: use PAINEL_DESTINO=local para a seleção local ou forneça uma nova seleção com aprovação externa expressa.");
