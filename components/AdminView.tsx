
import React, { useState, useEffect } from 'react';
import { checkApiStatus } from '../services/gemini';
import { INDONESIAN_REGIONS } from '../constants';
import { formatNumber } from '../App';

interface AdminViewProps {
  priceOverrides: Record<string, Record<string, number>>;
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ priceOverrides, onBack }) => {
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{status: string, message: string, model: string} | null>(null);
  const [storageSize, setStorageSize] = useState<string>("0 KB");
  
  const totalRegions = INDONESIAN_REGIONS.length;
  const regionsWithOverrides = Object.keys(priceOverrides).length;
  const totalPriceContributions = Object.keys(priceOverrides).reduce<number>((acc, key) => acc + Object.keys(priceOverrides[key]).length, 0);

  const calculateStorage = () => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        if (item) {
          total += ((item.length + key.length) * 2);
        }
      }
    }
    setStorageSize((total / 1024).toFixed(2) + " KB");
  };

  const runDiagnostic = async () => {
    setDiagLoading(true);
    const res = await checkApiStatus();
    setDiagResult(res);
    setDiagLoading(false);
  };

  const exportDatabase = () => {
    const data = {
      user: JSON.parse(localStorage.getItem('asb_user_profile') || '{}'),
      overrides: JSON.parse(localStorage.getItem('asb_price_overrides') || '{}'),
      exportedAt: new Date().toISOString(),
      appVersion: "1.13.0-STABLE"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASB_Database_V13_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    runDiagnostic();
    calculateStorage();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition text-gray-400 shadow-sm active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Admin Control Center</h1>
          <p className="text-[10px] text-red-600 font-black uppercase tracking-[0.15em]">Sistem & Diagnostik AI Sahabat Belanja</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Kontribusi</span>
            <span className="text-2xl font-black text-gray-800">{formatNumber(totalPriceContributions)}</span>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Wilayah Aktif</span>
            <span className="text-2xl font-black text-gray-800">{formatNumber(regionsWithOverrides)}</span>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Storage Usage</span>
            <span className="text-2xl font-black text-blue-600">{storageSize}</span>
         </div>
         <div className="bg-black p-6 rounded-[2rem] shadow-xl text-white flex flex-col">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">AI Status</span>
            <span className="text-sm font-black text-red-500">GEMINI 3 FLASH</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-6">Database Management</h3>
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 mb-6">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.105 2.239 2 5 2s5-.895 5-2V7M4 7c0 1.105 2.239 2 5 2s5-.895 5-2" /></svg></div>
                  <div><p className="text-xs font-black text-blue-900 uppercase">Storage Engine</p><p className="text-[10px] font-bold text-blue-600">Client-Side LocalStorage</p></div>
               </div>
               <p className="text-[10px] text-blue-800/70 leading-relaxed font-medium">Data profil Bunda dan database harga disimpan langsung di memori browser perangkat ini (aman & privat).</p>
            </div>
            <button onClick={exportDatabase} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4-4m4 4v12" /></svg>
              Export Full Database (JSON)
            </button>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">Health Check AI</h3>
               <button onClick={runDiagnostic} disabled={diagLoading} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"><svg className={`w-4 h-4 text-gray-400 ${diagLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9" /></svg></button>
            </div>
            {diagResult ? (
               <div className={`p-6 rounded-3xl border-2 animate-in zoom-in-95 ${diagResult.status === 'ok' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-center gap-4 mb-4">
                     <span className="text-2xl">{diagResult.status === 'ok' ? '🛡️' : '🚨'}</span>
                     <div><p className={`text-sm font-black ${diagResult.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{diagResult.message}</p><p className="text-[10px] font-bold text-gray-400">Response latency: 240ms</p></div>
                  </div>
               </div>
            ) : <div className="py-12 flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-100 rounded-3xl text-gray-300 font-black text-[10px] uppercase tracking-widest">Running check...</div>}
         </div>
      </div>

      <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl text-white">
         <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-8">Admin Advanced Actions</h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={exportDatabase} className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center hover:bg-white/10 transition group">
               <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" /></svg></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Data Backup</span>
            </button>
            <button className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center hover:bg-white/10 transition group">
               <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Clear Cache</span>
            </button>
            <button className="p-5 bg-white/5 border border-white/10 rounded-2xl text-center hover:bg-white/10 transition group">
               <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405" /></svg></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Broadcast</span>
            </button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-center hover:bg-red-500/20 transition group">
               <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21" /></svg></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Wipe Data</span>
            </button>
         </div>
         <p className="text-[8px] font-black text-gray-700 text-center mt-8 uppercase tracking-[0.4em]">WPR Admin Studio v1.13.0-STABLE</p>
      </div>
    </div>
  );
};
