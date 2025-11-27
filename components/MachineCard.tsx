
import React from 'react';
import { Machine, MachineStatus } from '../types';
import { Activity, AlertTriangle, Clock, Settings, Box } from 'lucide-react';

interface MachineCardProps {
  machine: Machine;
  onClick: (id: string) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onClick }) => {
  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.RUNNING: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case MachineStatus.IDLE: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case MachineStatus.DOWN: return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case MachineStatus.MAINTENANCE: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.RUNNING: return <Activity className="w-4 h-4" />;
      case MachineStatus.IDLE: return <Clock className="w-4 h-4" />;
      case MachineStatus.DOWN: return <AlertTriangle className="w-4 h-4" />;
      case MachineStatus.MAINTENANCE: return <Settings className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const isAssembly = machine.id.startsWith('ASM');

  return (
    <div 
        onClick={() => onClick(machine.id)}
        className="group relative bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all cursor-pointer overflow-hidden"
    >
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${
            machine.status === MachineStatus.RUNNING ? 'bg-emerald-500' :
            machine.status === MachineStatus.IDLE ? 'bg-amber-500' :
            machine.status === MachineStatus.DOWN ? 'bg-rose-500' : 'bg-blue-500'
        }`} />

        <div className="flex justify-between items-start mb-4 pl-2">
            <div>
                <h3 className="font-semibold text-slate-100 truncate w-32 md:w-40">{machine.name}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    {isAssembly ? <Box className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                    {isAssembly ? 'Assembly Station' : 'CNC Vertical Mill'}
                </p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(machine.status)}`}>
               {getStatusIcon(machine.status)}
               <span className="hidden sm:inline">{machine.status}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pl-2">
            <div>
                <p className="text-xs text-slate-500 mb-1">OEE Efficiency</p>
                <div className="flex items-end gap-1">
                    <span className={`text-2xl font-bold ${
                        machine.oee >= 85 ? 'text-emerald-400' : 
                        machine.oee >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>{machine.oee.toFixed(1)}%</span>
                </div>
                
                {/* OEE Breakdown */}
                <div className="flex flex-col gap-0.5 mt-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Avail</span>
                        <span className="text-slate-300 font-medium">{machine.availability.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Perf</span>
                        <span className="text-slate-300 font-medium">{machine.performance.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Qual</span>
                        <span className="text-slate-300 font-medium">{machine.quality.toFixed(0)}%</span>
                    </div>
                </div>
            </div>
            <div>
                <p className="text-xs text-slate-500 mb-1">Production</p>
                <div className="flex items-end gap-1">
                    <span className="text-xl font-bold text-slate-200">{machine.totalParts}</span>
                    <span className="text-xs text-slate-500 mb-1">/ {machine.targetParts}</span>
                </div>
                
                <div className="mt-4">
                     <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((machine.totalParts / machine.targetParts) * 100)}%</span>
                     </div>
                     <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                 machine.status === MachineStatus.DOWN ? 'bg-rose-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (machine.totalParts / machine.targetParts) * 100)}%` }}
                        />
                     </div>
                </div>
            </div>
        </div>

        {/* Energy Sparkline (Simulated visual) */}
        <div className="mt-4 pt-3 border-t border-slate-700/50 pl-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Power:</span>
                <span className="text-sm font-mono text-slate-200">{machine.energyConsumptionKw.toFixed(1)} kW</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Temp:</span>
                <span className={`text-sm font-mono ${machine.temperature > 60 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {machine.temperature.toFixed(1)}°C
                </span>
            </div>
        </div>
    </div>
  );
};
