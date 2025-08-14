import { useEffect, useState } from "react";
import { BuscaParams } from "../types";

interface Props {
  onSearch: (p: BuscaParams) => void;
  defaultLimit: number;
}

export default function Filters({ onSearch, defaultLimit }: Props) {
  const [numeroPI, setNumeroPI] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [dtFim, setDtFim] = useState("");

  function doSearch() {
    onSearch({
      // ATENÇÃO: o backend espera "numero" (não numero_pi)
      numero: toUndef(numeroPI),
      cnpj: cleanDigits(cnpj), // envia só os dígitos
      data_fim: toUndef(dtFim),
      limit: defaultLimit,
      offset: 0,
      order_by: "data_da_venda",
      order_dir: "desc",
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    doSearch();
  }

  function resetar() {
    setNumeroPI("");
    setCnpj("");
    setDtFim("");
    onSearch({
      limit: defaultLimit,
      offset: 0,
      order_by: "data_da_venda",
      order_dir: "desc",
    });
  }

  return (
    <form
      onSubmit={submit}
      className="
        mx-auto w-full max-w-7xl
        rounded-2xl
        p-5 sm:p-6 md:p-7
        backdrop-blur
        bg-[rgba(0,0,0,0.65)]
        shadow-[0_20px_80px_-30px_rgba(255,0,0,0.35)]
        border border-transparent
        [background:linear-gradient(#0b0b0b,#0b0b0b)_padding-box,linear-gradient(120deg,rgba(255,0,0,.6),rgba(255,80,80,.45))_border-box]
      "
    >
      {/* Cabeçalho do bloco */}
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-lg sm:text-xl font-extrabold tracking-wide text-white">
          Filtros de busca
        </h3>
        <span className="hidden sm:block text-xs text-red-200/80">
          Dica: pressione <span className="font-bold">Enter</span> para buscar
        </span>
      </div>

      {/* Grade responsiva */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
        {/* Número do PI */}
        <Input
          label="Número do PI"
          value={numeroPI}
          onChange={setNumeroPI}
          placeholder="Ex.: 12345"
          className="md:col-span-4"
        />

        {/* CNPJ */}
        <MaskedCNPJ
          label="CNPJ Anunciante"
          value={cnpj}
          onChange={setCnpj}
          className="md:col-span-4"
        />

        {/* Data fim */}
        <Input
          label="Fim da veiculação"
          type="date"
          value={dtFim}
          onChange={setDtFim}
          className="md:col-span-4"
        />

        {/* Ações */}
        <div className="md:col-span-12">
          <div className="mt-1 flex flex-wrap items-center gap-3 justify-end">
            <button
              type="button"
              onClick={resetar}
              className="
                inline-flex items-center gap-2
                rounded-xl border border-red-800/60 bg-black
                px-5 py-3 text-base font-bold text-red-100
                hover:bg-red-950/60 transition
                focus:outline-none focus:ring-2 focus:ring-red-600
              "
            >
              <span>⟲</span> Limpar
            </button>
            <button
              type="submit"
              className="
                inline-flex items-center gap-2
                rounded-xl px-6 py-3 text-base font-extrabold text-white
                bg-red-600 hover:bg-red-500 transition
                shadow-[0_10px_30px_-10px_rgba(255,0,0,0.45)]
                focus:outline-none focus:ring-2 focus:ring-red-500
              "
            >
              <span>🔎</span> Buscar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ---------- componentes ---------- */

function MaskedCNPJ({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  function handleChange(v: string) {
    onChange(formatCNPJ(v)); // aplica máscara ao digitar
  }
  return (
    <label className={`flex flex-col ${className}`}>
      <span className="mb-2 text-[13px] uppercase tracking-[0.18em] text-red-200/90 font-black">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        inputMode="numeric"
        className="
          w-full
          rounded-xl
          border border-red-800/50
          bg-[linear-gradient(180deg,rgba(25,25,25,.9),rgba(10,10,10,.9))]
          px-4 py-3.5
          text-red-50 text-lg
          placeholder:text-red-200/40
          outline-none
          focus:ring-2 focus:ring-red-600
          transition
        "
        placeholder="00.000.000/0000-00"
      />
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  className = "",
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col ${className}`}>
      <span className="mb-2 text-[13px] uppercase tracking-[0.18em] text-red-200/90 font-black">
        {label}
      </span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          rounded-xl
          border border-red-800/50
          bg-[linear-gradient(180deg,rgba(25,25,25,.9),rgba(10,10,10,.9))]
          px-4 py-3.5
          text-red-50 text-lg
          placeholder:text-red-200/40
          outline-none
          focus:ring-2 focus:ring-red-600
          transition
        "
      />
    </label>
  );
}

/* ---------- utils ---------- */

function toUndef(v?: string) {
  return v && v.trim() !== "" ? v : undefined;
}

// remove máscara (., /, -) e mantém só dígitos
function cleanDigits(v?: string) {
  const t = (v ?? "").replace(/\D+/g, "");
  return t.length ? t : undefined;
}

// formata visualmente como CNPJ à medida que digita
function formatCNPJ(v: string) {
  const d = v.replace(/\D+/g, "").slice(0, 14);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 5);
  const p3 = d.slice(5, 8);
  const p4 = d.slice(8, 12);
  const p5 = d.slice(12, 14);

  let out = "";
  if (p1) out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "/" + p4;
  if (p5) out += "-" + p5;
  return out;
}
