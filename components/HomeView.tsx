
import React, { useState } from 'react';
import { Machine } from '../types';
import { ViewType } from './Sidebar';
import { 
  Building2, 
  ChevronDown, 
  LayoutDashboard, 
  Activity, 
  FileText, 
  Server, 
  User, 
  LogOut, 
  Settings,
  ArrowRight,
  Factory
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: ViewType) => void;
  machines: Machine[];
  selectedLine: string;
  onLineChange: (line: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, machines, selectedLine, onLineChange }) => {
  const [selectedPlant, setSelectedPlant] = useState("Detroit Main Plant");

  // Calculate high-level stats
  const totalProduction = machines.reduce((acc, m) => acc + m.totalParts, 0);
  const avgOee = machines.reduce((acc, m) => acc + m.oee, 0) / (machines.length || 1);
  const activeMachines = machines.filter(m => m.status === 'RUNNING').length;
  const totalEnergy = machines.reduce((acc, m) => acc + m.energyConsumptionKw, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      
      {/* Top Navigation Bar */}
      <header className="h-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Settings className="text-white w-6 h-6 animate-spin-slow" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">OptiForge</span>
        </div>

        {/* Context Selectors */}
        <div className="hidden md:flex items-center gap-4 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium text-slate-300">
              <Building2 className="w-4 h-4 text-blue-400" />
              {selectedPlant}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left z-50">
                <div className="p-1">
                    <button onClick={() => setSelectedPlant("Detroit Main Plant")} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md">Detroit Main Plant</button>
                    <button onClick={() => setSelectedPlant("Berlin Gigafactory")} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md">Berlin Gigafactory</button>
                </div>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-700" />

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium text-slate-300">
              <Factory className="w-4 h-4 text-purple-400" />
              {selectedLine}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </button>
             <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-left z-50">
                <div className="p-1">
                    <button onClick={() => onLineChange("Line A - CNC Mill")} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md flex justify-between items-center">
                        Line A - CNC Mill
                        {selectedLine === "Line A - CNC Mill" && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                    </button>
                    <button onClick={() => onLineChange("Line C - Assembly")} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md flex justify-between items-center">
                        Line C - Assembly
                        {selectedLine === "Line C - Assembly" && <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <div className="text-sm font-bold text-white">Alex Morgan</div>
            <div className="text-xs text-slate-400">Plant Manager</div>
          </div>
          <div className="relative group cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                   <User className="w-5 h-5 text-white" />
                </div>
             </div>
             <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                <div className="p-1">
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md">
                        <Settings className="w-4 h-4" /> Account Settings
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-md">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                <div className="bg-gradient-to-br from-blue-600/20 to-slate-800 border border-blue-500/20 p-6 rounded-2xl">
                    <p className="text-blue-400 text-sm font-medium mb-1">Overall OEE ({selectedLine.split(' ')[0]})</p>
                    <div className="text-4xl font-bold text-white mb-2">{avgOee.toFixed(1)}%</div>
                    <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${avgOee}%` }}></div>
                    </div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                    <p className="text-slate-400 text-sm font-medium mb-1">Production Today</p>
                    <div className="text-4xl font-bold text-white mb-2">{totalProduction.toLocaleString()}</div>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="bg-emerald-400/20 p-0.5 rounded">▲ 12%</span> vs yesterday
                    </p>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                    <p className="text-slate-400 text-sm font-medium mb-1">Active Stations</p>
                    <div className="text-4xl font-bold text-white mb-2">{activeMachines} <span className="text-lg text-slate-500 font-normal">/ {machines.length}</span></div>
                    <p className="text-xs text-slate-500">{machines.length - activeMachines} offline or idle</p>
                </div>
                 <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl">
                    <p className="text-slate-400 text-sm font-medium mb-1">Energy Load</p>
                    <div className="text-4xl font-bold text-white mb-2">{totalEnergy.toFixed(0)} <span className="text-lg text-slate-500 font-normal">kW</span></div>
                    <p className="text-xs text-amber-400">Optimized for {selectedLine}</p>
                </div>
            </div>

            {/* Module Navigation */}
            <div>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-slate-400" />
                    Operational Modules
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Dashboard Module */}
                    <div 
                        onClick={() => onNavigate('dashboard')}
                        className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-blue-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10"
                    >
                        <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-400">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Production Floor</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Real-time monitoring of {machines.length} assets in {selectedLine} with live status indicators.
                        </p>
                        <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                            Enter Module <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                    {/* Analytics Module */}
                    <div 
                        onClick={() => onNavigate('analytics')}
                        className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-purple-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/10"
                    >
                        <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-400">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">AI Analytics</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Predictive maintenance alerts, anomaly detection, and Gemini-powered factory insights.
                        </p>
                        <div className="flex items-center text-purple-400 text-sm font-medium group-hover:gap-2 transition-all">
                            View Insights <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                     {/* Reports Module */}
                     <div 
                        onClick={() => onNavigate('reports')}
                        className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10"
                    >
                        <div className="w-12 h-12 bg-emerald-600/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Reports & Export</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Generate detailed production, quality, and downtime reports with PDF export capabilities.
                        </p>
                        <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
                            Open Reports <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                    {/* Machines Module */}
                    <div 
                        onClick={() => onNavigate('machines')}
                        className="group bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-500/50 p-6 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/20"
                    >
                        <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-600 group-hover:text-white transition-colors text-slate-400">
                            <Server className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Asset Config</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Manage parameters for {selectedLine}, operator assignments, and schedules.
                        </p>
                        <div className="flex items-center text-slate-400 text-sm font-medium group-hover:gap-2 transition-all">
                            Configure <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                </div>
            </div>

        </div>
      </main>
    </div>
  );
};
