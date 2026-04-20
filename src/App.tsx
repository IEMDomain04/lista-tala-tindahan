import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
type TransactionType = 'income' | 'expense' | 'receivable';

interface Transaction {
  id: string;
  vendor_id: number;
  description: string;
  amount: number;
  type: TransactionType;
  created_at: string;
}

// ==========================================
// 2. MOCK DATA (Replaces Database Fetching)
// ==========================================
const MOCK_DATA: Transaction[] = [
  { id: '1', vendor_id: 1, description: 'nakabenta ako ng 10 piso na yema', amount: 10, type: 'income', created_at: new Date().toISOString() },
  { id: '2', vendor_id: 1, description: 'nagastos ko rin yung 10', amount: 10, type: 'expense', created_at: new Date().toISOString() },
  { id: '3', vendor_id: 1, description: '500 benta sa drinks', amount: 500, type: 'income', created_at: new Date().toISOString() },
];

// ==========================================
// 3. UI COMPONENTS
// ==========================================
const MetricCard = ({ title, value, colorClass }: { title: string, value: number, colorClass: string }) => (
  <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-center">
    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{title}</p>
    <p className={`text-2xl font-bold ${colorClass}`}>₱{value.toLocaleString()}</p>
  </div>
);

// ==========================================
// 4. MAIN APPLICATION COMPONENT (UI ONLY)
// ==========================================
export default function QuantumNLPLedger() {
  // Initialize state with mock data instead of an empty array
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_DATA);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const showToast = (text: string, type: 'error' | 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Simulated Frontend Submission (No Backend/NLP Logic)
  const handleSystemInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setIsProcessing(true);

    // Simulate a network request delay
    setTimeout(() => {
      // Create a dummy transaction just so the UI updates
      const dummyTransaction: Transaction = {
        id: Math.random().toString(),
        vendor_id: activeVendorId,
        description: chatInput, // Just echoing the input back
        amount: Math.floor(Math.random() * 1000) + 100, // Random amount
        type: 'income', // Hardcoded for demo purposes
        created_at: new Date().toISOString()
      };

      setTransactions([dummyTransaction, ...transactions]);
      setChatInput('');
      showToast("Mock transaction logged (Frontend only).", "success");
      setIsProcessing(false);
    }, 800); // 800ms simulated delay
  };

  // Metrics Logic (Running off local state)
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalReceivable = transactions.filter(t => t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0);

  const chartData = [
    { name: 'Income', amount: totalIncome, fill: '#10B981' },
    { name: 'Expenses', amount: totalExpense, fill: '#EF4444' },
    { name: 'Utang', amount: totalReceivable, fill: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200 selection:bg-cyan-900 selection:text-cyan-50">
      
      {/* Toast Notification System */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-sm font-medium shadow-lg z-50 transition-all ${toastMessage.type === 'error' ? 'bg-red-900/90 text-red-100 border border-red-700' : 'bg-emerald-900/90 text-emerald-100 border border-emerald-700'}`}>
          {toastMessage.text}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header / Command Center Bar */}
        <header className="flex justify-between items-center bg-slate-900 px-6 py-4 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">QuantumNLP System UI</h1>
          </div>
          
          <select 
            value={activeVendorId} 
            onChange={(e) => setActiveVendorId(Number(e.target.value))}
            className="bg-slate-950 text-sm font-medium text-slate-300 border border-slate-700 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-cyan-600 cursor-pointer"
          >
            <option value={1}>Vendor Data: Aling Nena</option>
            <option value={2}>Vendor Data: Mang Kanor</option>
            <option value={3}>Vendor Data: Juans Tinda</option>
          </select>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT PANEL: Input & System Logs */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input Console */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
              <h2 className="text-xs font-semibold text-cyan-500 uppercase tracking-widest mb-4 flex items-center">
                <span className="mr-2">⚡</span> Demo Input Portal
              </h2>
              <form onSubmit={handleSystemInput} className="space-y-4">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type anything here to test the UI..."
                  className="w-full p-4 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none h-28 text-sm placeholder-slate-600"
                  disabled={isProcessing}
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Simulating Delay...
                    </span>
                  ) : 'Test UI Interaction'}
                </button>
              </form>
            </div>

            {/* Live Database Log */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl h-80 overflow-y-auto">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">UI Transaction State</h2>
              <div className="space-y-2">
                {transactions.length === 0 && <p className="text-xs text-slate-600 font-mono">No records found.</p>}
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-xs p-3 bg-slate-950 rounded border border-slate-800 font-mono">
                    <span className="truncate pr-4 text-slate-400 w-2/3">{tx.description || "[No desc]"}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${tx.type === 'income' ? 'bg-emerald-900/30 text-emerald-400' : tx.type === 'expense' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>
                        {tx.type}
                      </span>
                      <span className="text-slate-200">₱{tx.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Data Visualization */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Scorecards */}
            <div className="grid grid-cols-3 gap-4">
              <MetricCard title="System Income" value={totalIncome} colorClass="text-emerald-400" />
              <MetricCard title="System Expense" value={totalExpense} colorClass="text-red-400" />
              <MetricCard title="Active Receivables" value={totalReceivable} colorClass="text-amber-400" />
            </div>

            {/* Analytics Chart */}
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl h-[400px] flex flex-col">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">Cash Flow UI Mockup</h2>
              <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip 
                      cursor={{ fill: '#0F172A' }}
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }}
                      itemStyle={{ color: '#F8FAFC' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={80} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}