import { useState } from "react";
import { PICard, OrderBy, OrderDir } from "../types";
import { patchPI } from "../services/api";
import * as XLSX from "xlsx";

/* ---------- helpers visuais ---------- */
function Th({
  children,
  active,
  dir,
  onSort,
  field,
}: {
  children: React.ReactNode;
  active?: boolean;
  dir?: OrderDir;
  onSort?: (f: OrderBy) => void;
  field?: OrderBy;
}) {
  const clickable = !!onSort && !!field;
  const ariaSort = active ? (dir === "asc" ? "ascending" : "descending") : "none";
  function handleKey(e: React.KeyboardEvent) {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort!(field!);
    }
  }

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={[
        "px-4 py-3 text-left text-sm font-extrabold tracking-wide",
        "text-red-200",
        clickable ? "cursor-pointer select-none" : "",
        "whitespace-nowrap",
      ].join(" ")}
      onClick={() => (clickable && field ? onSort!(field) : undefined)}
      onKeyDown={handleKey}
      tabIndex={clickable ? 0 : -1}
      title={typeof children === "string" ? children : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && <span className="text-red-400">{dir === "asc" ? "▲" : "▼"}</span>}
      </span>
    </th>
  );
}

function Td({
  children,
  colSpan,
  className = "",
  stickyLeft = false,
}: {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
  stickyLeft?: boolean;
}) {
  return (
    <td
      colSpan={colSpan}
      className={[
        "px-4 py-3 text-sm text-slate-200 align-top",
        "border-t border-slate-800",
        stickyLeft
          ? "sticky left-0 z-20 bg-black/85 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function fmtBRL(v: unknown) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
    : String(v);
}

function Pill({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-red-900/40 border border-red-700/50 px-2 py-0.5 text-xs font-bold text-red-200">
      {children ?? "-"}
    </span>
  );
}

/* ---------- datas ---------- */
function fmtDateBR(v?: string | null): string {
  if (!v) return "-";
  const s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const isoPart = s.split("T")[0].split(" ")[0];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoPart);
  if (m) {
    const [, yyyy, mm, dd] = m;
    return `${dd}/${mm}/${yyyy}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return s;
}

function fmtMesAno(v?: string | null): string {
  if (!v) return "-";
  const s = String(v).trim();
  if (/^\d{2}\/\d{4}$/.test(s)) return s;
  const isoPart = s.split("T")[0].split(" ")[0];
  let m = /^(\d{4})-(\d{2})$/.exec(isoPart);
  if (m) {
    const [, yyyy, mm] = m;
    return `${mm}/${yyyy}`;
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoPart);
  if (m) {
    const [, yyyy, mm] = m;
    return `${mm}/${yyyy}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${yyyy}`;
  }
  return s;
}

/* ---------- componente principal ---------- */
export default function Table({
  rows,
  orderBy,
  orderDir,
  onSort,
  onRowUpdated,
}: {
  rows: PICard[];
  orderBy: OrderBy;
  orderDir: OrderDir;
  onSort: (f: OrderBy) => void;
  onRowUpdated: (updated: PICard) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    data_pulsar?: string | null;
    data_pagamento?: string | null;
    nota_fiscal?: string | null;
  }>({});
  const [saving, setSaving] = useState(false);

  function startEdit(r: PICard) {
    setEditingId(r.id);
    setForm({
      data_pulsar: r.data_pulsar ?? "",
      data_pagamento: r.data_pagamento ?? "",
      nota_fiscal: r.nota_fiscal ?? "",
    });
  }

  async function saveEdit(id: number) {
    try {
      setSaving(true);
      const body = {
        data_pulsar: emptyToNull(form.data_pulsar),
        data_pagamento: emptyToNull(form.data_pagamento),
        nota_fiscal: emptyToNull(form.nota_fiscal),
      };
      const updated = await patchPI(id, body);
      onRowUpdated(updated);
      setEditingId(null);
      setForm({});
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar. Verifique a API e os dados.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({});
  }

  function exportarPI(row: PICard) {
    const data = [
      {
        ID: row.id,
        PI: row.numero_pi ?? "",
        "PI Matriz": row.pi_matriz ?? "",
        Anunciante: row.nome_anunciante ?? "",
        "CNPJ Anunciante": row.cnpj_anunciante ?? "",
        Executivo: row.executivo ?? "",
        Diretoria: row.diretoria ?? "",
        Campanha: row.nome_campanha ?? "",
        Agência: row.nome_agencia ?? "",
        "Mês da venda": row.mes_da_venda ? fmtMesAno(row.mes_da_venda) : fmtMesAno(row.data_da_venda),
        "Valor bruto": row.valor_bruto ?? "",
        "Valor líquido": row.valor_liquido ?? "",
        "Início veic.": fmtDateBR(row.data_inicial_veiculacao),
        "Fim veic.": fmtDateBR(row.data_final_veiculacao),
        "Data da venda": fmtDateBR(row.data_da_venda),
        Vencimento: fmtDateBR(row.vencimento),
        Canal: row.canal ?? "",
        Produto: row.produto ?? "",
        "Data Pulsar": fmtDateBR(row.data_pulsar),
        "Data Pagamento": fmtDateBR(row.data_pagamento),
        NF: row.nota_fiscal ?? "",
        Observações: row.observacoes ?? "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PI");
    const safePI = (row.numero_pi ?? `pi_${row.id}`).toString().replace(/[^\w-]+/g, "_");
    XLSX.writeFile(wb, `pi_${safePI}.xlsx`);
  }

  return (
    <div className="overflow-auto rounded-2xl border border-red-700/50 bg-black shadow-[0_0_0_1px_rgba(255,0,0,0.15)]">
      <table className="min-w-full">
        {/* Cabeçalho fixo com fundo vermelho escuro */}
        <thead className="sticky top-0 z-10 bg-red-950/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-red-800/60">
          <tr>
            <Th field="numero_pi" active={orderBy === "numero_pi"} dir={orderDir} onSort={onSort}>
              PI
            </Th>
            <Th>PI Matriz</Th>
            <Th field="nome_anunciante" active={orderBy === "nome_anunciante"} dir={orderDir} onSort={onSort}>
              Anunciante
            </Th>
            <Th>CNPJ</Th>
            <Th field="executivo" active={orderBy === "executivo"} dir={orderDir} onSort={onSort}>
              Executivo
            </Th>
            <Th field="diretoria" active={orderBy === "diretoria"} dir={orderDir} onSort={onSort}>
              Diretoria
            </Th>
            <Th>Campanha</Th>
            <Th>Agência</Th>
            <Th>Mês da venda</Th>
            <Th field="valor_bruto" active={orderBy === "valor_bruto"} dir={orderDir} onSort={onSort}>
              V. bruto
            </Th>
            <Th field="valor_liquido" active={orderBy === "valor_liquido"} dir={orderDir} onSort={onSort}>
              V. líquido
            </Th>
            <Th>Início veic.</Th>
            <Th>Fim veic.</Th>
            <Th field="data_da_venda" active={orderBy === "data_da_venda"} dir={orderDir} onSort={onSort}>
              Venda
            </Th>
            <Th>Vencimento</Th>
            <Th>Observações</Th>
            <Th>Data Pulsar</Th>
            <Th>Data Pagamento</Th>
            <Th>NF</Th>
            <Th>Ações</Th>
          </tr>
        </thead>

        <tbody className="[&>tr:nth-child(odd)]:bg-black [&>tr:nth-child(even)]:bg-slate-950/40">
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={21} className="text-center text-slate-400">
                Sem resultados.
              </Td>
            </tr>
          ) : (
            rows.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id} className="hover:bg-red-950/20 transition-colors">
                  <Td stickyLeft className="font-extrabold text-white">
                    {r.numero_pi ?? "-"}
                  </Td>

                  <Td>{r.pi_matriz ? <Pill>{r.pi_matriz}</Pill> : "-"}</Td>
                  <Td className="font-bold text-slate-100" title={r.nome_anunciante ?? undefined}>
                    {r.nome_anunciante ?? "-"}
                  </Td>
                  <Td className="text-slate-300">{r.cnpj_anunciante ?? "-"}</Td>
                  <Td>{r.executivo ?? "-"}</Td>
                  <Td>{r.diretoria ?? "-"}</Td>
                  <Td className="max-w-[18rem]" title={r.nome_campanha ?? undefined}>
                    {r.nome_campanha ?? "-"}
                  </Td>
                  <Td>{r.nome_agencia ?? "-"}</Td>

                  {/* Mês como mm/aaaa (usa mes_da_venda se vier, senão deriva de data_da_venda) */}
                  <Td>{r.mes_da_venda ? fmtMesAno(r.mes_da_venda) : fmtMesAno(r.data_da_venda)}</Td>

                  <Td className="font-bold text-red-300">{fmtBRL(r.valor_bruto)}</Td>
                  <Td className="font-bold text-red-300">{fmtBRL(r.valor_liquido)}</Td>

                  <Td>{fmtDateBR(r.data_inicial_veiculacao)}</Td>
                  <Td>{fmtDateBR(r.data_final_veiculacao)}</Td>
                  <Td>{fmtDateBR(r.data_da_venda)}</Td>
                  <Td>{fmtDateBR(r.vencimento)}</Td>

                  {/* Observações destacadas */}
                  <Td className="max-w-[28rem]">
                    <div
                      className={[
                        "rounded-xl px-3 py-2",
                        r.observacoes
                          ? "border border-yellow-400/50 bg-yellow-100/10 text-yellow-100 font-semibold"
                          : "border border-slate-800 bg-slate-900/50 text-slate-400",
                      ].join(" ")}
                    >
                      <div className="text-[10px] uppercase tracking-wider mb-1">
                        Observações
                      </div>
                      <div className="whitespace-pre-wrap break-words">
                        {r.observacoes || "Sem observações"}
                      </div>
                    </div>
                  </Td>

                  {/* Campos editáveis */}
                  <Td>
                    {isEditing ? (
                      <input
                        type="date"
                        value={form.data_pulsar ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, data_pulsar: e.target.value }))}
                        className="w-44 rounded-lg bg-black border border-red-700 px-2 py-1 text-slate-100 focus:ring-2 focus:ring-red-600"
                      />
                    ) : (
                      fmtDateBR(r.data_pulsar)
                    )}
                  </Td>

                  <Td>
                    {isEditing ? (
                      <input
                        type="date"
                        value={form.data_pagamento ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, data_pagamento: e.target.value }))}
                        className="w-44 rounded-lg bg-black border border-red-700 px-2 py-1 text-slate-100 focus:ring-2 focus:ring-red-600"
                      />
                    ) : (
                      fmtDateBR(r.data_pagamento)
                    )}
                  </Td>

                  <Td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={form.nota_fiscal ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, nota_fiscal: e.target.value }))}
                        placeholder="Ex.: 12345"
                        className="w-40 rounded-lg bg-black border border-red-700 px-2 py-1 text-slate-100 focus:ring-2 focus:ring-red-600"
                      />
                    ) : (
                      r.nota_fiscal ?? "-"
                    )}
                  </Td>

                  <Td>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60"
                          onClick={() => saveEdit(r.id)}
                          disabled={saving}
                          title="Salvar"
                        >
                          {saving ? (
                            <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Salvar"
                          )}
                        </button>
                        <button
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100"
                          onClick={cancelEdit}
                          title="Cancelar"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100"
                          onClick={() => startEdit(r)}
                          title="Editar campos financeiros"
                        >
                          Editar
                        </button>
                        <button
                          className="px-3 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white border border-red-600"
                          onClick={() => exportarPI(r)}
                          title="Exportar este PI (XLSX)"
                        >
                          Baixar PI
                        </button>
                      </div>
                    )}
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function emptyToNull(v?: string | null) {
  return v && v.trim() !== "" ? v : null;
}
