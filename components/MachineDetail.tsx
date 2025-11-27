
import React, { useState, useEffect } from 'react';
import { Machine, MachineStatus } from '../types';
import { X, Cpu, Activity, Thermometer, Zap, AlertTriangle, Layers, TrendingUp, User, Clock, Box, PenTool } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, AreaChart, Area } from 'recharts';
import { getMachineRecommendations } from '../services/geminiService';

// Simplified markdown renderer
const SimpleMarkdown = ({ content }: { content: string }) => {
    return (
        <div className="prose prose-invert prose-sm max-w-none">
            {content.split('\n').map((line, i) => (
                <p key={i} className="mb-2 text-slate-300 text-sm leading-relaxed">
                    {line}
                </p>
            ))}
        </div>
    );
};

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

interface MachineDetailProps {
  machine: Machine | undefined;
  onClose: () => void;
  onUpdateMachine?: (id: string, updates: Partial<Machine>) => void;
}

export const MachineDetail: React.FC<MachineDetailProps> = ({ machine, onClose, onUpdateMachine }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (machine) {
        setAiAnalysis(""); 
    }
  }, [machine]);

  const handleAnalyze = async () => {
    if (!machine) return;
    setLoadingAi(true);
    const result = await getMachineRecommendations(machine);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleUpdateDowntimeReason = (reason: string) => {
    if (!machine || !onUpdateMachine || machine.downtimeLog.length === 0) return;
    
    // Create a copy of the log and update the most recent event (index 0)
    const newLog = [...machine.downtimeLog];
    newLog[0] = { ...newLog[0], reason: reason };
    
    onUpdateMachine(machine.id, { downtimeLog: newLog });
  };

  if (!machine) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-4">
             <div className={`w-3 h-3 rounded-full ${
                machine.status === MachineStatus.RUNNING ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' :
                machine.status === MachineStatus.IDLE ? 'bg-amber-500' : 'bg-rose-500'
             }`} />
             <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    {machine.name}
                    <span className="text-sm font-normal text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800">
                        {machine.id}
                    </span>
                </h2>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                        <User className="w-3 h-3" /> Op: {machine.operatorName}
                    </p>
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                         <Box className="w-3 h-3" /> Part: {machine.partName}
                    </p>
                </div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
            
            {/* Config & Status Bar */}
            <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 mb-6">
                 <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>Shift: <span className="text-slate-200">{machine.shiftStartTime} - {machine.shiftEndTime}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <span>Break: <span className="text-slate-200">{machine.breakStartTime} - {machine.breakEndTime}</span></span>
                    </div>
                 </div>
                 <div className="text-xs font-mono text-slate-500">Config loaded</div>
            </div>

            {/* Downtime Categorization (Only visible when DOWN) */}
            {machine.status === MachineStatus.DOWN && (
                <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl mb-6 animate-in slide-in-from-top-2">
                    <div className="flex items-start md:items-center flex-col md:flex-row gap-4 justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-500/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-rose-100">Machine is DOWN</h3>
                                <p className="text-sm text-rose-300/70">Current Duration: {machine.downtimeLog[0]?.durationMinutes} min</p>
                            </div>
                        </div>
                        
                        <div className="w-full md:w-auto flex flex-col gap-1">
                            <label className="text-xs text-rose-200/70 font-medium uppercase tracking-wide">Categorize TPM Loss</label>
                            <div className="relative">
                                <PenTool className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <select 
                                    value={machine.downtimeLog[0]?.reason || ""} 
                                    onChange={(e) => handleUpdateDowntimeReason(e.target.value)}
                                    className="w-full md:w-64 bg-slate-900 border border-rose-500/50 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none"
                                >
                                    {TPM_LOSSES.map((reason) => (
                                        <option key={reason} value={reason}>{reason}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">OEE Score</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100 mb-2">{machine.oee.toFixed(1)}%</div>
                    
                    {/* OEE Breakdown Detail */}
                    <div className="flex justify-between pt-2 border-t border-slate-700/50">
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500">Avail</div>
                            <div className="text-sm font-semibold text-slate-300">{machine.availability.toFixed(0)}%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500">Perf</div>
                            <div className="text-sm font-semibold text-slate-300">{machine.performance.toFixed(0)}%</div>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500">Qual</div>
                            <div className="text-sm font-semibold text-slate-300">{machine.quality.toFixed(0)}%</div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Production</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100">{machine.totalParts}</div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Target: {machine.targetParts}</span>
                        <span className="text-rose-400">Defect: {machine.defectParts}</span>
                    </div>
                    {/* Progress */}
                    <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (machine.totalParts/machine.targetParts)*100)}%` }}></div>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Power Load</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100">{machine.energyConsumptionKw.toFixed(1)} <span className="text-lg text-slate-500 font-normal">kW</span></div>
                    <div className="text-xs text-slate-500 mt-1">Efficiency: 92%</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Temp / Vib</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-100">{machine.temperature.toFixed(1)}°</div>
                    <div className="text-xs text-slate-500 mt-1">Vibration: {machine.vibration.toFixed(2)} mm/s</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Charts Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* OEE Trend Chart */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-slate-400" />
                            OEE Trend
                        </h3>
                        <div className="h-48 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={machine.oeeHistory}>
                                    <defs>
                                        <linearGradient id="colorOee" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} tickFormatter={(val) => val.split(':')[1] + ':' + val.split(':')[2]} interval={4} />
                                    <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} tick={{fill: '#64748b'}} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                        itemStyle={{ color: '#a78bfa' }}
                                        formatter={(val: number) => [val.toFixed(1) + '%', 'OEE']}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOee)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Energy Chart */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-slate-400" />
                            Real-time Energy Consumption (kW)
                        </h3>
                        <div className="h-48 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={machine.energyHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} tickFormatter={(val) => val.split(':')[1] + ':' + val.split(':')[2]} interval={4}/>
                                    <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tick={{fill: '#64748b'}} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                        itemStyle={{ color: '#fbbf24' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Production Chart */}
                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-400" />
                            Hourly Production Rate
                        </h3>
                         <div className="h-48 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={machine.hourlyProduction}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} />
                                    <YAxis stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* AI & Events Column */}
                <div className="space-y-6">
                    {/* Gemini AI Analysis */}
                    <div className="bg-gradient-to-b from-indigo-900/40 to-slate-800 border border-indigo-500/30 rounded-xl p-5 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-indigo-400" />
                                <h3 className="font-semibold text-indigo-100">Gemini Diagnostics</h3>
                            </div>
                            <button 
                                onClick={handleAnalyze}
                                disabled={loadingAi}
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {loadingAi ? 'Analyzing...' : 'Run Analysis'}
                            </button>
                        </div>
                        
                        <div className="min-h-[150px] text-sm text-slate-300 bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 overflow-y-auto max-h-[300px]">
                            {aiAnalysis ? (
                                <SimpleMarkdown content={aiAnalysis} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                                    <Cpu className="w-8 h-8 opacity-20" />
                                    <p className="text-center text-xs">Click "Run Analysis" to generate real-time<br/>insights using Gemini 2.5 Flash</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Downtime Logs */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 flex-1">
                        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            Recent Alerts
                        </h3>
                        <div className="space-y-3">
                            {machine.downtimeLog.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No recent downtime events.</p>
                            ) : (
                                machine.downtimeLog.slice(0, 5).map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-slate-300">{log.reason}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {new Date(log.timestamp).toLocaleTimeString()} • {log.durationMinutes}m duration
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
