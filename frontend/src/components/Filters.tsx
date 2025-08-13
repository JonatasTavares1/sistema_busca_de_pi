import { useState } from "react";
import { BuscaParams } from "../types";

interface Props {
  onSearch: (p: BuscaParams) => void;
  defaultLimit: number;
}

export default function Filters({ onSearch, defaultLimit }: Props) {
  const [numero, setNumero] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [anunciante, setAnunciante] = useState("");
  const [executivo, setExecutivo] = useState("");
  const [diretoria, setDiretoria] = useState("");
  const [canal, setCanal] = useState("");
  const [produto, setProduto] = useState("");
  const [dtIni, setDtIni] = useState("");
  const [dtFim, setDtFim] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch({
      numero: toUndef(numero),
      cnpj: toUndef(cnpj),
      anunciante: toUndef(anunciante),
      executivo: toUndef(executivo),
      diretoria: toUndef(diretoria),
      canal: toUndef(canal),
      produto: toUndef(produto),
      data_ini: toUndef(dtIni),
      data_fim: toUndef(dtFim),
      limit: defaultLimit,
      offset: 0,
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
      <Input label="Número do PI" value={numero} onChange={setNumero} placeholder="Ex.: 12345" />
      <Input label="CNPJ Anunciante" value={cnpj} onChange={setCnpj} placeholder="Somente números" />
      <Input label="Anunciante" value={anunciante} onChange={setAnunciante} placeholder="Nome do anunciante" />
      <Input label="Executivo" value={executivo} onChange={setExecutivo} placeholder="Ex.: Juliana" />

      <Input label="Diretoria" value={diretoria} onChange={setDiretoria} placeholder="Ex.: Governo Federal" />
      <Input label="Canal" value={canal} onChange={setCanal} placeholder="Ex.: Digital" />
      <Input label="Produto" value={produto} onChange={setProduto} placeholder="Ex.: Banner 300x250" />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Data início" type="date" value={dtIni} onChange={setDtIni} />
        <Input label="Data fim" type="date" value={dtFim} onChange={setDtFim} />
      </div>

      <div className="md:col-span-4">
        <button className="rounded-xl px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-500" type="submit">
          Buscar
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-200 mb-1">{label}</label>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-700 bg-gray-900/60 px-3 py-2 text-gray-100 outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}

function toUndef(v?: string) {
  return v && v.trim() !== "" ? v : undefined;
}
