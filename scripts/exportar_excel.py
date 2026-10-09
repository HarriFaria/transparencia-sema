#!/usr/bin/env python3
"""Preenche uma cópia do XLSX original com revisões humanas aprovadas."""

from __future__ import annotations

import json
import csv
from datetime import date, datetime, time, timezone
from pathlib import Path

import openpyxl


APP = Path(__file__).resolve().parents[1]
SOURCE = next((APP.parent / "arquivos").glob("*.xlsx"))
REVIEWS = APP / "private" / "revisoes"
EXPORTS = APP / "exports"


def latest_reviews() -> dict[str, dict]:
    latest: dict[str, dict] = {}
    if not REVIEWS.exists():
        return latest
    for path in REVIEWS.glob("*/*.json"):
        data = json.loads(path.read_text(encoding="utf-8"))
        current = latest.get(data["criterio_id"])
        if current is None or data["criada_em_utc"] > current["criada_em_utc"]:
            latest[data["criterio_id"]] = data
    return latest


def main() -> None:
    reviews = latest_reviews()
    workbook = openpyxl.load_workbook(SOURCE, data_only=False)
    sheet = workbook.worksheets[0]
    by_id = {sheet.cell(row, 3).value: row for row in range(2, 75)}
    for criterion_id, review in reviews.items():
        if criterion_id not in by_id:
            raise RuntimeError(f"Critério não localizado no modelo: {criterion_id}")
        row = by_id[criterion_id]
        first = review["primeira_verificacao"]
        second = review.get("segunda_verificacao")
        values = {
            9: date.fromisoformat(first["data"]), 10: time.fromisoformat(first["hora"]), 11: first["endereco_ou_justificativa"], 12: first["responsavel"],
            13: date.fromisoformat(second["data"]) if second else None, 14: time.fromisoformat(second["hora"]) if second else None,
            15: second["endereco_ou_justificativa"] if second else None, 16: review["responsavel_validacao"],
            17: "Sim" if review["captura_tela_anexada"] else "Não", 18: review["resultado_final"], 19: review["observacoes_achado"],
        }
        for column, value in values.items():
            sheet.cell(row, column).value = value
    EXPORTS.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = EXPORTS / f"Lista_Verificacao_SEMA_exportada_{timestamp}.xlsx"
    workbook.save(destination)
    csv_destination = EXPORTS / f"Lista_Verificacao_SEMA_{timestamp}.csv"
    with csv_destination.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream, delimiter=";", quoting=csv.QUOTE_MINIMAL)
        for row in sheet.iter_rows(min_row=1, max_row=74, min_col=1, max_col=20, values_only=True):
            writer.writerow(["" if value is None else value for value in row])
    print(f"Exportado: {destination} e {csv_destination} ({len(reviews)} revisão(ões)); linha 75 preservada no XLSX como exemplo e excluída do CSV e das fórmulas 2:74.")


if __name__ == "__main__":
    main()
