# AI Cloud Threat Detector (CloudSentinel) - Project Architecture & Technical Guide

## Introduction
**CloudSentinel** is an enterprise-grade cloud security intelligence and anomaly detection web application. It combines automated log stream monitoring, heuristic and AI-driven anomaly scoring, synchronized SOC dashboard metrics, interactive AI co-pilot advisory, and automated incident response playbooks.

---

## System Architecture

### 1. Frontend Layer
- **Framework**: Next.js 15 App Router with TypeScript for robust type safety and server actions.
- **Design System**: Tailwind CSS with custom glassmorphism styling, Radix UI accessible primitives, and responsive 12-column grid systems.
- **Data Visualizations**: Recharts for anomaly trend time series and incident breakdowns.
- **Date & Time Controls**: `date-fns` and `react-day-picker` powering synchronized timeframe queries across Dashboard and AI Co-pilot.

### 2. AI Intelligence Engine (Google Genkit + Gemini)
- **Framework**: [Google Genkit](https://firebase.google.com/docs/genkit) orchestrates modular AI flows in `src/ai/flows/`.
- **Primary Flows**:
  - `copilot-briefing-flow.ts`: Synthesizes live security posture briefings derived directly from dashboard event streams and alert metrics.
  - `copilot-chat-flow.ts`: Provides interactive SOC Q&A with live telemetry context and suggested tactical queries.
  - `summarize-and-advise-flow.ts`: Generates incident summaries and step-by-step remediation advice for individual alerts.
  - `threat-intelligence-flow.ts`: Checks suspicious IP addresses against simulated threat feeds.
  - `automated-response-playbook-flow.ts`: Simulates and executes automated security playbooks.
  - `adjustable-anomaly-detection-sensitivity.ts` & `alert-feedback-flow.ts`: Implements analyst feedback loops to dynamically tune sensitivity thresholds.

### 3. Telemetry & State Synchronization
- **Central Store**: `src/lib/mock-data.ts` manages normalized log events and alerts with consistent hydration seeding.
- **Reactive Syncing**: Integrates `cloudsentinel-update`, `storage`, and `focus` event listeners to ensure simulated attacks from `/user-activity` instantly propagate across Dashboard, Alerts, and AI Co-pilot views in real-time.
- **Metric Parity**: Strict calculation parity ensures that the **Total Events**, **Anomalies Detected**, **Alerts Sent**, and **High-Severity Alerts** displayed on the Dashboard precisely match the AI Co-pilot briefing data.

---

## AI Co-pilot Features & Layout

### Security Posture Briefing
- Ingests real-time filtered event telemetry.
- Highlights exact metric totals, critical active alerts, top attack signatures (e.g. `AUTH_LOGIN_SQL_INJECTION`, `PRIV_ESCALATION`, `DATA_EXPORT_USER_LIST`), and flagged attacker IPs.
- Delivers prioritized SOC directives (quarantine, playbook automation, credential rotation).

### Interactive SOC Co-pilot Chat
- Allows security analysts to ask tactical questions regarding active threats, dangerous source IPs, and mitigation strategies.
- Includes quick-query prompt chips for rapid investigation.

### Dashboard Alignment & Radar
- Mirrors the 4-column KPI cards from the Dashboard.
- Renders the **Active Critical Alerts** table with direct AI analysis triggers.
- Provides a live **Top Suspicious Source IPs** radar table.

---

## Setup & Running the Application

### Prerequisites
- Node.js (v18+)
- `npm`

### Environment Variables
Create a `.env` file in the root directory:
```bash
GOOGLE_API_KEY=your_google_gemini_api_key
```

### Commands
```bash
# Start development server
npm run dev

# Start Genkit developer tools (optional)
npm run genkit:dev

# Production build
npm run build
npm start
```
