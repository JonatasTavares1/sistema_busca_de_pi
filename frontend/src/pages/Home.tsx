import { useEffect, useMemo, useState } from "react";
import Filters from "../components/Filters";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import CardsGrid from "../components/CardsGrid";
import { buscarPIs } from "../services/api";
import { BuscaParams, OrderBy, OrderDir, PICard } from "../types";
import { DEFAULT_LIMIT } from "../config";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore (instale se quiser CSV): npm i papaparse @types/papaparse
import Papa from "papaparse";

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

  function exportarCSV() {
    if (!rows.length) return alert("Nada para exportar.");
    if (!Papa?.unparse)
      return alert("Papaparse não instalado. Rode: npm i papaparse @types/papaparse");
    const csv = Papa.unparse(rows as any);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pis_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // callback chamado pelo CardsGrid após PATCH /pi/{id}
  function onRowUpdated(updated: PICard) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  const canPrev = (query.offset ?? 0) > 0;
  const canNext = rows.length >= (query.limit ?? DEFAULT_LIMIT); // se veio exatamente 'limit', pode ter próxima

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🔎 Sistema de Busca de PI</h1>
        <p className="text-slate-400">React + TS + Tailwind — integrado ao seu FastAPI</p>
      </header>

      <Filters onSearch={handleSearch} defaultLimit={DEFAULT_LIMIT} />

      <div className="my-4 flex items-center gap-3">
        {/* Ordenação rápida (opcional): clique para alternar ASC/DESC */}
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Ordenar por:</span>
          <select
            className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-slate-200"
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
            className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1 text-slate-200"
          >
            {query.order_dir === "asc" ? "ASC ▲" : "DESC ▼"}
          </button>
        </div>

        <button
          onClick={exportarCSV}
          className="ml-auto rounded-xl px-4 py-2 font-medium text-white bg-slate-700 hover:bg-slate-600"
        >
          Exportar CSV (página atual)
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Cards (sem tabela) com observações em destaque e edição inline */}
          <CardsGrid rows={rows} onRowUpdated={onRowUpdated} />

          <Pagination
            page={page}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={prevPage}
            onNext={nextPage}
          />
        </>
      )}
    </div>
  );
}
