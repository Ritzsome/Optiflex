
import React from 'react';
import { LayoutDashboard, Server, Settings, Activity, Zap, FileText, Home } from 'lucide-react';

export type ViewType = 'home' | 'dashboard' | 'analytics' | 'reports' | 'machines';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="w-20 lg:w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen sticky top-0 z-40">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Settings className="text-white w-5 h-5 animate-spin-slow" />
        </div>
        <span className="hidden lg:block text-xl font-bold text-white tracking-tight">OptiForge</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            activeView === 'home' 
              ? 'bg-blue-600/10 text-blue-400 shadow-sm ring-1 ring-blue-600/20' 
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
        >
          <Home className="w-6 h-6 shrink-0" />
          <span className="hidden lg:block font-medium">Home</span>
        </button>

        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            activeView === 'dashboard' 
              ? 'bg-blue-600/10 text-blue-400 shadow-sm ring-1 ring-blue-600/20' 
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-6 h-6 shrink-0" />
          <span className="hidden lg:block font-medium">Floor Overview</span>
        </button>

        <button
          onClick={() => setActiveView('analytics')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            activeView === 'analytics' 
              ? 'bg-purple-600/10 text-purple-400 shadow-sm ring-1 ring-purple-600/20' 
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
        >
          <Activity className="w-6 h-6 shrink-0" />
          <span className="hidden lg:block font-medium">AI Analytics</span>
        </button>

        <button
          onClick={() => setActiveView('reports')}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
            activeView === 'reports' 
              ? 'bg-emerald-600/10 text-emerald-400 shadow-sm ring-1 ring-emerald-600/20' 
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
        >
          <FileText className="w-6 h-6 shrink-0" />
          <span className="hidden lg:block font-medium">Reports</span>
        </button>

        <div className="pt-4 mt-4 border-t border-slate-700">
             <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:block">
                Systems
             </div>
             <button 
                onClick={() => setActiveView('machines')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    activeView === 'machines' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
             >
                <Server className="w-6 h-6 shrink-0" />
                <span className="hidden lg:block font-medium">Machines</span>
             </button>
             <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-all">
                <Zap className="w-6 h-6 shrink-0" />
                <span className="hidden lg:block font-medium">Energy Grid</span>
             </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <div className="hidden lg:block">
                <p className="text-xs font-medium text-slate-300">System Online</p>
                <p className="text-[10px] text-slate-500">v2.4.0-stable</p>
            </div>
        </div>
      </div>
    </div>
  );
};
