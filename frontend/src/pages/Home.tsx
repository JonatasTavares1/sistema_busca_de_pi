import { useEffect, useMemo, useState } from "react";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import CardsGrid from "../components/CardsGrid";
import Header from "../components/Header";
import { buscarPIs } from "../services/api";
import { BuscaParams, OrderBy, OrderDir, PICard } from "../types";
import { DEFAULT_LIMIT } from "../config";
import * as XLSX from "xlsx";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<PICard[]>([]);

  // Estado de busca/ordenação/paginação (server-side)
  const [query, setQuery] = useState<BuscaParams>({
    limit: DEFAULT_LIMIT,
    offset: 0,
    order_by: "data_da_venda",
    order_dir: "desc",
  });

  const page = useMemo(
    () => Math.floor((query.offset ?? 0) / (query.limit ?? DEFAULT_LIMIT)) + 1,
    [query.offset, query.limit]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await buscarPIs(query);
        setRows(data);
      } catch (e) {
        console.error(e);
        alert("Falha ao buscar dados. Verifique o backend.");
      } finally {
        setLoading(false);
      }
    })();
  }, [JSON.stringify(query)]); // dispara quando a query muda

  function handleSearch(p: BuscaParams) {
    setQuery((q) => ({
      ...q,
      ...p,
      offset: 0, // nova busca -> volta para página 1
      order_by: q.order_by ?? "data_da_venda",
      order_dir: q.order_dir ?? "desc",
    }));
  }

  function handleSort(field: OrderBy) {
    setQuery((q) => {
      const currentField = q.order_by ?? "data_da_venda";
      const currentDir: OrderDir = q.order_dir ?? "desc";
      const nextDir: OrderDir =
        currentField === field ? (currentDir === "asc" ? "desc" : "asc") : "asc";
      return { ...q, order_by: field, order_dir: nextDir, offset: 0 };
    });
  }

  function nextPage() {
    setQuery((q) => ({
      ...q,
      offset: (q.offset ?? 0) + (q.limit ?? DEFAULT_LIMIT),
    }));
  }
  function prevPage() {
    setQuery((q) => ({
      ...q,
      offset: Math.max(0, (q.offset ?? 0) - (q.limit ?? DEFAULT_LIMIT)),
    }));
  }

  // ---------- EXPORTAÇÃO XLSX (página atual) ----------
  function exportarXLSX() {
    if (!rows.length) {
      alert("Nada para exportar.");
      return;
    }

    const data = rows.map((r) => ({
      ID: r.id,
      PI: r.numero_pi ?? "",
      "PI Matriz": r.pi_matriz ?? "",
      Anunciante: r.nome_anunciante ?? "",
      "CNPJ Anunciante": r.cnpj_anunciante ?? "",
      Executivo: r.executivo ?? "",
      Diretoria: r.diretoria ?? "",
      Campanha: r.nome_campanha ?? "",
      Agência: r.nome_agencia ?? "",
      "Mês da venda": r.mes_da_venda ?? "",
      "Valor bruto": r.valor_bruto ?? "",
      "Valor líquido": r.valor_liquido ?? "",
      "Início veic.": r.data_inicial_veiculacao ?? "",
      "Fim veic.": r.data_final_veiculacao ?? "",
      "Data da venda": r.data_da_venda ?? "",
      Vencimento: r.vencimento ?? "",
      Canal: r.canal ?? "",
      Produto: r.produto ?? "",
      "Data Pulsar": r.data_pulsar ?? "",
      "Data Pagamento": r.data_pagamento ?? "",
      NF: r.nota_fiscal ?? "",
      Observações: r.observacoes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PIs");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `pis_${today}.xlsx`);
  }
  // ----------------------------------------------------

  // callback chamado pelo CardsGrid após PATCH /pi/{id}
  function onRowUpdated(updated: PICard) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const canPrev = (query.offset ?? 0) > 0;
  const canNext = rows.length >= (query.limit ?? DEFAULT_LIMIT);

  return (
    <div className="w-full min-h-screen bg-black text-slate-100">
      {/* Header global (agora maior) */}
      <Header
        title="🔎 Sistema de Busca de PI"
    
      />

      {/* Conteúdo principal */}
      <main className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {/* MAIS espaço antes do filtro: mt-12 em telas pequenas e mt-16 em >=sm */}
        <div className="mt-12 sm:mt-16">
          <Filters onSearch={handleSearch} defaultLimit={DEFAULT_LIMIT} />
        </div>

        {/* Toolbar: ordenação à esquerda, export à direita */}
        <div className="my-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span>Ordenar por:</span>
            <select
              className="rounded-md bg-slate-900 border border-slate-800 px-2 py-1 text-slate-200"
              value={query.order_by ?? "data_da_venda"}
              onChange={(e) => handleSort(e.target.value as OrderBy)}
            >
              <option value="data_da_venda">Data da venda</option>
              <option value="numero_pi">PI</option>
              <option value="valor_bruto">Valor bruto</option>
              <option value="valor_liquido">Valor líquido</option>
              <option value="nome_anunciante">Anunciante</option>
              <option value="executivo">Executivo</option>
              <option value="diretoria">Diretoria</option>
              <option value="canal">Canal</option>
              <option value="produto">Produto</option>
            </select>
            <button
              onClick={() =>
                setQuery((q) => ({
                  ...q,
                  order_dir: q.order_dir === "asc" ? "desc" : "asc",
                  offset: 0,
                }))
              }
              className="rounded-md bg-slate-900 border border-slate-800 px-2 py-1 text-slate-200"
            >
              {query.order_dir === "asc" ? "ASC ▲" : "DESC ▼"}
            </button>
          </div>

          {/* Export agora na página (lado direito) */}
          <button
            onClick={exportarXLSX}
            className="ml-auto rounded-xl px-4 py-2 font-medium text-white bg-red-700 hover:bg-red-600"
          >
            Exportar XLSX (página atual)
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <CardsGrid rows={rows} onRowUpdated={onRowUpdated} />

            <div className="mt-6">
              <Pagination
                page={page}
                canPrev={canPrev}
                canNext={canNext}
                onPrev={prevPage}
                onNext={nextPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
