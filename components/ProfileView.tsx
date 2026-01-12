
import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { formatRupiah, formatNumber } from '../App';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';

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
  }
];

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'favorites'>('dashboard');

  const todayRecipe = useMemo(() => {
    const day = new Date().getDate();
    const index = day % RECIPE_POOL.length;
    return RECIPE_POOL[index];
  }, []);

  const totalBudget = MOCK_HISTORY.reduce((acc, curr) => acc + curr.budget, 0);
  const totalActual = MOCK_HISTORY.reduce((acc, curr) => acc + curr.actual, 0);
  const totalSavings = totalBudget - totalActual;
  const savingsPercent = Math.round((totalSavings / totalBudget) * 100);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString('id-ID');
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(64, 145, 108); // #40916C
    doc.text('AI Sahabat Belanja', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Laporan Rincian Mingguan - Dicetak pada: ${timestamp}`, 20, 32);
    doc.text(`Pengguna: ${user.name}`, 20, 37);
    
    // Table Header
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
    
    // Table Content
    let y = 62;
    doc.setFont('helvetica', 'normal');
    MOCK_HISTORY.forEach((item) => {
      const diff = item.budget - item.actual;
      const status = diff >= 0 ? 'HEM AT' : 'BOROS';
      
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
    
    // Footer Summary
    y += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Penghematan: ${formatRupiah(totalSavings)} (${savingsPercent}%)`, 20, y);
    
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text('Dokumen ini dibuat secara otomatis oleh AI Sahabat Belanja.', 20, 280);
    
    doc.save(`Riwayat_Belanja_${user.name.replace(/\s/g, '_')}.pdf`);
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Financial Health Card */}
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
            "Hebat! Bulan ini Sahabat berhasil menyisihkan dana dari budget belanja. Pertahankan masak sendiri untuk maksimalkan tabungan!"
          </p>
        </div>
        <svg className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.45 12.15l-2.62 2.62c-.39.39-1.02.39-1.41 0L6.79 14.15c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.53V7c0-.55.45-1 1-1s1 .45 1 1v7.53l1.79-1.79c.39-.39 1.02-.39 1.41 0 .4.39.4 1.03.25 1.41z" /></svg>
      </div>

      {/* Today's Recipe AI Card */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden border border-white/20">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Ide Masakan Hari Ini • {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}</p>
              <h3 className="text-4xl font-black mb-2 tracking-tight">{todayRecipe.title}</h3>
              <p className="text-xs font-semibold opacity-90 max-w-md leading-relaxed">{todayRecipe.description}</p>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] text-orange-600 shadow-2xl shadow-black/20 transform hover:scale-105 transition-transform border-4 border-orange-100 flex flex-col items-center min-w-[180px]">
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Perkiraan Total Biaya</span>
               <span className="text-3xl font-black tracking-tighter">{formatRupiah(todayRecipe.totalCost)}</span>
               <div className="mt-2 w-8 h-1 bg-orange-200 rounded-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white text-gray-800 p-6 rounded-[2rem] shadow-sm">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  Rincian Bahan
                </h4>
                <div className="space-y-3">
                  {todayRecipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center text-xs border-b border-gray-100 last:border-0 pb-2.5 last:pb-0">
                      <div>
                        <span className="font-bold block text-gray-700">{ing.name}</span>
                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">{ing.qty}</span>
                      </div>
                      <span className="font-mono font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">{formatRupiah(ing.price)}</span>
                    </div>
                  ))}
                </div>
             </div>

             <div className="bg-black/20 p-6 rounded-[2rem] border border-white/10 backdrop-blur-md">
                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                  Langkah Memasak
                </h4>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
                  {todayRecipe.steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white text-orange-600 font-black text-[10px] flex items-center justify-center shadow-md">{i+1}</span>
                      <p className="text-xs font-semibold text-white/90 leading-relaxed pt-1">{step}</p>
                    </div>
                  ))}
                </div>
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
         <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#5a823e]"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Hemat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Over Budget</span>
            </div>
         </div>
       </div>

       <div className="space-y-4">
         <div className="flex justify-between items-center px-2">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rincian Mingguan</p>
           <button 
             onClick={exportToPDF}
             className="flex items-center gap-2 px-4 py-2 bg-[#5a823e] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-[#4a6b32] transition active:scale-95"
           >
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             Export PDF
           </button>
         </div>
         {MOCK_HISTORY.map((item, idx) => (
           <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center hover:shadow-sm transition-shadow">
             <div>
               <p className="font-black text-gray-800 text-sm">{item.date}</p>
               <p className="text-[10px] text-gray-400 font-bold">Budget: {formatNumber(item.budget)}</p>
             </div>
             <div className="text-right">
               <p className={`font-black text-sm ${item.actual > item.budget ? 'text-red-500' : 'text-[#5a823e]'}`}>{formatRupiah(item.actual)}</p>
               <p className="text-[10px] font-bold text-gray-400">{item.actual > item.budget ? 'Boros' : 'Hemat'}</p>
             </div>
           </div>
         ))}
       </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
       {MOCK_FAVORITES.map((item, idx) => (
         <div key={idx} className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer">
           <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3 text-orange-500">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
           </div>
           <h4 className="font-black text-gray-800 text-sm leading-tight mb-2 line-clamp-2">{item.title}</h4>
           <p className="text-xs font-bold text-[#5a823e] mb-3">{formatRupiah(item.price)}</p>
           <div className="flex flex-wrap gap-1">
             {item.tags.map(tag => (
               <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-md text-[8px] font-black uppercase tracking-wide">{tag}</span>
             ))}
           </div>
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
          <button 
            onClick={onLogout}
            className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition"
          >
            Keluar Akun
          </button>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-white border border-gray-100 rounded-[2rem] w-full overflow-x-auto scrollbar-hide">
        {(['dashboard', 'history', 'favorites'] as const).map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-3 px-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[#5a823e] text-white shadow-lg shadow-green-100' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {tab === 'dashboard' ? 'Analisa AI' : tab === 'history' ? 'Riwayat' : 'Favorit'}
          </button>
        ))}
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'favorites' && renderFavorites()}
      </div>
    </div>
  );
};
