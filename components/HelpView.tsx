
import React, { useState } from 'react';
import { formatRupiah } from '../App';

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-sm font-black text-gray-800 group-hover:text-[#5a823e] transition-colors pr-4">{question}</span>
        <svg 
          className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#5a823e]' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="text-xs font-medium text-gray-500 leading-relaxed">{answer}</div>
      </div>
    </div>
  );
};

export const HelpView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [donationAmount, setDonationAmount] = useState<number | null>(null);
  const DUITKU_API_KEY = "1b9f0ddb781ea69b5d1931f3ede1370b";

  const faqs = [
    {
      question: "Apa itu AI Sahabat Belanja?",
      answer: "AI Sahabat Belanja adalah asisten cerdas berbasis AI yang dirancang untuk membantu keluarga Indonesia merencanakan menu makan harian sesuai dengan budget, jumlah anggota keluarga, dan lokasi pasar masing-masing."
    },
    {
      question: "Kebijakan Privasi (Privacy Policy)",
      answer: (
        <div className="space-y-2">
          <p>Kami sangat menghargai privasi Sahabat. Berikut adalah poin utama kebijakan kami:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Data Lokasi:</strong> Kami menggunakan data kota Anda semata-mata untuk memberikan estimasi harga pangan regional yang akurat melalui integrasi Google Search & Maps.</li>
            <li><strong>Informasi Kontak:</strong> Nomor HP yang Sahabat masukkan hanya digunakan untuk sistem identifikasi akun agar data favorit dan riwayat tidak hilang.</li>
            <li><strong>Keamanan Data:</strong> Kami tidak pernah menjual atau membagikan data pribadi Sahabat kepada pihak ketiga untuk kepentingan iklan atau pemasaran.</li>
            <li><strong>Transaksi Donasi:</strong> Semua pembayaran donasi diproses secara aman melalui gerbang pembayaran resmi (Duitku). Kami tidak menyimpan informasi kartu atau detail bank Sahabat.</li>
          </ul>
        </div>
      )
    },
    {
      question: "Kenapa harga di aplikasi berbeda dengan pasar saya?",
      answer: "Harga yang ditampilkan adalah estimasi rata-rata regional. Karena harga pangan fluktuatif setiap harinya, Sahabat sangat disarankan menggunakan fitur 'Koreksi Harga' untuk menyesuaikan dengan harga di pasar langganan Sahabat."
    },
    {
      question: "Apa perbedaan gaya hidup Sederhana, Normal, dan Mewah?",
      answer: "Sederhana fokus pada protein nabati (tahu/tempe) & sayuran lokal. Normal menyeimbangkan protein hewani (ayam/ikan). Mewah mencakup menu yang lebih variatif dengan protein premium seperti daging sapi atau seafood."
    },
    {
      question: "Saya Ingin Memasang Iklan Produk",
      answer: "Kami sangat terbuka untuk kolaborasi! Jika Sahabat memiliki produk bahan pangan, alat masak, atau layanan terkait dan ingin beriklan, silakan hubungi tim Admin kami melalui tombol WhatsApp di halaman ini untuk penawaran kerjasama."
    }
  ];

  const handleDonation = () => {
    if (!donationAmount) return;
    alert(`Mengarahkan ke Gateway Duitku...\nNominal: ${formatRupiah(donationAmount)}\nAPI Ref: ${DUITKU_API_KEY.slice(0,8)}...`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300 pb-10">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Pusat Bantuan</h1>
          <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.15em]">Ada yang bisa Sahabat bantu?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#40916C] to-[#2D6A4F] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-lg font-black mb-1">Dukung Sahabat! ☕</h4>
              <p className="text-[10px] font-bold opacity-80 mb-6 leading-relaxed">Donasi Bunda membantu kami terus mengupdate harga pasar & fitur AI gratis untuk semua.</p>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[10000, 25000, 50000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setDonationAmount(amt)}
                    className={`py-2.5 rounded-xl text-[10px] font-black border-2 transition-all ${donationAmount === amt ? 'bg-white text-[#40916C] border-white' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                  >
                    {amt/1000}rb
                  </button>
                ))}
              </div>

              <button 
                onClick={handleDonation}
                disabled={!donationAmount}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${donationAmount ? 'bg-[#FF9F1C] text-white shadow-lg animate-pulse' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
              >
                Kirim Donasi
              </button>
              <p className="text-[8px] text-center mt-3 font-bold opacity-50 uppercase tracking-tighter">Powered by Duitku Gateway</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center group">
            <div className="bg-green-50 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-10 h-10 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            <h4 className="text-xl font-black text-gray-800 mb-2">Punya Pengaduan?</h4>
            <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">Admin Sahabat Belanja siap membantu kendala teknis Sahabat via WhatsApp.</p>
            <a 
              href="https://wa.me/6285861324859?text=Halo%20Admin%20Sahabat%20Belanja%2C%20saya%20ingin%20mengadu%20atau%20bertanya..." 
              target="_blank" 
              className="w-full py-4 bg-[#25D366] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 hover:shadow-green-200 transition active:scale-95 text-center"
            >
              Chat Admin Sekarang
            </a>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
              <h3 className="text-xl font-black text-gray-800">Tanya Jawab (FAQ)</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Solusi Cepat Sahabat</p>
            </div>
            <div className="px-8 py-2">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
