import axios from "axios";
import { API_URL } from "../config";
import { BuscaParams, PICard } from "../types";

export const api = axios.create({ baseURL: API_URL });

export async function buscarPIs(params: BuscaParams): Promise<PICard[]> {
  const resp = await api.get<PICard[]>("/pis/search", { params });
  return resp.data ?? [];
}

export async function patchPI(
  id: number,
  body: { data_pulsar?: string | null; data_pagamento?: string | null; nota_fiscal?: string | null }
): Promise<PICard> {
  const resp = await api.patch<PICard>(`/pi/${id}`, body);
  return resp.data;
}
