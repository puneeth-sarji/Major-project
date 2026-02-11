# AI Cloud Threat Detector - Project Overview

## Introduction
**AI Cloud Threat Detector** is a cutting-edge web application designed to monitor, detect, and respond to cloud security threats in real-time. It leverages advanced AI models (Google Gemini via Genkit) to provide intelligent insights, anomaly detection, and automated incident response playbooks.

This project is built with a modern tech stack ensuring high performance, scalability, and a premium user experience.

## Architecture & Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) for server-side rendering and static site generation.
- **Language**: TypeScript for type-safety and developer experience.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling, combined with `tailwindcss-animate` for smooth transitions.
- **UI Components**: Built on [Radix UI](https://www.radix-ui.com/) primitives for accessible, unstyled components, and utilizing [Lucide React](https://lucide.dev/) for icons.
- **Visualizations**: [Recharts](https://recharts.org/) for data-rich charts and graphs.

### Backend & Services
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth) for secure user management.
- **Database**: [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore) (implied usage via Firebase SDK).
- **AI Integration**: [Google Genkit](https://firebase.google.com/docs/genkit) framework to orchestrate AI flows and interact with Google's Gemini models.

### Key Directories
- `src/app`: Application routes and pages (Next.js App Router).
- `src/components`: Reusable UI components and feature-specific widgets.
- `src/ai`: Genkit flows and AI logic.
- `src/lib`: Utility functions and Firebase configuration.

## Key Features

1.  **Real-Time Dashboard**:
    -   Visualizes security metrics and anomaly trends.
    -   Displays recent security events with severity levels.

2.  **AI Co-pilot**:
    -   Provides an interactive chat interface for security analysts.
    -   Generates live briefings on the current security posture using Genkit flows.
    -   *Note: Requires a valid Google AI API Key.*

3.  **Automated Playbooks**:
    -   Pre-defined workflows to handle common threats (e.g., "Block Known Malicious IP").
    -   AI-driven execution and decision-making.

4.  **Mock Threat Generation**:
    -   Built-in tools to simulate security threats (e.g., SQL Injection, CEO Fraud) for testing and demonstration purposes.

## Setup & Configuration

### Prerequisites
- Node.js (v18 or later recommended)
- `npm` or `yarn`

### Environment Variables
The application requires a `.env` file in the root directory with the following variable:
```bash
GOOGLE_API_KEY=your_google_gemini_api_key
```
*Without this key, AI features (Copilot, Playbooks) will not function.*

### Running the Project

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    *Starts the Next.js app on http://localhost:3000.*

3.  **Run Genkit (AI) Server**:
    ```bash
    npm run genkit:dev
    ```
    *Starts the Genkit developer UI on http://localhost:4000.*

4.  **Production Build**:
    ```bash
    npm run build
    npm start
    ```

## Troubleshooting

-   **AI Features Not Working**: Ensure `GOOGLE_API_KEY` is set in `.env` and restart the server. Check the Genkit dashboard (http://localhost:4000) for flow traces.
-   **Build Errors**: If using an older Node version, ensure you are on v18+. Clear `.next` cache if issues persist (`rm -rf .next`).
