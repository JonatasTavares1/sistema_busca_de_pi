interface Props {
  page: number; // 1-based
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ page, canPrev, canNext, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center gap-3 justify-center py-4 bg-black">
      <button
        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-40 disabled:hover:bg-red-600"
        onClick={onPrev}
        disabled={!canPrev}
      >
        ⬅ Anterior
      </button>

      <span className="text-lg text-red-400 font-bold">
        Página <b>{page}</b>
      </span>

      <button
        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-40 disabled:hover:bg-red-600"
        onClick={onNext}
        disabled={!canNext}
      >
        Próxima ➡
      </button>
    </div>
  );
}
