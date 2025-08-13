from fastapi import FastAPI, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal

from .database import Base, engine, get_db
from .models import PI

Base.metadata.create_all(bind=engine)

app = FastAPI(title="API de PIs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Schemas ---------
class PICard(BaseModel):
    id: int
    pi_matriz: str | None = None
    numero_pi: str
    nome_anunciante: str | None = None
    razao_social_anunciante: str | None = None
    cnpj_anunciante: str | None = None
    uf_cliente: str | None = None
    executivo: str | None = None
    diretoria: str | None = None
    nome_campanha: str | None = None
    nome_agencia: str | None = None
    razao_social_agencia: str | None = None
    cnpj_agencia: str | None = None
    uf_agencia: str | None = None
    data_inicial_veiculacao: date | None = None
    data_final_veiculacao: date | None = None
    mes_da_venda: str | None = None
    mes_inicial_veiculacao: str | None = None
    canal: str | None = None
    perfil_anunciante: str | None = None
    subperfil_anunciante: str | None = None
    produto: str | None = None
    valor_bruto: Decimal | None = None
    valor_liquido: Decimal | None = None
    vencimento: date | None = None
    data_da_venda: date | None = None
    data_emissao_recebimento: date | None = None
    # NOVOS
    data_pulsar: date | None = None
    data_pagamento: date | None = None
    nota_fiscal: str | None = None
    observacoes: str | None = None

    class Config:
        from_attributes = True

class PIPatch(BaseModel):
    data_pulsar: date | None = None
    data_pagamento: date | None = None
    nota_fiscal: str | None = None

# --------- Helpers ---------
ORDERABLE = {
    "numero_pi": PI.numero_pi,
    "data_da_venda": PI.data_da_venda,
    "valor_bruto": PI.valor_bruto,
    "valor_liquido": PI.valor_liquido,
    "nome_anunciante": PI.nome_anunciante,
    "executivo": PI.executivo,
    "diretoria": PI.diretoria,
    "canal": PI.canal,
    "produto": PI.produto,
}

def parse_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        return None

# --------- Endpoints ---------
@app.get("/", tags=["health"])
def root():
    return {"ok": True, "service": "API de PIs"}

@app.get("/pi/{numero_pi}", response_model=list[PICard], tags=["pi"])
def get_pi(
    numero_pi: str,
    cnpj: str | None = Query(default=None, description="Filtra por CNPJ do anunciante (somente dígitos)"),
    db: Session = Depends(get_db),
):
    q = db.query(PI).filter(PI.numero_pi == numero_pi)
    if cnpj:
        q = q.filter(PI.cnpj_anunciante == cnpj)
    registros = q.all()
    if not registros:
        raise HTTPException(status_code=404, detail="Nenhum PI encontrado")
    return registros

@app.get("/pi-matriz/{numero_matriz}", response_model=list[PICard], tags=["pi"])
def get_por_matriz(numero_matriz: str, db: Session = Depends(get_db)):
    registros = db.query(PI).filter(PI.pi_matriz == numero_matriz).all()
    if not registros:
        raise HTTPException(status_code=404, detail="Nenhum PI vinculado a este PI Matriz")
    return registros

@app.get("/pis/search", response_model=list[PICard], tags=["pi"])
def search_pis(
    numero: str | None = Query(default=None),
    cnpj: str | None = Query(default=None),
    anunciante: str | None = Query(default=None),
    executivo: str | None = Query(default=None),
    diretoria: str | None = Query(default=None),
    canal: str | None = Query(default=None),
    produto: str | None = Query(default=None),
    data_ini: str | None = Query(default=None),
    data_fim: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    order_by: str = Query(default="data_da_venda"),
    order_dir: str = Query(default="desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
):
    q = db.query(PI)

    if numero:
        q = q.filter(PI.numero_pi == numero)
    if cnpj:
        q = q.filter(PI.cnpj_anunciante == cnpj)
    if anunciante:
        q = q.filter(PI.nome_anunciante.ilike(f"%{anunciante}%"))
    if executivo:
        q = q.filter(PI.executivo.ilike(f"%{executivo}%"))
    if diretoria:
        q = q.filter(PI.diretoria.ilike(f"%{diretoria}%"))
    if canal:
        q = q.filter(PI.canal.ilike(f"%{canal}%"))
    if produto:
        q = q.filter(PI.produto.ilike(f"%{produto}%"))

    di = parse_date(data_ini)
    df = parse_date(data_fim)
    if di and df:
        q = q.filter(PI.data_da_venda >= di, PI.data_da_venda <= df)
    elif di:
        q = q.filter(PI.data_da_venda >= di)
    elif df:
        q = q.filter(PI.data_da_venda <= df)

    col = ORDERABLE.get(order_by, PI.data_da_venda)
    q = q.order_by(desc(col) if order_dir == "desc" else asc(col))

    q = q.offset(offset).limit(limit)
    return q.all()

@app.patch("/pi/{pi_id}", response_model=PICard, tags=["pi"])
def update_pi(pi_id: int, payload: PIPatch = Body(...), db: Session = Depends(get_db)):
    obj = db.get(PI, pi_id)  # SQLAlchemy 2.0
    if not obj:
        raise HTTPException(status_code=404, detail="PI não encontrado")

    if payload.data_pulsar is not None:
        obj.data_pulsar = payload.data_pulsar
    if payload.data_pagamento is not None:
        obj.data_pagamento = payload.data_pagamento
    if payload.nota_fiscal is not None:
        obj.nota_fiscal = payload.nota_fiscal

    db.commit()
    db.refresh(obj)
    return obj
