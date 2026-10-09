#!/usr/bin/env python3
"""Gera o catálogo público sanitizado e a rastreabilidade a partir dos originais."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import openpyxl


APP = Path(__file__).resolve().parents[1]
SOURCE = APP.parent / "arquivos"
DATA = APP / "data"
DOCS = APP / "docs-tecnicos"
PRIVATE = APP / "private" / "analise-documental"
INVENTORY = json.loads((DOCS / "inventario-documental.json").read_text(encoding="utf-8"))
INVENTORY_BY_NAME = {item["nome"]: item for item in INVENTORY["arquivos"]}
NOW = datetime.now(timezone.utc).isoformat()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def atomic_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(value, encoding="utf-8", newline="\n")
    tmp.replace(path)


def find_name(fragment: str) -> str:
    matches = [name for name in INVENTORY_BY_NAME if fragment.casefold() in name.casefold()]
    if len(matches) != 1:
        raise RuntimeError(f"Fragmento de arquivo ambíguo/ausente: {fragment!r}: {matches}")
    return matches[0]


XLSX = find_name("Lista_de_Verificacao")
DOCX = find_name("Roteiro_de_Execucao")


GROUP_TITLES = {
    "Q1.1": "Informações institucionais e perguntas frequentes",
    "Q1.2": "Convênios, repasses e acordos",
    "Q1.3": "Licitações, editais, resultados e contratos",
    "Q1.4": "Busca, formatos, acesso automatizado e acessibilidade",
    "Q1.5": "Plano de Dados Abertos e conjuntos de dados",
    "Q1.6": "Carta de Serviços ao Usuário",
    "Q2.1": "Processos e documentos administrativos ambientais",
    "Q2.2": "Relatórios anuais de qualidade do ar e da água",
    "Q2.3": "Cadastro Ambiental Rural — SIMCAR",
    "Q2.4": "Unidades de conservação e compensação ambiental",
    "Q2.5": "Fundo Estadual do Meio Ambiente — FEMAM",
    "Q2.6": "Recursos hídricos",
    "Q2.7": "Sistemas de informações ambientais e SINIMA",
    "Q3.1": "Autoridade responsável pela LAI",
    "Q3.2": "Encarregado de Proteção de Dados",
    "Q3.3": "Governança da transparência",
    "Q3.4": "Causas das falhas verificadas",
}


ITEM_GROUP = {index: group for index, group in enumerate(GROUP_TITLES, start=1)}


def ref(fragment: str, pages: list[int], relation: str, articles: list[str] | None = None, status: str = "confirmada") -> dict[str, Any]:
    name = find_name(fragment)
    return {
        "documento_id": INVENTORY_BY_NAME[name]["sha256"][:16],
        "arquivo": name,
        "paginas_pdf": pages,
        "artigos": articles or [],
        "relacao": relation,
        "status": status,
    }


GROUP_REFERENCES: dict[str, list[dict[str, Any]]] = {
    "Q1.1": [ref("L12527", [3], "Fundamento da transparência ativa para competências, estrutura, contatos, programas e FAQ.", ["art. 8º, § 1º, I, V e VI"]), ref("Decreto 806", [3, 4, 5], "Regulamentação estadual de transparência ativa.", ["arts. 5º a 10"])],
    "Q1.2": [ref("L12527", [3], "Fundamento para repasses e transferências.", ["art. 8º, § 1º, II"]), ref("78107-2022", [1, 3, 13, 14], "Antecedente de 2021/2023 sobre convênios; não comprova a situação de 2026."), ref("OFÍCIO_52", [2], "Antecedente de solicitação sobre fundos, parcerias e acordos; não comprova a situação de 2026.")],
    "Q1.3": [ref("L12527", [3], "Fundamento para licitações, editais, resultados e contratos.", ["art. 8º, § 1º, IV"])],
    "Q1.4": [ref("L12527", [3], "Requisitos técnicos mínimos dos sítios oficiais.", ["art. 8º, § 3º, I a VIII"]), ref("Decreto 806", [4, 5], "Requisitos estaduais do Portal Transparência.", ["arts. 7º a 10"])],
    "Q1.5": [ref("Decreto 1691", [2, 3], "Define PDA e exige sua publicação e a publicação de dados na plataforma estadual.", ["arts. 4º, 5º e 7º"])],
    "Q1.6": [],
    "Q2.1": [ref("L10650", [1, 2], "Acesso público a documentos/processos ambientais e publicação de listagens.", ["arts. 2º e 4º"]), ref("OFÍCIO_51", [2, 3], "Antecedente sobre multas, infrações e desmatamento; não comprova publicidade atual.")],
    "Q2.2": [ref("L10650", [2], "Exige relatórios anuais de qualidade do ar e da água.", ["art. 8º"])],
    "Q2.3": [ref("OFÍCIO_50", [1, 2, 3], "Antecedente de solicitação sobre SIMCAR; não comprova acesso público atual.")],
    "Q2.4": [ref("OFÍCIO_53", [1, 2, 3], "Antecedente sobre unidades, planos de manejo e compensação; não comprova publicidade atual.")],
    "Q2.5": [ref("OFÍCIO_52", [1, 2, 3], "Antecedente sobre fundos e recursos; não comprova publicidade atual.")],
    "Q2.6": [],
    "Q2.7": [],
    "Q3.1": [ref("L12527", [11], "Prevê designação e atribuições da autoridade de monitoramento.", ["art. 40"]), ref("Regimento Interno", [3, 14, 15], "Estrutura e competências da Unidade Estratégica de Transparência e Geoinformação.", ["art. 19"]), ref("PTA_PTA 2026", [68, 69], "Relatório PTA identifica responsável por ação e entregas do Portal da Transparência; não há elemento literalmente rotulado 'Quadro 1'.")],
    "Q3.2": [ref("Decreto 1427", [2, 4, 5, 6], "Regulamentação estadual do encarregado/DPO; a LGPD citada na matriz não integra a pasta.", ["arts. 7º, 10, 12 e 14"])],
    "Q3.3": [ref("Regimento Interno", [3, 14, 15], "Estrutura e competências formais de transparência e LAI.", ["art. 19"])],
    "Q3.4": [],
}


MISSING_BY_GROUP = {
    "Q1.6": ["Lei Federal nº 13.460/2017"],
    "Q2.3": ["Lei Federal nº 12.651/2012"],
    "Q2.4": ["Lei Federal nº 9.985/2000"],
    "Q2.5": ["Lei Complementar Estadual nº 38/1995"],
    "Q2.6": ["Lei Federal nº 9.433/1997"],
    "Q2.7": ["Lei Complementar Federal nº 140/2011"],
    "Q3.2": ["Lei Federal nº 13.709/2018"],
    "Q3.4": ["Resultados consolidados das Questões 1 e 2 — ainda inexistentes"],
}


DOCUMENT_CARDS = [
    ("OFÍCIO_53", "Ofício nº 53/2023/CPMAS", "2023-12-04", "ofício", "Solicita informações sobre unidades de conservação, planos de manejo, conselhos e compensação ambiental.", [1, 2, 3], ["Q2.4"]),
    ("OFÍCIO_52", "Ofício nº 52/2023/CPMAS", "2023-12-04", "ofício", "Solicita informações sobre fundos ambientais, recursos internacionais, destinação, parcerias e acordos.", [1, 2, 3], ["Q1.2", "Q2.5"]),
    ("OFÍCIO_51", "Ofício nº 51/2023/CPMAS", "2023-12-04", "ofício", "Solicita informações sobre desmatamento, multas, infrações e ações de fiscalização.", [1, 2, 3], ["Q2.1"]),
    ("OFÍCIO_50", "Ofício nº 50/2023/CPMAS", "2023-12-04", "ofício", "Solicita base e informações de funcionamento e produtividade do SIMCAR.", [1, 2, 3], ["Q2.3"]),
    ("78107-2022", "Voto-vista — Processo nº 7.810-7/2022", "2023-06-21", "voto-vista", "O conteúdo confirma que o nome 78107-2022 corresponde ao Processo nº 7.810-7/2022; registra antecedente sobre convênios no Portal Transparência.", [1, 3, 13, 14, 15], ["Q1.2"]),
    ("Decreto 1427", "Decreto Estadual nº 1.427/2025", "2025-04-30", "decreto", "Regulamenta a proteção de dados pessoais no Executivo estadual e disciplina o encarregado/DPO.", [1, 2, 4, 5, 6], ["Q3.2"]),
    ("Decreto 1691", "Decreto Estadual nº 1.691/2025", "2025-10-01", "decreto", "Institui a Política de Dados Abertos estadual e disciplina o PDA e a plataforma de dados.", [1, 2, 3, 4], ["Q1.5"]),
    ("Decreto 1973", "Decreto Estadual nº 397/2020 (arquivo nomeado 'Decreto 1973-2013')", "2020-03-11", "decreto", "O conteúdo não é o Decreto nº 1.973/2013: é o Decreto nº 397/2020, que o altera. O Decreto nº 1.973/2013 foi revogado pelo Decreto nº 806/2021.", [1, 2], ["Q1.1", "Q1.2", "Q1.3", "Q1.4"]),
    ("Decreto 806", "Decreto Estadual nº 806/2021", "2021-01-22", "decreto", "Regulamenta a LAI no Executivo estadual; o PDF informa consolidação até o Decreto nº 1.051/2021.", [1, 3, 4, 5, 19], ["Q1.1", "Q1.2", "Q1.3", "Q1.4"]),
    ("Regimento Interno", "Decreto Estadual nº 1.599/2025 — Regimento Interno da SEMA", "2025-08-06", "decreto/regimento", "Aprova o Regimento Interno; o art. 19 atribui competências à Unidade Estratégica de Transparência e Geoinformação.", [1, 3, 14, 15], ["Q3.1", "Q3.3"]),
    ("L10650", "Lei Federal nº 10.650/2003", "2003-04-16", "lei", "Dispõe sobre acesso público a dados e informações ambientais no Sisnama.", [1, 2], ["Q2.1", "Q2.2"]),
    ("L12527", "Lei Federal nº 12.527/2011 — LAI", "2011-11-18", "lei", "Regula o acesso a informações; contém os arts. 8º e 40 usados na matriz.", [1, 3, 11], ["Q1.1", "Q1.2", "Q1.3", "Q1.4", "Q3.1"]),
    ("Pedido de informa", "Acesso à informação SEMA-MT — fluxo e prazos", None, "material informativo", "Apresenta transparência ativa/passiva, canais, prazos e fluxo recursal; cita o Decreto nº 1.973/2013, posteriormente revogado pelo Decreto nº 806/2021.", [1, 2, 3, 4, 5], []),
    ("PTA_PTA 2026", "PLAN 20 — Relatório do PTA, exercício 2026, UO 27.101", "2026", "relatório de planejamento", "Contém ação de fortalecimento da transparência e responsável nas páginas PDF 68–69. Não contém a expressão ou um quadro rotulado 'Quadro 1'.", [1, 68, 69, 87], ["Q3.1"]),
    ("Lista_de_Verificacao", "Lista de Verificação Eletrônica SEMA-MT", None, "planilha metodológica", "Fonte primária dos 73 critérios; linhas 2–74. A linha 75 é exemplo e está fora das fórmulas do Resumo.", [], list(GROUP_TITLES)),
    ("Roteiro_de_Execucao", "Roteiro de execução — passo a passo", None, "roteiro metodológico", "Fonte primária dos 17 itens e 66 passos; exige início pela página inicial, URL exata e captura datada em sucesso e ausência.", [], list(GROUP_TITLES)),
]


def automation_level(text: str) -> str:
    lowered = text.casefold()
    if "não tem como automatizar" in lowered or "ti não ajuda" in lowered:
        return "humana"
    if "continua sendo da equipe" in lowered:
        return "parcialmente_automatizavel"
    return "automatizavel_com_validacao_humana"


def load_steps() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    extracted = json.loads((PRIVATE / "roteiro-docx-extraido.json").read_text(encoding="utf-8"))
    current_item = 0
    steps: list[dict[str, Any]] = []
    item_meta: dict[int, dict[str, Any]] = {}
    for paragraph in extracted["paragrafos"]:
        item_match = re.match(r"Item\s+(\d+)\s+—\s+(.+)", paragraph["texto"])
        if item_match:
            current_item = int(item_match.group(1))
            item_meta[current_item] = {"titulo_literal": item_match.group(2), "paragrafo_titulo": paragraph["indice"], "onde_olhar": None}
            continue
        if current_item and paragraph["texto"].startswith("Onde olhar:"):
            item_meta[current_item]["onde_olhar"] = paragraph["texto"].split(":", 1)[1].strip()
        if paragraph["estilo"] == "List Number":
            if not current_item:
                raise RuntimeError("Passo numerado anterior ao primeiro item")
            number = len(steps) + 1
            group = ITEM_GROUP[current_item]
            steps.append({
                "id": f"P{number:02d}",
                "numero": number,
                "item": current_item,
                "grupo_id": group,
                "texto_literal": paragraph["texto"],
                "origem_docx": {"arquivo": DOCX, "paragrafo": paragraph["indice"], "estilo": paragraph["estilo"]},
            })
    if len(steps) != 66:
        raise RuntimeError(f"Esperados 66 passos; encontrados {len(steps)}")
    items = []
    for number in range(1, 18):
        group = ITEM_GROUP[number]
        meta = item_meta[number]
        items.append({
            "numero": number,
            "grupo_id": group,
            "questao": int(group[1]),
            "titulo": meta["titulo_literal"],
            "onde_olhar": meta["onde_olhar"],
            "origem_docx": {"arquivo": DOCX, "paragrafo_titulo": meta["paragrafo_titulo"]},
            "passos": [step["id"] for step in steps if step["item"] == number],
            "restricao": "Executar somente depois dos itens 1 a 16; não é busca em site." if number == 17 else ("Entrevista somente após alinhamento com a supervisão." if number in (14, 16) else None),
        })
    return steps, items


def main() -> None:
    workbook = openpyxl.load_workbook(SOURCE / XLSX, data_only=False)
    worksheet = workbook.worksheets[0]
    steps, items = load_steps()
    step_ids_by_group: dict[str, list[str]] = defaultdict(list)
    for step in steps:
        step_ids_by_group[step["grupo_id"]].append(step["id"])

    criteria = []
    for row in range(2, 75):
        values = [worksheet.cell(row, column).value for column in range(1, 21)]
        number, question, criterion_id, wording, norm, source, enforceability, period = values[:8]
        guidance = values[19]
        if not criterion_id:
            raise RuntimeError(f"ID vazio na linha {row}")
        group = ".".join(str(criterion_id).split(".")[:2])
        refs = GROUP_REFERENCES[group]
        missing = MISSING_BY_GROUP.get(group, [])
        criteria.append({
            "ordem": number,
            "questao": int(str(question).split()[-1]),
            "id": criterion_id,
            "grupo_id": group,
            "redacao_literal": wording,
            "norma_dispositivo_literal": norm,
            "fonte_informacao_literal": source,
            "url_confirmada": None,
            "exigibilidade": enforceability,
            "periodo_previsto": period,
            "orientacao_ti_literal": guidance,
            "origem_xlsx": {"arquivo": XLSX, "sha256": INVENTORY_BY_NAME[XLSX]["sha256"], "aba": worksheet.title, "linha": row, "colunas_referencia": "A:H,T"},
            "passos_roteiro": step_ids_by_group[group],
            "referencias_documentais": refs,
            "referencias_ausentes_ou_a_confirmar": [{"status": "a_verificar", "documento": item, "motivo": "Citado na matriz, mas não localizado entre os 16 originais."} for item in missing],
            "automacao": {"nivel": automation_level(str(guidance)), "limites": "Automação apenas apoia localização e coleta; atendimento e interpretação dependem de revisão humana."},
            "evidencia_exigida": ["URL exata ou justificativa de não localização", "data e hora reais", "sequência de navegação desde a página inicial", "captura bruta datada em localização e não localização"],
            "verificacao_humana_obrigatoria": True,
            "pendencias_documentais": missing,
            "status_operacional": "nao_iniciado",
            "resultado_final": None,
        })

    ids = [item["id"] for item in criteria]
    if len(criteria) != 73 or len(set(ids)) != 73:
        raise RuntimeError("A planilha não resultou em 73 IDs únicos")
    question_counts = Counter(item["questao"] for item in criteria)
    if question_counts != Counter({1: 35, 2: 24, 3: 14}):
        raise RuntimeError(f"Contagens por questão divergentes: {question_counts}")
    groups = []
    for index, (group_id, title) in enumerate(GROUP_TITLES.items(), start=1):
        group_criteria = [item for item in criteria if item["grupo_id"] == group_id]
        groups.append({"id": group_id, "item_roteiro": index, "questao": int(group_id[1]), "titulo": title, "quantidade_criterios": len(group_criteria), "criterios": [item["id"] for item in group_criteria], "passos": step_ids_by_group[group_id]})

    references = []
    for fragment, title, date, doc_type, summary, pages, linked_groups in DOCUMENT_CARDS:
        name = find_name(fragment)
        inventory = INVENTORY_BY_NAME[name]
        references.append({
            "id": inventory["sha256"][:16], "arquivo": name, "titulo": title, "data_documento": date, "tipo": doc_type,
            "sha256": inventory["sha256"], "tamanho_bytes": inventory["tamanho_bytes"], "status_leitura": inventory["status_leitura"],
            "paginas_ou_estrutura_pertinente": pages, "resumo_documental": summary, "grupos_vinculados": linked_groups,
            "limitacoes": "O conteúdo documental não comprova a situação atual do portal em 2026." if doc_type in {"ofício", "voto-vista"} else None,
        })
    reference_payload = {
        "schema_version": 1, "gerado_em_utc": NOW, "documentos_localizados": references,
        "documentos_mencionados_na_metodologia_mas_ausentes": sorted({doc for docs in MISSING_BY_GROUP.values() for doc in docs if "Resultados consolidados" not in doc} | {"Relatório de Visão Geral do Objeto", "Matriz de Planejamento"}),
        "verificacoes_criticas": {
            "pta_quadro_1": "O PDF PTA 2026 foi localizado e processado em 87 páginas. Não contém a expressão nem elemento rotulado 'Quadro 1'; as páginas PDF 68–69 contêm a ação de transparência e o responsável citados no roteiro.",
            "processo_78107": "Confirmado na página 1: o arquivo 78107-2022 é o voto-vista do Processo nº 7.810-7/2022.",
            "decreto_1973": "O arquivo assim nomeado contém, na realidade, o Decreto nº 397/2020, que altera o Decreto nº 1.973/2013. O Decreto nº 806/2021 registra a revogação do nº 1.973/2013 em sua página 19.",
        },
    }
    atomic_json(DATA / "criterios.json", {"schema_version": 1, "gerado_em_utc": NOW, "fonte": {"arquivo": XLSX, "sha256": INVENTORY_BY_NAME[XLSX]["sha256"], "linhas_importadas": "2:74", "linha_exemplo_excluida": 75}, "totais": {"criterios": 73, "questao_1": 35, "questao_2": 24, "questao_3": 14}, "criterios": criteria})
    atomic_json(DATA / "grupos.json", {"schema_version": 1, "total": 17, "grupos": groups})
    atomic_json(DATA / "roteiro.json", {"schema_version": 1, "fonte": {"arquivo": DOCX, "sha256": INVENTORY_BY_NAME[DOCX]["sha256"]}, "regras_metodologicas": ["Iniciar cada portal ou sistema pela página inicial.", "Registrar a sequência de navegação e a URL exata.", "Coletar captura datada quando localizar e quando não localizar.", "Repetir a não localização em outra data, separada por alguns dias, sem prazo mínimo numérico inventado.", "O item 17 ocorre somente após os itens 1 a 16.", "Entrevistas dos itens 14 e 16 dependem de alinhamento com a supervisão."], "total_itens": 17, "total_passos": 66, "itens": items, "passos": steps})
    atomic_json(DATA / "referencias-documentais.json", reference_payload)
    atomic_json(DATA / "resultados-publicados.json", [])

    matrix_lines = ["# Matriz de rastreabilidade", "", "> Matriz documental. `resultado_final` permanece vazio até revisão humana independente.", "", "| # | ID | Questão / grupo | Critério literal | Origem | Passos | Referências confirmadas | Pendências | Automação |", "|---:|---|---|---|---|---|---|---|---|"]
    for item in criteria:
        confirmed = "; ".join(f"{r['arquivo']} p. {','.join(map(str, r['paginas_pdf']))}" for r in item["referencias_documentais"]) or "sem_referencia_documental_adicional"
        pending = "; ".join(item["pendencias_documentais"]) or "—"
        matrix_lines.append(f"| {item['ordem']} | {item['id']} | Q{item['questao']} / {item['grupo_id']} | {item['redacao_literal'].replace('|', '&#124;')} | XLSX {item['origem_xlsx']['aba']}!{item['origem_xlsx']['linha']} | {', '.join(item['passos_roteiro'])} | {confirmed.replace('|', '&#124;')} | {pending.replace('|', '&#124;')} | {item['automacao']['nivel']} |")
    atomic_text(DOCS / "MATRIZ_DE_RASTREABILIDADE.md", "\n".join(matrix_lines) + "\n")

    analysis = f"""# Análise documental integrada

## Escopo efetivamente processado

Foram inventariados **16 arquivos**: 14 PDFs (**251 páginas processadas**), uma planilha XLSX e um roteiro DOCX. Os 251 extratos de páginas PDF foram gravados individualmente em `private/analise-documental/`. OCR local foi executado nas páginas PDF com menos de 150 caracteres extraídos: página 2 do arquivo nomeado `Decreto 1973-2013.pdf` e páginas 1 e 3 de `Pedido de informação - fluxo e prazos.pdf`.

A planilha foi lida célula a célula, inclusive fórmulas, valores em cache e estilos. A aba principal contém 73 critérios válidos nas linhas 2–74 e um exemplo na linha 75, excluído. As fórmulas da aba Resumo usam exatamente `$2:$74` e calculam atendimento como `Atendidos / total`; itens parciais não entram no numerador. As 26 linhas da aba Instruções foram preservadas no extrato privado.

O roteiro contém 115 parágrafos, 3 tabelas de separação por questão, nenhum arquivo de mídia incorporado e **66 parágrafos numerados**, organizados em 17 itens. As propriedades internas declaram uma página e zero palavras; esse metadado é incompatível com a estrutura extraída e não foi tratado como paginação confiável.

## Confirmações e divergências críticas

- **PTA/Quadro 1:** o PDF `Unidade_NGER_PTA_PTA 2026 COMPLETO.pdf` tem 87 páginas e contém, nas páginas PDF 68–69, a ação de fortalecimento da transparência, o produto “Portal da Transparência mantido” e o responsável citado no roteiro. Não foi localizado um elemento ou texto literalmente rotulado “Quadro 1”; portanto, não se afirma que o arquivo contenha o Quadro 1 mencionado.
- **Processo:** a página 1 do voto-vista confirma expressamente `PROCESSO Nº 7.810-7/2022`; a associação com o nome de arquivo `78107-2022` foi confirmada pelo conteúdo, não pela semelhança gráfica.
- **Arquivo “Decreto 1973-2013”:** seu conteúdo é o Decreto nº 397, de 11/03/2020, que altera o Decreto nº 1.973/2013. O Decreto nº 806/2021 registra, na página 19, a revogação do Decreto nº 1.973/2013. O nome do arquivo não descreve corretamente o ato principal nele contido.
- **Regimento:** o Decreto nº 1.599/2025 apresenta a Unidade Estratégica de Transparência e Geoinformação na estrutura (p. 3) e o art. 19 nas páginas 14–15, incluindo supervisão do Portal e coordenação dos procedimentos de implementação da LAI.
- **Documentos metodológicos ausentes:** não foram localizados entre os 16 originais o `Relatório de Visão Geral do Objeto` nem a `Matriz de Planejamento`, embora sejam mencionados na planilha e no roteiro.

## Achados documentais — não são achados de fiscalização de 2026

- Os Ofícios 50–53/2023 são pedidos de informação e antecedentes. Eles não demonstram, por si, publicação ou ausência atual no portal.
- O voto-vista de 21/06/2023 registra discussão sobre informações de convênios e recomendações de transparência relacionadas ao exercício de 2021. Isso é antecedente, não conclusão atual.
- O Decreto nº 1.691/2025 exige PDA por órgão e publicação dos dados abertos na plataforma estadual e do PDA no sítio institucional (p. 3).
- A Lei nº 10.650/2003 trata do acesso a documentos/processos ambientais e exige relatórios anuais de qualidade do ar e da água (p. 2).
- O material “Pedido de informação — fluxo e prazos” cita o Decreto nº 1.973/2013, mas o acervo também contém o Decreto nº 806/2021, que registra sua revogação; o material deve ser tratado como potencialmente desatualizado até validação institucional.

## Pendências documentais reais

As seguintes normas citadas na matriz não foram fornecidas como originais: Lei nº 13.460/2017, Lei nº 12.651/2012, Lei nº 9.985/2000, LC Estadual nº 38/1995, Lei nº 9.433/1997, LC nº 140/2011 e Lei nº 13.709/2018. Há atos correlatos no acervo para alguns grupos, mas eles não substituem automaticamente o texto normativo citado. A matriz registra esses casos como `a_verificar`.

## Separação entre documentação e fiscalização

Nenhuma coleta atual em portal foi executada nesta etapa documental. Não existem resultados aprovados, percentuais de conformidade, data de última coleta ou conclusões de atendimento. `data/resultados-publicados.json` permanece um array vazio.
"""
    atomic_text(DOCS / "ANALISE_DOCUMENTAL_INTEGRADA.md", analysis)
    print(f"Gerados: {len(criteria)} critérios, {len(groups)} grupos, {len(steps)} passos, {len(references)} fichas documentais")


if __name__ == "__main__":
    main()
