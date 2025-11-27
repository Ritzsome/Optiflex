
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, User, Table as TableIcon, BarChart3, ChevronRight } from 'lucide-react';
import { Machine, ChatMessage, ChatResponse } from '../types';
import { chatWithFactory } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChatWidgetProps {
  machines: Machine[];
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ machines }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([
    "Compare OEE across all machines",
    "Which machine has the highest temperature?",
    "Show me a production summary table",
    "List machines with critical defects"
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    setCurrentSuggestions([]); // Clear suggestions while loading

    try {
      // Pass the updated messages history (including the new user message)
      const currentHistory = [...messages, userMsg];
      const response = await chatWithFactory(text, machines, currentHistory);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        type: response.type,
        tableData: response.tableData,
        chartData: response.chartData,
        chartTitle: response.chartTitle,
        chartColor: response.chartColor,
        suggestions: response.suggestedQuestions
      };

      setMessages(prev => [...prev, aiMsg]);
      
      if (response.suggestedQuestions && response.suggestedQuestions.length > 0) {
        setCurrentSuggestions(response.suggestedQuestions);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error analyzing the data. Please try again.",
        timestamp: new Date()
      }]);
      setCurrentSuggestions(["Show Machine Status", "Overall OEE"]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (msg: ChatMessage) => {
    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        
        {msg.type === 'table' && msg.tableData && (
          <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700 mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    {msg.tableData.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {msg.tableData.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-slate-400">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {msg.type === 'barChart' && msg.chartData && (
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 mt-2 h-48 w-full">
            {msg.chartTitle && (
              <p className="text-xs font-semibold text-slate-400 mb-2 text-center">{msg.chartTitle}</p>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={msg.chartData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis dataKey="label" stroke="#64748b" fontSize={10} tick={{fill: '#94a3b8'}} />
                 <YAxis stroke="#64748b" fontSize={10} tick={{fill: '#94a3b8'}} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                 />
                 <Bar 
                    dataKey="value" 
                    fill={msg.chartColor || "#6366f1"} 
                    radius={[4, 4, 0, 0]}
                    name="Value"
                 />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      <div 
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-[90vw] md:w-[450px] mb-4 overflow-hidden transition-all duration-300 origin-bottom-right pointer-events-auto flex flex-col ${
          isOpen ? 'scale-100 opacity-100 translate-y-0 h-[600px]' : 'scale-95 opacity-0 translate-y-10 pointer-events-none h-0 hidden'
        }`}
      >
        {/* Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-100 text-sm">Factory Assistant</h3>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                        Connected to Real-time Data
                    </p>
                </div>
            </div>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-8">
                    <div className="bg-indigo-500/10 p-5 rounded-full ring-1 ring-indigo-500/20">
                        <Sparkles className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-slate-200 font-semibold text-lg">Hello, Operator.</p>
                        <p className="text-slate-400 text-sm mt-2 leading-relaxed">I'm analyzing real-time performance for all 10 machines. Ask me about efficiency, defects, or specific downtime events.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                            }`}>
                                {renderContent(msg)}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                                    <User className="w-4 h-4 text-slate-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Suggestions & Input Area */}
        <div className="bg-slate-900 border-t border-slate-700 p-4 shrink-0 space-y-3">
            
            {/* Suggestion Chips */}
            {!isLoading && currentSuggestions.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade-right">
                    {currentSuggestions.map((suggestion, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSendMessage(suggestion)}
                            className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-xs text-indigo-300 transition-colors"
                        >
                            {suggestion}
                            <ChevronRight className="w-3 h-3 opacity-50" />
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                className="flex gap-2"
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about factory data..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-500"
                />
                <button 
                    type="submit"
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-lg shadow-indigo-900/40 transition-all hover:scale-110 pointer-events-auto"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && messages.length === 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
        )}
      </button>
    </div>
  );
};
