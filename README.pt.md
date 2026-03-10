# 🚴 Bike B2B Sales App

Projeto de portfólio Salesforce que simula um **fluxo de vendas B2B com catálogo de produtos e geração de cotações**, utilizando Apex, SOQL e Lightning Web Components.

English: [README.md](README.md)

---

# 🧠 Visão Geral do Projeto

A aplicação simula um processo de vendas B2B dentro do Salesforce.

O usuário pode:

- Navegar pelo catálogo de bicicletas
- Ver disponibilidade de estoque
- Criar cotações (quotes)
- Adicionar produtos à cotação
- Calcular automaticamente o valor total

O objetivo do projeto é demonstrar **boas práticas de desenvolvimento Salesforce**.

---

# ✨ Funcionalidades

## 🚴 Catálogo de Bicicletas

- Listagem de bicicletas
- Busca e filtros
- Painel de detalhes do produto

## 📦 Gestão de Estoque

Controle de quantidade de estoque com cálculo automático de status.

Status:

| Status           | Descrição            |
| ---------------- | -------------------- |
| 🟢 Em estoque    | Produto disponível   |
| 🟡 Estoque baixo | Quantidade limitada  |
| 🔴 Sem estoque   | Produto indisponível |

---

## 💰 Criador de Cotação

Permite criar **cotações em modo Draft** diretamente do catálogo.

Funcionalidades:

- Seleção de Account
- Adição de bikes na cotação
- Definição de quantidade
- Preço preenchido automaticamente
- Cálculo automático de subtotal
- Cálculo automático do total da cotação

Validações:

- Não permite cotação para bike sem estoque
- Validação de quantidade
- Validação de preço
- Toasts de sucesso e erro

---

# 🏗 Arquitetura

O projeto utiliza uma arquitetura em camadas:

LWC (Interface)
↓
Controllers Apex
↓
Service Layer
↓
Selectors (SOQL)
↓
Objetos personalizados

Principais classes:

BikeSelector
BikeService
BikeOrderService
BikeQuoteService

Triggers mantêm lógica mínima e delegam regras para os serviços.

---

# 🧩 Modelo de Dados

Objetos utilizados:

Bike**c
Bike_Order**c
Bike_Order_Item**c
Bike_Quote**c
Bike_Quote_Item\_\_c

Campos importantes:

Stock_Quantity**c
Stock_Status**c
Quantity**c
Unit_Price**c
Subtotal**c
Total_Amount**c
Account\_\_c

---

# 🖥 Componentes LWC

Componentes principais:

bikeCatalog
bikeCard
bikeDetails
quoteBuilder

---

# ⚙️ Tecnologias

Salesforce DX
Apex
SOQL
Lightning Web Components
JavaScript
Git
VS Code

---

# 🚀 Como Rodar o Projeto

Clone o repositório:

git clone https://github.com/FelipeSEugenio/bike-b2b-sales-app.git

Abra o projeto:

cd bike-b2b-sales-app
code .

Login na org Salesforce:

sf org login web

Deploy do projeto:

sf project deploy start

Abrir a org:

sf org open

---

# 🧪 Testes

Executar testes Apex:

sf apex run test --code-coverage --result-format human

Executar testes LWC:

npm run test:unit

---

# 📈 Roadmap

Melhorias futuras:

- Conversão de Quote para Order
- Fluxo de fulfillment
- Reserva de estoque
- Preços por account
- Melhorias de interface

---

# 👨‍💻 Autor

Felipe Siqueira Eugênio

Salesforce Developer
Apex • LWC • SOQL • CRM • Agentforce
