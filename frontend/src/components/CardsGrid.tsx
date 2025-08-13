import { useState } from "react";
import { PICard } from "../types";
import { patchPI } from "../services/api";

export default function CardsGrid({
  rows,
  onRowUpdated,
}: {
  rows: PICard[];
  onRowUpdated: (updated: PICard) => void;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-slate-700 p-6 text-slate-300">
        Sem resultados.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <PIItem key={r.id} row={r} onRowUpdated={onRowUpdated} />
      ))}
    </div>
  );
}

function PIItem({ row, onRowUpdated }: { row: PICard; onRowUpdated: (u: PICard) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{
    data_pulsar?: string | null;
    data_pagamento?: string | null;
    nota_fiscal?: string | null;
  }>({
    data_pulsar: row.data_pulsar ?? "",
    data_pagamento: row.data_pagamento ?? "",
    nota_fiscal: row.nota_fiscal ?? "",
  });

  async function salvar() {
    try {
      const body = {
        data_pulsar: nz(form.data_pulsar),
        data_pagamento: nz(form.data_pagamento),
        nota_fiscal: nz(form.nota_fiscal),
      };
      const updated = await patchPI(row.id, body);
      onRowUpdated(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar. Confira a API e os dados.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-sm">
      {/* Cabeçalho */}
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-700 pb-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">PI</div>
          <div className="text-lg font-semibold text-white">{row.numero_pi ?? "-"}</div>
          {row.pi_matriz && (
            <div className="text-xs text-slate-400">PI Matriz: {row.pi_matriz}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-400">Anunciante</div>
          <div className="text-sm font-medium text-slate-200">
            {row.nome_anunciante ?? "-"}
          </div>
          {row.cnpj_anunciante && (
            <div className="text-xs text-slate-400">{row.cnpj_anunciante}</div>
          )}
        </div>
      </div>

      {/* Blocos rápidos */}
      <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
        <Info label="Executivo" value={row.executivo} />
        <Info label="Diretoria" value={row.diretoria} />
        <Info label="Campanha" value={row.nome_campanha} />
        <Info label="Agência" value={row.nome_agencia} />
        <Info label="Mês da venda" value={row.mes_da_venda} />
        <Info label="Venda" value={row.data_da_venda} />
        <Info label="Vencimento" value={row.vencimento} />
        <Info label="Valor bruto" value={fmtBRL(row.valor_bruto)} />
        <Info label="Valor líquido" value={fmtBRL(row.valor_liquido)} />
      </div>

      {/* Observações em destaque */}
      <div
        className={`mb-4 rounded-xl border p-3 text-sm ${
          row.observacoes
            ? "border-amber-300/40 bg-amber-50/10"
            : "border-slate-700 bg-slate-800/60"
        }`}
      >
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
          Observações
        </div>
        <div className={`whitespace-pre-wrap ${row.observacoes ? "text-amber-100" : "text-slate-400"}`}>
          {row.observacoes || "Sem observações"}
        </div>
      </div>

      {/* Campos financeiros editáveis */}
      <div className="rounded-xl bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-200">Financeiro</div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={salvar}
                className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm({
                    data_pulsar: row.data_pulsar ?? "",
                    data_pagamento: row.data_pagamento ?? "",
                    nota_fiscal: row.nota_fiscal ?? "",
                  });
                }}
                className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Info label="Data Pulsar" value={row.data_pulsar} />
            <Info label="Data Pagamento" value={row.data_pagamento} />
            <Info label="NF" value={row.nota_fiscal} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <FieldDate
              label="Data Pulsar"
              value={form.data_pulsar ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, data_pulsar: v }))}
            />
            <FieldDate
              label="Data Pagamento"
              value={form.data_pagamento ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, data_pagamento: v }))}
            />
            <FieldText
              label="Nota Fiscal"
              value={form.nota_fiscal ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, nota_fiscal: v }))}
              placeholder="Ex.: 12345"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="truncate text-slate-200">{value ?? "-"}</div>
    </div>
  );
}

function FieldDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-300">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600"
      />
    </label>
  );
}

function FieldText({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-300">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1 text-slate-100 outline-none focus:ring-2 focus:ring-emerald-600"
      />
    </label>
  );
}

function fmtBRL(v: unknown) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)
    : String(v);
}

function nz(v?: string | null) {
  return v && v.trim() !== "" ? v : null;
}
