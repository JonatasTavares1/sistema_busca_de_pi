import sys, os
# Adiciona a pasta raiz do projeto ao sys.path (permite rodar de qualquer lugar)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import argparse
import pandas as pd
from dateutil.parser import parse
import re
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import PI

Base.metadata.create_all(bind=engine)

print("USANDO SCRIPT:", os.path.abspath(__file__))

# ---- Parsers utilitários ----
def parse_brl(valor):
    import re
    import pandas as pd

    if pd.isna(valor):
        return None

    s = str(valor).strip()
    if s == "":
        return None

    # Remove moeda/espaços e normaliza traços
    s = (s.replace("R$", "")
           .replace(" ", "")
           .replace("−", "-")
           .replace("–", "-")
           .replace("—", "-"))

    # Parênteses = negativo
    neg = False
    if s.startswith("(") and s.endswith(")"):
        neg = True
        s = s[1:-1]

    # Formato BR: "100.000,50" -> "100000.50"
    if re.search(r",\d{1,2}$", s):
        s = s.replace(".", "").replace(",", ".")

    # Caso "1234-02" (faltou 'e') -> "1234e-02"
    if re.match(r"^-?\d+(?:\.\d+)?-\d+$", s):
        s = re.sub(r"-(\d+)$", r"e-\1", s)

    # Mantém apenas dígitos, ponto, sinais e expoente
    s = re.sub(r"[^0-9eE\.\+\-]", "", s)

    if s in {"", "-", "+", ".", "e", "E"}:
        return None

    try:
        val = float(s)
        return -val if neg else val
    except ValueError:
        return None

def parse_date(v):
    if pd.isna(v) or str(v).strip() == "":
        return None
    try:
        # dayfirst=True para datas brasileiras
        return parse(str(v), dayfirst=True).date()
    except Exception:
        return None

def s(v):
    if pd.isna(v):
        return None
    t = str(v).strip()
    return t if t else None

def norm_cnpj(v):
    """Remove máscara do CNPJ. Retorna apenas dígitos (ou None)."""
    raw = s(v)
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    return digits or None

# ---- Mapeamento de colunas (exatos da sua planilha) ----
COLMAP = {
    "PI Matriz": "pi_matriz",
    "PI": "numero_pi",
    "Nome do Anunciante": "nome_anunciante",
    "Razão Social do Anunciante": "razao_social_anunciante",
    "CNPJ do Anunciante": "cnpj_anunciante",
    "UF Cliente": "uf_cliente",
    "Executivo": "executivo",
    "Diretoria": "diretoria",
    "Nome Campanha": "nome_campanha",
    "Nome da Agência": "nome_agencia",
    "Razão Social Agência": "razao_social_agencia",
    "CNPJ Agência": "cnpj_agencia",
    "UF Agência": "uf_agencia",
    "Data  inícial veiculação": "data_inicial_veiculacao",
    "Data Final Veiculação": "data_final_veiculacao",
    "Mes da venda": "mes_da_venda",
    "Mês Inicial de Veiculação": "mes_inicial_veiculacao",
    "Canal": "canal",
    "Perfil Anunciante": "perfil_anunciante",
    "Sub Perfil Anunciante": "subperfil_anunciante",
    "Produto": "produto",
    "Valor bruto": "valor_bruto",
    "Valor líquido": "valor_liquido",
    "Vencimento": "vencimento",
    "Data da venda": "data_da_venda",
    "Data de emissão/recebimento do PI": "data_emissao_recebimento",
    "Observações": "observacoes",
}

NUMERICOS = {"valor_bruto", "valor_liquido"}
DATAS = {"data_inicial_veiculacao","data_final_veiculacao","vencimento","data_da_venda","data_emissao_recebimento"}

def normaliza_headers(df: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    for col in df.columns:
        key = None
        for original, interno in COLMAP.items():
            if str(original).strip().lower() == str(col).strip().lower():
                key = interno
                break
        rename[col] = key if key else str(col).strip()
    return df.rename(columns=rename)

def upsert(db: Session, row: dict, row_index: int, warnings: list[dict], pendentes: dict[tuple, PI]) -> bool:
    """
    Retorna True se inseriu, False se atualizou.
    Chave composta:
      - Se tem CNPJ: (numero_pi, cnpj_anunciante)
      - Senão:       (numero_pi, nome_anunciante)
    Usa 'pendentes' para evitar duplicar durante a mesma execução.
    """
    numero = s(row.get("numero_pi"))
    if not numero:
        warnings.append({"linha": row_index, "coluna": "numero_pi", "valor": None, "motivo": "Sem número de PI — linha ignorada"})
        return False

    cnpj_raw = row.get("cnpj_anunciante")
    cnpj = norm_cnpj(cnpj_raw)  # normaliza para comparação/salvamento
    nome = s(row.get("nome_anunciante"))

    if cnpj:
        key = (numero, cnpj)
        q = db.query(PI).filter(PI.numero_pi == numero, PI.cnpj_anunciante == cnpj)
    else:
        key = (numero, nome)
        q = db.query(PI).filter(PI.numero_pi == numero, PI.nome_anunciante == nome)

    obj = pendentes.get(key)
    if obj is None:
        obj = q.first()

    payload = {}
    for k, v in row.items():
        if k in NUMERICOS:
            try:
                parsed = parse_brl(v)
                if parsed is None and (v is not None and str(v).strip() != ""):
                    warnings.append({"linha": row_index, "coluna": k, "valor": v, "motivo": "Valor numérico inválido — ignorado"})
                payload[k] = parsed
            except Exception as e:
                warnings.append({"linha": row_index, "coluna": k, "valor": v, "motivo": f"Erro ao parsear numérico: {e}"})
                payload[k] = None
        elif k in DATAS:
            parsed = parse_date(v)
            if parsed is None and (v is not None and str(v).strip() != ""):
                warnings.append({"linha": row_index, "coluna": k, "valor": v, "motivo": "Data inválida — ignorada"})
            payload[k] = parsed
        else:
            payload[k] = s(v)

    # sobrescreve cnpj_anunciante já normalizado
    payload["cnpj_anunciante"] = cnpj
    # garante numero_pi
    payload["numero_pi"] = numero

    if obj:
        for k, v in payload.items():
            setattr(obj, k, v)
        pendentes[key] = obj
        return False
    else:
        obj = PI(**payload)
        db.add(obj)
        db.flush()
        pendentes[key] = obj
        return True

def main(arquivo: str, aba: str | None):
    df = pd.read_excel(arquivo, sheet_name=aba) if aba else pd.read_excel(arquivo)
    df = normaliza_headers(df)

    # garantir todas as colunas internas
    internos = list(set(COLMAP.values()))
    for k in internos:
        if k not in df.columns:
            df[k] = None

    # manter apenas as colunas mapeadas
    df = df[internos]

    db = SessionLocal()
    warnings: list[dict] = []
    inseridos = 0
    atualizados = 0
    pulos_sem_pi = 0
    pendentes: dict[tuple, PI] = {}  # cache por (numero, cnpj) ou (numero, nome)

    try:
        for idx, (_, row) in enumerate(df.iterrows(), start=2):  # start=2 pois excel tipicamente tem header na 1
            before_ins = inseridos
            inserted = upsert(db, row.to_dict(), row_index=idx, warnings=warnings, pendentes=pendentes)
            if inserted:
                inseridos += 1
            else:
                # se não inseriu nem atualizou (porque faltou PI), contamos pulo
                if before_ins == inseridos and s(row.get("numero_pi")) is None:
                    pulos_sem_pi += 1
                else:
                    atualizados += 1

        db.commit()
        print(f"Importação concluída.")
        print(f" - Linhas processadas: {len(df)}")
        print(f" - Inseridos: {inseridos}")
        print(f" - Atualizados: {atualizados}")
        print(f" - Linhas ignoradas (sem PI): {pulos_sem_pi}")

        if warnings:
            warn_df = pd.DataFrame(warnings, columns=["linha", "coluna", "valor", "motivo"])
            out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "import_warnings.csv")
            warn_df.to_csv(out_path, index=False, encoding="utf-8-sig")
            print(f" - Avisos: {len(warnings)} (salvos em {out_path})")
        else:
            print(" - Avisos: 0")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Importa planilha de PIs para SQLite.")
    p.add_argument("--arquivo", required=True, help="Caminho do .xlsx")
    p.add_argument("--aba", required=False, help="Nome da aba (opcional)")
    args = p.parse_args()
    main(args.arquivo, args.aba)
