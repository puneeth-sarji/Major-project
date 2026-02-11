# AI Cloud Threat Detector

## Overview
AI Cloud Threat Detector is a web application designed to provide real-time anomaly detection, threat intelligence, and automated response playbooks for cloud security. The application leverages AI-driven insights to enhance security monitoring and response capabilities.

## Features
- **Dashboard**: Provides an overview of security metrics, anomaly trends, and recent events.
- **Alerts**: Displays real-time alerts with severity levels, timestamps, and AI analysis.
- **AI Co-pilot**: Offers AI-driven recommendations and insights for threat mitigation.
- **Playbooks**: Automates response workflows for common security incidents.
- **Settings**: Allows customization of application preferences.

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
├── public/
│   ├── next.svg
│   ├── vercel.svg
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
│   │   │   ├── model-based-anomaly-scoring.ts
│   │   │   ├── real-time-anomaly-alerting.ts
│   │   │   ├── summarize-and-advise-flow.ts
│   │   │   ├── threat-intelligence-flow.ts
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── actions.ts
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── alerts/
│   │   │   │   ├── page.tsx
│   │   │   ├── copilot/
│   │   │   │   ├── page.tsx
│   │   │   ├── playbooks/
│   │   │   │   ├── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
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
│   │   │   ├── settings/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   ├── user-activity/
│   │   │   ├── page.tsx
│   ├── components/
│   │   ├── DarkVeil.css
│   │   ├── DarkVeil.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── DecryptedText.jsx
│   │   ├── DotGrid.css
│   │   ├── DotGrid.jsx
│   │   ├── DotGrid.tsx
│   │   ├── grid-pattern.tsx
│   │   ├── LetterGlitch.tsx
│   │   ├── LightRays.css
│   │   ├── LightRays.jsx
│   │   ├── logo.tsx
│   │   ├── PixelBlast.css
│   │   ├── PixelBlast.tsx
│   │   ├── Prism.css
│   │   ├── Prism.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── time-ago.tsx
│   │   ├── dashboard/
│   │   │   ├── anomaly-chart.tsx
│   │   │   ├── anomaly-chat.tsx
│   │   │   ├── events-table.tsx
│   │   │   ├── kpi-cards.tsx
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── tooltip.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── mock-analysis.ts
│   │   ├── mock-data.ts
│   │   ├── utils.ts
│   ├── types/
│   │   ├── index.ts
```

## Installation

For a detailed project overview and architecture explanation, please refer to [PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md).

1. Clone the repository:
   ```bash
   git clone https://github.com/puneeth-sarji/Major-project.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Major-project
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Google AI API Key:
   ```bash
   GOOGLE_API_KEY=your_google_gemini_api_key
   ```
   *Note: AI features (Copilot, Playbooks) require a valid API key.*

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Open the application in your browser at `http://localhost:3000`.

3. Start the Genkit (AI) server:
   ```bash
   npm run genkit:dev
   ```
   *The Genkit Developer UI will be available at http://localhost:4000.*


## Technologies Used
- **Next.js**: React framework for server-side rendering and static site generation.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Recharts**: Library for building charts and visualizations.
- **Firebase**: Backend services for authentication and data storage.

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Add feature-name"
   ```
4. Push to your forked repository:
   ```bash
   git push origin feature-name
   ```
5. Create a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Contact
For any inquiries or support, please contact (mailto:puneethsarji@gmail.com).
