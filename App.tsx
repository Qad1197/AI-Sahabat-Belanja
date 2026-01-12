
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserPreferences, Lifestyle, GenerationResult, HistoryItem, UserProfile } from './types';
import { generateMealPlan } from './services/gemini';
import { INDONESIAN_REGIONS, getMinRationalPrice, ICONS } from './constants';
import { PlanDisplay } from './components/PlanDisplay';
import { PriceCorrection } from './components/PriceCorrection';
import { HelpView } from './components/HelpView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';

export const formatNumber = (val: number) => new Intl.NumberFormat('id-ID').format(val);
export const formatRupiah = (val: number) => `Rp ${formatNumber(val)}`;

const LOADING_MESSAGES = [
  "Hai Bund! Sabar ya, lagi pilih sayur paling segar...",
  "Lagi susun resep sehat buat keluarga tercinta...",
  "Cek harga pasar terupdate di lokasimu dulu ya...",
  "Menghitung nutrisi biar anak-anak tumbuh kuat...",
  "Ngerancang menu hemat tapi tetap istimewa..."
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'correction' | 'profile' | 'help' | 'admin'>('home');
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('asb_user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [phoneInput, setPhoneInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [priceOverrides, setPriceOverrides] = useState<Record<string, Record<string, number>>>(() => {
    const saved = localStorage.getItem('asb_price_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  const [prefs, setPrefs] = useState<UserPreferences>({
    budget: 500000,
    durationDays: 7,
    portionsPerMeal: 3,
    numberOfPeople: 4,
    lifestyle: Lifestyle.NORMAL,
    city: 'Kota Administrasi Jakarta Selatan'
  });

  const [locationSearch, setLocationSearch] = useState('');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('asb_tutorial_seen');
    if (!hasSeenTutorial) {
      setTutorialStep(1);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegions = useMemo(() => {
    const search = locationSearch.toLowerCase().trim();
    if (!search) return INDONESIAN_REGIONS.slice(0, 15); 
    return INDONESIAN_REGIONS.filter(r => 
      r.name.toLowerCase().includes(search) || 
      r.province.toLowerCase().includes(search)
    ).slice(0, 50); 
  }, [locationSearch]);

  const budgetAnalysis = useMemo(() => {
    const totalMeals = prefs.durationDays * prefs.numberOfPeople * prefs.portionsPerMeal;
    const costPerMeal = prefs.budget / (totalMeals || 1);
    const minRational = getMinRationalPrice(prefs.city, prefs.lifestyle);
    
    let status: 'danger' | 'warning' | 'success' = 'success';
    let message = 'Budget Ideal';
    let alasan = 'Budget cukup untuk standar gizi 4 sehat 5 sempurna dengan protein hewani berkualitas.';
    let pertimbangan = 'Bunda bisa lebih leluasa memilih variasi menu mingguan dan menyisipkan buah segar setiap hari.';
    
    if (costPerMeal < minRational * 0.75) {
      status = 'danger';
      message = 'Terlalu Rendah';
      alasan = 'Anggaran di bawah rata-rata biaya hidup sehat di wilayah ini. Berisiko kurang gizi seimbang.';
      pertimbangan = 'Sebaiknya Bunda menambah anggaran atau kurangi durasi hari agar kualitas masakan tetap terjaga.';
    } else if (costPerMeal < minRational) {
      status = 'warning';
      message = 'Sangat Hemat';
      alasan = 'Anggaran di batas minimal. Membutuhkan kreativitas tinggi dalam memilih bahan pangan.';
      pertimbangan = 'Fokus pada protein nabati (tahu/tempe). Disarankan belanja di pasar tradisional pagi hari.';
    }

    return { costPerMeal, minRational, status, message, alasan, pertimbangan, isDisabled: status === 'danger' };
  }, [prefs]);

  useEffect(() => {
    if (user) localStorage.setItem('asb_user_profile', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('asb_price_overrides', JSON.stringify(priceOverrides));
  }, [priceOverrides]);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!phoneInput) return;
    setAuthLoading(true);

    const ADMIN_PHONE = "08123456789";
    const isAdmin = phoneInput === ADMIN_PHONE;
    
    try {
      const newUser: UserProfile = {
        email: phoneInput,
        name: isAdmin ? "Administrator" : phoneInput,
        role: isAdmin ? 'admin' : 'user',
        photo: `https://ui-avatars.com/api/?name=${isAdmin ? "Admin" : phoneInput}&background=${isAdmin ? '000' : '40916C'}&color=fff`,
        favorites: [],
        history: []
      };
      setUser(newUser);
      setPhoneInput("");
      if (isAdmin) setActiveView('admin');
    } catch (err) {
      setError("Login gagal. Periksa nomor Bunda ya!");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateOverride = (city: string, ingredient: string, price: number) => {
    setPriceOverrides(prev => ({
      ...prev,
      [city]: { ...(prev[city] || {}), [ingredient]: price }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (budgetAnalysis.isDisabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateMealPlan(prefs, priceOverrides[prefs.city]);
      setResult(data);
    } catch (err: any) {
      setError("Duh Bund, server lagi sibuk nih. Coba lagi sebentar ya!");
    } finally {
      setLoading(false);
    }
  };

  const finishTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('asb_tutorial_seen', 'true');
  };

  return (
    <div className="min-h-screen pb-40 bg-[#fdfdfb]">
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex flex-col items-center justify-center p-6">
          <div className="max-w-xs w-full bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-500 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-4 rounded-full shadow-lg">
              <span className="text-3xl">
                {tutorialStep === 1 ? '📍' : tutorialStep === 2 ? '💰' : tutorialStep === 3 ? '👨‍👩‍👧' : '🚀'}
              </span>
            </div>
            
            <div className="text-center mt-4">
              <h3 className="text-lg font-black text-gray-800 mb-2 leading-tight">
                {tutorialStep === 1 && "Tentukan Lokasi Bunda"}
                {tutorialStep === 2 && "Tentukan Budget Belanja"}
                {tutorialStep === 3 && "Gaya Hidup & Keluarga"}
                {tutorialStep === 4 && "Mulai Susun Menu!"}
              </h3>
              <p className="text-xs font-medium text-gray-500 leading-relaxed mb-8">
                {tutorialStep === 1 && "Pilih kota tempat Bunda belanja agar AI Sahabat bisa menyesuaikan harga pangan lokal yang paling akurat."}
                {tutorialStep === 2 && "Masukkan total anggaran belanja Bunda. AI akan memastikan gizi keluarga terpenuhi dalam budget ini."}
                {tutorialStep === 3 && "Atur gaya hidup (Sederhana/Mewah) dan berapa jumlah orang yang akan makan masakan Bunda."}
                {tutorialStep === 4 && "Klik tombol hijau besar di bawah untuk membiarkan asisten AI menyusun resep hemat & sehat untuk Bunda."}
              </p>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => tutorialStep < 4 ? setTutorialStep(tutorialStep + 1) : finishTutorial()} 
                  className="w-full py-4 bg-[#40916C] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100"
                >
                  {tutorialStep === 4 ? "Selesai & Mulai" : "Lanjut"}
                </button>
                <button onClick={finishTutorial} className="py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lewati Panduan</button>
              </div>
            </div>
          </div>
          <div className="absolute pointer-events-none transition-all duration-500" 
            style={{ 
              top: tutorialStep === 1 ? '22%' : tutorialStep === 2 ? '38%' : tutorialStep === 3 ? '55%' : '75%',
              left: '50%',
              transform: 'translateX(-50%)'
            }}>
            <div className="w-10 h-10 border-4 border-white border-t-transparent border-l-transparent rotate-45 animate-bounce"></div>
          </div>
        </div>
      )}

      <header className="glass border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-5 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => {setResult(null); setActiveView('home');}}>
            <div className="relative">
              <div className={`p-2.5 rounded-2xl shadow-lg transition-all duration-300 animate-vibrant ${activeView === 'admin' ? 'bg-black' : 'bg-gradient-to-tr from-[#40916C] via-[#52B788] to-[#FF9F1C]'}`}>
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 10V6C7.5 4.89543 8.39543 4 9.5 4H14.5C15.6046 4 16.5 4.89543 16.5 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2.5 10H21.5L19 21H5L2.5 10Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-brand tracking-tight leading-none uppercase flex gap-1">
                <span className="text-gray-300">AI</span> <div className="flex"><span className="text-[#40916C]">Sahabat</span><span className="text-[#FB8500]">Belanja</span></div>
              </h1>
              <span className="text-[10px] font-bold text-gray-400 mt-1 transition-colors duration-300 uppercase">
                {activeView === 'admin' ? <span className="text-red-600 font-black">ADMIN CONSOLE</span> : <>dibuat oleh <span className="text-[#FB8500] font-black uppercase">WPR STUDIO</span></>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTutorialStep(1)} className="p-2.5 text-gray-400 hover:text-[#40916C] transition"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
            {user ? (
              <button onClick={() => setActiveView('profile')} className={`flex items-center gap-2 pr-4 rounded-full border transition p-1 shadow-sm ${activeView === 'admin' ? 'bg-black border-gray-800' : 'bg-white border-gray-100'}`}><img src={user.photo} className="w-8 h-8 rounded-full" alt="profile" />{user.role === 'admin' && <span className="text-[9px] font-black text-red-500">ADMIN</span>}</button>
            ) : (
              <button onClick={() => setActiveView('profile')} className="bg-[#40916C] text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-green-100 transition-all">Masuk</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 mt-6">
        {activeView === 'home' && (
          <div className="space-y-6">
            {!result && !loading && (
              <form onSubmit={handleSubmit} className="bg-white p-7 rounded-[3rem] shadow-xl shadow-green-900/5 border border-gray-50 space-y-7 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-6">
                  <div className={`bg-[#f2fcf6] p-6 rounded-[2.5rem] border border-green-50 relative transition-all duration-500 ${tutorialStep === 1 ? 'ring-4 ring-green-400 shadow-xl z-[110] bg-white' : ''}`} ref={locationDropdownRef}>
                     <label className="text-[11px] font-bold text-[#40916C] uppercase tracking-[0.1em] block mb-3">🛍️ Lokasi Belanja Bund</label>
                     <div className="w-full bg-transparent font-bold text-gray-800 text-lg flex items-center justify-between cursor-pointer group" onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}>
                        <span className="truncate group-hover:text-[#40916C] transition-colors">{prefs.city}</span>
                        <svg className={`w-5 h-5 transition-transform text-[#40916C] ${isLocationDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                     </div>
                     {isLocationDropdownOpen && (
                       <div className="absolute left-0 right-0 top-full mt-3 z-[120] bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-4 animate-in slide-in-from-top-3 duration-300">
                         <div className="relative mb-4">
                           <input type="text" placeholder="Ketik nama Kota..." autoFocus value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-[#f8faf7] border border-gray-100 rounded-3xl outline-none font-bold text-sm focus:ring-4 focus:ring-[#40916C]/10 transition-all" />
                           <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#40916C]" />
                         </div>
                         <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-2 px-1">
                           {filteredRegions.length > 0 ? filteredRegions.map(r => (
                               <div key={r.name} onClick={() => { setPrefs({...prefs, city: r.name}); setIsLocationDropdownOpen(false); setLocationSearch(''); }} className={`px-5 py-4 rounded-2xl cursor-pointer transition-all ${prefs.city === r.name ? 'bg-[#40916C] text-white shadow-lg' : 'hover:bg-[#f2fcf6] text-gray-700'}`}>
                                 <p className="font-bold text-sm">{r.name}</p>
                                 <p className={`text-[10px] font-semibold uppercase tracking-wider ${prefs.city === r.name ? 'text-white/70' : 'text-gray-400'}`}>{r.province}</p>
                               </div>
                             )) : <p className="text-center py-6 text-xs font-bold text-gray-400 italic">Wilayah tidak ditemukan...</p>}
                         </div>
                       </div>
                     )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className={`bg-[#fff9f2] p-6 rounded-[2.5rem] border border-orange-50 group transition-all ${tutorialStep === 2 ? 'ring-4 ring-orange-400 shadow-xl z-[110] bg-white' : ''}`}>
                      <label className="text-[11px] font-bold text-[#FB8500] uppercase tracking-[0.1em] block mb-3">💰 Budget Bunda (Rp)</label>
                      <input type="text" inputMode="numeric" value={formatNumber(prefs.budget)} onChange={(e) => { const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0; setPrefs({...prefs, budget: val}); }} className="w-full bg-transparent font-bold text-[#FB8500] outline-none text-2xl" />
                    </div>
                    <div className={`bg-[#f2fcf6] p-6 rounded-[2.5rem] border border-green-50 transition-all ${tutorialStep === 3 ? 'ring-4 ring-green-400 shadow-xl z-[110] bg-white' : ''}`}>
                       <label className="text-[11px] font-bold text-[#40916C] uppercase tracking-[0.1em] block mb-3">🍽️ Gaya Menu</label>
                       <div className="flex gap-2">
                          {[Lifestyle.SEDERHANA, Lifestyle.NORMAL, Lifestyle.MEWAH].map(l => (
                            <button key={l} type="button" onClick={() => setPrefs({...prefs, lifestyle: l})} className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase transition-all ${prefs.lifestyle === l ? 'bg-[#40916C] text-white shadow-lg scale-105' : 'bg-white text-gray-400 border border-gray-100'}`}>
                              <span className="block text-lg mb-1">{l === Lifestyle.SEDERHANA ? '🌱' : l === Lifestyle.NORMAL ? '🍗' : '🥩'}</span>{l}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                  <div className={`grid grid-cols-3 gap-4 transition-all ${tutorialStep === 3 ? 'ring-4 ring-blue-400 p-2 rounded-[2.5rem] shadow-xl z-[110] bg-white' : ''}`}>
                    <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 text-center">
                       <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Hari</label>
                       <input type="number" value={prefs.durationDays} onChange={(e) => setPrefs({...prefs, durationDays: parseInt(e.target.value)})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                    </div>
                    <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 text-center">
                       <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Makan</label>
                       <input type="number" value={prefs.portionsPerMeal} onChange={(e) => setPrefs({...prefs, portionsPerMeal: parseInt(e.target.value)})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                    </div>
                    <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 text-center">
                       <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Orang</label>
                       <input type="number" value={prefs.numberOfPeople} onChange={(e) => setPrefs({...prefs, numberOfPeople: parseInt(e.target.value)})} className="w-full bg-transparent text-center font-bold text-xl outline-none" />
                    </div>
                  </div>
                  <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${budgetAnalysis.status === 'danger' ? 'bg-red-50 border-red-100' : budgetAnalysis.status === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Analisis Sahabat Bunda</span>
                        <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold text-white uppercase shadow-sm ${budgetAnalysis.status === 'danger' ? 'bg-red-500' : budgetAnalysis.status === 'warning' ? 'bg-[#FB8500]' : 'bg-[#40916C]'}`}>{budgetAnalysis.status === 'danger' ? '⚠️' : budgetAnalysis.status === 'warning' ? '💡' : '✅'} {budgetAnalysis.message}</div>
                     </div>
                     <p className="text-2xl font-bold text-gray-800 tracking-tight leading-none">{formatRupiah(Math.round(budgetAnalysis.costPerMeal))} <span className="text-[11px] text-gray-400 font-semibold uppercase">/ porsi</span></p>
                     <p className="text-[10px] font-semibold text-gray-400 mt-2 uppercase tracking-wide opacity-80">Minimal di daerah ini: {formatRupiah(budgetAnalysis.minRational)}</p>
                     <div className="space-y-2 border-t border-black/5 pt-4 mt-4">
                        <p className="text-xs font-semibold text-gray-600 leading-relaxed"><span className="text-[10px] font-black uppercase text-gray-400 mr-2">Alasan:</span>{budgetAnalysis.alasan}</p>
                        <p className="text-xs font-semibold text-gray-600 leading-relaxed italic"><span className="text-[10px] font-black uppercase text-gray-400 mr-2">Saran:</span>{budgetAnalysis.pertimbangan}</p>
                     </div>
                  </div>
                </div>
                <button type="submit" disabled={budgetAnalysis.isDisabled} className={`w-full py-5 rounded-[2.5rem] font-bold text-sm uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 ${budgetAnalysis.isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#40916C] to-[#52B788] text-white animate-vibrant'} ${tutorialStep === 4 ? 'ring-4 ring-green-400 scale-105 z-[110]' : ''}`}>
                  {budgetAnalysis.isDisabled ? 'Budget Terlalu Rendah' : 'Susun Rencana Menu Bunda! 🥦'}
                </button>
              </form>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative"><div className="w-24 h-24 border-[6px] border-[#f2fcf6] border-t-[#40916C] rounded-full animate-spin"></div><div className="absolute inset-0 flex items-center justify-center text-3xl">🍲</div></div>
                <div className="space-y-3 px-10"><p className="text-xl font-bold text-gray-800">Sabar ya Bund...</p><p className="font-semibold text-[#40916C] italic text-sm leading-relaxed">"{LOADING_MESSAGES[loadingMsgIdx]}"</p></div>
              </div>
            )}

            {result && !loading && <PlanDisplay result={result} budget={prefs.budget} city={prefs.city} priceOverrides={priceOverrides} onUpdateOverride={handleUpdateOverride} />}
            {error && <div className="p-10 bg-red-50 text-red-600 rounded-[3rem] border-2 border-red-100 font-bold text-center animate-in shake">{error}</div>}
          </div>
        )}

        {activeView === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
             {!user ? (
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-50 flex flex-col items-center text-center">
                 <div className="bg-[#f2fcf6] p-7 rounded-full mb-8 shadow-inner"><svg className="w-12 h-12 text-[#40916C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                 <h2 className="text-2xl font-bold text-gray-800 mb-3 tracking-tight">Masuk Bunda</h2>
                 <p className="text-sm text-gray-400 font-semibold mb-10 px-4 leading-relaxed">Simpan menu favorit Bunda & riwayat belanja dengan aman.</p>
                 <form onSubmit={handlePhoneLogin} className="w-full space-y-5">
                   <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Masukkan No. HP Bunda" className="w-full px-8 py-5 bg-[#f8faf7] border border-gray-100 rounded-[2rem] outline-none font-bold text-gray-800 focus:ring-4 focus:ring-[#40916C]/10 text-center tracking-wide text-lg transition-all" />
                   <button type="submit" disabled={authLoading} className="w-full py-5 bg-[#40916C] text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 text-xs">{authLoading ? 'Memproses...' : 'Lanjut Sekarang'}</button>
                 </form>
               </div>
             ) : <ProfileView user={user} onLogout={() => { localStorage.removeItem('asb_user_profile'); setUser(null); setActiveView('home'); }} />}
          </div>
        )}

        {activeView === 'admin' && user?.role === 'admin' && <AdminView priceOverrides={priceOverrides} onBack={() => setActiveView('home')} />}
        {activeView === 'correction' && <PriceCorrection city={prefs.city} priceOverrides={priceOverrides} onUpdateOverride={handleUpdateOverride} onBack={() => setActiveView('home')} />}
        {activeView === 'help' && <HelpView onBack={() => setActiveView('home')} />}

        <footer className="mt-16 mb-8 text-center px-6">
          <div className="w-12 h-1 bg-gradient-to-r from-green-100 via-green-200 to-green-100 rounded-full mx-auto mb-6"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-2">
            © 2026 QADRYANSYAH STUDIO WPR • V.13 RILIS VERCEL
          </p>
          <p className="text-xs font-bold text-gray-400 leading-relaxed italic">
            Dibuat dengan Cinta untuk <span className="text-[#FB8500]">Muga</span> dan seluruh Ibu di Indonesia.
          </p>
        </footer>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-100 px-4 pb-8 pt-4 flex justify-between items-center z-50 shadow-[0_-15px_50px_rgba(0,0,0,0.06)]">
         <button onClick={() => {setResult(null); setActiveView('home');}} className={`flex-1 p-2 transition flex flex-col items-center gap-1.5 group ${activeView === 'home' ? 'text-[#40916C]' : 'text-gray-300 hover:text-gray-400'}`}>
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${activeView === 'home' ? 'bg-[#40916C]/10 scale-110' : 'group-hover:bg-gray-50'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'home' ? 3 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
         </button>
         <button onClick={() => setActiveView('correction')} className={`flex-1 p-2 transition flex flex-col items-center gap-1.5 group ${activeView === 'correction' ? 'text-[#FB8500]' : 'text-gray-300 hover:text-gray-400'}`}>
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${activeView === 'correction' ? 'bg-[#FB8500]/10 scale-110' : 'group-hover:bg-gray-50'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'correction' ? 3 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Koreksi</span>
         </button>
         <button onClick={() => setActiveView('help')} className={`flex-1 p-2 transition flex flex-col items-center gap-1.5 group ${activeView === 'help' ? 'text-blue-500' : 'text-gray-300 hover:text-gray-400'}`}>
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${activeView === 'help' ? 'bg-blue-500/10 scale-110' : 'group-hover:bg-gray-50'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'help' ? 3 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Bantuan</span>
         </button>
         <button onClick={() => setActiveView('profile')} className={`flex-1 p-2 transition flex flex-col items-center gap-1.5 group ${activeView === 'profile' ? 'text-[#40916C]' : 'text-gray-300 hover:text-gray-400'}`}>
            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${activeView === 'profile' ? 'bg-[#40916C]/10 scale-110' : 'group-hover:bg-gray-50'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'profile' ? 3 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
         </button>
      </nav>
    </div>
  );
};

export default App;
