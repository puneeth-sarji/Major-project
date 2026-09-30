
import { faker } from '@faker-js/faker';
import type { LogEvent, Alert } from '@/types';

import { startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// Seeding faker ensures that the same mock data is generated on the server and client, preventing hydration errors.
faker.seed(123);

const generateRandomLogEvent = (index: number): LogEvent => {
  const isAnomaly = faker.number.float() < 0.12; // ~12% chance of being an anomaly
  const action = isAnomaly
    ? faker.helpers.arrayElement([
        'AUTH_LOGIN_SQL_INJECTION',
        'PRIV_ESCALATION',
        'DATA_EXPORT_USER_LIST',
        'SECURITY_LOG_DISABLED',
        'FAILED_LOGIN_ATTEMPT',
        'UNAUTHORIZED_API_ACCESS',
        'DB_QUERY_BULK_EXPORT'
      ])
    : faker.helpers.arrayElement([
        'USER_LOGIN',
        'API_CALL_GET',
        'API_CALL_POST',
        'DB_QUERY',
        'FILE_UPLOAD',
        'USER_LOGOUT',
        'INSTANCE_CREATE'
      ]);

  return {
    id: `event-${index}-${faker.string.alphanumeric(8)}`,
    timestamp: faker.date.recent({ days: 30 }).toISOString(),
    sourceIp: faker.internet.ip(),
    action,
    status: isAnomaly ? 'Failure' : 'Success',
    anomalyScore: isAnomaly ? parseFloat(faker.number.float({ min: 0.75, max: 0.99 }).toFixed(2)) : parseFloat(faker.number.float({ min: 0.01, max: 0.4 }).toFixed(2)),
    country: faker.location.countryCode(),
  };
};

// Central store for mock events to ensure consistency between server and client
let mockLogEventsStore: LogEvent[] = Array.from({ length: 300 }, (_, index) => generateRandomLogEvent(index))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const filterEventsByDateRange = (events: LogEvent[], dateRange?: DateRange): LogEvent[] => {
  if (!dateRange || !dateRange.from) {
    return events;
  }

  let start = startOfDay(dateRange.from);
  let end = endOfDay(dateRange.to || dateRange.from);

  if (start > end) {
    const temp = start;
    start = startOfDay(dateRange.to!);
    end = endOfDay(temp);
  }

  const startTime = start.getTime();
  const endTime = end.getTime();

  return events.filter(event => {
    const eventTime = new Date(event.timestamp).getTime();
    return eventTime >= startTime && eventTime <= endTime;
  });
};


export const getMockLogEvents = (count: number): LogEvent[] => {
    // On the client, try to get from localStorage to persist across navigations
    if (typeof window !== 'undefined') {
        const storedEvents = localStorage.getItem('mockLogEvents');
        if (storedEvents) {
            try {
                const parsed: LogEvent[] = JSON.parse(storedEvents);
                const seen = new Set<string>();
                mockLogEventsStore = parsed.filter((event) => {
                    if (!event.id || seen.has(event.id)) {
                        return false;
                    }
                    seen.add(event.id);
                    return true;
                });
                return mockLogEventsStore.slice(0, count === 0 ? undefined : count);
            } catch (e) {
                console.error('Error parsing stored events:', e);
            }
        }
        // If not in storage, store the initial server-generated list
        localStorage.setItem('mockLogEvents', JSON.stringify(mockLogEventsStore));
    }
    // Return a slice of the requested count, or the whole list.
    return mockLogEventsStore.slice(0, count === 0 ? undefined : count);
};

export const addMockLogEvent = (event: Omit<LogEvent, 'id' | 'timestamp' | 'country' | 'sourceIp'>): LogEvent => {
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newEvent: LogEvent = {
        id: uniqueId,
        timestamp: new Date().toISOString(),
        sourceIp: faker.internet.ip(),
        country: faker.location.countryCode(),
        ...event
    };
    
    // Prepend the new event to the central store
    mockLogEventsStore = [newEvent, ...mockLogEventsStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('mockLogEvents', JSON.stringify(mockLogEventsStore));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('cloudsentinel-update'));
    }
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
      id: `alert-${log.id}`,
      timestamp: log.timestamp,
      severity: getSeverity(log.anomalyScore),
      description: getAlertDescription(log),
      sourceIp: log.sourceIp,
      logId: log.id,
    }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return alerts;
};
