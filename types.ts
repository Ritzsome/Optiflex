
export enum MachineStatus {
  RUNNING = 'RUNNING',
  IDLE = 'IDLE',
  DOWN = 'DOWN',
  MAINTENANCE = 'MAINTENANCE'
}

export interface DowntimeEvent {
  id: string;
  timestamp: number;
  reason: string;
  durationMinutes: number;
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  
  // Configuration / Meta Data
  operatorName: string;
  partName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  breakStartTime: string;
  breakEndTime: string;

  // OEE Components (0-100)
  availability: number;
  performance: number;
  quality: number;
  oee: number;

  // Production
  totalParts: number;
  goodParts: number;
  defectParts: number;
  targetParts: number;
  partsPerMinute: number;

  // Energy
  energyConsumptionKw: number; // Current usage
  totalEnergyKwh: number; // Cumulative

  // Operational
  temperature: number; // Celsius
  vibration: number; // mm/s
  operatingTimeMinutes: number;
  
  // History
  downtimeLog: DowntimeEvent[];
  hourlyProduction: { hour: string; count: number }[];
  hourlyOEE: { hour: string; value: number }[]; // New field for Heatmap
  energyHistory: { time: string; value: number }[];
  oeeHistory: { time: string; value: number }[];
}

export interface PredictiveAlert {
  machineId: string;
  machineName: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  probability: number;
  issue: string;
  recommendation: string;
}

export interface FactoryState {
  machines: Machine[];
  totalOEE: number;
  activeAlarms: number;
  lastUpdated: number;
}

// Chat Interfaces
export interface ChatResponse {
  answer: string;
  type: 'text' | 'table' | 'barChart';
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  chartData?: {
    label: string;
    value: number;
  }[];
  chartTitle?: string;
  chartColor?: string;
  suggestedQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Rich content props
  type?: 'text' | 'table' | 'barChart';
  tableData?: { headers: string[]; rows: string[][] };
  chartData?: { label: string; value: number }[];
  chartTitle?: string;
  chartColor?: string;
  suggestions?: string[];
}
