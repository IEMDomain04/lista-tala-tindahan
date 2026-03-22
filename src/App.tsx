import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// 1. TYPES & INTERFACES
// Defining the exact shape of our data helps catch errors early.
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

export default function App() {
  // ==========================================
  // 2. APPLICATION STATE
  // These variables hold the data that changes while the app is running.
  // ==========================================
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // NEW: Instead of a hardcoded variable, we use state to track the active vendor.
  // We default to vendor ID 1 on load.
  const [activeVendorId, setActiveVendorId] = useState<number>(1);

  // ==========================================
  // 3. DATABASE FETCHING LOGIC
  // ==========================================
  
  // useEffect runs the code inside it automatically. 
  // By putting [activeVendorId] in the array at the end, we tell React:
  // "Every time the user switches the vendor, run fetchTransactions() again."
  useEffect(() => {
    fetchTransactions();
  }, [activeVendorId]); 

  const fetchTransactions = async () => {
    // We ask Supabase for transactions, but use .eq() to act as a strict filter
    // so Vendor 1 never sees Vendor 2's data.
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('vendor_id', activeVendorId) // FILTER: Only grab rows matching the active vendor
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error.message);
    } else if (data) {
      setTransactions(data);
    }
  };

  // ==========================================
  // 4. MOCK NLP & DATABASE INSERT LOGIC
  // ==========================================
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setIsSending(true);

    const lowerInput = chatInput.toLowerCase();
    
    // Split the sentence by commas or conjunctions to handle multiple thoughts
    const clauses = lowerInput.split(/,|\bpero\b|\bat\b|\btapos\b/);
    
    // Prepare an array to hold all the rows we are about to insert
    const newDbRows: Omit<Transaction, 'id' | 'created_at'>[] = [];

    // Loop through each piece of the sentence to extract the meaning
    clauses.forEach((clause) => {
      // Look for a number using a Regular Expression
      const amountMatch = clause.match(/\d+/);
      
      // If no number is found in this clause, skip it and move to the next one
      if (!amountMatch) return; 

      const detectedAmount = parseInt(amountMatch[0], 10);
      let detectedType: TransactionType = 'income'; // Assume it's income by default

      // Scan the clause for specific keywords to adjust the transaction type
      if (clause.includes('gastos') || clause.includes('bili') || clause.includes('puhunan') || clause.includes('bayad')) {
        detectedType = 'expense';
      } else if (clause.includes('utang')) {
        detectedType = 'receivable';
      } else if (clause.includes('benta') || clause.includes('kita')) {
        detectedType = 'income';
      }

      // Package the extracted data into a neat object and push it to our array
      newDbRows.push({
        vendor_id: activeVendorId, // Assign it to whichever vendor is currently selected!
        description: clause.trim(), 
        amount: detectedAmount,
        type: detectedType,
      });
    });

    // Guard clause: If the NLP couldn't find any numbers at all, stop the process
    if (newDbRows.length === 0) {
      alert("Oops! Walang numero. Try adding an amount (e.g., 'benta 100')");
      setIsSending(false);
      return;
    }

    // Send the array of new rows directly to the Supabase database
    const { data, error } = await supabase
      .from('transactions')
      .insert(newDbRows)
      .select(); 

    if (error) {
      console.error('Database Error:', error.message);
      alert('Failed to save. Check console for details.');
    } else if (data) {
      // If successful, take the newly created database rows and merge them 
      // into the current UI state so the dashboard updates instantly without refreshing.
      setTransactions([...data, ...transactions]);
      setChatInput('');
    }
    
    setIsSending(false);
  };

  // ==========================================
  // 5. DASHBOARD METRICS CALCULATIONS
  // ==========================================
  // We use .filter() to isolate specific types, and .reduce() to sum up the amounts.
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalReceivable = transactions.filter(t => t.type === 'receivable').reduce((sum, t) => sum + t.amount, 0);

  // Format the data exactly how Recharts needs it to draw the bar graph
  const chartData = [
    { name: 'Income', amount: totalIncome, fill: '#10B981' },
    { name: 'Expenses', amount: totalExpense, fill: '#EF4444' },
    { name: 'Utang', amount: totalReceivable, fill: '#F59E0B' },
  ];

  // ==========================================
  // 6. UI RENDERING
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER AREA */}
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold tracking-tight">Tala-Tindahan</h1>
          
          {/* NEW: Dynamic Vendor Switcher Dropdown */}
          <select 
            value={activeVendorId} 
            onChange={(e) => setActiveVendorId(Number(e.target.value))}
            className="text-sm font-medium text-gray-700 bg-gray-200 px-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer border-r-8 border-transparent"
          >
            <option value={1}>Aling Nena's Store</option>
            <option value={2}>Mang Kanors Store</option>
            <option value={3}>Juan dela cruz Tindahan</option>
          </select>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Input & History */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Input Box */}
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

            {/* Recent Transactions */}
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

          {/* RIGHT COLUMN: Dashboard Visualization */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Scorecards */}
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

            {/* Chart */}
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