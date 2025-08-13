# 🔎 Sistema de Busca de PIs

Este projeto é uma aplicação simples para **consulta de Pedidos de Inserção (PIs)** a partir de uma API, com interface web em HTML/CSS/JS e integração com um banco de dados SQLite.

O objetivo é permitir a pesquisa rápida de PIs pelo **número** (e futuramente outros filtros, como CNPJ do cliente), retornando todos os registros correspondentes — inclusive casos onde diferentes clientes possuam o mesmo número de PI.

---

## 📂 Estrutura do Projeto

.
├── backend/ \
│ ├── main.py # API FastAPI para consulta dos PIs \
│ ├── database.py # Configuração do banco SQLite \
│ ├── models.py # Modelos SQLAlchemy \
│ ├── scripts/ \ 
│ │ └── import_excel.py # Script para importar dados de planilhas Excel \
│ ├── banco.db # Banco de dados SQLite com os PIs \
│ └── requirements.txt # Dependências do backend \
└── public/ \
├── index.html # Página de busca de PI \
├── script.js # Lógica para requisições à API e renderização dos resultados \
└── style.css (opcional) # Estilos adicionais 

---

## 🚀 Tecnologias Utilizadas

**Backend**
- [Python 3.12+](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- SQLite

**Frontend**
- HTML5
- CSS3
- JavaScript (Fetch API)
