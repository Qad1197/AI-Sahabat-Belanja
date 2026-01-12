
import React, { useState, useMemo } from 'react';
import { INDONESIAN_REGIONS, ICONS } from '../constants';
import { formatNumber, formatRupiah } from '../App';

interface PriceCorrectionProps {
  city: string;
  priceOverrides: Record<string, Record<string, number>>;
  onUpdateOverride: (city: string, ingredient: string, price: number) => void;
  onBack: () => void;
}

const COMMON_INGREDIENTS = [
  "Beras", "Ayam (Daging/Potong)", "Telur Ayam", "Bawang Merah", "Bawang Putih", 
  "Cabai Merah Keriting", "Cabai Rawit Merah", "Minyak Goreng", "Gula Pasir",
  "Daging Sapi", "Ikan Kembung", "Ikan Bandeng", "Tahu Putih", "Tempe",
  "Sayur Bayam", "Kangkung", "Tomat", "Susu UHT", "Garam", "Kecap Manis"
].sort();

export const PriceCorrection: React.FC<PriceCorrectionProps> = ({ city, priceOverrides, onUpdateOverride, onBack }) => {
  const [currentCity, setCurrentCity] = useState(city);
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const filteredIngredients = useMemo(() => {
    return COMMON_INGREDIENTS.filter(ing => ing.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const handleSave = (ingredient: string, priceStr: string) => {
    const price = parseInt(priceStr.replace(/[^0-9]/g, ''));
    if (!isNaN(price)) {
      onUpdateOverride(currentCity, ingredient, price);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition text-gray-400 shadow-sm active:scale-90">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Koreksi Harga Warga</h1>
          <p className="text-[10px] text-[#40916C] font-black uppercase tracking-[0.15em]">Bantu Sesuaikan Harga di {currentCity}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block tracking-widest">Pilih Wilayah</label>
            <div className="relative">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between font-black text-gray-800 transition-all hover:border-[#40916C]/30">
                <span className="truncate">{currentCity}</span>
                <svg className={`w-5 h-5 transition-transform text-[#40916C] ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-[60] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto animate-in slide-in-from-top-2">
                  {INDONESIAN_REGIONS.map(r => (
                    <div key={r.name} onClick={() => { setCurrentCity(r.name); setIsDropdownOpen(false); }} className="px-5 py-3 hover:bg-[#f2fcf6] rounded-xl cursor-pointer text-sm font-bold text-gray-700 transition-colors">{r.name}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panduan Tata Cara Card */}
          <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
             <div className="flex items-center gap-2.5 mb-2">
                <div className="bg-orange-100 p-2 rounded-xl">
                   <svg className="w-5 h-5 text-[#FB8500]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <h4 className="text-[12px] font-black uppercase text-gray-800 tracking-wider">Panduan Koreksi</h4>
             </div>
             <div className="space-y-5">
                <div className="flex gap-4 group">
                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f2fcf6] text-[#40916C] font-black text-[11px] flex items-center justify-center border border-green-100 group-hover:bg-[#40916C] group-hover:text-white transition-colors">1</span>
                   <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                     <span className="text-gray-800 font-bold block mb-0.5">Tentukan Lokasi & Cari Bahan</span>
                     Pilih Wilayah di menu atas, lalu ketik nama bahan masakan yang ingin Bunda sesuaikan harganya di kolom pencarian.
                   </p>
                </div>
                <div className="flex gap-4 group">
                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f2fcf6] text-[#40916C] font-black text-[11px] flex items-center justify-center border border-green-100 group-hover:bg-[#40916C] group-hover:text-white transition-colors">2</span>
                   <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                     <span className="text-gray-800 font-bold block mb-0.5">Update Harga Pasar</span>
                     Masukkan nominal harga satuan terbaru yang Bunda temukan di pasar atau toko langganan Bunda saat ini.
                   </p>
                </div>
                <div className="flex gap-4 group">
                   <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#f2fcf6] text-[#40916C] font-black text-[11px] flex items-center justify-center border border-green-100 group-hover:bg-[#40916C] group-hover:text-white transition-colors">3</span>
                   <p className="text-[11px] font-semibold text-gray-500 leading-relaxed">
                     <span className="text-gray-800 font-bold block mb-0.5">Simpan Data</span>
                     Klik tombol <span className="text-[#40916C] font-black uppercase tracking-tighter">centang hijau</span> agar sistem AI menyesuaikan estimasi belanja khusus untuk Bunda.
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-[#40916C] via-[#52B788] to-[#2D6A4F] text-white p-7 rounded-[2rem] shadow-xl shadow-green-100 relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="text-lg font-black mb-2 animate-pulse">Hebat Bund!</h4>
                <p className="text-[10px] font-bold opacity-90 leading-relaxed">Setiap harga yang Bunda update akan membantu AI kami menghitung rencana belanja yang jauh lebih akurat.</p>
             </div>
             <svg className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.45 12.15l-2.62 2.62c-.39.39-1.02.39-1.41 0L6.79 14.15c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.53V7c0-.55.45-1 1-1s1 .45 1 1v7.53l1.79-1.79c.39-.39 1.02-.39 1.41 0 .4.39.4 1.03.25 1.41z" /></svg>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-[#f8faf7] border-b border-gray-100">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari bahan masakan (Beras, Ayam, Cabai...)" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-3xl shadow-sm focus:ring-4 focus:ring-[#40916C]/10 outline-none font-bold text-gray-800 transition-all placeholder:text-gray-300"
                />
                <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#40916C]" />
              </div>
            </div>

            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto scrollbar-hide">
              {filteredIngredients.length > 0 ? (
                filteredIngredients.map((ing) => {
                  const override = priceOverrides[currentCity]?.[ing];
                  const displayVal = inputValues[ing] ?? (override ? formatNumber(override) : '');
                  
                  return (
                    <div key={ing} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-[#f2fcf6]/40 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-800 leading-none mb-1">{ing}</span>
                        <div className="flex items-center gap-1.5">
                           <span className={`text-[9px] font-bold uppercase tracking-widest ${override ? 'text-[#FB8500]' : 'text-gray-300'}`}>
                             {override ? 'Harga Bunda' : 'Estimasi Regional'}
                           </span>
                           {override && <div className="w-1.5 h-1.5 rounded-full bg-[#FB8500] animate-pulse"></div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">Rp</span>
                          <input 
                            type="text" 
                            inputMode="numeric"
                            value={displayVal}
                            placeholder="0"
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setInputValues({ ...inputValues, [ing]: formatNumber(parseInt(val) || 0) });
                            }}
                            className="w-36 pl-10 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#40916C] outline-none font-mono font-bold text-right text-gray-800 transition-all shadow-inner"
                          />
                        </div>
                        <button 
                          onClick={() => handleSave(ing, displayVal)}
                          className={`p-3.5 rounded-2xl transition-all shadow-lg active:scale-90 ${displayVal ? 'bg-[#40916C] text-white hover:bg-[#327a5b]' : 'bg-gray-100 text-gray-300'}`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-24 text-center space-y-4">
                   <div className="text-5xl opacity-30">🧺</div>
                   <p className="text-sm font-bold text-gray-400">Bahan tidak ditemukan Bund.<br/><span className="text-[10px] font-medium">Coba gunakan kata kunci lain.</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
