
import { faker } from '@faker-js/faker';
import type { LogEvent, Alert } from '@/types';

// Seeding faker ensures that the same mock data is generated on the server and client, preventing hydration errors.
faker.seed(123);

const generateRandomLogEvent = (index: number): LogEvent => {
  const isAnomaly = faker.number.float() < 0.1; // 10% chance of being an anomaly
  return {
    id: faker.string.uuid(),
    timestamp: faker.date.recent({ days: 7 }).toISOString(),
    sourceIp: faker.internet.ip(),
    action: faker.helpers.arrayElement([
      'USER_LOGIN',
      'API_CALL_GET',
      'API_CALL_POST',
      'DB_QUERY',
      'FILE_UPLOAD',
      'USER_LOGOUT',
      'FAILED_LOGIN_ATTEMPT',
      'INSTANCE_CREATE'
    ]),
    status: isAnomaly ? 'Failure' : 'Success',
    anomalyScore: isAnomaly ? parseFloat(faker.number.float({ min: 0.75, max: 0.99 }).toFixed(2)) : parseFloat(faker.number.float({ min: 0.01, max: 0.4 }).toFixed(2)),
    country: faker.location.countryCode(),
  };
};

// Central store for mock events to ensure consistency between server and client
let mockLogEventsStore: LogEvent[] = Array.from({ length: 200 }, (_, index) => generateRandomLogEvent(index))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

faker.seed(123); // Reset seed after initial generation


export const getMockLogEvents = (count: number): LogEvent[] => {
    // On the client, try to get from session storage to persist across navigations
    if (typeof window !== 'undefined') {
        const storedEvents = sessionStorage.getItem('mockLogEvents');
        if (storedEvents) {
            // Update the central store to match session storage if it exists
            mockLogEventsStore = JSON.parse(storedEvents);
            return mockLogEventsStore;
        }
        // If not in session storage, store the initial server-generated list
        sessionStorage.setItem('mockLogEvents', JSON.stringify(mockLogEventsStore));
    }
    // Return a slice of the requested count, or the whole list.
    return mockLogEventsStore.slice(0, count === 0 ? undefined : count);
};

export const addMockLogEvent = (event: Omit<LogEvent, 'id' | 'timestamp' | 'country' | 'sourceIp'>): LogEvent => {
    faker.seed(Date.now()); // Use a new seed for dynamic events
    const newEvent: LogEvent = {
        id: faker.string.uuid(),
        timestamp: new Date().toISOString(),
        sourceIp: faker.internet.ip(),
        country: faker.location.countryCode(),
        ...event
    };
    
    // Prepend the new event to the central store
    mockLogEventsStore = [newEvent, ...mockLogEventsStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('mockLogEvents', JSON.stringify(mockLogEventsStore));
    }
    faker.seed(123); // Reset to original seed
    return newEvent;
}


const getSeverity = (score: number): 'Low' | 'Medium' | 'High' => {
  if (score >= 0.9) return 'High';
  if (score > 0.75) return 'Medium';
  return 'Low';
};

const getAlertDescription = (log: LogEvent): string => {
  switch(log.action) {
    case 'AUTH_LOGIN_SQL_INJECTION':
      return `CRITICAL: A successful SQL Injection attack from ${log.sourceIp} allowed login access.`;
    case 'PRIV_ESCALATION':
      return `High-Risk Action: Privilege escalation attempt detected from ${log.sourceIp}.`;
    case 'DATA_EXPORT_USER_LIST':
      return `Potential Data Exfiltration: A large user data list was exported from ${log.sourceIp}.`;
    case 'SECURITY_LOG_DISABLED':
        return `CRITICAL: An attempt to disable security logging was made from ${log.sourceIp}.`;
    default:
      return `Unusual activity detected: ${log.action} from ${log.sourceIp} with score ${log.anomalyScore}.`;
  }
}

export const getMockAlerts = (logEvents: LogEvent[]): Alert[] => {
  const alerts = logEvents
    .filter(log => log.anomalyScore > 0.7)
    .map((log): Alert => ({
      id: faker.string.uuid(),
      timestamp: log.timestamp,
      severity: getSeverity(log.anomalyScore),
      description: getAlertDescription(log),
      sourceIp: log.sourceIp,
      logId: log.id,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  faker.seed(123);
  return alerts;
};
