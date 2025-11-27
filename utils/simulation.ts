
import { Machine, MachineStatus, DowntimeEvent } from '../types';

const TPM_LOSSES = [
  "Equipment Failure",
  "Setup and Adjustment",
  "Cutting Tool Replacement",
  "Startup Loss",
  "Minor Stoppages (Idling)",
  "Speed Reduction",
  "Defects and Rework",
  "Shutdown (Planned)",
  "Management Loss",
  "Operating Motion Loss",
  "Line Organization Loss",
  "Logistic Loss",
  "Measurement and Adjustment",
  "Energy Loss",
  "Die/Jig/Tool Breakage",
  "Yield Loss"
];

const ASSEMBLY_OPS = [
    "OP10 - Frame Load", "OP20 - Chassis Weld", "OP30 - Anti-Corrosion", "OP40 - Axle Mount", 
    "OP50 - Suspension", "OP60 - Engine Mount", "OP70 - Transmission", "OP80 - Exhaust Sys", 
    "OP90 - Heat Shield", "OP100 - Battery Pack", "OP110 - Wiring Harness", "OP120 - ECU Install",
    "OP130 - Fluid Fill", "OP140 - Wheel Assembly", "OP150 - Interior Trim", "OP160 - Glass Fitment",
    "OP170 - Door Mount", "OP180 - Dyno Test", "OP190 - Water Test", "OP200 - Final QC"
];

const generatePastDowntime = (count: number): DowntimeEvent[] => {
    return Array.from({length: count}, (_, i) => ({
        id: `past-${i}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        reason: TPM_LOSSES[Math.floor(Math.random() * TPM_LOSSES.length)],
        durationMinutes: 10 + Math.floor(Math.random() * 120)
    })).sort((a, b) => b.timestamp - a.timestamp);
};

const createMachine = (id: string, name: string, partName: string, isAssembly: boolean): Machine => {
    const performanceFactor = 0.8 + (Math.random() * 0.2); 
    const operators = ['John Doe', 'Jane Smith', 'Mike Ross', 'Sarah Connor', 'Tony Stark', 'Bruce Banner', 'Natasha R', 'Steve R'];

    return {
      id: id,
      name: name,
      status: Math.random() > 0.1 ? MachineStatus.RUNNING : MachineStatus.IDLE,
      
      // Config Defaults
      operatorName: operators[Math.floor(Math.random() * operators.length)],
      partName: partName,
      shiftStartTime: "08:00",
      shiftEndTime: "16:00",
      breakStartTime: "12:00",
      breakEndTime: "12:30",

      availability: (90 + Math.random() * 10) * performanceFactor,
      performance: (85 + Math.random() * 15) * performanceFactor,
      quality: (95 + Math.random() * 5) * performanceFactor,
      oee: 0, // calc later
      totalParts: Math.floor(Math.random() * 500) + 100,
      goodParts: 0, // calc later
      defectParts: 0,
      targetParts: isAssembly ? 2000 : 1000, // Assembly usually higher volume
      partsPerMinute: isAssembly ? 5 + Math.random() * 5 : 2 + Math.random() * 3,
      energyConsumptionKw: isAssembly ? 5 + Math.random() * 5 : 15 + Math.random() * 10, // Assembly robots use less power than CNC
      totalEnergyKwh: Math.floor(Math.random() * 1000),
      temperature: 30 + Math.random() * 15,
      vibration: 0.2 + Math.random() * 0.8,
      operatingTimeMinutes: 240,
      downtimeLog: generatePastDowntime(Math.floor(Math.random() * 5) + 2), 
      hourlyProduction: Array.from({length: 8}, (_, h) => ({ hour: `${h+8}:00`, count: Math.floor(Math.random() * (isAssembly ? 100 : 50)) })),
      hourlyOEE: Array.from({length: 8}, (_, h) => ({ 
          hour: `${h+8}:00`, 
          value: Math.min(100, Math.max(40, (75 + Math.random() * 25) * (Math.random() > 0.8 ? 0.6 : 1))) 
      })),
      energyHistory: Array.from({length: 20}, (_, t) => ({ time: new Date(Date.now() - (20-t)*60000).toISOString(), value: 20 + Math.random() * 5 })),
      oeeHistory: Array.from({length: 20}, (_, t) => ({ time: new Date(Date.now() - (20-t)*60000).toISOString(), value: 75 + Math.random() * 15 }))
    };
};

export const generateInitialMachines = (count: number): Machine[] => {
  // Legacy support if needed, defaults to CNC
  return generateCNCMachines();
};

export const generateCNCMachines = (): Machine[] => {
    const parts = ['Gearbox Housing', 'Piston Rod', 'Turbine Blade', 'Flange Adapter', 'Cylinder Head'];
    return Array.from({ length: 10 }, (_, i) => 
        createMachine(
            `CNC-${(i + 1).toString().padStart(2, '0')}`,
            `CNC Mill ${(i + 1).toString().padStart(2, '0')}`,
            parts[i % parts.length],
            false
        )
    ).map(updateCalculatedMetrics);
};

export const generateAssemblyStations = (): Machine[] => {
    return Array.from({ length: 20 }, (_, i) => 
        createMachine(
            `ASM-${(i + 1).toString().padStart(2, '0')}`,
            ASSEMBLY_OPS[i],
            "Model X Chassis",
            true
        )
    ).map(updateCalculatedMetrics);
};

const updateCalculatedMetrics = (m: Machine): Machine => {
  m.goodParts = m.totalParts - m.defectParts;
  m.quality = m.totalParts > 0 ? (m.goodParts / m.totalParts) * 100 : 100;
  m.oee = (m.availability / 100) * (m.performance / 100) * (m.quality / 100) * 100;
  return m;
};

export const updateSimulation = (machines: Machine[]): Machine[] => {
  const now = new Date();
  
  return machines.map(m => {
    let newStatus = m.status;
    
    // Random Status Change Logic (simplified)
    const rand = Math.random();
    if (m.status === MachineStatus.RUNNING && rand < 0.005) newStatus = MachineStatus.DOWN;
    else if (m.status === MachineStatus.DOWN && rand < 0.05) newStatus = MachineStatus.IDLE;
    else if (m.status === MachineStatus.IDLE && rand < 0.1) newStatus = MachineStatus.RUNNING;

    // Simulate Values based on Status
    let energy = m.energyConsumptionKw;
    let temp = m.temperature;
    let vib = m.vibration;
    let produced = 0;
    
    if (newStatus === MachineStatus.RUNNING) {
      energy = m.id.startsWith('ASM') ? 5 + Math.random() * 3 : 25 + Math.random() * 15; 
      temp = Math.min(85, temp + 0.1); 
      vib = m.id.startsWith('ASM') ? 0.5 + Math.random() * 0.5 : 2.0 + Math.random();
      
      // Production
      if (Math.random() > 0.6) {
        produced = 1;
        m.totalParts += 1;
        // Defect chance
        if (Math.random() < 0.01) m.defectParts += 1;
      }
    } else if (newStatus === MachineStatus.IDLE) {
      energy = 2 + Math.random(); 
      temp = Math.max(25, temp - 0.2); 
      vib = 0.1;
    } else {
       energy = 0.5;
       temp = Math.max(20, temp - 0.5);
       vib = 0;
    }

    // Downtime Log
    let downtimeLog = m.downtimeLog;
    if (newStatus === MachineStatus.DOWN && m.status !== MachineStatus.DOWN) {
        // New Downtime Event
        downtimeLog = [{
            id: Date.now().toString(),
            timestamp: Date.now(),
            reason: TPM_LOSSES[0], // Default
            durationMinutes: 0
        }, ...downtimeLog];
    } else if (m.status === MachineStatus.DOWN) {
         if (downtimeLog.length > 0) {
             const updatedLog = [...downtimeLog];
             updatedLog[0] = { ...updatedLog[0], durationMinutes: updatedLog[0].durationMinutes + 1 };
             downtimeLog = updatedLog;
         }
    }

    // Energy History
    const newEnergyPoint = { 
        time: now.toISOString(), 
        value: energy 
    };
    const energyHistory = [...m.energyHistory.slice(1), newEnergyPoint];

    // Hourly Production
    const hourlyProduction = [...m.hourlyProduction];
    if (produced) {
        const lastIdx = hourlyProduction.length - 1;
        hourlyProduction[lastIdx] = {
            ...hourlyProduction[lastIdx],
            count: hourlyProduction[lastIdx].count + 1
        };
    }

    const updatedMachine = updateCalculatedMetrics({
        ...m,
        status: newStatus,
        energyConsumptionKw: energy,
        temperature: temp,
        vibration: vib,
        energyHistory,
        downtimeLog,
        hourlyProduction
    });

    const newOeePoint = {
        time: now.toISOString(),
        value: updatedMachine.oee
    };
    const oeeHistory = [...m.oeeHistory.slice(1), newOeePoint];

    const hourlyOEE = [...m.hourlyOEE];
    if (hourlyOEE.length > 0) {
        hourlyOEE[hourlyOEE.length - 1] = {
            ...hourlyOEE[hourlyOEE.length - 1],
            value: updatedMachine.oee
        };
    }

    return {
        ...updatedMachine,
        oeeHistory,
        hourlyOEE
    };
  });
};
