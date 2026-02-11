export type LogEvent = {
  id: string;
  timestamp: string;
  sourceIp: string;
  action: string;
  status: 'Success' | 'Failure';
  anomalyScore: number;
  country: string;
};

export type Alert = {
  id: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  sourceIp: string;
  logId: string;
};
