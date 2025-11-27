
import React from 'react';
import { Machine } from '../types';
import { LayoutGrid } from 'lucide-react';

interface OEEHeatmapProps {
  machines: Machine[];
}

export const OEEHeatmap: React.FC<OEEHeatmapProps> = ({ machines }) => {
  const hours = machines[0]?.hourlyOEE.map(h => h.hour) || [];

  const getCellColor = (value: number) => {
    if (value >= 90) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30';
    if (value >= 70) return 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30';
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-700/50 p-2 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-slate-300" />
            </div>
            <div>
                <h3 className="font-bold text-white">OEE Heatmap (Hourly)</h3>
                <p className="text-slate-400 text-xs">Efficiency performance breakdown by hour</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/30 rounded"></div>
                    <span className="text-slate-400">&gt; 90%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded"></div>
                    <span className="text-slate-400">70-90%</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-rose-500/20 border border-rose-500/30 rounded"></div>
                    <span className="text-slate-400">&lt; 70%</span>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto pb-2">
            <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="flex mb-2">
                    <div className="w-24 shrink-0 font-medium text-xs text-slate-500 uppercase tracking-wider">Machine</div>
                    {hours.map((hour, idx) => (
                        <div key={idx} className="flex-1 text-center font-medium text-xs text-slate-500 uppercase tracking-wider">
                            {hour}
                        </div>
                    ))}
                </div>

                {/* Machine Rows */}
                <div className="space-y-2">
                    {machines.map((machine) => (
                        <div key={machine.id} className="flex items-center group">
                            <div className="w-24 shrink-0 text-sm font-medium text-slate-300 truncate pr-2" title={machine.name}>
                                {machine.name.replace("Machine ", "M-")}
                            </div>
                            {machine.hourlyOEE.map((data, idx) => (
                                <div key={idx} className="flex-1 px-1">
                                    <div 
                                        className={`h-10 w-full rounded-lg border flex items-center justify-center text-xs font-bold transition-all cursor-default ${getCellColor(data.value)}`}
                                        title={`${machine.name} @ ${data.hour}: ${data.value.toFixed(1)}%`}
                                    >
                                        {data.value.toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
