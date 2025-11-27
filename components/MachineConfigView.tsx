
import React, { useState, useEffect } from 'react';
import { Machine } from '../types';
import { Settings, Save, Server, Clock, User, Box, Target, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface MachineConfigViewProps {
  machines: Machine[];
  onUpdateMachine: (id: string, updates: Partial<Machine>) => void;
}

export const MachineConfigView: React.FC<MachineConfigViewProps> = ({ machines, onUpdateMachine }) => {
  const [selectedId, setSelectedId] = useState<string>(machines[0]?.id || "");
  const [formData, setFormData] = useState<Partial<Machine>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Find the live machine object
  const selectedMachine = machines.find(m => m.id === selectedId);

  // Initialize form data only when switching machines to prevent overwrites during simulation ticks
  useEffect(() => {
    if (selectedMachine) {
        setFormData({
            name: selectedMachine.name,
            operatorName: selectedMachine.operatorName,
            partName: selectedMachine.partName,
            targetParts: selectedMachine.targetParts,
            shiftStartTime: selectedMachine.shiftStartTime,
            shiftEndTime: selectedMachine.shiftEndTime,
            breakStartTime: selectedMachine.breakStartTime,
            breakEndTime: selectedMachine.breakEndTime,
        });
        setIsDirty(false);
        setShowSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]); 

  const handleChange = (field: keyof Machine, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setShowSuccess(false);
  };

  const handleSave = () => {
    if (selectedId && formData) {
        onUpdateMachine(selectedId, formData);
        setIsDirty(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleReset = () => {
      if (selectedMachine) {
        setFormData({
            name: selectedMachine.name,
            operatorName: selectedMachine.operatorName,
            partName: selectedMachine.partName,
            targetParts: selectedMachine.targetParts,
            shiftStartTime: selectedMachine.shiftStartTime,
            shiftEndTime: selectedMachine.shiftEndTime,
            breakStartTime: selectedMachine.breakStartTime,
            breakEndTime: selectedMachine.breakEndTime,
        });
        setIsDirty(false);
        setShowSuccess(false);
      }
  };

  if (!selectedMachine) return <div className="flex items-center justify-center h-full text-slate-500">Loading assets...</div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] animate-in fade-in duration-500">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-6 h-6 text-slate-400" />
                    Machine Configuration
                </h2>
                <p className="text-slate-400 text-sm mt-1">Manage operational parameters and production targets.</p>
            </div>
            {isDirty && (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20 animate-in slide-in-from-right-4">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Unsaved changes</span>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
            {/* List Column */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-full max-h-[700px] shadow-lg">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider">Asset List</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                    {machines.map(m => (
                        <button
                            key={m.id}
                            onClick={() => {
                                if (isDirty) {
                                    if (window.confirm("You have unsaved changes. Discard them?")) {
                                        setSelectedId(m.id);
                                    }
                                } else {
                                    setSelectedId(m.id);
                                }
                            }}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-all duration-200 group ${
                                selectedId === m.id 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`relative w-2.5 h-2.5 rounded-full ${m.status === 'RUNNING' ? 'bg-emerald-400' : m.status === 'IDLE' ? 'bg-amber-400' : 'bg-rose-500'}`}>
                                    {m.status === 'RUNNING' && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>}
                                </div>
                                <div>
                                    <div className={`font-medium ${selectedId === m.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{m.name}</div>
                                    <div className={`text-xs ${selectedId === m.id ? 'text-blue-200' : 'text-slate-500'}`}>{m.id}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6 h-full max-h-[700px] overflow-y-auto shadow-lg relative">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10 pt-2">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {formData.name}
                            <span className="text-sm font-normal text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">{selectedId}</span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={handleReset}
                            disabled={!isDirty}
                            className="text-slate-400 hover:text-white px-3 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!isDirty}
                            className={`px-5 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg ${
                                showSuccess 
                                    ? 'bg-emerald-600 text-white'
                                    : isDirty 
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {showSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {showSuccess ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* General Info */}
                    <div className="space-y-5">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-blue-500/20 pb-2">
                            <Server className="w-4 h-4" /> Asset Information
                        </h4>
                        
                        <div className="space-y-1.5 group">
                            <label className="text-xs font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors">Machine Name</label>
                            <input 
                                type="text" 
                                value={formData.name || ''} 
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 group">
                            <label className="text-xs font-medium text-slate-400 flex items-center gap-1 group-focus-within:text-blue-400 transition-colors">
                                <User className="w-3 h-3" /> Operator Name
                            </label>
                            <input 
                                type="text" 
                                value={formData.operatorName || ''} 
                                onChange={(e) => handleChange('operatorName', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>

                         <div className="space-y-1.5 group">
                            <label className="text-xs font-medium text-slate-400 flex items-center gap-1 group-focus-within:text-blue-400 transition-colors">
                                <Box className="w-3 h-3" /> Active Part
                            </label>
                            <input 
                                type="text" 
                                value={formData.partName || ''} 
                                onChange={(e) => handleChange('partName', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Targets & Shift */}
                    <div className="space-y-5">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-purple-500/20 pb-2">
                            <Target className="w-4 h-4" /> Production KPIs
                        </h4>
                         <div className="space-y-1.5 group">
                            <label className="text-xs font-medium text-slate-400 group-focus-within:text-purple-400 transition-colors">Daily Production Target (Units)</label>
                            <input 
                                type="number" 
                                value={formData.targetParts || 0} 
                                onChange={(e) => handleChange('targetParts', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                            />
                            <p className="text-[10px] text-slate-500">Based on standard 8hr shift capacity</p>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="col-span-full pt-2">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-amber-500/20 pb-2">
                            <Clock className="w-4 h-4" /> Shift Schedule
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors">Shift Start</label>
                                <input 
                                    type="time" 
                                    value={formData.shiftStartTime || ''} 
                                    onChange={(e) => handleChange('shiftStartTime', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors">Shift End</label>
                                <input 
                                    type="time" 
                                    value={formData.shiftEndTime || ''} 
                                    onChange={(e) => handleChange('shiftEndTime', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors">Break Start</label>
                                <input 
                                    type="time" 
                                    value={formData.breakStartTime || ''} 
                                    onChange={(e) => handleChange('breakStartTime', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5 group">
                                <label className="text-xs font-medium text-slate-400 group-focus-within:text-amber-400 transition-colors">Break End</label>
                                <input 
                                    type="time" 
                                    value={formData.breakEndTime || ''} 
                                    onChange={(e) => handleChange('breakEndTime', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
