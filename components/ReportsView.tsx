import React, { useState, useRef } from 'react';
import { Machine } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileBarChart, AlertTriangle, CheckCircle, Sparkles, Download, RefreshCw, FileText } from 'lucide-react';
import { generateReportInsight } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportsViewProps {
  machines: Machine[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ machines }) => {
  const [reportType, setReportType] = useState<'production' | 'downtime' | 'quality'>('production');
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const summary = await generateReportInsight(machines, reportType);
    setAiSummary(summary);
    setIsGenerating(false);
  };

  const handleExportPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExporting(true);

    try {
        // Wait a brief moment for any states to settle
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(reportContainerRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: '#0f172a', // Match app background
            ignoreElements: (element) => element.classList.contains('no-print'),
            logging: false,
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate ratio to fit page with some margin
        const margin = 10;
        const availWidth = pdfWidth - (margin * 2);
        const availHeight = pdfHeight - (margin * 2);
        
        const ratio = Math.min(availWidth / imgWidth, availHeight / imgHeight);
        
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
        const xOffset = (pdfWidth - finalWidth) / 2;

        pdf.setFillColor(15, 23, 42); // slate-900
        pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
        
        pdf.addImage(imgData, 'PNG', xOffset, margin, finalWidth, finalHeight);
        
        pdf.save(`OptiForge_${reportType.charAt(0).toUpperCase() + reportType.slice(1)}_Report.pdf`);

    } catch (error) {
        console.error("PDF Export failed:", error);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  // --- Data Preparation ---
  const productionData = machines.map(m => ({
    name: m.name.replace('Machine ', 'M'),
    produced: m.totalParts,
    target: m.targetParts,
    gap: m.targetParts - m.totalParts
  }));

  const downtimeData = machines.map(m => ({
    name: m.name.replace('Machine ', 'M'),
    duration: m.downtimeLog.reduce((acc, log) => acc + log.durationMinutes, 0),
    count: m.downtimeLog.length
  }));

  const qualityData = machines.map(m => ({
    name: m.name.replace('Machine ', 'M'),
    good: m.goodParts,
    defect: m.defectParts,
    rate: m.totalParts > 0 ? (m.defectParts / m.totalParts * 100).toFixed(1) : 0
  }));

  // --- Render Helpers ---
  const renderTab = (type: 'production' | 'downtime' | 'quality', label: string, icon: React.ReactNode) => (
    <button
      onClick={() => { setReportType(type); setAiSummary(""); }}
      className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-medium text-sm transition-all border-b-2 ${
        reportType === type 
          ? 'bg-slate-800 border-blue-500 text-blue-400' 
          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
         <div>
            <h2 className="text-2xl font-bold text-white">System Reports</h2>
            <p className="text-slate-400 text-sm">Comprehensive performance analysis</p>
         </div>
         <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600 disabled:opacity-50"
         >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {isExporting ? 'Generating PDF...' : 'Download PDF Report'}
         </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-6 no-print">
        {renderTab('production', 'Production Report', <FileBarChart className="w-4 h-4" />)}
        {renderTab('downtime', 'Downtime Analysis', <AlertTriangle className="w-4 h-4" />)}
        {renderTab('quality', 'Quality Control', <CheckCircle className="w-4 h-4" />)}
      </div>

      {/* Report Content Container (Captures for PDF) */}
      <div ref={reportContainerRef} className="p-4 bg-slate-900">
          {/* Title for PDF only */}
          <div className="mb-4 hidden" style={{ display: isExporting ? 'block' : 'none' }}>
               <h1 className="text-3xl font-bold text-white mb-2">OptiForge {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
               <p className="text-slate-400">Generated on {new Date().toLocaleString()}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Chart Area */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    {reportType === 'production' && 'Production Output vs Target'}
                    {reportType === 'downtime' && 'Total Downtime Duration (Minutes)'}
                    {reportType === 'quality' && 'Good Parts vs Defects'}
                  </h3>
                  
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {reportType === 'production' ? (
                            <BarChart data={productionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend />
                                <Bar dataKey="produced" fill="#3b82f6" name="Actual Parts" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="target" fill="#1e293b" name="Target" stroke="#475569" strokeDasharray="3 3" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : reportType === 'downtime' ? (
                            <BarChart data={downtimeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend />
                                <Bar dataKey="duration" fill="#f43f5e" name="Downtime (Min)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : (
                            <BarChart data={qualityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Legend />
                                <Bar dataKey="good" stackId="a" fill="#10b981" name="Good Parts" />
                                <Bar dataKey="defect" stackId="a" fill="#ef4444" name="Defects" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Data Table */}
               <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-400">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3">Machine</th>
                                    {reportType === 'production' && (
                                        <>
                                            <th className="px-6 py-3">Produced</th>
                                            <th className="px-6 py-3">Target</th>
                                            <th className="px-6 py-3">Efficiency</th>
                                        </>
                                    )}
                                    {reportType === 'downtime' && (
                                        <>
                                            <th className="px-6 py-3">Total Downtime</th>
                                            <th className="px-6 py-3">Events Count</th>
                                            <th className="px-6 py-3">Availability Impact</th>
                                        </>
                                    )}
                                    {reportType === 'quality' && (
                                        <>
                                            <th className="px-6 py-3">Good Parts</th>
                                            <th className="px-6 py-3">Defects</th>
                                            <th className="px-6 py-3">Defect Rate</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map((m) => (
                                    <tr key={m.id} className="border-b border-slate-700 hover:bg-slate-700/20">
                                        <td className="px-6 py-4 font-medium text-white">{m.name}</td>
                                        {reportType === 'production' && (
                                            <>
                                                <td className="px-6 py-4">{m.totalParts}</td>
                                                <td className="px-6 py-4">{m.targetParts}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`${m.totalParts/m.targetParts > 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {(m.totalParts/m.targetParts * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        {reportType === 'downtime' && (
                                            <>
                                                <td className="px-6 py-4">{m.downtimeLog.reduce((a,b)=>a+b.durationMinutes,0)} min</td>
                                                <td className="px-6 py-4">{m.downtimeLog.length}</td>
                                                <td className="px-6 py-4 text-rose-400">-{((100 - m.availability)/1).toFixed(1)}%</td>
                                            </>
                                        )}
                                        {reportType === 'quality' && (
                                            <>
                                                <td className="px-6 py-4 text-emerald-400">{m.goodParts}</td>
                                                <td className="px-6 py-4 text-rose-400">{m.defectParts}</td>
                                                <td className="px-6 py-4">{((m.defectParts/m.totalParts)*100 || 0).toFixed(2)}%</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               </div>
            </div>

            {/* Sidebar: AI Summary */}
            <div className="space-y-6">
                <div className="bg-gradient-to-b from-blue-900/20 to-slate-800 border border-blue-500/30 rounded-xl p-6 sticky top-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">AI Executive Summary</h3>
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-6 no-print">
                        Generate an instant analysis of this specific report using Gemini 2.5.
                    </p>

                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 min-h-[200px] text-sm text-slate-300 mb-6">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-3">
                                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                                <p className="text-blue-400/80 animate-pulse">Analyzing report data...</p>
                            </div>
                        ) : aiSummary ? (
                            <div className="prose prose-invert prose-sm">
                                <p className="whitespace-pre-line leading-relaxed">{aiSummary}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-center">
                                No summary generated.<br/>Click button below.
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleGenerateSummary}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2 no-print"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isGenerating ? 'Generating...' : 'Generate Insight'}
                    </button>
                </div>
            </div>

          </div>
      </div>
    </div>
  );
};