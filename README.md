# 🔗🧠 ChainBrain

**AI-powered software supply-chain security platform** – understanding dependency risks in real application context.

---

## 📌 Overview

Traditional dependency scanners give you:

```text
Package → CVE → Severity
```

**ChainBrain goes deeper:**

```text
Dependency
    ↓
Security Analysis
    ↓
Vulnerability Detection
    ↓
Code Usage & Reachability
    ↓
Risk Assessment
    ↓
AI Explanation
    ↓
Recommended Remediation
```

> 🎯 **The goal**: answer the *useful* questions –  
> *Why is this dependency risky? How is it used in my app? Does the risky functionality actually matter? And what should I do about it?*

---

## 💡 Core Idea

ChainBrain combines **multiple layers** of software supply‑chain analysis:

- 📦 **Package intelligence** – suspicious characteristics  
- ⚙️ **Behavioural analysis** – potentially risky package behaviour  
- 🛡️ **Vulnerability intelligence** – known CVEs  
- 🔍 **Code analysis** – how dependencies are used  
- 📍 **Reachability analysis** – prioritize risks that can affect the application  
- 🤖 **AI‑powered explanations** – turn technical findings into actionable insights

---

## ✨ Key Features

### 🧩 Package Risk Analysis

Evaluates dependencies using multiple security signals:

- Package metadata & age  
- Maintainer information  
- Release activity  
- Installation scripts  
- Network activity  
- Command execution  
- Known vulnerabilities  
- Typosquatting similarity  

These signals help **prioritize packages** that deserve closer investigation.

### 🔎 Code & Reachability Analysis

Presence of a dependency **≠** practical risk.  
ChainBrain analyzes application code and dependency relationships to classify:

| Classification | Meaning |
|----------------|---------|
| **DIRECT**     | Explicitly imported by application code |
| **TRANSITIVE** | Introduced through another dependency |
| **REACHABLE**  | Relevant functionality can be reached from the app |
| **DORMANT**    | Present but not actively used |

> ✅ This lets you **prioritize security findings based on actual usage**.

### 🤖 AI Security Analysis

Uses **LLaMA 3.2** via **Ollama** as an explanation layer on top of deterministic analysis.  
The AI provides:

- Plain‑English vulnerability explanations  
- Project‑specific security context  
- Risk explanations  
- Remediation recommendations  
- Potential safer alternatives  

The AI **complements** deterministic analysis – it does *not* independently decide whether a package is vulnerable.

### 🧨 Attack Propagation Visualization *(planned)*

A safe, real‑time visualization of how a compromise could propagate through your dependency graph:

```text
Vulnerable Dependency
        ↓
Dependency Relationship
        ↓
Reachable Code
        ↓
Potential Attack Path
        ↓
Application Impact
```

> ⚠️ Designed for **security education and controlled simulation** – not a real exploit system.

### 💬 AI Chat Assistant

An interactive chat interface that answers **project‑context‑aware** questions about scan results:

- *Why is this package risky?*  
- *Is this vulnerability relevant to my app?*  
- *Which dependency should I address first?*  
- *What remediation should I consider?*

---

## 🏗️ Architecture

```text
                         ChainBrain
                             │
                             ▼
                      Project Upload
                             │
                             ▼
                      NestJS Backend
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        Dependency      Code Analysis    AI Layer
           Parser           Engine
              │              │              │
              ▼              ▼              ▼
        Package Risk     Reachability   AI Explanation
          Analysis         Analysis
              │              │
              └───────┬──────┘
                      │
                      ▼
               Security Results
                      │
                      ▼
              PostgreSQL + Prisma
                      │
                      ▼
               React Dashboard
                      │
             ┌────────┼────────┐
             │        │        │
             ▼        ▼        ▼
         Security  Dependency  AI Chat
          Insights    Graph
                         │
                         ▼
                  Attack Simulation
```

---

## 🔄 Analysis Flow

```text
Project ZIP
    ↓
Extraction
    ↓
Dependency Parsing
    ↓
Security Analysis
    ↓
Code / Reachability Analysis
    ↓
Risk Assessment
    ↓
AI Analysis
    ↓
Security Dashboard
```

---

## 📊 Dashboard

The interactive dashboard transforms scan results into information developers can quickly act on:

- 📋 Project information  
- 📈 Security metrics  
- 🎯 Risk distribution  
- ⚠️ Severity breakdown  
- 🔍 Vulnerability findings  
- 🧠 AI security summaries  
- 💡 AI recommendations  
- 🌐 Dependency relationships  
- 🧨 Attack visualization  
- 💬 AI chat assistance  

> The frontend design started from a Google Stitch‑generated interface and is being progressively converted into maintainable React + TypeScript components while preserving the original look.

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | NestJS, TypeScript, REST APIs |
| **Database** | PostgreSQL, Prisma |
| **AI** | LLaMA 3.2, Ollama |
| **Security Analysis** | AST Analysis, Dependency Analysis, CVE Analysis, Levenshtein Distance |
| **Development** | Git, GitHub, Postman, VS Code |

---

## 📁 Project Structure

```text
ChainBrain/
│
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   └── src/
│   │       ├── ai/
│   │       ├── parser/
│   │       ├── prisma/
│   │       ├── scanner/
│   │       └── upload/
│   │
│   └── frontend/
│       └── src/
│           ├── api/
│           ├── components/
│           ├── pages/
│           ├── store/
│           ├── styles/
│           └── types/
│
├── docs/
├── docker/
├── .github/
└── README.md
```

---

## 🚧 Current Status

**Active Development**

### ✅ Implemented / Established

- React + TypeScript frontend  
- Vite‑based frontend setup  
- NestJS backend  
- Project upload pipeline  
- Dependency parsing architecture  
- Scanner architecture  
- AI service  
- PostgreSQL and Prisma integration  
- Dashboard architecture  
- Security metrics and visualization components  
- Dependency table components  
- AI chat components  
- Theme support  
- Risk analysis foundations  

### 🔄 In Progress

- Complete frontend/backend integration  
- End‑to‑end real scan data flow  
- Complete code reachability analysis  
- Dependency graph  
- Vulnerability visualization  
- AI recommendations  
- Project‑context‑aware AI chat  
- Attack propagation visualization  
- Scan history  
- Report/export functionality  
- Additional security intelligence integrations  
- Production hardening  

---

## 🗺️ Roadmap

### 🔐 Core Security Analysis
- [ ] Complete package risk analysis  
- [ ] Expand vulnerability intelligence  
- [ ] Complete behavioural analysis  
- [ ] Complete typosquatting detection  
- [ ] Complete AST‑based reachability analysis  

### 📊 Security Dashboard
- [ ] Complete real‑time scan results  
- [ ] Complete vulnerability visualization  
- [ ] Build interactive dependency graph  
- [ ] Connect AI recommendations to live scan data  

### 🧨 Attack Visualization
- [ ] Generate attack paths from scan results  
- [ ] Visualize dependency propagation  
- [ ] Build real‑time attack simulation  
- [ ] Generate AI explanations for attack paths  

### 👨‍💻 Developer Experience
- [ ] Scan history  
- [ ] Rescanning  
- [ ] Report export  
- [ ] Project‑context‑aware AI assistant  
- [ ] Support for additional package ecosystems  

---

## 🌟 Vision

> ChainBrain aims to move software supply‑chain security **beyond simply reporting vulnerabilities**.  
> Instead of *“This package has a vulnerability.”*, we provide:  
> *“This dependency is risky, here is why, here is how it is used in your application, here is whether the relevant functionality is reachable, here is how the risk could propagate, here is the potential impact, and here is what you should do about it.”*

---

## ⚠️ Disclaimer

> ChainBrain's attack visualization is intended for **security education, analysis, and controlled simulation**. It does **not** execute real attacks against uploaded projects.

---

**ChainBrain** – Understand the dependency. Trace the risk. Act on it.