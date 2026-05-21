import React, { useState } from 'react';
import { ObjekPajak, SPPT, Subjek, Pengaturan } from '../types';
import { 
  Search, 
  MapPin, 
  Landmark, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Building, 
  HelpCircle, 
  PhoneCall, 
  FileText, 
  Coins, 
  ExternalLink,
  User,
  MapPinned,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

interface PublicViewProps {
  objek: ObjekPajak[];
  sppt: SPPT[];
  subjek: Subjek[];
  settings: Pengaturan;
  onGoToLogin: () => void;
}

export default function PublicView({
  objek,
  sppt,
  subjek,
  settings,
  onGoToLogin
}: PublicViewProps) {
  const [nopInput, setNopInput] = useState('');
  const [bills, setBills] = useState<(SPPT & { nama_wp?: string; letak?: string; luas_bumi?: number; luas_bngn?: number; njop_val?: number })[]>([]);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeGuideTab, setActiveGuideTab] = useState<'cara' | 'faq'>('cara');

  // Search function for NOP
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSearchAttempted(true);

    const checkNop = nopInput.replace(/[^0-9]/g, '').trim(); // Strip formatting for search safety
    const originalInput = nopInput.trim();

    if (!originalInput) {
      setErrorMsg('Masukkan nomor NOP Anda terlebih dahulu.');
      setBills([]);
      return;
    }

    // Try matches either formatted or unformatted NOP
    const land = objek.find(o => {
      const cleanO = o.nop.replace(/[^0-9]/g, '');
      return o.nop === originalInput || cleanO === checkNop;
    });

    if (!land) {
      setBills([]);
      return;
    }

    const owner = subjek.find(s => s.nik === land.nik);
    const nameStr = owner ? owner.nama : land.nama_pemilik_sppt;
    const locationStr = land.letak_op;

    const matchedBills = sppt.filter(s => {
      const cleanS = s.nop.replace(/[^0-9]/g, '');
      return s.nop === land.nop || cleanS === checkNop;
    });

    setBills(
      matchedBills.map(b => ({
        ...b,
        nama_wp: nameStr,
        letak: locationStr,
        luas_bumi: land.luas_b,
        luas_bngn: land.luas_bangunan,
        njop_val: land.njop
      }))
    );
  };

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Preset NOP examples generator
  const handleUsePreset = (presetNop: string) => {
    setNopInput(presetNop);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative flex flex-col justify-between text-slate-800 selection:bg-indigo-500/30 selection:text-slate-900">
      
      {/* Premium subtle background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        <div className="w-[600px] h-[600px] rounded-full bg-indigo-500/[0.03] filter blur-[100px] absolute -top-80 -left-40 animate-pulse duration-[10s]" />
        <div className="w-[600px] h-[600px] rounded-full bg-emerald-500/[0.02] filter blur-[100px] absolute -bottom-45 -right-20 animate-pulse duration-[14s]" />
        {/* Crisp grid lines suited for light layout */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_65%,transparent_100%)] opacity-35" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        
        {/* Navigation / Header */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-slate-200/70 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-550 to-indigo-550 opacity-15 blur-sm group-hover:opacity-30 transition duration-500" />
              <div className="relative w-11 h-11 rounded-xl bg-white border border-slate-150 p-1 flex items-center justify-center overflow-hidden shadow-sm">
                {settings.logo_desa ? (
                  <img 
                    src={settings.logo_desa} 
                    referrerPolicy="no-referrer"
                    alt="Logo Desa"
                    className="w-full h-full object-contain scale-[1.05]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Landmark className="w-6 h-6 text-indigo-600" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-wider text-base uppercase">{settings.nama_aplikasi || 'E-PBB ONLINE'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200 tracking-wider">LIVE</span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5 tracking-wide uppercase">
                Portal Pelayanan Mandiri Desa {settings.nama_desa || ''}
              </span>
            </div>
          </div>

          <button
            onClick={onGoToLogin}
            className="bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-950 shadow-md transition-all duration-300 cursor-pointer flex items-center gap-2"
          >
            <User className="w-3.5 h-3.5 text-slate-300" />
            <span>Masuk Petugas</span>
          </button>
        </header>

        {/* Content Body */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 flex-grow flex flex-col justify-center">
          
          {/* Welcome Text Section */}
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Periksa Tagihan Pajak Bumi & Bangunan
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed">
              Cek real-time status kelunasan PBB SPPT Desa {settings.nama_desa || ''} melalui portal resmi terintegrasi. Cukup masukkan Nomor Objek Pajak (NOP) Anda yang terdaftar.
            </p>
          </div>

          {/* Core Interactive Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form & Search Result (Slightly larger area) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Form Input Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-150/60 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.01] rounded-full filter blur-xl pointer-events-none" />
                
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-indigo-650 rounded-full" />
                  Cari Data Berdasarkan NOP
                </h3>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-4.5 h-4.5 text-indigo-500" />
                    </span>
                    <input
                      type="text"
                      placeholder="Masukkan 24 Digit NOP (Contoh: 320102000...)"
                      value={nopInput}
                      onChange={(e) => setNopInput(e.target.value)}
                      className="w-full text-sm font-bold pl-12 pr-4 py-4 rounded-2xl outline-none border border-slate-200 bg-slate-50 font-mono text-slate-900 focus:border-indigo-505 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all duration-300 shadow-inner placeholder-slate-400 tracking-wide"
                    />
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-red-655 flex-shrink-0" />
                      <p className="text-xxs font-bold text-red-700 leading-normal">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold py-4 px-6 rounded-2xl text-xs sm:text-sm tracking-wide transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Temukan SPPT Wajib Pajak</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </button>
                    
                    {/* Quick Preset Help if available */}
                    {objek && objek.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleUsePreset(objek[0].nop)}
                        className="bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 py-3.5 px-4.5 rounded-2xl text-xxs font-semibold transition cursor-pointer shadow-sm"
                      >
                        Simulasi NOP Bawaan
                      </button>
                    )}
                  </div>
                </form>

                {/* Info NOP Helper Badge */}
                <div className="mt-4 flex gap-2.5 items-start text-[11px] text-slate-500 leading-relaxed font-semibold bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <Info className="w-4 h-4 text-indigo-550 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-700">Di mana menemukan NOP?</strong> Nomor Objek Pajak (24 digit lengkap) terletak pada bagian atas lembar Surat Pemberitahuan Pajak Terutang (SPPT) fisik Anda di samping nama desa.
                  </p>
                </div>
              </div>

              {/* Dynamic Search Results */}
              {searchAttempted && (
                <div className="bg-white border border-slate-205 rounded-3xl p-6 shadow-xl shadow-slate-150/60 relative overflow-hidden transition-all duration-300">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                      Hasil Pencarian Portal
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">Terbaru</span>
                  </h3>

                  {bills.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 space-y-2">
                      <ShieldAlert className="w-10 h-10 mx-auto text-slate-400" />
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">NOP Tidak Valid / Tidak Ketemu</p>
                        <p className="text-xxs text-slate-500 leading-relaxed font-semibold max-w-sm mx-auto mt-1">
                          Nomor Objek Pajak yang Anda masukkan tidak terdaftar di database Desa {settings.nama_desa || ''} atau belum memiliki riwayat tahun pajak diterbitkan.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Identity Panel */}
                      <div className="bg-slate-50/70 border border-slate-200/80 p-4.5 rounded-2xl relative">
                        <div className="absolute top-3.5 right-4 flex items-center gap-1.5 text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
                          <MapPinned className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Status Wajib Pajak</span>
                        </div>
                        <div className="space-y-2.5">
                          <div>
                            <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wide block">Nama Pemilik SPPT</span>
                            <span className="text-sm font-black text-slate-900 block mt-0.5">{bills[0].nama_wp}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wide block">Alamat / Letak Objek Pajak</span>
                            <span className="text-xs text-slate-600 font-semibold block mt-0.5">{bills[0].letak || 'Wilayah Desa'}</span>
                          </div>

                          {/* Detail dimensi tanah/bangunan */}
                          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-3.5 mt-2">
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Luas Bumi</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5 block">{bills[0].luas_bumi ? `${bills[0].luas_bumi} m²` : '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Luas Bangunan</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5 block">{bills[0].luas_bngn ? `${bills[0].luas_bngn} m²` : '-'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase block font-sans">Ketetapan NJOP</span>
                              <span className="text-xs font-black text-indigo-650 mt-0.5 block">{bills[0].njop_val ? formatRp(bills[0].njop_val) : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SPPT Installments Cards */}
                      <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider block">Daftar Tagihan Tahun Pajak</span>
                      
                      <div className="space-y-3 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                        {bills.map(b => {
                          const isLunas = b.status === 'Lunas';
                          return (
                            <div 
                              key={b.id} 
                              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3
                                ${isLunas 
                                  ? 'bg-emerald-50 hover:bg-emerald-50/55 border-emerald-200/60' 
                                  : 'bg-amber-50 hover:bg-amber-50/55 border-amber-200/60'}`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900">Tahun Pajak {b.tahun}</span>
                                  <span className="text-[9.5px] font-mono text-slate-400 font-bold">ID {b.id}</span>
                                </div>
                                <div className="flex items-baseline gap-1.5 pt-0.5">
                                  <span className="text-slate-550 text-[10px] font-bold">Pagu Ketetapan Pokok:</span>
                                  <span className="text-sm font-black text-slate-900">{formatRp(b.pagu)}</span>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 border-t sm:border-t-0 border-slate-200 pt-2.5 sm:pt-0">
                                <span className={`text-[9.5px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 uppercase tracking-wider
                                  ${isLunas 
                                    ? 'bg-white text-emerald-700 border-emerald-300 shadow-sm' 
                                    : 'bg-white text-amber-700 border-amber-300 shadow-sm'}`}>
                                  {isLunas ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Lunas</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-amber-600 animator-pulse" />
                                      <span>Belum Lunas</span>
                                    </>
                                  )}
                                </span>

                                {!isLunas && (
                                  <span className="text-[10px] text-slate-500 font-bold block mt-1 tracking-tight">Kolektif di Balai Desa / Kepala Dusun</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Information, Portal FAQ, Guide block */}
            <div className="lg:col-span-5 bg-white border border-slate-205 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-150/60 space-y-6">
              
              {/* Village Header Identity */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                    <Building className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-indigo-650 uppercase tracking-widest">KANTOR KEPALA DESA</h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase mt-0.5">
                      Pemerintah Desa {settings.nama_desa || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Tabs (Guide vs FAQ) */}
              <div className="flex border border-slate-200 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('cara')}
                  className={`flex-1 py-2 text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center
                    ${activeGuideTab === 'cara' 
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200/50' 
                      : 'text-slate-550 hover:text-slate-800'}`}
                >
                  Cara Pembayaran
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('faq')}
                  className={`flex-1 py-2 text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center
                    ${activeGuideTab === 'faq' 
                      ? 'bg-white text-slate-900 shadow-md border border-slate-200/50' 
                      : 'text-slate-550 hover:text-slate-800'}`}
                >
                  Tanya Jawab (FAQ)
                </button>
              </div>

              {/* Tab Content: Guide Cara */}
              {activeGuideTab === 'cara' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-655 leading-relaxed font-semibold">
                    Untuk melunasi SPPT Pajak Bumi dan Bangunan (PBB-P2) yang bersatus <strong className="text-amber-700">Belum Lunas</strong>, wajib pajak dapat menempuh jalur resmi berikut:
                  </p>

                  <div className="space-y-3.5 text-xs text-slate-650 font-semibold font-sans">
                    
                    <div className="flex gap-3 leading-normal">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center flex-shrink-0 text-xxs font-black font-mono">
                        1
                      </div>
                      <div className="flex-1">
                        <strong className="text-slate-900 block font-black text-xs">Kolektor Dusun / Ketua RT</strong>
                        Hubungi Kepala Dusun atau Tim Kolektor Pajak Desa yang bertugas di wilayah RT Anda untuk penyetoran langsung secara tunai.
                      </div>
                    </div>

                    <div className="flex gap-3 leading-normal">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center flex-shrink-0 text-xxs font-black font-mono">
                        2
                      </div>
                      <div className="flex-1">
                        <strong className="text-slate-900 block font-black text-xs">Loket PBB Balai Desa</strong>
                        Kunjungi kantor kepala desa (Loket Pelayanan Pajak E-PBB) pada jam kerja dengan membawa SPPT atau mencatat kode NOP Anda.
                      </div>
                    </div>

                    <div className="flex gap-3 leading-normal">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center flex-shrink-0 text-xxs font-black font-mono">
                        3
                      </div>
                      <div className="flex-1">
                        <strong className="text-slate-900 block font-black text-xs">Verifikasi & Real-time Kuitansi</strong>
                        Setelah disetor, petugas loket akan mengesahkan pembayaran Anda secara instan dan Anda dapat mencek ulang halaman ini untuk memastikan status sudah berubah menjadi <span className="text-emerald-600 font-extrabold font-black">Lunas</span>.
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab Content: FAQ FAQ */}
              {activeGuideTab === 'faq' && (
                <div className="space-y-3.5">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1.5 text-xs">
                    <strong className="text-slate-900 block font-extrabold text-xs">Apakah bisa bayar transfer bank?</strong>
                    <p className="text-slate-500 leading-normal font-semibold">
                      Saat ini pembayaran online dapat diproses melalui QRIS / transfer pada loket administrasi desa untuk memicu cetak kuitansi. Hubungi tim administrasi desa untuk informasi opsi transfer.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-1.5 text-xs">
                    <strong className="text-slate-900 block font-extrabold text-xs">Bagaimana jika data SPPT tidak sesuai?</strong>
                    <p className="text-slate-500 leading-normal font-semibold">
                      Jika terjadi perbedaan nama wajib pajak, luas bumi, atau letak objek lahan, Anda dapat melapor ke Kepala Seksi Pemerintahan Desa untuk segera mengajukan pembetulan SPPT.
                    </p>
                  </div>
                </div>
              )}

              {/* Help & Support Footer Contact */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold block uppercase tracking-wider">Butuh Bantuan Teknis?</span>
                  <span className="text-slate-700 font-extrabold block mt-0.5">Hubungi Tim Kolektor Desa</span>
                </div>
                <div className="bg-indigo-600 hover:bg-indigo-700 p-2.5 rounded-xl text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-[0.98]">
                  <PhoneCall className="w-4 h-4" />
                  <span className="text-xxs font-black uppercase">Kontak</span>
                </div>
              </div>

            </div>

          </div>

        </main>

        {/* Dynamic footer matching local system settings */}
        <footer className="w-full bg-white border-t border-slate-200 px-4 sm:px-6 py-8 relative z-10 text-center space-y-2 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-slate-500 font-semibold text-xxs sm:text-xs">
            <p className="tracking-wide text-center md:text-left leading-normal">
              &copy; {new Date().getFullYear()} <strong className="text-slate-900 font-bold">{settings.nama_aplikasi?.toUpperCase() || 'E-PBB'}</strong>. PEMERINTAH DESA {settings.nama_desa?.toUpperCase() || ''}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2 md:mt-0 uppercase text-[10px] text-slate-600 bg-slate-50 px-3.5 py-1.5 border border-slate-200 rounded-xl font-bold tracking-wide">
              <span>Kec. {settings.nama_kecamatan || ''}</span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <span>Kab. {settings.nama_kabupaten || ''}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wide max-w-4xl mx-auto text-center pt-2 leading-relaxed border-t border-slate-100">
            Sistem Layanan Mandiri Kelunasan Pajak Bumi dan Bangunan Perdesaan dan Perkotaan (PBB-P2) dikelola secara tersinkronisasi sebagai wujud keterbukaan informasi publik dan akuntabilitas Desa.
          </p>
        </footer>

      </div>
    </div>
  );
}
