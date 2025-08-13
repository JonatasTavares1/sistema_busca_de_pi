from datetime import date
from decimal import Decimal
from sqlalchemy import Index, String, Date, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

STR = 255

class PI(Base):
    __tablename__ = "pis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    pi_matriz: Mapped[str | None] = mapped_column(String(STR), index=True)
    # PI pode repetir (sem UNIQUE)
    numero_pi: Mapped[str] = mapped_column(String(STR), index=True, nullable=False)

    # Anunciante
    nome_anunciante: Mapped[str | None] = mapped_column(String(STR), index=True)
    razao_social_anunciante: Mapped[str | None] = mapped_column(String(STR))
    cnpj_anunciante: Mapped[str | None] = mapped_column(String(32), index=True)  # só dígitos
    uf_cliente: Mapped[str | None] = mapped_column(String(8))
    executivo: Mapped[str | None] = mapped_column(String(STR), index=True)
    diretoria: Mapped[str | None] = mapped_column(String(STR), index=True)

    # Campanha / Agência
    nome_campanha: Mapped[str | None] = mapped_column(String(STR), index=True)
    nome_agencia: Mapped[str | None] = mapped_column(String(STR))
    razao_social_agencia: Mapped[str | None] = mapped_column(String(STR))
    cnpj_agencia: Mapped[str | None] = mapped_column(String(32))
    uf_agencia: Mapped[str | None] = mapped_column(String(8))

    # Datas / Períodos
    data_inicial_veiculacao: Mapped[date | None] = mapped_column(Date)
    data_final_veiculacao: Mapped[date | None] = mapped_column(Date)
    mes_da_venda: Mapped[str | None] = mapped_column(String(32))            # "YYYY-MM" ou "MMM/YYYY"
    mes_inicial_veiculacao: Mapped[str | None] = mapped_column(String(32))

    # Classificação / Produto
    canal: Mapped[str | None] = mapped_column(String(STR), index=True)
    perfil_anunciante: Mapped[str | None] = mapped_column(String(STR))
    subperfil_anunciante: Mapped[str | None] = mapped_column(String(STR))
    produto: Mapped[str | None] = mapped_column(String(STR), index=True)

    # Valores
    valor_bruto: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    valor_liquido: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))

    # Datas financeiras/operacionais
    vencimento: Mapped[date | None] = mapped_column(Date)
    data_da_venda: Mapped[date | None] = mapped_column(Date, index=True)
    data_emissao_recebimento: Mapped[date | None] = mapped_column(Date)

    # NOVOS CAMPOS
    data_pulsar: Mapped[date | None] = mapped_column(Date)
    data_pagamento: Mapped[date | None] = mapped_column(Date)
    nota_fiscal: Mapped[str | None] = mapped_column(String(64))

    observacoes: Mapped[str | None] = mapped_column(String(1024))

    def __repr__(self) -> str:
        return f"<PI id={self.id} numero_pi={self.numero_pi!r} cnpj={self.cnpj_anunciante!r}>"

# Índices auxiliares p/ buscas
Index("ix_pi_numero_cnpj", PI.numero_pi, PI.cnpj_anunciante)
Index("ix_pi_numero_nome", PI.numero_pi, PI.nome_anunciante)

