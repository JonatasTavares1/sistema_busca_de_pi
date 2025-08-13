const API = "http://localhost:8000";

const el = (sel) => document.querySelector(sel);
const fmtBRL = (v) =>
  v == null ? "-" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseDateSafe = (val) => {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{4}-\d{2}$/.test(s)) return new Date(`${s}-01T00:00:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00`);
  const d = new Date(s);
  return isNaN(d) ? null : d;
};
const capitalizeFirst = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);
const fmtDate = (v) => {
  const d = parseDateSafe(v);
  return d ? d.toLocaleDateString("pt-BR") : "-";
};
const fmtMonthYear = (v) => {
  const d = parseDateSafe(v);
  if (!d) return "-";
  return capitalizeFirst(d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
};
const toInputDate = (v) => {
  const d = parseDateSafe(v);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

async function buscar() {
  const numero = el("#piInput").value.trim();
  const out = el("#resultado");
  out.innerHTML = "";
  if (!numero) return;

  out.innerHTML = `<div class="notfound" style="color:#9ca3af">Carregando...</div>`;

  try {
    const url = `${API}/pi/${encodeURIComponent(numero)}`;
    const resp = await fetch(url);

    if (resp.status === 404) {
      out.innerHTML = `<div class="notfound">Nenhum PI encontrado.</div>`;
      return;
    }
    if (!resp.ok) throw new Error("Falha na API");

    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      out.innerHTML = `<div class="notfound">Nenhum PI encontrado.</div>`;
      return;
    }

    const cards = data.map((x) => `
      <div class="card" data-id="${x.id}">
        <form class="edit-form" data-pi="${x.id}">
          <div class="grid">
            <div class="label">PI</div><div class="value">${x.numero_pi}</div>
            <div class="label">PI Matriz</div><div class="value">${x.pi_matriz ?? "-"}</div>
            <div class="label">Anunciante</div><div class="value">${x.nome_anunciante ?? "-"}</div>
            <div class="label">CNPJ Anunciante</div><div class="value">${x.cnpj_anunciante ?? "-"}</div>
            <div class="label">Executivo</div><div class="value">${x.executivo ?? "-"}</div>
            <div class="label">Diretoria</div><div class="value">${x.diretoria ?? "-"}</div>
            <div class="label">Campanha</div><div class="value">${x.nome_campanha ?? "-"}</div>
            <div class="label">Agência</div><div class="value">${x.nome_agencia ?? "-"}</div>

            <div class="label">Mês da Venda</div><div class="value highlight">${fmtMonthYear(x.mes_da_venda)}</div>
            <div class="label">Valor bruto</div><div class="value">${fmtBRL(x.valor_bruto)}</div>
            <div class="label">Valor líquido</div><div class="value">${fmtBRL(x.valor_liquido)}</div>
            <div class="label">Início veiculação</div><div class="value">${fmtDate(x.data_inicial_veiculacao)}</div>
            <div class="label">Fim veiculação</div><div class="value">${fmtDate(x.data_final_veiculacao)}</div>
            <div class="label">Data da venda</div><div class="value">${fmtDate(x.data_da_venda)}</div>
            <div class="label">Vencimento</div><div class="value">${fmtDate(x.vencimento)}</div>

            <div class="label">Observações</div><div class="value highlight">${x.observacoes ?? "-"}</div>

            <!-- Novos campos editáveis -->
            <div class="label">Data Pulsar</div>
            <div class="value"><input type="date" name="data_pulsar" value="${toInputDate(x.data_pulsar)}" /></div>

            <div class="label">Data de Pagamento</div>
            <div class="value"><input type="date" name="data_pagamento" value="${toInputDate(x.data_pagamento)}" /></div>

            <div class="label">Nota Fiscal</div>
            <div class="value"><input type="text" name="nota_fiscal" value="${x.nota_fiscal ?? ""}" placeholder="Ex.: 12345" /></div>

            <div class="label"></div>
            <div class="value"><button type="submit" class="salvar-btn">Salvar</button></div>
          </div>
        </form>
      </div>
    `).join("");

    const header = `<div style="margin-top:16px;color:#9ca3af">${data.length} registro${data.length>1?"s":""} encontrado${data.length>1?"s":""}</div>`;
    out.innerHTML = header + cards;

  } catch (e) {
    out.innerHTML = `<div class="notfound">Erro ao buscar. Verifique se a API está rodando.</div>`;
  }
}

el("#buscarBtn").addEventListener("click", buscar);
el("#piInput").addEventListener("keydown", (e) => { if (e.key === "Enter") buscar(); });

// Submit de cada form/card → PATCH
document.addEventListener("submit", async (e) => {
  const form = e.target.closest(".edit-form");
  if (!form) return;
  e.preventDefault();

  const btn = form.querySelector(".salvar-btn");
  const piId = Number(form.dataset.pi);
  const get = (name) => form.querySelector(`[name="${name}"]`)?.value || null;

  const payload = {
    data_pulsar: get("data_pulsar"),
    data_pagamento: get("data_pagamento"),
    nota_fiscal: get("nota_fiscal"),
  };

  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = "Salvando...";

  try {
    const resp = await fetch(`${API}/pi/${piId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error("Falha ao salvar");
    await resp.json();
    btn.textContent = "Salvo ✔";
    setTimeout(() => (btn.textContent = oldText), 1200);
  } catch (err) {
    console.error(err);
    btn.textContent = "Erro ao salvar";
    setTimeout(() => (btn.textContent = oldText), 1500);
  } finally {
    btn.disabled = false;
  }
});
