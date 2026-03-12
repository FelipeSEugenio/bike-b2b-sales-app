# 🚴 Bike B2B Sales App

> Um projeto de portfólio Salesforce simulando um **fluxo completo de vendas B2B** — desde o catálogo de produtos até a conversão de cotação em pedido — construído com Apex, SOQL e Lightning Web Components (LWC).

🇺🇸 English: [README.md](README.md)

![Salesforce](https://img.shields.io/badge/Salesforce-00A1E0?style=for-the-badge&logo=salesforce&logoColor=white)
![Apex](https://img.shields.io/badge/Apex-1FAEDF?style=for-the-badge)
![LWC](https://img.shields.io/badge/LWC-032D60?style=for-the-badge)
![SOQL](https://img.shields.io/badge/SOQL-00A1E0?style=for-the-badge)
![Version](https://img.shields.io/badge/versão-3.0-blue?style=for-the-badge)

---

## 🧠 Visão Geral do Projeto

O **Bike B2B Sales App** é uma aplicação Salesforce que simula um processo completo de vendas B2B — desde a navegação pelo catálogo de produtos até a conversão de uma cotação em pedido.

Desenvolvido para demonstrar habilidades reais de desenvolvimento Salesforce, este projeto abrange:

- **Lógica de negócio no backend** utilizando camadas de serviço Apex e triggers enxutas
- **Interface frontend** construída com Lightning Web Components
- **Arquitetura escalável** seguindo as melhores práticas de desenvolvimento Salesforce
- **Fluxo de vendas completo**: navegação pelo catálogo → criação de cotação → conversão em pedido

> **Versão 3** introduz um fluxo de vendas totalmente integrado, incluindo validação de estoque, criação de cotações e conversão de Cotação em Pedido diretamente pelo catálogo.

---

## 💼 Cenário de Negócio

Uma distribuidora de bicicletas precisa de uma solução baseada em Salesforce para gerenciar suas operações de vendas B2B.

Os representantes de vendas precisam conseguir:

- Navegar por um catálogo interno com visibilidade de estoque em tempo real
- Criar cotações em rascunho em nome de contas clientes
- Adicionar produtos, definir quantidades e configurar preços
- Converter cotações aprovadas em pedidos sem sair da plataforma

Este projeto simula esse fluxo dentro de um org Salesforce, substituindo processos manuais baseados em planilhas por uma solução de CRM estruturada e automatizada.

---

## ✨ Funcionalidades

### 🚴 Catálogo de Bicicletas

- Grade de produtos responsiva com listagem de bicicletas
- Busca e filtragem de produtos
- Painel de detalhes do produto com informações completas
- Indicadores visuais de status de estoque em tempo real

### 📦 Gestão de Estoque

| Status               | Condição                    | Comportamento                |
| -------------------- | --------------------------- | ---------------------------- |
| 🟢 **Em Estoque**    | Quantidade acima do limite  | Criação de cotação permitida |
| 🟡 **Estoque Baixo** | Quantidade abaixo do limite | Aviso exibido ao usuário     |
| 🔴 **Sem Estoque**   | Quantidade = 0              | Criação de cotação bloqueada |

Os status de estoque são calculados automaticamente e exibidos como indicadores visuais na interface do catálogo.

### 💰 Criador de Cotações

Crie e gerencie cotações em rascunho diretamente pelo catálogo:

- Selecione uma **conta cliente**
- Adicione uma ou mais bicicletas à cotação
- Defina a quantidade por item
- Preço unitário preenchido automaticamente com base nos dados do produto
- Cálculo automático do **subtotal** por linha
- Recalculação automática do **total da cotação**

**Validações integradas:**

- Impede a cotação de produtos sem estoque
- Validação dos campos de quantidade e preço
- Notificações toast para feedback de sucesso e erro

### 🔄 Conversão de Cotação em Pedido _(V3)_

- Converta uma cotação finalizada em um **Pedido** com uma única ação
- Itens do pedido gerados automaticamente a partir dos itens da cotação
- Disponibilidade de estoque revalidada no momento da conversão
- Rastreabilidade mantida entre registros de cotação e pedido

---

## ⚙️ Tecnologias Utilizadas

| Tecnologia                              | Uso                                                       |
| --------------------------------------- | --------------------------------------------------------- |
| **Apex**                                | Lógica de negócio no backend, camada de serviço, triggers |
| **SOQL**                                | Consultas ao banco de dados via classes seletoras         |
| **Lightning Web Components (LWC)**      | Componentes de interface frontend                         |
| **JavaScript**                          | Lógica dos componentes LWC                                |
| **Salesforce DX (SFDX)**                | Estrutura do projeto e deploy                             |
| **Git**                                 | Controle de versão                                        |
| **VS Code + Salesforce Extension Pack** | Ambiente de desenvolvimento                               |

---

## 🏗 Arquitetura

A aplicação segue o padrão de **arquitetura em camadas**, separando responsabilidades entre camadas distintas:

```
┌─────────────────────────────────┐
│    Lightning Web Components     │  ← Camada de UI (bikeCatalog, bikeCard, quoteBuilder)
└────────────────┬────────────────┘
                 │ @wire / chamadas imperativas Apex
┌────────────────▼────────────────┐
│        Apex Controllers         │  ← Controllers enxutos que expõem métodos para o LWC
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│         Camada de Serviço       │  ← Lógica de negócio (BikeService, BikeQuoteService, BikeOrderService)
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│      Camada Seletora (SOQL)     │  ← Consultas centralizadas e reutilizáveis (BikeSelector)
└────────────────┬────────────────┘
                 │
┌────────────────▼────────────────┐
│         Objetos Customizados    │  ← Modelo de dados Salesforce
└─────────────────────────────────┘
```

**Decisões arquiteturais principais:**

- **Triggers enxutas** — toda a lógica de negócio delegada para classes de serviço
- **Classes seletoras** — todas as consultas SOQL centralizadas e reutilizáveis
- **Camada de serviço** — lógica de domínio encapsulada, independente da UI

---

## 🧩 Modelo de Dados

### Objetos Customizados

| Objeto               | Descrição                                                |
| -------------------- | -------------------------------------------------------- |
| `Bike__c`            | Catálogo de produtos — bicicletas disponíveis para venda |
| `Bike_Quote__c`      | Cabeçalho da cotação vinculado a uma Conta               |
| `Bike_Quote_Item__c` | Itens individuais dentro de uma cotação                  |
| `Bike_Order__c`      | Pedido gerado a partir de uma cotação confirmada         |
| `Bike_Order_Item__c` | Itens individuais dentro de um pedido                    |

### Campos Principais

| Campo               | Objeto               | Tipo             | Finalidade                                 |
| ------------------- | -------------------- | ---------------- | ------------------------------------------ |
| `Stock_Quantity__c` | `Bike__c`            | Número           | Nível atual de estoque                     |
| `Stock_Status__c`   | `Bike__c`            | Fórmula/Picklist | Indicador de disponibilidade               |
| `Unit_Price__c`     | `Bike_Quote_Item__c` | Moeda            | Preço por unidade                          |
| `Quantity__c`       | `Bike_Quote_Item__c` | Número           | Quantidade solicitada                      |
| `Subtotal__c`       | `Bike_Quote_Item__c` | Moeda            | Total da linha calculado automaticamente   |
| `Total_Amount__c`   | `Bike_Quote__c`      | Moeda            | Total da cotação calculado automaticamente |
| `Account__c`        | `Bike_Quote__c`      | Lookup           | Referência à conta do cliente              |

---

## 🖥 Lightning Web Components

| Componente     | Responsabilidade                                                    |
| -------------- | ------------------------------------------------------------------- |
| `bikeCatalog`  | Grade principal do catálogo — exibe todas as bicicletas disponíveis |
| `bikeCard`     | Card individual do produto com indicador de estoque                 |
| `bikeDetails`  | Painel de detalhes do produto com seção de Cotação Rápida           |
| `quoteBuilder` | Formulário de criação de cotação com gerenciamento de itens         |

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Salesforce CLI (`sf`) instalado
- VS Code com Salesforce Extension Pack
- Acesso a um Developer Org ou Scratch Org Salesforce

### Passo a Passo

**1. Clone o repositório**

```bash
git clone https://github.com/FelipeSEugenio/bike-b2b-sales-app.git
cd bike-b2b-sales-app
```

**2. Abra no VS Code**

```bash
code .
```

**3. Autentique com seu org Salesforce**

```bash
sf org login web
```

**4. Faça o deploy dos metadados para o org**

```bash
sf project deploy start
```

**5. Abra o org no navegador**

```bash
sf org open
```

---

## 🧪 Executando Testes

**Executar testes unitários Apex com cobertura de código:**

```bash
sf apex run test --code-coverage --result-format human
```

**Executar testes unitários LWC:**

```bash
npm run test:unit
```

---

## 📈 Roadmap

Melhorias planejadas para versões futuras:

- [ ] **Fluxo de cumprimento de pedidos** — rastrear o status do pedido através das etapas de fulfillment
- [ ] **Reserva de estoque** — reservar estoque quando uma cotação é criada
- [ ] **Faixas de preço por conta** — precificação personalizada por segmento de cliente
- [ ] **Geração de cotação em PDF** — exportar cotações como PDFs para download
- [ ] **UI/UX aprimorada** — filtragem, ordenação e design responsivo melhorados
- [ ] **Processo de aprovação** — fluxo de aprovação de cotação antes da conversão

---

## 👨‍💻 Autor

**Felipe Siqueira Eugênio**
Desenvolvedor Salesforce

`Apex` • `LWC` • `SOQL` • `CRM` • `Agentforce`

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/felipe-de-siqueira-eugenio/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/FelipeSEugenio)

---

> ⭐ Este projeto foi desenvolvido como um portfólio de Desenvolvedor Salesforce, demonstrando desenvolvimento backend com Apex, frontend com LWC, arquitetura em camadas e implementação de fluxo de vendas B2B completo.
