// projects/btc-etf-calculator/frontend/app/page.tsx (Updated to fetch JSON)
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Info, DollarSign, Bitcoin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type ETF = {
  ticker: string;
  name: string;
  price: number;
  btcPerShare: number;
  dailyFlowBTC: number;
  totalHeldBTC: number;
  issuer: string;
};

// Initial state while loading
const LOADING_ETF: ETF = { ticker: 'LOADING...', name: 'Loading Data...', price: 0, btcPerShare: 0, dailyFlowBTC: 0, totalHeldBTC: 0, issuer: '' };

const StatCard = ({ title, value, subValue, trend }: { title: string, value: string, subValue?: string, trend?: 'up' | 'down' | 'neutral' }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
      {trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-400" />}
    </div>
    {subValue && <p className="text-slate-500 text-sm mt-1">{subValue}</p>}
  </div>
);

const Calculator = ({ etfs, btcPrice }: { etfs: ETF[], btcPrice: number }) => {
  const [selectedTicker, setSelectedTicker] = useState('IBIT');
  const [shares, setShares] = useState<string>('100');
  const [btcAmount, setBtcAmount] = useState<string>('');
  const [direction, setDirection] = useState<'etfToBtc' | 'btcToEtf'>('etfToBtc');

  const selectedEtf = etfs.find(e => e.ticker === selectedTicker) || etfs[0] || LOADING_ETF;

  useEffect(() => {
    if (!selectedEtf.btcPerShare) return;
    const shareVal = parseFloat(shares) || 0;
    const btcVal = parseFloat(btcAmount) || 0;

    if (direction === 'etfToBtc') {
      setBtcAmount((shareVal * selectedEtf.btcPerShare).toFixed(8));
    } else {
      setShares((btcVal / selectedEtf.btcPerShare).toFixed(2));
    }
  }, [shares, selectedTicker, direction, selectedEtf]);

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirection('etfToBtc');
    setShares(e.target.value);
  };

  const handleBtcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirection('btcToEtf');
    setBtcAmount(e.target.value);
  };

  if (!etfs.length) return <div className="p-8 text-center text-slate-500">Loading calculator...</div>;

  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-400" /> Converter
        </h2>
        <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded">
          1 {selectedTicker} = {selectedEtf.btcPerShare?.toFixed(8)} BTC
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
        
        {/* Left Side (ETF) */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-semibold uppercase">ETF Ticker</label>
          <div className="flex gap-2">
            <select 
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-3 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {etfs.map(e => <option key={e.ticker} value={e.ticker}>{e.ticker}</option>)}
            </select>
            <div className="relative flex-1">
              <input 
                type="number" 
                value={shares}
                onChange={handleShareChange}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-3 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Shares"
              />
              <span className="absolute right-3 top-3 text-slate-500 text-sm">SHARES</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 text-right">
             ≈ ${(parseFloat(shares || '0') * selectedEtf.price).toLocaleString()} USD
          </div>
        </div>

        {/* Middle Arrow */}
        <div className="flex justify-center pb-6 text-slate-500">
          <ArrowRight className="w-6 h-6" />
        </div>

        {/* Right Side (BTC) */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-semibold uppercase">Bitcoin Amount</label>
          <div className="relative">
            <input 
              type="number" 
              value={btcAmount}
              onChange={handleBtcChange}
              className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg px-3 py-3 font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="BTC"
            />
            <span className="absolute right-3 top-3 text-emerald-600 text-sm font-bold">BTC</span>
          </div>
          <div className="text-xs text-slate-500 text-right">
             ≈ ${(parseFloat(btcAmount || '0') * btcPrice).toLocaleString()} USD
          </div>
        </div>

      </div>
    </div>
  );
};

export default function Home() {
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [btcPrice, setBtcPrice] = useState(65000);

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(data => {
        if (data.etfs) {
          // Normalize flow data (mock data is sometimes string)
          const normalized = data.etfs.map((e: any) => ({
            ...e,
            dailyFlowBTC: parseFloat(e.dailyFlowBTC),
            totalHeldBTC: parseFloat(e.totalHeldBTC),
            price: parseFloat(e.price)
          }));
          setEtfs(normalized);
        }
        if (data.btcPrice) setBtcPrice(data.btcPrice);
      })
      .catch(err => console.error('Failed to load data:', err));
  }, []);

  // Calculate totals
  const totalHeld = etfs.reduce((acc, curr) => acc + (curr.totalHeldBTC || 0), 0);
  const totalFlow = etfs.reduce((acc, curr) => acc + (curr.dailyFlowBTC || 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bitcoin className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">BTC ETF Dashboard</h1>
              <p className="text-slate-500 text-sm">Real-time flows & conversion</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-500 uppercase">BTC Price</div>
            <div className="text-lg font-mono text-emerald-400">${btcPrice.toLocaleString()}</div>
          </div>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total BTC Held by ETFs" 
            value={`${totalHeld.toLocaleString()} BTC`} 
            subValue={`≈ $${((totalHeld * btcPrice) / 1e9).toFixed(2)} Billion`} 
          />
          <StatCard 
            title="Net Flow (24h)" 
            value={`${totalFlow > 0 ? '+' : ''}${totalFlow.toFixed(2)} BTC`} 
            subValue={`≈ $${((totalFlow * btcPrice) / 1e6).toFixed(1)} Million`} 
            trend={totalFlow >= 0 ? 'up' : 'down'}
          />
           <StatCard 
            title="Dominance" 
            value={`${((totalHeld / 21000000) * 100).toFixed(2)}%`} 
            subValue="of 21M Supply Cap" 
          />
        </div>

        {/* Calculator */}
        <Calculator etfs={etfs} btcPrice={btcPrice} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Flows Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Daily Flows by Issuer</h3>
              <span className="text-xs text-slate-500">Updated: Today</span>
            </div>
            
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Ticker</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">24h Flow (BTC)</th>
                    <th className="px-6 py-4 text-right">Total Holdings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {etfs.map((etf) => (
                    <tr key={etf.ticker} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white flex flex-col">
                        <span>{etf.ticker}</span>
                        <span className="text-xs text-slate-500 font-normal">{etf.issuer}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">${etf.price.toFixed(2)}</td>
                      <td className={`px-6 py-4 font-mono font-bold ${etf.dailyFlowBTC >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {etf.dailyFlowBTC > 0 ? '+' : ''}{etf.dailyFlowBTC}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">
                        {etf.totalHeldBTC.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Chart (Simplified for now) */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Flow Trend (30d)</h3>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={etfs}>
                   <XAxis dataKey="ticker" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                   <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                   />
                   <Bar dataKey="dailyFlowBTC" radius={[4, 4, 0, 0]}>
                      {etfs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.dailyFlowBTC >= 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
