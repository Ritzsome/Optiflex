
import React, { useState, useEffect } from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { MachineCard } from './components/MachineCard';
import { MachineDetail } from './components/MachineDetail';
import { ReportsView } from './components/ReportsView';
import { ChatWidget } from './components/ChatWidget';
import { MachineConfigView } from './components/MachineConfigView';
import { OEEHeatmap } from './components/OEEHeatmap';
import { Machine, PredictiveAlert, MachineStatus, DowntimeEvent } from './types';
import { generateCNCMachines, generateAssemblyStations, updateSimulation } from './utils/simulation';
import { analyzeFactoryData, generatePredictiveAlerts } from './services/geminiService';
import { Sparkles, BarChart3, AlertCircle, RefreshCcw, Siren, CheckCircle2, Thermometer, Activity, PieChart as PieChartIcon, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FactoryData {
    lineA: Machine[];
    lineC: Machine[];
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [activeLine, setActiveLine] = useState<string>("Line A - CNC Mill");
  
  // State to hold ALL factory data
  const [factoryData, setFactoryData] = useState<FactoryData>({
      lineA: [],
      lineC: []
  });

  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MachineStatus | 'ALL'>('ALL');
  
  // Analytics State
  const [globalAnalysis, setGlobalAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Predictive Maintenance State
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Initialization
  useEffect(() => {
    setFactoryData({
        lineA: generateCNCMachines(),
        lineC: generateAssemblyStations()
    });
  }, []);

  // Simulation Loop - Updates BOTH lines
  useEffect(() => {
    const interval = setInterval(() => {
      setFactoryData(prev => ({
          lineA: updateSimulation(prev.lineA),
          lineC: updateSimulation(prev.lineC)
      }));
      setLastUpdated(new Date());
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  // Derive the active machines based on selection
  const machines = activeLine === "Line A - CNC Mill" ? factoryData.lineA : factoryData.lineC;

  const handleGlobalAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeFactoryData(machines, `Analyze critical bottlenecks and energy spikes for ${activeLine}.`);
    setGlobalAnalysis(result);
    setIsAnalyzing(false);
  };

  const handlePredictiveScan = async () => {
    setIsScanning(true);
    const alerts = await generatePredictiveAlerts(machines);
    setPredictiveAlerts(alerts);
    setLastScanTime(new Date());
    setIsScanning(false);
  };

  // Function to update machine configuration from the config view
  const handleUpdateMachineConfig = (id: string, updates: Partial<Machine>) => {
    setFactoryData(prev => {
        const isLineA = prev.lineA.some(m => m.id === id);
        if (isLineA) {
            return { ...prev, lineA: prev.lineA.map(m => m.id === id ? { ...m, ...updates } : m) };
        } else {
            return { ...prev, lineC: prev.lineC.map(m => m.id === id ? { ...m, ...updates } : m) };
        }
    });
  };

  const selectedMachine = machines.find(m => m.id === selectedMachineId);
  const totalOEE = machines.reduce((acc: number, m: Machine) => acc + m.oee, 0) / (machines.length || 1);
  const activeAlerts = machines.filter(m => m.status === MachineStatus.DOWN).length;

  const filteredMachines = statusFilter === 'ALL' 
    ? machines 
    : machines.filter(m => m.status === statusFilter);

  // Prepare Downtime Data for Pie Chart
  const downtimeDistribution = machines
    .flatMap(m => m.downtimeLog)
    .reduce((acc: Record<string, number>, curr: DowntimeEvent) => {
        acc[curr.reason] = (acc[curr.reason] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(downtimeDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 reasons

  const PIE_COLORS = ['#f43f5e', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4'];

  // Handle Home View separately (Landing Page)
  if (activeView === 'home') {
    return (
        <HomeView 
            onNavigate={setActiveView} 
            machines={machines} 
            selectedLine={activeLine}
            onLineChange={setActiveLine}
        />
    );
  }

  return (
    <div className="flex bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-blue-500/30">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen relative">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                {activeView === 'dashboard' ? 'Production Floor' : 
                 activeView === 'analytics' ? 'AI Analytics' : 
                 activeView === 'reports' ? 'System Reports' : 'Machines'}
            </h1>
            <div className="flex items-center gap-3 text-sm">
               <span className="text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{activeLine}</span>
               <span className="text-slate-400">|</span>
               <p className="text-slate-400 flex items-center gap-2">
                   Last synced: {lastUpdated.toLocaleTimeString()}
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block ml-1"></span>
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Avg OEE</span>
                <span className={`text-xl font-bold ${totalOEE >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {totalOEE.toFixed(1)}%
                </span>
             </div>
             <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Active Alerts</span>
                <span className={`text-xl font-bold ${activeAlerts > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {activeAlerts}
                </span>
             </div>
          </div>
        </header>

        {activeView === 'dashboard' ? (
             <>
                 {/* Status Filters */}
                 <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="text-slate-500 mr-2 hidden md:block">
                        <Filter className="w-4 h-4" />
                    </div>
                    <button 
                        onClick={() => setStatusFilter('ALL')}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            statusFilter === 'ALL' 
                                ? 'bg-slate-700 text-white border-slate-600 shadow-sm' 
                                : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        All ({machines.length})
                    </button>
                    <button 
                        onClick={() => setStatusFilter(MachineStatus.RUNNING)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            statusFilter === MachineStatus.RUNNING 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        Running ({machines.filter(m => m.status === MachineStatus.RUNNING).length})
                    </button>
                    <button 
                        onClick={() => setStatusFilter(MachineStatus.IDLE)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            statusFilter === MachineStatus.IDLE 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        Idle ({machines.filter(m => m.status === MachineStatus.IDLE).length})
                    </button>
                    <button 
                        onClick={() => setStatusFilter(MachineStatus.DOWN)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            statusFilter === MachineStatus.DOWN 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                                : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        Down ({machines.filter(m => m.status === MachineStatus.DOWN).length})
                    </button>
                    <button 
                        onClick={() => setStatusFilter(MachineStatus.MAINTENANCE)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                            statusFilter === MachineStatus.MAINTENANCE 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                                : 'bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
                        }`}
                    >
                        Maintenance ({machines.filter(m => m.status === MachineStatus.MAINTENANCE).length})
                    </button>
                 </div>

                 {/* Machine Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                    {filteredMachines.length > 0 ? (
                        filteredMachines.map(machine => (
                            <MachineCard 
                                key={machine.id} 
                                machine={machine} 
                                onClick={setSelectedMachineId} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                            <Activity className="w-10 h-10 mb-2 opacity-20" />
                            <p>No stations found with status: {statusFilter}</p>
                        </div>
                    )}
                 </div>

                 {/* OEE Heatmap Section */}
                 <div className="mt-2 pb-10 animate-in slide-in-from-bottom-4 duration-700">
                    <OEEHeatmap machines={machines} />
                 </div>
             </>
        ) : activeView === 'analytics' ? (
            <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-10">
                
                {/* Row 1: Intelligence & Predictive */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Factory Intelligence Card */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-500/10 p-3 rounded-xl">
                                <Sparkles className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Line Intelligence</h2>
                                <p className="text-slate-400 text-sm">Holistic analysis of {activeLine}</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 min-h-[200px] mb-6 shadow-inner flex-1">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                                    <p className="text-slate-400 animate-pulse">Analyzing {machines.length} data streams...</p>
                                </div>
                            ) : globalAnalysis ? (
                                <div className="prose prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-slate-300 leading-relaxed text-sm">{globalAnalysis}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full space-y-3 text-slate-500">
                                    <BarChart3 className="w-10 h-10 opacity-20" />
                                    <p>No analysis generated yet.</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleGlobalAnalysis}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? 'Processing...' : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Line Report
                                </>
                            )}
                        </button>
                    </div>

                    {/* Predictive Maintenance Card */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col h-full">
                         <div className="flex items-center justify-between mb-6">
                             <div className="flex items-center gap-3">
                                <div className="bg-rose-500/10 p-3 rounded-xl">
                                    <Siren className="w-6 h-6 text-rose-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Predictive Maintenance</h2>
                                    <p className="text-slate-400 text-sm">Early warning detection system</p>
                                </div>
                             </div>
                             {lastScanTime && (
                                 <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-700">
                                     Checked: {lastScanTime.toLocaleTimeString()}
                                 </span>
                             )}
                         </div>

                         <div className="flex-1 space-y-3 min-h-[200px] mb-6 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700">
                            {isScanning ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-4 border-rose-500/30 animate-ping absolute top-0 left-0"></div>
                                        <Siren className="w-12 h-12 text-rose-500 relative z-10 animate-pulse" />
                                    </div>
                                    <p className="text-slate-400">Scanning fleet sensors...</p>
                                </div>
                            ) : predictiveAlerts.length > 0 ? (
                                predictiveAlerts.map((alert, idx) => (
                                    <div key={idx} className={`p-4 rounded-xl border ${
                                        alert.riskLevel === 'High' ? 'bg-rose-950/20 border-rose-500/30' : 
                                        alert.riskLevel === 'Medium' ? 'bg-amber-950/20 border-amber-500/30' : 
                                        'bg-blue-950/20 border-blue-500/30'
                                    }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-200">{alert.machineName}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                    alert.riskLevel === 'High' ? 'bg-rose-500 text-white' : 
                                                    alert.riskLevel === 'Medium' ? 'bg-amber-500 text-amber-950' : 
                                                    'bg-blue-500 text-white'
                                                }`}>{alert.riskLevel} Risk</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <span>Prob:</span>
                                                <span className="font-mono text-slate-200">{alert.probability}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" /> {alert.issue}
                                        </p>
                                        <p className="text-xs text-slate-400 pl-5">
                                            <span className="text-slate-500">Rec:</span> {alert.recommendation}
                                        </p>
                                    </div>
                                ))
                            ) : lastScanTime ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500/50" />
                                    <p>All systems nominal.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 opacity-60">
                                    <Activity className="w-12 h-12" />
                                    <p>Ready to scan.</p>
                                </div>
                            )}
                         </div>

                         <button 
                            onClick={handlePredictiveScan}
                            disabled={isScanning}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-slate-600 hover:border-slate-500 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isScanning ? 'Scanning Sensors...' : (
                                <>
                                    <Siren className="w-5 h-5" />
                                    Scan For Risks
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Row 2: Downtime Analysis & Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Downtime Distribution Chart */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="bg-slate-700/50 p-2 rounded-lg">
                                <PieChartIcon className="w-5 h-5 text-slate-300" />
                             </div>
                             <h3 className="font-bold text-white">Downtime Reasons</h3>
                        </div>
                        <div className="flex-1 w-full min-h-[250px]">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend 
                                            layout="vertical" 
                                            verticalAlign="middle" 
                                            align="right"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                    No downtime data recorded
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metric Cards Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/10 p-3 rounded-full shrink-0">
                                    <Activity className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Availability</p>
                                    <p className="text-2xl font-bold text-white">
                                        {((machines.filter(m => m.status === 'RUNNING').length / machines.length) * 100).toFixed(0)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500/10 p-3 rounded-full shrink-0">
                                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Total Parts</p>
                                    <p className="text-2xl font-bold text-white">
                                        {machines.reduce((acc, m) => acc + m.totalParts, 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-500/10 p-3 rounded-full shrink-0">
                                    <Thermometer className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm">Avg Temp</p>
                                    <p className="text-2xl font-bold text-white">
                                        {(machines.reduce((acc, m) => acc + m.temperature, 0) / machines.length).toFixed(1)}°C
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        ) : activeView === 'machines' ? (
             <MachineConfigView machines={machines} onUpdateMachine={handleUpdateMachineConfig} />
        ) : (
            <ReportsView machines={machines} />
        )}

        {/* Machine Detail Modal */}
        {selectedMachineId && (
            <MachineDetail 
                machine={selectedMachine} 
                onClose={() => setSelectedMachineId(null)} 
                onUpdateMachine={handleUpdateMachineConfig}
            />
        )}

        {/* AI Chat Widget */}
        <ChatWidget machines={machines} />
      </main>
    </div>
  );
};

export default App;
