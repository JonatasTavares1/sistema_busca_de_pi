// src/components/LoadingSpinner.tsx
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10 bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      <span className="ml-3 text-lg text-red-500 font-semibold">
        Carregando...
      </span>
    </div>
  );
}
