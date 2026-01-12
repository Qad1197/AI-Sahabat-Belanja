
import React, { useState, useMemo } from 'react';
import { GenerationResult, DayPlan, IngredientDetail, ShoppingItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatRupiah, formatNumber } from '../App';

interface PlanDisplayProps {
  result: GenerationResult;
  budget: number;
  city: string;
  priceOverrides: Record<string, Record<string, number>>;
  onUpdateOverride: (city: string, ingredient: string, price: number) => void;
}

const STANDARDS = { calories: 2150, protein: 60, carbs: 300 };

const RECOMMENDED_ALLOCATION: Record<string, number> = {
  'Protein': 0.35, 'Sayur': 0.25, 'Karbohidrat': 0.25, 'Buah': 0.10, 'Bumbu': 0.03, 'Lainnya': 0.02
};

const CATEGORY_COLORS: Record<string, string> = {
  'Protein': '#ef4444', 'Sayur': '#22c55e', 'Karbohidrat': '#eab308', 'Buah': '#f97316', 'Bumbu': '#8b5cf6', 'Lainnya': '#64748b'
};

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ result, budget, city, priceOverrides, onUpdateOverride }) => {
  const [activeTab, setActiveTab] = useState<'meals' | 'shopping' | 'analysis'>('meals');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [editingIngredient, setEditingIngredient] = useState<{name: string, value: string} | null>(null);

  const currentDayPlan = result.dailyPlans.find(d => d.day === selectedDay) || result.dailyPlans[0];

  const getEffectivePrice = (ingredient: IngredientDetail) => {
    return priceOverrides[city]?.[ingredient.name] ?? ingredient.unitPrice;
  };

  const calculateMealTotal = (ingredients: IngredientDetail[]) => {
    return ingredients.reduce((sum, ing) => {
      const effPrice = getEffectivePrice(ing);
      const ratio = ing.unitPrice > 0 ? effPrice / ing.unitPrice : 1;
      return sum + (ing.totalPrice * ratio);
    }, 0);
  };

  const totalEffectiveCost = useMemo(() => {
    return result.shoppingList.reduce((sum, item) => {
      const effPrice = priceOverrides[city]?.[item.name] ?? item.estimatedPrice;
      const ratio = item.estimatedPrice > 0 ? effPrice / item.estimatedPrice : 1;
      return sum + (item.estimatedPrice * ratio);
    }, 0);
  }, [result.shoppingList, priceOverrides, city]);

  const categoryAnalysis = useMemo(() => {
    const categories: Record<string, number> = {};
    result.shoppingList.forEach(item => {
      const effPrice = priceOverrides[city]?.[item.name] ?? item.estimatedPrice;
      const cat = item.category || 'Lainnya';
      categories[cat] = (categories[cat] || 0) + (item.estimatedPrice * (item.estimatedPrice > 0 ? effPrice/item.estimatedPrice : 1));
    });
    return Object.entries(categories).map(([name, actual]) => {
      const allocated = budget * (RECOMMENDED_ALLOCATION[name] || 0.05);
      return { name, actual, allocated, status: actual > allocated ? 'over' : 'under' };
    }).sort((a, b) => b.actual - a.actual);
  }, [result.shoppingList, budget, totalEffectiveCost, priceOverrides, city]);

  const renderMealTable = (title: string, ingredients: IngredientDetail[], slotColor: string) => {
    const totalCost = calculateMealTotal(ingredients);
    return (
      <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm mb-6">
        <div className={`${slotColor} px-6 py-4 flex justify-between items-center text-white`}>
          <h4 className="font-black uppercase tracking-widest text-[10px]">{title}</h4>
          <span className="text-sm font-black bg-black/10 px-4 py-1.5 rounded-full">{formatRupiah(totalCost)}</span>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-2">
                <th className="pb-3 pl-2">Bahan</th>
                <th className="pb-3 text-center">Vol</th>
                <th className="pb-3 text-right">Harga Satuan</th>
                <th className="pb-3 text-right pr-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ingredients.map((ing, idx) => {
                const effPrice = getEffectivePrice(ing);
                const isOverridden = priceOverrides[city]?.[ing.name] !== undefined;
                const isEditing = editingIngredient?.name === ing.name;

                return (
                  <tr key={idx} className={`group transition-colors ${isEditing ? 'bg-orange-50/50' : 'hover:bg-gray-50/30'}`}>
                    <td className="py-4 pl-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{ing.name}</span>
                        {isOverridden && <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter">Database Warga</span>}
                      </div>
                    </td>
                    <td className="py-4 text-center font-medium text-gray-500">{ing.quantity}</td>
                    <td className="py-4 text-right">
                      {isEditing ? (
                        <div className="flex flex-col items-end gap-2 animate-in zoom-in-95 duration-200">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">Rp</span>
                            <input 
                              autoFocus
                              type="text"
                              inputMode="numeric"
                              value={editingIngredient.value}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setEditingIngredient({ ...editingIngredient, value: formatNumber(parseInt(val) || 0) });
                              }}
                              className="w-28 pl-7 pr-3 py-2 bg-white border-2 border-orange-200 rounded-xl font-mono font-black text-right text-orange-600 outline-none shadow-sm"
                            />
                          </div>
                          <div className="flex gap-1.5">
                             <button 
                                onClick={() => setEditingIngredient(null)} 
                                className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-gray-200"
                             >Batal</button>
                             <button 
                                onClick={() => {
                                  const price = parseInt(editingIngredient.value.replace(/[^0-9]/g, '')) || 0;
                                  onUpdateOverride(city, ing.name, price);
                                  setEditingIngredient(null);
                                }} 
                                className="px-3 py-1.5 bg-[#5a823e] text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md active:scale-95"
                             >Simpan</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end group">
                          <span className={`font-mono font-black ${isOverridden ? 'text-orange-500' : 'text-gray-900'}`}>{formatRupiah(effPrice)}</span>
                          <button 
                            onClick={() => setEditingIngredient({ name: ing.name, value: formatNumber(effPrice) })}
                            className="text-[9px] font-black text-[#5a823e] uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 text-right pr-2 font-mono font-black text-gray-900">
                      {formatRupiah(ing.totalPrice * (ing.unitPrice > 0 ? effPrice/ing.unitPrice : 1))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 text-white p-2.5 rounded-xl shadow-lg shadow-blue-100">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none mb-1">Status Keakuratan</h4>
            <p className="text-sm font-black text-blue-600">Terverifikasi PIHPS & Warga</p>
          </div>
        </div>
        {result.sourceLinks && result.sourceLinks[0] && (
          <a href={result.sourceLinks[0].uri} target="_blank" className="text-[10px] font-black text-blue-600 border-2 border-blue-200 px-4 py-2 rounded-xl hover:bg-white transition uppercase">Cek Portal BI</a>
        )}
      </div>

      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[2rem] w-fit">
        {['meals', 'shopping', 'analysis'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)} 
            className={`px-6 py-2.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-[#5a823e] shadow-sm' : 'text-gray-400'}`}
          >
            {tab === 'meals' ? 'Menu' : tab === 'shopping' ? 'Belanja' : 'Analisis'}
          </button>
        ))}
      </div>

      {activeTab === 'meals' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {result.dailyPlans.map(d => (
              <button 
                key={d.day} 
                onClick={() => setSelectedDay(d.day)} 
                className={`min-w-[70px] py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${selectedDay === d.day ? 'bg-[#5a823e] border-[#5a823e] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-300'}`}
              >
                <span className="text-[8px] font-black uppercase">Hari</span>
                <span className="text-xl font-black">{d.day}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {renderMealTable(`MENU PAGI • ${currentDayPlan.breakfast.title}`, currentDayPlan.breakfast.ingredients, 'bg-orange-400')}
              {renderMealTable(`MENU SIANG • ${currentDayPlan.lunch.title}`, currentDayPlan.lunch.ingredients, 'bg-[#5a823e]')}
              {renderMealTable(`MENU MALAM • ${currentDayPlan.dinner.title}`, currentDayPlan.dinner.ingredients, 'bg-indigo-500')}
            </div>
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl sticky top-24">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-8">Nutrisi Harian</h4>
                  {[
                    { label: 'Energi', val: currentDayPlan.dailyTotal.calories, std: STANDARDS.calories, unit: ' kkal', color: 'bg-orange-500' },
                    { label: 'Protein', val: currentDayPlan.dailyTotal.protein, std: STANDARDS.protein, unit: 'g', color: 'bg-green-500' },
                    { label: 'Karbo', val: currentDayPlan.dailyTotal.carbs, std: STANDARDS.carbs, unit: 'g', color: 'bg-blue-500' }
                  ].map((nut, i) => (
                    <div key={i} className="mb-6 last:mb-0">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase">{nut.label}</span>
                        <span className="text-xs font-black">{formatNumber(Math.round(nut.val))} <span className="text-[9px] text-gray-500">/ {formatNumber(nut.std)}{nut.unit}</span></span>
                      </div>
                      <div className="h-2.5 bg-white/5 rounded-full overflow-hidden"><div className={`h-full ${nut.color} rounded-full`} style={{ width: `${Math.min(100, (nut.val/nut.std)*100)}%` }} /></div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shopping' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in duration-300">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 border-b border-gray-50 pb-8">
              <div>
                 <h3 className="text-2xl font-black text-gray-800 tracking-tight">Daftar Belanja Sahabat</h3>
                 <p className="text-sm text-gray-400 font-medium mt-1">Estimasi total berdasarkan harga pasar terbaru</p>
              </div>
              <div className="bg-[#f2f7ed] px-8 py-4 rounded-3xl border border-[#5a823e]/10 text-right">
                 <span className="text-[10px] font-black text-[#5a823e] uppercase tracking-widest block mb-1">Total Belanja</span>
                 <span className="text-3xl font-black text-gray-800">{formatRupiah(totalEffectiveCost)}</span>
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead><tr className="text-left text-[10px] font-black text-gray-400 uppercase border-b border-gray-50"><th className="pb-4">Kategori</th><th className="pb-4">Item</th><th className="pb-4">Volume</th><th className="pb-4 text-right">Harga</th></tr></thead>
               <tbody className="divide-y divide-gray-50">
                 {result.shoppingList.map((item, idx) => {
                   const effPrice = priceOverrides[city]?.[item.name] ?? item.estimatedPrice;
                   return (
                     <tr key={idx} className="hover:bg-gray-50/50 transition">
                       <td className="py-4"><span className="px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase" style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#94a3b8' }}>{item.category}</span></td>
                       <td className="py-4 font-bold text-gray-800">{item.name}</td>
                       <td className="py-4 text-xs font-black text-gray-400">{item.quantity}</td>
                       <td className="py-4 text-right font-mono font-black text-gray-900">{formatRupiah(effPrice)}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-[2rem] border border-gray-100 flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Budgetmu</span><span className="text-2xl font-black text-gray-800">{formatRupiah(budget)}</span></div>
            <div className="bg-white p-7 rounded-[2rem] border border-gray-100 flex flex-col"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimasi AI</span><span className={`text-2xl font-black ${totalEffectiveCost > budget ? 'text-red-500' : 'text-[#5a823e]'}`}>{formatRupiah(totalEffectiveCost)}</span></div>
            <div className={`p-7 rounded-[2rem] shadow-xl flex flex-col ${totalEffectiveCost > budget ? 'bg-red-500 text-white' : 'bg-[#5a823e] text-white'}`}><span className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-2">Sisa / Selisih</span><span className="text-2xl font-black">{formatRupiah(budget - totalEffectiveCost)}</span></div>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100">
             <h3 className="text-xl font-black text-gray-800 tracking-tight mb-8">Alokasi Biaya Pasar</h3>
             <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryAnalysis} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fontWeight: 800 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => (active && payload ? (
                      <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-xl text-xs font-bold">
                        <p className="uppercase mb-2 text-gray-500">{payload[0].payload.name}</p>
                        <p className="flex justify-between gap-6">Aktual: <span className="text-orange-400">{formatRupiah(payload[0].value as number)}</span></p>
                      </div>
                    ) : null)} />
                    <Bar dataKey="actual" radius={[0, 12, 12, 0]}>{categoryAnalysis.map((e, i) => (<Cell key={i} fill={CATEGORY_COLORS[e.name] || '#94a3b8'} />))}</Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-8 p-6 bg-[#f2f7ed] rounded-3xl border border-[#5a823e]/10">
                <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"💡 {result.budgetAnalysis}"</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
