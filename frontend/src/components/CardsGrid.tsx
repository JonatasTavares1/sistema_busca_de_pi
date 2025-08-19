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
      <div className="rounded-2xl border border-red-700/50 bg-black p-10 text-red-200 text-2xl text-center font-black tracking-wide">
        Sem resultados.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-16">
      {rows.map((r) => (
        <PIItem key={r.id} row={r} onRowUpdated={onRowUpdated} />
      ))}
    </div>
  );
}

function PIItem({
  row,
  onRowUpdated,
}: {
  row: PICard;
  onRowUpdated: (u: PICard) => void;
}) {
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

  const tipoPI = getTipoPI(row);
  const numeroMatriz = row.pi_matriz ?? null;

  return (
    <section
      className="
        w-full max-w-6xl mx-auto
        rounded-[28px] relative
        p-[1px]
        [background:linear-gradient(#0b0b0b,#0b0b0b)_padding-box,linear-gradient(135deg,rgba(255,80,80,.6),rgba(255,0,0,.35))_border-box]
        shadow-[0_10px_60px_-20px_rgba(255,0,0,0.45),0_0_0_1px_rgba(255,0,0,0.15)]
      "
    >
      <div className="rounded-[26px] bg-gradient-to-b from-[#130A0A] to-[#0B0505] text-red-50 px-8 py-10 sm:px-12 sm:py-14 md:px-16 md:py-16 backdrop-blur">
        {/* Cabeçalho LIMPO com faixa vermelha */}
        <header className="mb-10 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between border-b border-red-800/50 pb-8">
          <div className="space-y-4">
            <div className="text-[11px] md:text-xs font-black uppercase tracking-[0.28em] text-red-200/75">
              PI
            </div>
            <div>
              <h2 className="text-5xl md:text-6xl font-black leading-[1.05] tracking-tight drop-shadow-sm">
                {row.numero_pi ?? "-"}
              </h2>
              {/* Barrinha vermelha decorativa */}
              <div className="mt-3 h-1.5 w-40 rounded-full bg-gradient-to-r from-red-500 via-red-400 to-red-600 shadow-[0_0_18px_rgba(255,0,0,0.55)]" />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {row.canal && (
                <Chip title="Canal" large>
                  {row.canal}
                </Chip>
              )}
              {row.produto && (
                <Chip title="Produto" large>
                  {row.produto}
                </Chip>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <div className="text-[11px] md:text-xs font-black uppercase tracking-[0.28em] text-red-200/75">
              Anunciante
            </div>
            <div className="text-3xl md:text-4xl font-black">{row.nome_anunciante ?? "-"}</div>
            <div className="text-base md:text-lg font-bold text-red-200/90">
              {row.cnpj_anunciante || "—"}
            </div>
          </div>
        </header>

        {/* ======= Seções separadas ======= */}

        {/* Identificação */}
        <Section title="Identificação do PI">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Info label="Tipo do PI" value={tipoPI} highlight />
            <Info label="PI Matriz" value={numeroMatriz ?? "—"} />
            <Info label="Campanha" value={row.nome_campanha} />
            <Info label="Executivo" value={row.executivo} />
            <Info label="Diretoria" value={row.diretoria} />
            <Info label="Canal" value={row.canal} />
            <Info label="Produto" value={row.produto} />
          </div>
        </Section>

        {/* Entidades */}
        <Section title="Agência e Cliente">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Info label="Agência" value={row.nome_agencia} />
            <Info label="Razão Social Agência" value={row.razao_social_agencia} />
            <Info label="CNPJ Agência" value={row.cnpj_agencia} />
            <Info label="UF Cliente" value={row.uf_cliente} />
            <Info label="UF Agência" value={row.uf_agencia} />
            <Info label="Perfil" value={row.perfil_anunciante} />
            <Info label="Subperfil" value={row.subperfil_anunciante} />
          </div>
        </Section>

        {/* Datas e Valores */}
        <Section title="Datas e Valores">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Info
              label="Mês da venda"
              value={
                row.mes_da_venda
                  ? fmtDateMesAno(row.mes_da_venda)
                  : fmtDateMesAno(row.data_da_venda)
              }
            />
            <Info label="Venda" value={fmtDateBR(row.data_da_venda)} highlight />
            <Info label="Vencimento" value={fmtDateBR(row.vencimento)} highlight />
            <Info label="Início veiculação" value={fmtDateBR(row.data_inicial_veiculacao)} />
            <Info label="Fim veiculação" value={fmtDateBR(row.data_final_veiculacao)} />
            <Info label="Valor bruto" value={fmtBRL(row.valor_bruto)} money big />
            <Info label="Valor líquido" value={fmtBRL(row.valor_liquido)} money big />
          </div>
        </Section>

        {/* Observações */}
        <Section title="Observações" variant="warning">
          <div
            className={`whitespace-pre-wrap text-[1.1rem] leading-relaxed ${
              row.observacoes ? "text-yellow-100 font-black" : "text-red-200/80 font-bold"
            }`}
          >
            {row.observacoes || "Sem observações"}
          </div>
        </Section>

        {/* Financeiro (editável) */}
        <Section title="Preenchimento do Financeiro" tightHeader titleSize="2xl">
          <div className="mb-6">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center rounded-2xl border border-red-700 bg-black/60 px-8 py-3 text-base font-black text-red-200 hover:bg-red-950/60 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 transition"
              >
                Editar
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={salvar}
                  className="rounded-2xl bg-red-600 px-8 py-3 text-base font-black text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition shadow-[0_10px_30px_-10px_rgba(255,0,0,0.45)]"
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
                  className="rounded-2xl border border-red-800 bg-black px-8 py-3 text-base font-black text-red-100 hover:bg-red-950 focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {!editing ? (
            // NF mega + datas em negrito e maiores
            <div className="grid grid-cols-1 gap-8">
              <NFHighlight value={row.nota_fiscal} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                <Info label="Data Pulsar" value={fmtDateBR(row.data_pulsar)} highlight xxl />
                <Info label="Data Pagamento" value={fmtDateBR(row.data_pagamento)} highlight xxl />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
              <FieldDate
                label="Data Pulsar"
                value={form.data_pulsar ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, data_pulsar: v }))}
              />
              <FieldText
                label="Nota Fiscal"
                value={form.nota_fiscal ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, nota_fiscal: v }))}
                placeholder="Ex.: 12345"
              />
              <FieldDate
                label="Data Pagamento"
                value={form.data_pagamento ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, data_pagamento: v }))}
              />
            </div>
          )}
        </Section>
      </div>
    </section>
  );
}

/* ===================== Subcomponentes ===================== */

function NFHighlight({ value }: { value?: string | null }) {
  const [copied, setCopied] = useState(false);
  const has = !!(value && value.trim());

  async function copy() {
    if (!has) return;
    try {
      await navigator.clipboard.writeText(value!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={[
        "rounded-2xl p-6 md:p-7 border",
        has
          ? "border-red-500/70 bg-gradient-to-br from-red-900/40 to-red-950/40"
          : "border-red-800/60 bg-black/40",
      ].join(" ")}
    >
      <div className="mb-2 text-[13px] md:text-[14px] uppercase tracking-[0.24em] text-red-200/90 font-black">
        NF
      </div>
      <div className="flex items-center justify-between gap-4">
        <div
          className={[
            "truncate tabular-nums font-mono",
            has ? "text-red-50" : "text-red-300/70",
            "font-black",
            // forte: base 40px, md 52px
            "text-[40px] leading-[2.4rem] md:text-[52px] md:leading-[3rem] tracking-wide",
          ].join(" ")}
          title={has ? value! : "Sem NF"}
        >
          {has ? value : "—"}
        </div>
        <button
          onClick={copy}
          disabled={!has}
          className="rounded-xl border border-red-700 bg-black/60 px-6 py-3 text-lg font-extrabold text-red-100 hover:bg-red-950 disabled:opacity-50"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  variant,
  tightHeader,
  titleSize = "md",
  titleClassName = "",
}: {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "warning";
  tightHeader?: boolean;
  /** md = padrão; lg/xl/2xl deixam o título maior */
  titleSize?: "md" | "lg" | "xl" | "2xl";
  /** classes extras opcionais para o título */
  titleClassName?: string;
}) {
  const isWarn = variant === "warning";

  const sizeCls =
    titleSize === "2xl"
      ? "text-4xl md:text-5xl"
      : titleSize === "xl"
      ? "text-3xl md:text-4xl"
      : titleSize === "lg"
      ? "text-2xl md:text-3xl"
      : "text-xl md:text-2xl"; // md (default)

  return (
    <div
      className={[
        "mb-9 rounded-2xl p-[1px]",
        isWarn
          ? "[background:linear-gradient(#000,#000)_padding-box,linear-gradient(90deg,rgba(255,212,121,.9),rgba(255,212,121,.35))_border-box]"
          : "[background:linear-gradient(#0c0c0c,#0c0c0c)_padding-box,linear-gradient(120deg,rgba(255,0,0,.55),rgba(255,80,80,.4))_border-box]",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-[18px] border border-transparent",
          isWarn ? "bg-black/30" : "bg-black/45",
          "px-5 md:px-6 py-6 md:py-7 backdrop-blur-sm",
        ].join(" ")}
      >
        <div className={["flex items-center justify-between", tightHeader ? "mb-4" : "mb-6"].join(" ")}>
          <div className={[sizeCls, "font-black tracking-wide", titleClassName].join(" ")}>
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_12px_rgba(255,0,0,0.6)] align-middle" />
            {title}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Chip({
  children,
  title,
  large,
}: {
  children: React.ReactNode;
  title?: string;
  large?: boolean;
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1 rounded-full",
        "border border-red-700/60",
        "bg-[linear-gradient(180deg,rgba(35,15,15,.9),rgba(15,5,5,.92))]",
        "text-red-200",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        large ? "px-3.5 py-1.5 text-sm font-black" : "px-3 py-1 text-xs font-extrabold",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Info({
  label,
  value,
  money,
  highlight,
  big,
  xl,
  xxl,
}: {
  label: string;
  value?: string | null;
  money?: boolean;
  highlight?: boolean;
  big?: boolean;
  xl?: boolean;
  xxl?: boolean; // tamanho extra (datas do financeiro)
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] md:text-[12px] uppercase tracking-[0.22em] text-red-200/90 font-black">
        {label}
      </span>
      <span
        className={[
          "truncate",
          money ? "text-yellow-300" : highlight ? "text-red-50" : "text-white",
          "font-black",
          xxl
            ? "text-[30px] leading-[2.2rem] md:text-[36px] md:leading-[2.5rem]"
            : big
            ? "text-[26px] leading-[2.1rem]"
            : xl
            ? "text-[22px] leading-9"
            : "text-[20px] leading-8",
        ].join(" ")}
        title={value ?? "-"}
      >
        {value ?? "-"}
      </span>
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
    <label className="flex flex-col gap-2">
      <span className="text-base md:text-lg font-black text-red-200">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          rounded-2xl border border-red-800/60
          bg-[linear-gradient(180deg,rgba(25,25,25,.9),rgba(10,10,10,.9))]
          px-4 py-3 text-red-100 outline-none
          focus:ring-2 focus:ring-red-600 font-black text-lg
          shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
        "
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
    <label className="flex flex-col gap-2">
      <span className="text-base md:text-lg font-black text-red-200">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          rounded-2xl border border-red-800/60
          bg-[linear-gradient(180deg,rgba(25,25,25,.9),rgba(10,10,10,.9))]
          px-4 py-3 text-red-100 outline-none
          focus:ring-2 focus:ring-red-600 font-black text-lg
          shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
        "
      />
    </label>
  );
}

/* ===================== Utils ===================== */

function fmtBRL(v: unknown) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  return Number.isFinite(n)
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(n)
    : String(v);
}

function fmtDateBR(v?: string | null): string {
  if (!v) return "-";
  const s = String(v).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  const iso = s.split("T")[0].split(" ")[0];
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
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

/** Exibe somente mm/aaaa (para casos como "2024-12-01 00:00:00" ou ISO em geral) */
function fmtDateMesAno(v?: string | null): string {
  if (!v) return "-";
  const s = String(v).trim();

  if (/^\d{2}\/\d{4}$/.test(s)) return s;

  const iso = s.split("T")[0].split(" ")[0];

  let m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (m) {
    const [, yyyy, mm] = m;
    return `${mm}/${yyyy}`;
  }
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
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

function nz(v?: string | null) {
  return v && v.trim() !== "" ? v : null;
}

function getTipoPI(row: any): string {
  if (typeof row.eh_matriz === "boolean") {
    if (row.eh_matriz) return "Matriz";
    if (row.pi_matriz) return "CS/Vinculado";
    return "Normal/Independente";
  }
  if (typeof row.tipo_pi === "string" && row.tipo_pi.trim() !== "") {
    const t = row.tipo_pi.toLowerCase();
    if (["matriz"].includes(t)) return "Matriz";
    if (["cs", "vinculado", "vinculada"].includes(t)) return "CS/Vinculado";
    if (["normal", "independente"].includes(t)) return "Normal/Independente";
  }
  if (row.pi_matriz) return "CS/Vinculado";
  return "Normal/Independente";
}
