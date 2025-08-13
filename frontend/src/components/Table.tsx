import { useState } from "react";
import { PICard, OrderBy, OrderDir } from "../types";
import { patchPI } from "../services/api";

function Th({ children, active, dir, onSort, field }:{
  children: React.ReactNode; active?: boolean; dir?: OrderDir;
  onSort?: (f: OrderBy) => void; field?: OrderBy;
}) {
  const clickable = !!onSort && !!field;
  return (
    <th
      className={`px-3 py-2 text-left text-sm font-semibold ${clickable ? "cursor-pointer select-none" : ""}`}
      onClick={() => (clickable && field) ? onSort!(field) : undefined}
    >
      <span className="text-slate-200 flex items-center gap-1">
        {children}
        {active && (dir === "asc" ? "▲" : "▼")}
      </span>
    </th>
  );
}
function Td({ children, colSpan }:{ children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="px-3 py-2 text-sm text-slate-300">{children}</td>;
}
function fmtBRL(v: unknown) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n) ? new Intl.NumberFormat("pt-BR",{ style:"currency", currency:"BRL"}).format(n) : String(v);
}

export default function Table({
  rows, orderBy, orderDir, onSort, onRowUpdated,
}:{
  rows: PICard[]; orderBy: OrderBy; orderDir: OrderDir;
  onSort: (f: OrderBy) => void; onRowUpdated: (updated: PICard) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ data_pulsar?: string | null; data_pagamento?: string | null; nota_fiscal?: string | null }>({});

  function startEdit(r: PICard) {
    setEditingId(r.id);
    setForm({
      data_pulsar: r.data_pulsar ?? "",
      data_pagamento: r.data_pagamento ?? "",
      nota_fiscal: r.nota_fiscal ?? "",
    });
  }
  async function saveEdit(id: number) {
    const body = {
      data_pulsar: emptyToNull(form.data_pulsar),
      data_pagamento: emptyToNull(form.data_pagamento),
      nota_fiscal: emptyToNull(form.nota_fiscal),
    };
    const updated = await patchPI(id, body);
    onRowUpdated(updated);
    setEditingId(null);
  }
  function cancelEdit() {
    setEditingId(null);
    setForm({});
  }

  return (
    <div className="overflow-auto rounded-xl border border-slate-700">
      <table className="min-w-full bg-slate-800">
        <thead className="bg-slate-700/50">
          <tr>
            <Th field="numero_pi" active={orderBy === "numero_pi"} dir={orderDir} onSort={onSort}>PI</Th>
            <Th>PI Matriz</Th>
            <Th field="nome_anunciante" active={orderBy === "nome_anunciante"} dir={orderDir} onSort={onSort}>Anunciante</Th>
            <Th>CNPJ</Th>
            <Th field="executivo" active={orderBy === "executivo"} dir={orderDir} onSort={onSort}>Executivo</Th>
            <Th field="diretoria" active={orderBy === "diretoria"} dir={orderDir} onSort={onSort}>Diretoria</Th>
            <Th>Campanha</Th>
            <Th>Agência</Th>
            <Th>Mês da venda</Th>
            <Th field="valor_bruto" active={orderBy === "valor_bruto"} dir={orderDir} onSort={onSort}>V. bruto</Th>
            <Th field="valor_liquido" active={orderBy === "valor_liquido"} dir={orderDir} onSort={onSort}>V. líquido</Th>
            <Th>Início veic.</Th>
            <Th>Fim veic.</Th>
            <Th field="data_da_venda" active={orderBy === "data_da_venda"} dir={orderDir} onSort={onSort}>Venda</Th>
            <Th>Vencimento</Th>
            <Th>Observações</Th>
            <Th>Data Pulsar</Th>
            <Th>Data Pagamento</Th>
            <Th>NF</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><Td colSpan={20}>Sem resultados.</Td></tr>
          ) : (
            rows.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id} className="odd:bg-slate-800 even:bg-slate-800/70 align-top">
                  <Td>{r.numero_pi ?? "-"}</Td>
                  <Td>{r.pi_matriz ?? "-"}</Td>
                  <Td>{r.nome_anunciante ?? "-"}</Td>
                  <Td>{r.cnpj_anunciante ?? "-"}</Td>
                  <Td>{r.executivo ?? "-"}</Td>
                  <Td>{r.diretoria ?? "-"}</Td>
                  <Td>{r.nome_campanha ?? "-"}</Td>
                  <Td>{r.nome_agencia ?? "-"}</Td>
                  <Td>{r.mes_da_venda ?? "-"}</Td>
                  <Td>{fmtBRL(r.valor_bruto)}</Td>
                  <Td>{fmtBRL(r.valor_liquido)}</Td>
                  <Td>{r.data_inicial_veiculacao ?? "-"}</Td>
                  <Td>{r.data_final_veiculacao ?? "-"}</Td>
                  <Td>{r.data_da_venda ?? "-"}</Td>
                  <Td>{r.vencimento ?? "-"}</Td>
                  <Td className="max-w-[24rem]">{r.observacoes ?? "-"}</Td>

                  <Td>
                    {isEditing ? (
                      <input type="date" value={form.data_pulsar ?? ""} onChange={e=>setForm(f=>({...f,data_pulsar:e.target.value}))}
                        className="w-40 rounded-md bg-slate-900/60 border border-slate-700 px-2 py-1" />
                    ) : (r.data_pulsar ?? "-")}
                  </Td>
                  <Td>
                    {isEditing ? (
                      <input type="date" value={form.data_pagamento ?? ""} onChange={e=>setForm(f=>({...f,data_pagamento:e.target.value}))}
                        className="w-40 rounded-md bg-slate-900/60 border border-slate-700 px-2 py-1" />
                    ) : (r.data_pagamento ?? "-")}
                  </Td>
                  <Td>
                    {isEditing ? (
                      <input type="text" value={form.nota_fiscal ?? ""} onChange={e=>setForm(f=>({...f,nota_fiscal:e.target.value}))}
                        className="w-36 rounded-md bg-slate-900/60 border border-slate-700 px-2 py-1" placeholder="Ex.: 12345" />
                    ) : (r.nota_fiscal ?? "-")}
                  </Td>

                  <Td>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500" onClick={()=>saveEdit(r.id)}>Salvar</button>
                        <button className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600" onClick={cancelEdit}>Cancelar</button>
                      </div>
                    ) : (
                      <button className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600" onClick={()=>startEdit(r)}>Editar</button>
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
