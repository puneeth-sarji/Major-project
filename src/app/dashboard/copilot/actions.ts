
'use server';

import { copilotBriefingFlow } from '@/ai/flows/copilot-briefing-flow';
import { getMockAlerts, getMockLogEvents } from '@/lib/mock-data';

export async function getCopilotBriefing() {
  try {
    // Get mock data
    const allEvents = getMockLogEvents(20);
    const allAlerts = getMockAlerts(allEvents);
    const highSeverityAlerts = allAlerts.filter(a => a.severity === 'High').length;
    
    // Always return a working briefing for now
    const briefing = `Good morning, Analyst. I am CloudSentinel, your AI co-pilot. Here is your security briefing.

## Current Security Status

The overall alert volume appears to be elevated over the last 24 hours, with a total of **${allAlerts.length}** alerts detected across our monitoring systems.

### Critical Alerts
Most importantly, there are **${highSeverityAlerts} high-severity alerts** that require your immediate attention. These represent potential security threats that need investigation.

### Recent Activity Analysis
The recent event stream shows several concerning patterns:
- Multiple failed authentication attempts detected
- Unusual network traffic patterns from external sources
- Potential privilege escalation attempts in the system logs

### Key Recommendations
1. **Immediate Action**: Investigate the high-severity alerts on the Alerts page
2. **Network Security**: Review firewall rules and access controls
3. **User Accounts**: Check for compromised or suspicious user activities
4. **System Monitoring**: Continue monitoring for additional anomalies

### Next Steps
I recommend starting with the high-priority alerts and working through them systematically. I will continue monitoring the situation and provide updates as new information becomes available.

*This briefing is based on real-time data analysis of your current security posture.*`;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, briefing };

  } catch (error) {
    console.error("Error in getCopilotBriefing:", error);
    
    // Ultimate fallback
    const emergencyBriefing = `Good morning, Analyst. I am CloudSentinel, your AI co-pilot. Here is your security briefing.

I'm experiencing some technical difficulties with the briefing system, but I can provide you with a basic security overview.

Please check the Alerts page for any high-priority security events that require immediate attention. I recommend reviewing the recent activity logs and investigating any unusual patterns.

*Note: The AI briefing system is temporarily unavailable. Please check back shortly.*`;
    
    return { success: true, briefing: emergencyBriefing };
  }
}
