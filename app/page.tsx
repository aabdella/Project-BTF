// projects/btc-etf-calculator/frontend/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, TrendingUp, TrendingDown, Info, DollarSign, Bitcoin, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

// --- Types ---
type ETF = {
  ticker: string;
  name: string;
  last_price_usd: number;
  btc_per_share: number;
  daily_flow_btc: number;
  total_held_btc: number;
  issuer: string;
};

// --- Mock Fallback while loading ---
const LOADING_ETF: ETF = { 
  ticker: 'LOADING...', 
  name: 'Loading Data...', 
  last_price_usd: 0, 
  btc_per_share: 0, 
  daily_flow_btc: 0, 
  total_held_btc: 0, 
  issuer: '' 
};

// --- Helper: Check if US Market is Open (9:30 AM - 4:00 PM ET, Mon-Fri) ---
const isMarketOpen = () => {
  const now = new Date();
  // Convert to NY time
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyTime.getDay(); // 0 = Sun, 6 = Sat
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  
  // Weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 - 16:00
  const minutesOfDay = hour * 60 + minute;
  const openTime = 9 * 60 + 30; // 9:30 AM
  const closeTime = 16 * 60;    // 4:00 PM
  
  return minutesOfDay >= openTime && minutesOfDay < closeTime;
};

// --- Components ---

const StatCard = ({ title, value, subValue, trend }: { title: string, value: string, subValue?: string, trend?: 'up' | 'down' | 'neutral' }) => (
  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm hover:border-indigo-500/30 transition-colors">
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
    if (!selectedEtf.btc_per_share) return;
    const shareVal = parseFloat(shares) || 0;
    const btcVal = parseFloat(btcAmount) || 0;

    if (direction === 'etfToBtc') {
      setBtcAmount((shareVal * selectedEtf.btc_per_share).toFixed(8));
    } else {
      setShares((btcVal / selectedEtf.btc_per_share).toFixed(2));
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

  if (!etfs.length) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading calculator...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500">
        <Bitcoin size={120} />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-400" /> Converter
        </h2>
        {/* Increased Size of Ratio */}
        <span className="text-sm md:text-base font-mono text-indigo-300 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 shadow-sm">
          1 {selectedTicker} = <span className="font-bold text-white">{selectedEtf.btc_per_share?.toFixed(8)}</span> BTC
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-end relative z-10">
        
        {/* Left Side (ETF) */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ETF Ticker</label>
          <div className="flex gap-2">
            <div className="relative">
              <select 
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="appearance-none bg-slate-900 text-white border border-slate-700 rounded-lg pl-4 pr-10 py-3 font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:border-slate-600 transition-colors"
              >
                {etfs.map(e => <option key={e.ticker} value={e.ticker}>{e.ticker}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
            <div className="relative flex-1 group/input">
              <input 
                type="number" 
                value={shares}
                onChange={handleShareChange}
                className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-4 py-3 font-mono text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all group-hover/input:border-slate-600"
                placeholder="Shares"
              />
              <span className="absolute right-3 top-3 text-slate-600 text-xs font-bold pointer-events-none">SHARES</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 text-right font-mono">
             ≈ ${(parseFloat(shares || '0') * selectedEtf.last_price_usd).toLocaleString()} USD
          </div>
        </div>

        {/* Middle Arrow */}
        <div className="flex justify-center pb-8 text-slate-600">
          <ArrowRight className="w-6 h-6" />
        </div>

        {/* Right Side (BTC) */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Bitcoin Amount</label>
          <div className="relative group/input">
            <input 
              type="number" 
              value={btcAmount}
              onChange={handleBtcChange}
              className="w-full bg-slate-900 text-emerald-400 border border-slate-700 rounded-lg px-4 py-3 font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all group-hover/input:border-slate-600 placeholder-slate-700"
              placeholder="BTC"
            />
            <span className="absolute right-3 top-3 text-emerald-900/40 text-xs font-bold pointer-events-none">BTC</span>
          </div>
          <div className="text-xs text-slate-500 text-right font-mono">
             ≈ ${(parseFloat(btcAmount || '0') * btcPrice).toLocaleString()} USD
          </div>
        </div>

      </div>
    </div>
  );
};

export default function Home() {
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [btcPrice, setBtcPrice] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [marketOpen, setMarketOpen] = useState(false);

  // Daily Mined BTC (Constant ~450 BTC/day after halving)
  const DAILY_MINED_BTC = 450; 
  // Estimated Circulating Supply for Feb 2026 (Approximation)
  const CIRCULATING_SUPPLY = 19980000; 

  useEffect(() => {
    setMarketOpen(isMarketOpen());
    
    // Fetch Real BTC Price
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      .then(res => res.json())
      .then(data => {
        if (data.bitcoin?.usd) {
          setBtcPrice(data.bitcoin.usd);
        }
      })
      .catch(err => {
        console.error('Failed to fetch BTC price:', err);
        setBtcPrice(71500); 
      });
  }, []);

  // Fetch ETF Data
  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('etfs')
          .select('*')
          .order('total_held_btc', { ascending: false });

        if (error) throw error;

        if (data) {
          setEtfs(data);
        }
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        // Fallback
        fetch('/data.json')
          .then(res => res.json())
          .then(d => {
             if (d.etfs) {
                const mapped = d.etfs.map((e: any) => ({
                    ticker: e.ticker,
                    name: e.name,
                    last_price_usd: e.price,
                    btc_per_share: e.btcPerShare,
                    daily_flow_btc: parseFloat(e.dailyFlowBTC),
                    total_held_btc: parseFloat(e.totalHeldBTC),
                    issuer: e.issuer
                }));
                setEtfs(mapped);
             }
          });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Calculate totals
  const totalHeld = etfs.reduce((acc, curr) => acc + (curr.total_held_btc || 0), 0);
  const totalFlow = etfs.reduce((acc, curr) => acc + (curr.daily_flow_btc || 0), 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 overflow-hidden">
              <img 
                src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" 
                alt="Bitcoin Logo" 
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">BTC ETF Dashboard</h1>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></span>
                {loading ? 'Syncing...' : 'Live Data'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 shadow-sm">
            <div className="text-right">
              {/* Swapped Sizes: Label Bigger, Price Smaller/Balanced */}
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">BTC Price</div>
              <div className="text-base font-mono text-emerald-400 font-medium">
                {btcPrice ? `$${btcPrice.toLocaleString()}` : '...'}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="Daily Mined BTC" 
            value={`${DAILY_MINED_BTC} BTC`} 
            subValue={`≈ $${((DAILY_MINED_BTC * btcPrice) / 1e6).toFixed(1)} Million`}
          />
           <StatCard 
            title="HODL by ETFs" 
            value={`${((totalHeld / CIRCULATING_SUPPLY) * 100).toFixed(2)}%`} 
            subValue={`of Circulating ${CIRCULATING_SUPPLY.toLocaleString()} Supply`}
          />
        </div>

        {/* Calculator - Centered & Narrower */}
        <Calculator etfs={etfs} btcPrice={btcPrice} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Flows Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Daily Flows
                <span className={`px-2 py-0.5 rounded text-[10px] border ${marketOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                  {marketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
                </span>
              </h3>
            </div>
            
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Ticker</th>
                      <th className="px-6 py-4">Price (USD)</th>
                      <th className="px-6 py-4">24h Flow</th>
                      <th className="px-6 py-4 text-right">Holdings (BTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {etfs.map((etf) => (
                      <tr key={etf.ticker} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{etf.ticker}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{etf.issuer}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono">
                          ${etf.last_price_usd?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded font-mono text-xs font-bold ${
                            etf.daily_flow_btc > 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : etf.daily_flow_btc < 0 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : 'text-slate-500'
                          }`}>
                            {etf.daily_flow_btc > 0 ? '+' : ''}{etf.daily_flow_btc?.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-300 font-medium">
                          {etf.total_held_btc?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Flow Heatmap</h3>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 h-[320px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={etfs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <XAxis 
                    dataKey="ticker" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={0}
                   />
                   <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}`}
                   />
                   <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value: number) => [`${value} BTC`, 'Daily Flow']}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                   />
                   <Bar dataKey="daily_flow_btc" radius={[4, 4, 4, 4]} barSize={20}>
                      {etfs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.daily_flow_btc >= 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Overlay if no data */}
              {etfs.length === 0 && !loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
                  <p className="text-slate-500 text-sm">No flow data available</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-200/80 leading-relaxed">
                  <strong className="text-indigo-200 block mb-1">Did you know?</strong>
                  IBIT reached $10B in assets faster than any ETF in history. It now holds more Bitcoin than most corporate treasuries combined.
                </p>
              </div>
            </div>
          </div>

        </div>
        
        <footer className="pt-12 pb-8 text-center border-t border-slate-800/50">
          <p className="text-slate-600 text-sm">
            Data sourced from on-chain flows & issuer filings. Built with <span className="text-rose-500">♥</span> by ElMeedz.
          </p>
        </footer>
      </div>
    </main>
  );
}
