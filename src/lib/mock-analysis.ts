
export const MOCK_ANALYSIS: Record<'Low' | 'Medium' | 'High', string[]> = {
  "High": [
    `#### Incident Summary
A high-severity alert was triggered for **{{action}}** from the IP address **{{sourceIp}}**. This IP has a known history of malicious activity and is flagged by our threat intelligence feeds as part of a known botnet.

#### Recommended Actions
*   **Critical:** Immediately execute the "Block Known Malicious IP" playbook to prevent further access.
*   Investigate the target system for signs of compromise.
*   Review firewall logs for other connection attempts from this IP address.
*   Create a high-priority ticket for tracking this incident.`,
    `#### Incident Summary
We've observed multiple failed login attempts against a critical server, originating from **{{sourceIp}}**. This brute-force pattern, combined with the time of day, suggests a targeted effort to gain unauthorized access. The alert is critical.

#### Recommended Actions
*   Run the "Isolate Suspicious Instance" playbook to quarantine the affected server.
*   Temporarily block **{{sourceIp}}** at the network edge.
*   Review access logs on the target server to determine which accounts were targeted.
*   Ensure multi-factor authentication is enforced for all administrative accounts.`
  ],
  "Medium": [
    `#### Incident Summary
A medium-severity alert was triggered by unusual API activity from **{{sourceIp}}**. While this IP is not on a blocklist, the sequence of API calls is anomalous compared to baseline behavior, suggesting potential misuse of credentials.

#### Recommended Actions
*   Execute the "Create Investigation Ticket" playbook to formally track this event.
*   Notify the owner of the API key to validate the activity.
*   Monitor the IP for any further suspicious actions.
*   If the activity is confirmed as malicious, rotate the compromised credentials immediately.`,
    `#### Incident Summary
An alert for potential data exfiltration was triggered from **{{sourceIp}}**. A larger than normal volume of data was transferred out of the network. This could be a sign of a data breach in progress.

#### Recommended Actions
*   Create an investigation ticket immediately.
*   Analyze the nature of the outbound traffic to determine what data was accessed.
*   Review the user or service account associated with the traffic for other suspicious behavior.
*   Consider running the "Isolate Suspicious Instance" playbook if the activity is ongoing.`
  ],
  "Low": [
    `#### Incident Summary
A low-severity alert was noted for **{{action}}** from **{{sourceIp}}**. Our threat intelligence service reports no known threats from this IP. The activity appears to be isolated and is likely benign.

#### Recommended Actions
*   Run the "De-escalate Low-Severity Alerts" playbook to resolve this alert.
*   No immediate action is required, but the event is logged for trend analysis.
*   Continue monitoring for any correlated alerts.`,
    `#### Incident Summary
A user logged in from an unfamiliar geographic location (**{{sourceIp}}**). While this could be legitimate travel, it has been flagged as a low-severity alert for situational awareness.

#### Recommended Actions
*   This alert is for informational purposes.
*   If this user's activity becomes anomalous in other ways, this event can be used for additional context.
*   Consider closing this alert if no further suspicious activity is observed within 24 hours.`
  ]
};
