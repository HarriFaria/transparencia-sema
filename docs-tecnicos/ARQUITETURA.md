# Arquitetura

## Princípio

A solução separa fonte documental, catálogo versionável, operação restrita e publicação sanitizada. Não existe banco de dados.

```text
../arquivos/ (originais; somente leitura)
       │
       ├─ scripts Python ──> private/analise-documental/ (transcrições integrais)
       │                 └─> data/ + docs-tecnicos/ (catálogo e rastreabilidade)
       │
data/*.json ──> Next.js estático ──> out/ (sem dados brutos)
       │
Playwright local ──> private/execucoes/<id>/ (eventos, imagens, trace, hashes)
       │
revisão no navegador ──> exportação JSON com hash ──> data/validacoes/ (privado)
                                                     └─> publicação explícita ──> data/resultados-publicados.json

private/execucoes/ ──> exportação controlada ──> data/resultados-coletas.json
                              └─ seleção explícita ─> public/evidencias-autorizadas/ (cópias locais)
```

## Frontend

Next.js App Router, React e TypeScript. `output: "export"` produz páginas estáticas. O frontend importa somente os JSONs em `data/`; não conhece caminhos nem conteúdo de `private/` ou `../arquivos/`.

## Persistência local

- escrita JSON atômica: arquivo temporário exclusivo seguido de `rename`;
- locks com criação exclusiva (`wx`) antes de publicar/revisar;
- eventos JSONL append-only;
- backups de publicações anteriores em `private/backups/publicacoes/`;
- SHA-256 de documentos, configurações, screenshots e registros de revisão;
- identificadores de execução com timestamp UTC e UUID parcial;
- visualização temporal em `America/Cuiaba`.

## Modelo operacional

Status operacional e resultado final são domínios separados. Falha técnica, indisponibilidade, restrição de acesso, CAPTCHA ou timeout nunca são convertidos automaticamente em `Não atendido`. Os três únicos resultados finais são `Atendido`, `Não atendido` e `Atendido parcialmente`.

## Coleta Q1.1

O adaptador SEMA abre a homepage verificada, captura a página inicial, extrai links reais e aplica regras de descoberta por termos com limites de palavra. No modo `coleta`, retorna à homepage antes de cada clique, registra URL anterior/posterior, texto do link, mudança de domínio, timestamps, screenshot bruto, SHA-256 e trace. O limite atual é dez páginas por execução e 750 ms entre ações.

## Privacidade e publicação

Originais, extratos completos, evidências e exportações são ignorados pelo Git. O utilitário de publicação retém somente revisões humanas válidas e remove caminhos locais de evidência, preservando seus hashes. Não há push, deploy ou envio para API externa automatizado.

A integração do painel usa `scripts/exportar-resultados-painel.ts`. O script lê os registros preservados, relaciona eventos somente pelos IDs de critério presentes nos próprios eventos, reverifica hashes e emite um extrato sem caminhos absolutos. Capturas só são copiadas quando listadas em um manifesto. O `prebuild` confere lista e SHA-256 e bloqueia a seleção local em builds destinados à publicação; publicação externa exige novo manifesto e aprovação expressa.

## Limitação de identidade

O fluxo não solicita nem armazena nome, matrícula, e-mail, login, assinatura ou outro identificador pessoal de quem revisa. A confirmação de revisão independente é uma autodeclaração associada apenas ao critério, à execução, ao diagnóstico, à revisão e ao instante. Sem autenticação, o sistema não comprova a identidade nem a distinção entre coletor e revisor e não apresenta o registro como homologação institucional verificada.
