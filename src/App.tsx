import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Types ---
type TransactionType = 'income' | 'expense' | 'receivable';

interface Transaction {
  id: string;
  vendor_id: number;
  description: string;
  amount: number;
  type: TransactionType;
  created_at: string;
}

export default function App() {
  // --- State ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ⚠️ IMPORTANT: Paste the UUID of the vendor you created in Supabase here!
  const TEST_VENDOR_ID = 1;

  // --- 1. Fetch Data on Load ---
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error.message);
    } else if (data) {
      setTransactions(data);
    }
  };

  // --- 2. Process Chat & Insert to Supabase (UPGRADED NLP) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setIsSending(true);

    const lowerInput = chatInput.toLowerCase();
    
    // 1. Split the sentence into smaller thoughts (clauses)
    // We split by commas, or conjunctions like "pero", "at", "tapos"
    const clauses = lowerInput.split(/,|\bpero\b|\bat\b|\btapos\b/);
    
    const newDbRows: Omit<Transaction, 'id' | 'created_at'>[] = [];

    // 2. Analyze each clause individually
    clauses.forEach((clause) => {
      // Find the number in THIS specific clause
      const amountMatch = clause.match(/\d+/);
      
      // If there is no number in this part of the sentence, skip it
      if (!amountMatch) return; 

      const detectedAmount = parseInt(amountMatch[0], 10);
      let detectedType: TransactionType = 'income'; // Default to benta

      // Look for keywords ONLY within this specific clause
      if (clause.includes('gastos') || clause.includes('bili') || clause.includes('puhunan') || clause.includes('bayad')) {
        detectedType = 'expense';
      } else if (clause.includes('utang')) {
        detectedType = 'receivable';
      } else if (clause.includes('benta') || clause.includes('kita')) {
        detectedType = 'income';
      }

      newDbRows.push({
        vendor_id: TEST_VENDOR_ID,
        description: clause.trim(), // Saves just that specific part of the sentence!
        amount: detectedAmount,
        type: detectedType,
      });
    });

    // Fallback if no numbers were found at all
    if (newDbRows.length === 0) {
      alert("Oops! Walang numero. Try adding an amount (e.g., 'benta 100')");
      setIsSending(false);
      return;
    }

    // 3. Send ALL detected transactions to Supabase in one go
    const { data, error } = await supabase
      .from('transactions')
      .insert(newDbRows)
      .select(); 

    if (error) {
      console.error('Database Error:', error.message);
      alert('Failed to save. Check console for details.');
    } else if (data) {
      // Instantly update the UI with the fresh data from the DB
      // We spread the new data array so both transactions show up at once
      setTransactions([...data, ...transactions]);
      setChatInput('');
    }
    
    setIsSending(false);
  };

  // --- 3. Dashboard Calculations ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalReceivable = transactions.filter(t => t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0);

  const chartData = [
    { name: 'Income', amount: totalIncome, fill: '#10B981' },
    { name: 'Expenses', amount: totalExpense, fill: '#EF4444' },
    { name: 'Utang', amount: totalReceivable, fill: '#F59E0B' },
  ];

  // --- 4. Render UI ---
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">Tala-Tindahan</h1>
          <span className="text-sm font-medium text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Aling Nena's Store</span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Chat */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Chat Logger</h2>
              <form onSubmit={handleSendMessage} className="space-y-4">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder='Try: "benta ko ngayon 1500" or "gastos sa yelo 50"'
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24 text-sm"
                  disabled={isSending}
                />
                <button 
                  type="submit"
                  disabled={isSending}
                  className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSending ? 'Saving...' : 'Send to Ledger'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent (Live from DB)</h2>
              <div className="space-y-3">
                {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions yet.</p>}
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                    <span className="truncate pr-4 text-gray-600">{tx.description}</span>
                    <span className={`font-medium ${tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-600' : 'text-amber-600'}`}>
                      ₱{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Total Benta</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">₱{totalIncome}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Total Gastos</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">₱{totalExpense}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Pautang</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">₱{totalReceivable}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Cash Flow Overview</h2>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}