export interface PICard {
  id: number;
  pi_matriz?: string | null;
  numero_pi: string;

  nome_anunciante?: string | null;
  razao_social_anunciante?: string | null;
  cnpj_anunciante?: string | null;
  uf_cliente?: string | null;
  executivo?: string | null;
  diretoria?: string | null;

  nome_campanha?: string | null;
  nome_agencia?: string | null;
  razao_social_agencia?: string | null;
  cnpj_agencia?: string | null;
  uf_agencia?: string | null;

  data_inicial_veiculacao?: string | null;
  data_final_veiculacao?: string | null;
  mes_da_venda?: string | null;
  mes_inicial_veiculacao?: string | null;

  canal?: string | null;
  perfil_anunciante?: string | null;
  subperfil_anunciante?: string | null;
  produto?: string | null;

  valor_bruto?: number | string | null;
  valor_liquido?: number | string | null;

  vencimento?: string | null;
  data_da_venda?: string | null;
  data_emissao_recebimento?: string | null;

  // ⇩ novos nomes do seu backend
  data_pulsar?: string | null;
  data_pagamento?: string | null;
  nota_fiscal?: string | null;

  observacoes?: string | null;
}

export type OrderBy =
  | "numero_pi"
  | "data_da_venda"
  | "valor_bruto"
  | "valor_liquido"
  | "nome_anunciante"
  | "executivo"
  | "diretoria"
  | "canal"
  | "produto";

export type OrderDir = "asc" | "desc";

export interface BuscaParams {
  numero?: string;
  cnpj?: string;
  anunciante?: string;
  executivo?: string;
  diretoria?: string;
  canal?: string;
  produto?: string;
  data_ini?: string; // YYYY-MM-DD
  data_fim?: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
  order_by?: OrderBy;
  order_dir?: OrderDir;
}
