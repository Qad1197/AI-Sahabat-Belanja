
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { formatRupiah, formatNumber } from '../App';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { checkApiStatus } from '../services/gemini';

interface ProfileViewProps {
  user: UserProfile;
  onLogout: () => void;
}

const MOCK_HISTORY = [
  { date: 'Mg 1', budget: 500000, actual: 485000 },
  { date: 'Mg 2', budget: 500000, actual: 420000 },
  { date: 'Mg 3', budget: 550000, actual: 560000 },
  { date: 'Mg 4', budget: 500000, actual: 490000 },
];

const MOCK_FAVORITES = [
  { title: 'Sayur Asem Jakarta', price: 25000, tags: ['Segar', 'Hemat'] },
  { title: 'Ayam Goreng Lengkuas', price: 45000, tags: ['Protein', 'Keluarga'] },
  { title: 'Tumis Kangkung Terasi', price: 12000, tags: ['Cepat', 'Sayur'] },
  { title: 'Pepes Tahu Kemangi', price: 15000, tags: ['Sehat', 'Kukus'] },
];

const RECIPE_POOL = [
  {
    title: "Ayam Kecap Mentega",
    totalCost: 38500,
    description: "Menu favorit keluarga yang gurih, manis, dan praktis. Cocok untuk makan siang atau malam.",
    ingredients: [
      { name: "Ayam Potong", qty: "500 gr", price: 25000 },
      { name: "Bawang Bombay", qty: "1 buah", price: 3000 },
      { name: "Mentega/Margarin", qty: "3 sdm", price: 2000 },
      { name: "Kecap Manis", qty: "5 sdm", price: 1500 },
      { name: "Jeruk Limau", qty: "2 buah", price: 1000 },
      { name: "Bumbu Halus", qty: "1 paket", price: 6000 }
    ],
    steps: [
      "Cuci bersih ayam, lumuri dengan jeruk nipis dan garam, diamkan 15 menit.",
      "Goreng ayam hingga matang kecoklatan, tiriskan.",
      "Tumis bawang bombay dengan mentega hingga harum.",
      "Masukkan ayam goreng, tambahkan kecap manis, saus tiram, dan sedikit air.",
      "Masak hingga kuah mengental and meresap. Beri perasan jeruk limau sebelum diangkat."
    ]
  },
  {
    title: "Sayur Lodeh Jawa",
    totalCost: 22000,
    description: "Masakan rumahan legendaris dengan kuah santan gurih dan isian sayur mayur yang kaya nutrisi.",
    ingredients: [
      { name: "Labu Siam", qty: "1 buah", price: 4000 },
      { name: "Kacang Panjang", qty: "1 ikat", price: 3000 },
      { name: "Terong Ungu", qty: "1 buah", price: 2500 },
      { name: "Santan Kental", qty: "200 ml", price: 5000 },
      { name: "Tempe Semangit", qty: "1 kotak kecil", price: 3000 },
      { name: "Bumbu Lodeh Komplit", qty: "1 paket", price: 4500 }
    ],
    steps: [
      "Potong semua sayuran sesuai selera, cuci bersih.",
      "Rebus air, masukkan bumbu halus, lengkuas, dan daun salam.",
      "Masukkan sayuran yang keras terlebih dahulu (labu siam).",
      "Tambahkan santan, aduk terus agar tidak pecah.",
      "Masukkan sisa sayuran, beri gula dan garam, masak hingga matang sempurna."
    ]
  },
  {
    title: "Soto Ayam Lamongan",
    totalCost: 45000,
    description: "Soto ayam khas dengan taburan koya yang gurih dan kuah kuning yang segar.",
    ingredients: [
      { name: "Dada Ayam", qty: "500 gr", price: 28000 },
      { name: "Telur Ayam", qty: "2 butir", price: 4000 },
      { name: "Soun & Toge", qty: "1 paket", price: 5000 },
      { name: "Bumbu Soto", qty: "1 paket", price: 5000 },
      { name: "Krupuk Udang (Koya)", qty: "1 bungkus", price: 3000 }
    ],
    steps: [
      "Rebus ayam hingga empuk, lalu goreng sebentar dan suwir-suwir.",
      "Tumis bumbu soto halus hingga harum, masukkan ke air kaldu rebusan ayam.",
      "Siapkan mangkuk, tata soun, toge, dan suwiran ayam.",
      "Siram dengan kuah soto panas.",
      "Taburkan bubuk koya (kerupuk udang haluskan) di atasnya."
    ]
  },
  {
    title: "Rendang Daging Sapi",
    totalCost: 95000,
    description: "Masakan paling ikonik dunia. Kaya rempah dan bisa tahan lama untuk stok makan keluarga.",
    ingredients: [
      { name: "Daging Sapi", qty: "500 gr", price: 70000 },
      { name: "Santan Kental", qty: "500 ml", price: 12000 },
      { name: "Bumbu Rendang Komplit", qty: "1 paket", price: 10000 },
      { name: "Kelapa Sangrai", qty: "1 bungkus", price: 3000 }
    ],
    steps: [
      "Potong daging sapi sesuai selera, jangan terlalu kecil.",
      "Tumis bumbu rendang hingga harum dan berminyak.",
      "Masukkan daging, aduk hingga berubah warna.",
      "Tuangkan santan, masak dengan api kecil sambil terus diaduk perlahan.",
      "Masak hingga kuah mengering dan bumbu meresap hitam sempurna (4-5 jam)."
    ]
  }
];

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'favorites'>('dashboard');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{status: string, message: string, model: string} | null>(null);

  const todayRecipe = useMemo(() => {
    const now = new Date();
    const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const index = dateSeed % RECIPE_POOL.length;
    return RECIPE_POOL[index];
  }, []);

  const totalBudget = MOCK_HISTORY.reduce((acc, curr) => acc + curr.budget, 0);
  const totalActual = MOCK_HISTORY.reduce((acc, curr) => acc + curr.actual, 0);
  const totalSavings = totalBudget - totalActual;
  const savingsPercent = Math.round((totalSavings / totalBudget) * 100);

  const handleDiagnostic = async () => {
    setDiagLoading(true);
    const res = await checkApiStatus();
    setDiagResult(res);
    setDiagLoading(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('id-ID');
    doc.setFontSize(22);
    doc.setTextColor(64, 145, 108);
    doc.text('AI Sahabat Belanja', 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Laporan Rincian Mingguan - Dicetak pada: ${timestamp}`, 20, 32);
    doc.text(`Pengguna: ${user.name}`, 20, 37);
    doc.setFillColor(242, 247, 237);
    doc.rect(20, 45, 170, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Periode', 25, 51);
    doc.text('Budget', 60, 51);
    doc.text('Aktual', 100, 51);
    doc.text('Selisih', 140, 51);
    doc.text('Status', 170, 51);
    let y = 62;
    doc.setFont('helvetica', 'normal');
    MOCK_HISTORY.forEach((item) => {
      const diff = item.budget - item.actual;
      const status = diff >= 0 ? 'HEMAT' : 'BOROS';
      doc.text(item.date, 25, y);
      doc.text(formatNumber(item.budget), 60, y);
      doc.text(formatNumber(item.actual), 100, y);
      doc.text(formatNumber(diff), 140, y);
      if (status === 'BOROS') doc.setTextColor(239, 68, 68);
      else doc.setTextColor(64, 145, 108);
      doc.text(status, 170, y);
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(240, 240, 240);
      doc.line(20, y + 2, 190, y + 2);
      y += 10;
    });
    y += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Penghematan: ${formatRupiah(totalSavings)} (${savingsPercent}%)`, 20, y);
    doc.save(`Riwayat_Belanja_${user.name.replace(/\s/g, '_')}.pdf`);
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-5">
           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Sistem AI</h4>
           <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#40916C] animate-pulse"></div>
              <span className="text-[9px] font-black text-gray-500">Gemini 3 Flash</span>
           </div>
        </div>
        
        {diagResult ? (
          <div className={`p-4 rounded-2xl border mb-4 flex items-center justify-between animate-in zoom-in-95 ${diagResult.status === 'ok' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{diagResult.status === 'ok' ? '✅' : '❌'}</span>
              <div>
                <p className={`text-xs font-black ${diagResult.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{diagResult.message}</p>
                <p className="text-[9px] font-bold text-gray-400">Model: {diagResult.model}</p>
              </div>
            </div>
            <button onClick={() => setDiagResult(null)} className="text-[9px] font-black text-gray-400 hover:text-gray-600">RESET</button>
          </div>
        ) : (
          <button 
            onClick={handleDiagnostic}
            disabled={diagLoading}
            className="w-full py-4 bg-[#f8faf7] border-2 border-dashed border-gray-200 rounded-[1.5rem] flex items-center justify-center gap-3 group hover:border-[#40916C]/30 transition-all"
          >
            {diagLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-[#40916C] rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4 text-gray-400 group-hover:text-[#40916C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )}
            <span className="text-[10px] font-black text-gray-400 group-hover:text-[#40916C] uppercase tracking-widest">{diagLoading ? 'Mengecek API...' : 'Cek Koneksi & Billing'}</span>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#5a823e] to-[#4a6b32] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">AI Financial Insight</p>
              <h3 className="text-2xl font-black">Alokasi & Saving</h3>
            </div>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-black">{formatRupiah(totalSavings)}</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg mb-2">Hemat {savingsPercent}%</span>
          </div>
          <p className="text-xs font-medium opacity-90 leading-relaxed">
            "Hebat! Bulan ini Sahabat berhasil menyisihkan dana dari budget belanja. Pertahankan manajemen belanja mandiri untuk maksimalkan tabungan!"
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden border border-white/20">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Ide Masakan Hari Ini • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h3 className="text-4xl font-black mb-2 tracking-tight">{todayRecipe.title}</h3>
              <p className="text-xs font-semibold opacity-90 max-w-md leading-relaxed">{todayRecipe.description}</p>
            </div>
            <div className="bg-white p-6 rounded-[2rem] text-orange-600 shadow-2xl shadow-black/20 transform hover:scale-105 transition-transform border-4 border-orange-100 flex flex-col items-center min-w-[180px]">
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Perkiraan Total Biaya</span>
               <span className="text-3xl font-black tracking-tighter">{formatRupiah(todayRecipe.totalCost)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
       <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
         <h3 className="text-lg font-black text-gray-800 mb-6 pl-2">Tren Pengeluaran 4 Minggu</h3>
         <div className="h-64 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={MOCK_HISTORY} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
               <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
               <Tooltip 
                  cursor={{fill: 'transparent'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 text-white p-3 rounded-xl text-xs font-bold shadow-xl">
                          <p className="mb-1 text-gray-400">{payload[0].payload.date}</p>
                          <p className="text-green-400">Aktual: {formatRupiah(payload[0].value as number)}</p>
                          <p className="text-gray-400">Budget: {formatRupiah(payload[0].payload.budget)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
               />
               <Bar dataKey="actual" radius={[6, 6, 6, 6]} barSize={40}>
                 {MOCK_HISTORY.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.actual > entry.budget ? '#ef4444' : '#5a823e'} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>
       <div className="space-y-4">
         <div className="flex justify-between items-center px-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Mingguan</p>
           <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-[#5a823e] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Export PDF</button>
         </div>
         {MOCK_HISTORY.map((item, idx) => (
           <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
             <div><p className="font-black text-gray-800 text-sm">{item.date}</p><p className="text-[10px] text-gray-400 font-bold">Budget: {formatNumber(item.budget)}</p></div>
             <div className="text-right"><p className={`font-black text-sm ${item.actual > item.budget ? 'text-red-500' : 'text-[#5a823e]'}`}>{formatRupiah(item.actual)}</p></div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
       {MOCK_FAVORITES.map((item, idx) => (
         <div key={idx} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm active:scale-95 cursor-pointer">
           <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-orange-500">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
           </div>
           <h4 className="font-black text-gray-800 text-sm leading-tight mb-2 line-clamp-2">{item.title}</h4>
           <p className="text-xs font-bold text-[#5a823e] mb-3">{formatRupiah(item.price)}</p>
         </div>
       ))}
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-5">
        <img src={user.photo} className="w-20 h-20 rounded-full border-4 border-[#f2f7ed]" alt="Profile" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-gray-800 truncate">{user.name}</h2>
          <p className="text-xs text-gray-400 font-bold truncate mb-3">{user.email}</p>
          <button onClick={onLogout} className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Keluar Akun</button>
        </div>
      </div>
      <div className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-[2rem] w-full overflow-x-auto scrollbar-hide">
        {(['dashboard', 'history', 'favorites'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#5a823e] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>{tab === 'dashboard' ? 'Analisa AI' : tab === 'history' ? 'Riwayat' : 'Favorit'}</button>
        ))}
      </div>
      <div className="min-h-[300px]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'favorites' && renderFavorites()}
      </div>

      <div className="text-center px-10 mt-4">
         <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center justify-center gap-2">
           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           Data Anda tersimpan aman di perangkat ini.
         </p>
      </div>
    </div>
  );
};
