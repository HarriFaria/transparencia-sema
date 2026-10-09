import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, open, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const projectRoot = path.resolve(process.cwd());

export async function ensureDir(directory: string) { await mkdir(directory, { recursive: true }); }

export async function sha256File(filePath: string) {
  const buffer = await readFile(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

export function sha256Text(value: string) { return createHash("sha256").update(value).digest("hex"); }

export async function atomicWriteJson(filePath: string, value: unknown) {
  await ensureDir(path.dirname(filePath));
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await rename(temporary, filePath);
}

export async function appendJsonl(filePath: string, value: unknown) {
  await ensureDir(path.dirname(filePath));
  await appendFile(filePath, `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "a" });
}

export async function withFileLock<T>(target: string, action: () => Promise<T>): Promise<T> {
  const lockPath = `${target}.lock`;
  await ensureDir(path.dirname(lockPath));
  const handle = await open(lockPath, "wx").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "EEXIST") throw new Error(`Recurso bloqueado por outra operação: ${lockPath}`);
    throw error;
  });
  try { return await action(); }
  finally { await handle.close(); await rm(lockPath, { force: true }); }
}

export function utcNow() { return new Date().toISOString(); }
export function executionId(prefix = "exec") { return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`; }
