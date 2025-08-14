import { useState } from "react";

type HeaderProps = {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode; // opcional
};

export default function Header({ title, subtitle, rightSlot }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-gradient-to-r from-red-900 to-red-950 border-b border-red-700/60 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Altura aumentada: h-24 */}
        <div className="h-24 flex flex-col items-center justify-center text-center gap-1">
          {/* Marca / Títulos */}
          <div className="min-w-0">
            <div className="text-white font-black text-2xl sm:text-3xl leading-tight">
              {title ?? "Painel de PIs"}
            </div>
            {subtitle && (
              <div className="text-red-200/80 text-sm sm:text-base">
                {subtitle}
              </div>
            )}
          </div>

          {/* Ações à direita (desktop) - opcional */}
          {rightSlot && (
            <div className="hidden md:flex items-center gap-2 mt-2">
              {rightSlot}
            </div>
          )}
        </div>
      </div>

      {menuOpen && rightSlot && (
        <div className="md:hidden border-t border-red-800 bg-red-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            {rightSlot}
          </div>
        </div>
      )}
    </header>
  );
}
