// src/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
      <span className="ml-3 text-sm text-slate-300">Carregando...</span>
    </div>
  );
}
