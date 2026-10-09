import criteriosData from "@/data/criterios.json";
import gruposData from "@/data/grupos.json";
import roteiroData from "@/data/roteiro.json";
import referenciasData from "@/data/referencias-documentais.json";
import resultadosData from "@/data/resultados-publicados.json";
import coletasData from "@/data/resultados-coletas.json";
import type { Criterio, Grupo, PainelColetas } from "@/lib/types";

export const criterios = criteriosData.criterios as Criterio[];
export const grupos = gruposData.grupos as Grupo[];
export const roteiro = roteiroData;
export const referencias = referenciasData;
export const resultados = resultadosData;
export const coletas = coletasData as PainelColetas;

export const formatAutomation = (level: string) =>
  ({
    humana: "Humana",
    parcialmente_automatizavel: "Apoio automatizável",
    automatizavel_com_validacao_humana: "Automatizável com validação",
  })[level] ?? level;
