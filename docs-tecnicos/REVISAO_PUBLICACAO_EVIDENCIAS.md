# Revisão de publicação das evidências

Data da revisão: 13/10/2026. Escopo atualizado: 43 capturas localizadas nas sete execuções Q1.1 preservadas.

## Resultado

- 18 capturas aprovadas e publicadas: dez da coleta inicial e oito da coleta substantiva complementar;
- 25 capturas retidas por redundância ou ausência na allowlist;
- nenhum dado pessoal, credencial, token, sessão, sistema interno ou documento reservado identificado nas dez imagens aprovadas;
- nenhum original privado foi alterado;
- as cópias públicas não receberam ocultação, pois não foi identificado conteúdo que exigisse saneamento;
- capturas candidatas a vários critérios foram vinculadas somente ao grupo Q1.1.

| ID | Arquivo público | Captura (UTC) | Origem pública | Vínculo | Decisão e justificativa |
|---|---|---|---|---|---|
| EV-Q11-001 | `ev-q11-001.png` | 2026-10-09 15:53:16 | Página inicial SEMA-MT | execução | Aprovado; registro inicial sem associação material a critério. |
| EV-Q11-002 | `ev-q11-002.png` | 2026-10-09 15:53:20 | Perguntas frequentes | Q1.1.10 | Aprovado; página pública e associação individual registrada no evento. |
| EV-Q11-003 | `ev-q11-003.png` | 2026-10-09 15:53:23 | Página inicial SEMA-MT | grupo Q1.1 | Aprovado; retorno de navegação, sem atribuição individual. |
| EV-Q11-004 | `ev-q11-004.png` | 2026-10-09 15:53:26 | Comitê do Programa REM | grupo Q1.1 | Aprovado; candidata a múltiplos critérios, mantida no grupo. |
| EV-Q11-005 | `ev-q11-005.png` | 2026-10-09 15:53:29 | Planos estaduais | grupo Q1.1 | Aprovado; candidata a múltiplos critérios, mantida no grupo. |
| EV-Q11-006 | `ev-q11-006.png` | 2026-10-09 15:53:32 | Projeto EVA | grupo Q1.1 | Aprovado; candidata a múltiplos critérios, mantida no grupo. |
| EV-Q11-007 | `ev-q11-007.png` | 2026-10-09 15:53:35 | Quem somos | Q1.1.1 | Aprovado; página pública e associação individual registrada no evento. |
| EV-Q11-008 | `ev-q11-008.png` | 2026-10-09 15:53:38 | Unidades administrativas | Q1.1.2 | Aprovado; página pública e associação individual registrada no evento. |
| EV-Q11-009 | `ev-q11-009.png` | 2026-10-09 15:53:41 | Atendimento ao cidadão | grupo Q1.1 | Aprovado; preservada sem conclusão sobre ausência de conteúdo. |
| EV-Q11-010 | `ev-q11-010.png` | 2026-10-09 15:53:44 | Página inicial SEMA-MT | grupo Q1.1 | Aprovado; retorno final sem atribuição individual. |

| EV-Q11-011 | `ev-q11-011.png` | 2026-10-13 14:08:28 | Organograma | Q1.1.2 | Aprovado; organograma e datas visíveis. |
| EV-Q11-012 | `ev-q11-012.png` | 2026-10-13 14:08:30 | Estrutura | Q1.1.2 | Aprovado; decretos de estrutura publicados em 2026. |
| EV-Q11-013 | `ev-q11-013.png` | 2026-10-13 14:08:32 | Contatos Sema | Q1.1.3–Q1.1.5 | Aprovado; contatos funcionais, endereços e horários públicos. |
| EV-Q11-014 | `ev-q11-014.png` | 2026-10-13 14:08:37 | Ouvidoria | Q1.1.3–Q1.1.5 | Aprovado; dados funcionais publicados pela SEMA. |
| EV-Q11-015 | `ev-q11-015.png` | 2026-10-13 14:08:39 | Programas e projetos estratégicos | Q1.1.6 e Q1.1.8 | Aprovado; não associado a ações ou obras. |
| EV-Q11-016 | `ev-q11-016.png` | 2026-10-13 14:08:41 | Programas e projetos internacionais | grupo Q1.1 | Aprovado no nível do grupo; página descreve a unidade, não um programa individual. |
| EV-Q11-017 | `ev-q11-017.png` | 2026-10-13 14:08:43 | Ações e projetos de educação ambiental | Q1.1.7 e Q1.1.8 | Aprovado; data de 2019 preservada, sem inferência de atualidade. |
| EV-Q11-018 | `ev-q11-018.png` | 2026-10-13 14:08:49 | Projeto EVA | Q1.1.6–Q1.1.8 | Aprovado; finalidade, ações previstas e documentos de 2026; sem vínculo com obras. |

As URLs completas, hashes SHA-256, tamanhos e metadados técnicos públicos constam em `data/evidencias-publicas.json`. Caminhos privados não constam neste relatório nem no manifesto público.

## Controles aplicados

1. inspeção visual individual das dez capturas iniciais e das oito novas candidatas aprovadas;
2. allowlist privada explícita em `private/aprovacao-evidencias.json`;
3. conferência do evento JSONL e do SHA-256 original;
4. cópia para `public/evidencias/Q1.1/<execução>/` e geração de miniatura separada;
5. verificação automatizada do hash de cada cópia e miniatura;
6. teste HTTP de imagem: status 200, `content-type: image/png` e 2.077.360 bytes na amostra EV-Q11-001;
7. inspeção do bundle para impedir PDF, DOCX, XLSX, JSONL, ZIP, log, trace e caminho absoluto.

As imagens comprovam a navegação técnica. Não comprovam atendimento, parcialidade ou não atendimento à norma.
