# 🚴 Bike B2B Sales App

Salesforce portfolio project simulating a **B2B product catalog and quote workflow** using Apex, SOQL and Lightning Web Components (LWC).

This project demonstrates how to build a structured Salesforce application with **backend business logic, frontend UI, and scalable architecture**.

Português: [README.pt.md](README.pt.md)

---

# 🧠 Project Overview

The application simulates a simplified **B2B sales process** inside Salesforce.

Users can:

- Browse a bike product catalog
- Check stock availability
- Create draft quotes
- Add bikes to a quote
- Automatically calculate quote totals

The goal of this project is to demonstrate **Salesforce development best practices** including Apex services, thin triggers, and LWC UI integration.

---

# ✨ Features

## 🚴 Bike Catalog

- Bike catalog grid
- Search and filtering
- Bike detail panel

## 📦 Stock Management

- Track stock quantity
- Automatic stock status calculation

Stock statuses:

| Status          | Description          |
| --------------- | -------------------- |
| 🟢 In Stock     | Product available    |
| 🟡 Low Stock    | Limited availability |
| 🔴 Out of Stock | Product unavailable  |

Visual badges are displayed directly in the catalog.

---

## 💰 Quote Builder

Create and manage **Draft Quotes** directly from the catalog.

Capabilities:

- Select **Account**
- Add bikes to quote
- Define quantity
- Prefill price from bike price
- Automatic subtotal calculation
- Automatic quote total calculation

Safeguards:

- Cannot create quotes for out-of-stock bikes
- Quantity validation
- Price validation
- Success and error toast messages

---

# 🏗 Architecture

The project follows a layered architecture:

LWC (UI)
↓
Apex Controllers
↓
Service Layer
↓
Selectors (SOQL queries)
↓
Custom Objects

Core Apex classes:

BikeSelector
BikeService
BikeOrderService
BikeQuoteService

Triggers are kept **thin**, delegating business logic to services.

---

# 🧩 Data Model

Custom objects used:

Bike**c
Bike_Order**c
Bike_Order_Item**c
Bike_Quote**c
Bike_Quote_Item\_\_c

Important fields:

Stock_Quantity**c
Stock_Status**c
Quantity**c
Unit_Price**c
Subtotal**c
Total_Amount**c
Account\_\_c

---

# 🖥 Lightning Web Components

Main UI components:

bikeCatalog
bikeCard
bikeDetails
quoteBuilder

UI capabilities include:

- Catalog grid
- Stock status badges
- Bike detail panel
- Quote builder

---

# ⚙️ Technologies Used

Salesforce DX
Apex
SOQL
Lightning Web Components (LWC)
JavaScript
Git
VS Code

---

# 🚀 Running the Project

Clone repository:

git clone https://github.com/FelipeSEugenio/bike-b2b-sales-app.git

Open project:

cd bike-b2b-sales-app
code .

Login to Salesforce org:

sf org login web

Deploy metadata:

sf project deploy start

Open the org:

sf org open

---

# 🧪 Tests

Run Apex tests:

sf apex run test --code-coverage --result-format human

Run LWC tests:

npm run test:unit

---

# 📈 Roadmap

Future improvements planned:

- Quote → Order conversion
- Order fulfillment workflow
- Inventory reservation
- Account pricing tiers
- Enhanced UI/UX

---

# 📸 Screenshots

![alt text](image-2.png)
![alt text](image-3.png)

---

# 👨‍💻 Author

Felipe Siqueira Eugênio

Salesforce Developer
Apex • LWC • SOQL • CRM • Agentforce

LinkedIn
GitHub

---

# ⭐ Purpose of This Project

This project was built as a **Salesforce Developer portfolio project** demonstrating:

- Apex backend development
- LWC frontend development
- Business logic implementation
- Git version control workflow
- Salesforce architecture best practices
