# Publicação GitHub e Vercel

Data da entrega: 13/10/2026.

## Destino auditado

- remoto: `origin`;
- URL: `https://github.com/HarriFaria/transparencia-sema.git`;
- branch: `main`;
- estratégia: push para a integração GitHub→Vercel existente, sem Vercel CLI e sem criação de projeto novo.

## Conteúdo deliberadamente excluído

- `../arquivos/`: 14 PDFs, XLSX e DOCX oficiais;
- `private/`: execuções, JSONL, traces, originais, allowlist e QA local;
- `exports/`: planilhas, CSVs e índices locais;
- `.env*` reais, logs, caches, backups, `.next/`, `out/` e `node_modules/`;
- 25 capturas sem allowlist ou redundantes, além de todos os textos, logs, traces e screenshots brutos;
- `public/evidencias-autorizadas/`, diretório legado de preview local.

## Conteúdo público versionado

- interface Next.js/TypeScript e CSS;
- `data/painel-publico.json` e `public/data/painel-publico.json`;
- `data/evidencias-publicas.json` e `public/data/evidencias-publicas.json`;
- `data/diagnosticos-preliminares.json` e `public/data/diagnosticos-preliminares.json`;
- 18 PNGs aprovados e 18 miniaturas em `public/evidencias/Q1.1/<execução>/`;
- scripts locais de preparação e verificação;
- documentação sanitizada.

## Sequência de publicação

```powershell
npm.cmd ci
npm.cmd run prepare:public-evidence
npm.cmd run prepare:q11-diagnostics
npm.cmd run prepare:public-data
npm.cmd run validate:data
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run verify:public-evidence
npm.cmd run build
npm.cmd run verify:public

git status --short
git diff --check
git remote -v
git branch --show-current
git check-ignore -v public/evidencias/Q1.1/q11-coleta-2026-10-09T15-53-09-274Z-fab24357/ev-q11-001.png
git add --all
git diff --cached --name-status
git commit -m "feat: redesenha painel SEMA com evidências públicas"
git push origin main
```

`git check-ignore` deve sair sem correspondência para a imagem pública. Após o build, `out/evidencias/` deve conter 36 arquivos (18 imagens e 18 miniaturas), e `out/data/` deve conter os três snapshots JSON.

## Verificação HTTP local

```powershell
python -m http.server 4173 --directory out --bind 127.0.0.1
Invoke-WebRequest -Method Head -Uri "http://127.0.0.1:4173/evidencias/Q1.1/q11-coleta-2026-10-09T15-53-09-274Z-fab24357/ev-q11-001.png"
```

Resultado da amostra local: HTTP 200, `content-type: image/png`, 2.077.360 bytes. O teste automatizado verifica os hashes e a existência dos demais arquivos.

## Acompanhamento na Vercel

O push em `main` deve iniciar o deployment do projeto já conectado. A publicação somente pode ser declarada concluída após observar o commit correspondente no dashboard ou receber resposta HTTP do domínio de produção. Se a integração não expuser status ao ambiente local, registrar o push como concluído e a confirmação do deployment como pendente, sem inventar URL ou estado.
