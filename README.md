# AI Cloud Threat Detector (CloudSentinel)

## Overview
**CloudSentinel** (AI Cloud Threat Detector) is a high-performance web application designed to provide real-time anomaly detection, threat intelligence, automated response playbooks, and AI-driven SOC co-pilot capabilities for cloud infrastructure. The application leverages Google Gemini via Firebase GenKit to deliver continuous security monitoring and incident response workflows.

## Key Features
- **Security Dashboard**: Real-time overview of security metrics, anomaly trends, recent events, and severity distributions.
- **Security Alerts**: Real-time triage console for correlated alerts with severity tagging, log trace links, and individual AI incident analysis.
- **AI Co-pilot**:
  - **Live Security Briefing**: Generates real-time narrative security briefings directly derived from and matching live Dashboard telemetry and date range filters.
  - **Interactive SOC Chat**: Real-time conversational agent capable of answering threat intelligence questions, recommending immediate containment strategies, and explaining anomalies.
  - **Live Radar**: Surfaces top attacking IPs and recurring anomaly signatures with quick-analysis triggers.
  - **Resilient AI Flow**: Includes dynamic fallback intelligence ensuring 100% data integrity even during network or quota constraints.
- **Automated Playbooks**: Pre-defined and AI-assisted workflows to automate incident containment (e.g., *Block Known Malicious IP*, *Isolate Suspicious Instance*).
- **Threat Simulation**: Built-in User Activity generator to simulate attack vectors (SQL Injection, Privilege Escalation, Data Exfiltration, Tampering) with instant multi-tab cross-session state synchronization.
- **Settings & Sensitivity**: Dynamic anomaly threshold tuning with real-time feedback loops.

## Project Structure
```
cloud-threat-detection/
├── apphosting.yaml
├── components.json
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── PROJECT_EXPLANATION.md
├── README.md
├── public/
├── src/
│   ├── ai/
│   │   ├── dev.ts
│   │   ├── genkit.ts
│   │   ├── flows/
│   │   │   ├── adjustable-anomaly-detection-sensitivity.ts
│   │   │   ├── adjustable-anomaly-threshold.ts
│   │   │   ├── alert-feedback-flow.ts
│   │   │   ├── automated-response-playbook-flow.ts
│   │   │   ├── copilot-briefing-flow.ts
│   │   │   ├── copilot-chat-flow.ts
│   │   │   ├── model-based-anomaly-scoring.ts
│   │   │   ├── real-time-anomaly-alerting.ts
│   │   │   ├── summarize-and-advise-flow.ts
│   │   │   ├── threat-intelligence-flow.ts
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   ├── actions.ts
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── alerts/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── page.tsx
│   │   │   ├── copilot/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── page.tsx
│   │   │   ├── playbooks/
│   │   │   │   ├── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   ├── user-activity/
│   │   │   ├── page.tsx
│   ├── components/
│   │   ├── date-range-picker.tsx
│   │   ├── grid-pattern.tsx
│   │   ├── logo.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── time-ago.tsx
│   │   ├── dashboard/
│   │   │   ├── anomaly-chart.tsx
│   │   │   ├── events-table.tsx
│   │   │   ├── kpi-cards.tsx
│   │   │   ├── recent-alerts.tsx
│   │   ├── ui/
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── mock-data.ts
│   │   ├── utils.ts
│   ├── types/
│   │   ├── index.ts
```

## Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/puneeth-sarji/Major-project.git
   cd Major-project
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   GOOGLE_API_KEY=your_google_gemini_api_key
   ```
   *Note: AI features utilize Google Gemini with fallback intelligence.*

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Start the Genkit Developer Console (Optional)**:
   ```bash
   npm run genkit:dev
   ```
   Accessible at `http://localhost:4000`.

## Architecture & Technologies
- **Frontend Framework**: Next.js 15 (App Router) + React 18
- **Styling & Design System**: Tailwind CSS, Radix UI Primitives, Lucide Icons, Glassmorphism backdrop filters
- **Visual Effects & Visualizations**: Recharts, Three.js / OGL ambient shaders
- **AI Framework**: Google Genkit with Gemini models (`googleai/gemini-2.5-flash`)
- **State & Synchronization**: Event-driven client-server synchronization across tabs with custom storage dispatchers

## License
MIT License.
