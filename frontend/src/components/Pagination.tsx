interface Props {
  page: number;     // 1-based
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}
export default function Pagination({ page, canPrev, canNext, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center gap-2 justify-end py-3">
      <button className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-50" onClick={onPrev} disabled={!canPrev}>Anterior</button>
      <span className="text-sm text-slate-300">Página <b>{page}</b></span>
      <button className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-50" onClick={onNext} disabled={!canNext}>Próxima</button>
    </div>
  );
}
