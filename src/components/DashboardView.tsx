import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight, 
  Search, 
  Plus, 
  Database,
  Calendar,
  Contact2,
  AlertTriangle,
  TrendingDown,
  BarChart as BarChartIcon,
  RefreshCcw
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dusun, RT, Periode, Subjek, ObjekPajak, SPPT, Pembayaran, Pengguna, Pengaturan } from '../types';
import MonthlyPaymentChart from './MonthlyPaymentChart';

interface DashboardViewProps {
  dusun: Dusun[];
  rt: RT[];
  periode: Periode[];
  subjek: Subjek[];
  objek: ObjekPajak[];
  sppt: SPPT[];
  pembayaran: Pembayaran[];
  settings: Pengaturan;
  lastSyncTime: Date | null;
  onChangeMenu: (menu: string) => void;
  onSetQuickCheckNOP?: (nop: string) => void;
}

export default function DashboardView({
  dusun,
  rt,
  periode,
  subjek,
  objek,
  sppt,
  pembayaran,
  settings,
  lastSyncTime,
  onChangeMenu,
  onSetQuickCheckNOP
}: DashboardViewProps) {
  // Find current active tax period
  const activePeriod = periode.find(p => p.status === 'Aktif')?.tahun || '2026';
  const [selectedTahun, setSelectedTahun] = useState<string>(activePeriod);

  // Filter SPPT by year
  const filteredSPPT = selectedTahun 
    ? sppt.filter(s => s.tahun === selectedTahun) 
    : sppt;

  // Due SPPTs (Belum Lunas in active tax year)
  const dueSPPTs = filteredSPPT
    .filter(s => s.status === 'Belum Lunas')
    .sort((a, b) => b.pagu - a.pagu)
    .slice(0, 5);

  // Key figures
  const totalSPPT = filteredSPPT.length;
  const lunasSPPT = filteredSPPT.filter(s => s.status === 'Lunas').length;
  const piutangSPPT = totalSPPT - lunasSPPT;

  const totalPagu = filteredSPPT.reduce((sum, s) => sum + s.pagu, 0);
  const totalBayar = filteredSPPT.filter(s => s.status === 'Lunas').reduce((sum, s) => sum + s.pagu, 0);
  const totalSisa = totalPagu - totalBayar;
  const realisasiPersen = totalPagu > 0 ? Math.round((totalBayar / totalPagu) * 100) : 0;

  // Format IDR Rupiah
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Recent payments
  const recentPayments = [...pembayaran]
    .sort((a, b) => b.tgl.localeCompare(a.tgl))
    .slice(0, 5);

  // SVG Donut calculation parameters
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (realisasiPersen / 100) * circumference;

  // Piutang Trend Data
  const piutangTrendData = React.useMemo(() => {
    // Total Pagu for current year
    const totalPaguYear = filteredSPPT.reduce((sum, s) => sum + s.pagu, 0);

    // Payments in this year
    const paymentsThisYear = pembayaran.filter(p => {
        if (!p.tgl) return false;
        const year = p.tgl.split(' ')[0].split('-')[0];
        return year === selectedTahun;
    });

    const monthlySummaries = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'][i],
      paid: 0
    }));

    paymentsThisYear.forEach(p => {
      const monthStr = p.tgl.split(' ')[0].split('-')[1];
      const mIdx = parseInt(monthStr, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        monthlySummaries[mIdx].paid += p.jml;
      }
    });

    let cumulativePaid = 0;
    return monthlySummaries.map(m => {
        cumulativePaid += m.paid;
        return {
            month: m.monthName,
            sisaPiutang: Math.max(0, totalPaguYear - cumulativePaid)
        };
    });
  }, [filteredSPPT, pembayaran, selectedTahun]);

  return (
    <div className="space-y-6 fade-in text-slate-700">
      
      {/* Sync Status Banner */}
      {lastSyncTime && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-2 rounded-xl font-medium">
          <RefreshCcw className="w-4 h-4" />
          <span>Terakhir disinkronisasi: {lastSyncTime.toLocaleTimeString('id-ID')}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform -translate-y-6 translate-x-12 select-none">
          <DollarSign className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="bg-blue-500/25 border border-blue-400/30 text-blue-200 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-widest">
            SISTEM INFORMASI PBB DESA
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Selamat Datang di Portal E-PBB Desa {settings.nama_desa}!
          </h1>
          <p className="text-blue-100 text-sm md:text-base font-normal leading-relaxed opacity-90 max-w-xl">
            Optimalkan pendataan, pemantauan status lunas, penerimaan kas harian, dan pencetakan struk pembayaran pajak bumi dan bangunan dengan mudah, cepat, dan transparan.
          </p>
        </div>
      </div>

      {/* Due Tax Cards if any */}
      {dueSPPTs.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            NOP Jatuh Tempo / Belum Lunas ({selectedTahun})
          </h4>
          <div className="space-y-2">
            {dueSPPTs.map(s => (
              <div key={s.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100 shadow-xs">
                <span className="text-xs font-bold text-slate-700">{s.nama_pemilik_sppt || 'Wajib Pajak'}</span>
                <span className="text-xs font-black text-amber-700">{formatRp(s.pagu)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Year Selection Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Metrik Penerimaan Pajak Desa
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Ringkasan status tagihan dan setoran berdasarkan tahun pajak</p>
        </div>
        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 shadow-inner">
          <span className="text-xs font-semibold text-slate-500">Tahun Pajak :</span>
          <select 
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="text-sm font-bold bg-transparent border-none outline-none focus:ring-0 text-slate-800 cursor-pointer"
          >
            <option value="">Semua Tahun</option>
            {periode.map((p) => (
              <option key={p.tahun} value={p.tahun}>
                {p.tahun} {p.status === 'Aktif' ? '(Aktif)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SPPT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Lembar SPPT</p>
            <p className="text-3xl font-extrabold text-slate-950">{totalSPPT}</p>
            <span className="text-xxs text-slate-500 font-medium">Dokumen Pajak Objek Bumi</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-inner">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Realisasi Lunas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lunas Terbayar</p>
            <p className="text-3xl font-extrabold text-green-600">{lunasSPPT}</p>
            <span className="text-xxs text-slate-500 font-medium">Realisasi ({realisasiPersen}%)</span>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Piutang / Belum Lunas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tunggakan Belum Lunas</p>
            <p className="text-3xl font-extrabold text-red-650">{piutangSPPT}</p>
            <span className="text-xxs text-slate-500 font-medium">Outstanding Bill</span>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shadow-inner">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Setoran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metrik Penerimaan PBB</p>
            <p className="text-2xl font-extrabold text-indigo-750 truncate max-w-[170px]">{formatRp(totalBayar)}</p>
            <span className="text-xxs text-slate-500 font-medium">Dari {formatRp(totalPagu)}</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Custom Chart, Recent Payments, Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Collection donut details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center lg:col-span-4 h-96">
          <h4 className="text-sm font-bold text-slate-950 w-full text-left border-b border-slate-100 pb-3 mb-4">
            Progress Realisasi Target
          </h4>
          
          <div className="relative flex-1 flex flex-col items-center justify-center py-4">
            <svg width="160" height="160" className="transform -rotate-90 select-none">
              {/* Secondary stroke path */}
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="stroke-slate-100" 
                strokeWidth="16" 
                fill="transparent" 
              />
              {/* Dynamic state curve */}
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="stroke-blue-600" 
                strokeWidth="16" 
                fill="transparent" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center select-none">
              <span className="block text-3xl font-black text-slate-900 leading-none">{realisasiPersen}%</span>
              <span className="text-xxs font-semibold text-slate-400 uppercase mt-1 block">Selesai</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full text-center mt-2 pt-2 border-t border-slate-50">
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-full mr-2"></span>
              <span className="text-xs text-slate-500 font-semibold">Realisasi</span>
              <p className="text-xs font-bold text-slate-800">{formatRp(totalBayar)}</p>
            </div>
            <div>
              <span className="inline-block w-2.5 h-2.5 bg-slate-200 rounded-full mr-2"></span>
              <span className="text-xs text-slate-500 font-semibold">Tunggakan</span>
              <p className="text-xs font-bold text-slate-800">{formatRp(totalSisa)}</p>
            </div>
          </div>
        </div>

        {/* Recent payments cashier history */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:col-span-5 h-96">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Transaksi Penerimaan Terbaru
            </h4>
            <button 
              onClick={() => onChangeMenu('pembayaran')}
              className="text-xs bg-indigo-50 text-indigo-650 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-bold transition flex items-center gap-1"
            >
              Urus Kas <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs">Belum ada struk setoran hari ini</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentPayments.map((p) => {
                  return (
                    <li key={p.id} className="py-3 flex justify-between items-center hover:bg-slate-50/50 transition px-2 rounded-xl">
                      <div className="flex items-center gap-3 truncate mr-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-55/70 text-emerald-600 border border-emerald-100/50 flex items-center justify-center font-bold text-xs">
                          {p.metode === 'Transfer' ? 'TF' : 'CA'}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{p.nama_pembayar}</p>
                          <p className="text-xxs text-slate-400 font-medium">SPPT: {p.id_sppt}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-emerald-600">+{formatRp(p.jml)}</span>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{p.tgl.split(' ')[0]}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Quick Tools Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col lg:col-span-3 h-96">
          <h4 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            Akses Pintas Cepat
          </h4>
          <div className="flex-1 flex flex-col gap-3 justify-center">
            {/* Quick cash check */}
            <button 
              onClick={() => onChangeMenu('pembayaran')}
              className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-800 transition text-left group border border-blue-100/30"
            >
              <div className="w-9 h-9 bg-blue-500 rounded-lg text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/15 group-hover:scale-105 transition-transform duration-200">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-slate-800">Cek Tagihan / NOP</span>
                <span className="text-[10.5px] text-slate-500 block leading-tight">Bayar & Cetak Receipt</span>
              </div>
            </button>

            {/* General OP check */}
            <button 
              onClick={() => onChangeMenu('objek')}
              className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-800 transition text-left group border border-amber-100/30"
            >
              <div className="w-9 h-9 bg-amber-500 rounded-lg text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/15 group-hover:scale-105 transition-transform duration-200">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-slate-800">Tambah Objek (OP)</span>
                <span className="text-[10.5px] text-slate-500 block leading-tight">Daftarkan Tanah & Bangunan</span>
              </div>
            </button>

            {/* General WP check */}
            <button 
              onClick={() => onChangeMenu('subjek')}
              className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-800 transition text-left group border border-purple-100/30"
            >
              <div className="w-9 h-9 bg-purple-500 rounded-lg text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/15 group-hover:scale-105 transition-transform duration-200">
                <Contact2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold block text-slate-800">Wajib Pajak Baru</span>
                <span className="text-[10.5px] text-slate-500 block leading-tight">Pendataan NIK & Telepon WP</span>
              </div>
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
              E-PBB ENGINE {settings.nama_desa ? settings.nama_desa : 'DESA'}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Payment Chart */}
      <MonthlyPaymentChart pembayaran={pembayaran} selectedTahun={selectedTahun} />

      {/* Piutang Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Tren Sisa Piutang Pajak Bulanan ({selectedTahun})
          </h4>
          <p className="text-xxs text-slate-400 mt-0.5">
            Visualisasi penurunan sisa piutang pajak seiring berjalannya waktu
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={piutangTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : `${(val / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(value: number) => formatRp(value)}
                contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="sisaPiutang" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Quick Geo Report */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500 animate-pulse" />
              Sebaran Penerimaan Berdasarkan Wilayah Dusun
            </h4>
            <p className="text-xxs text-slate-400 mt-0.5">Ringkasan cepat performa setoran dari masing-masing kepala dusun</p>
          </div>
          <button 
            onClick={() => onChangeMenu('laporan')}
            className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition"
          >
            Analisis Detail <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dusun.map(d => {
            // Find RTs in this Dusun
            const rtsInDusun = rt.filter(r => r.id_dusun === d.id);
            const rtsIds = rtsInDusun.map(r => r.id);
            // Find Objek Pajak in these RTs
            const opsInDusun = objek.filter(o => rtsIds.includes(o.id_rt));
            const opsNops = opsInDusun.map(o => o.nop);
            // Find SPPT for this year that are in these NOPs
            const spptsInDusun = filteredSPPT.filter(s => opsNops.includes(s.nop));

            const totalPaguDusun = spptsInDusun.reduce((sum, s) => sum + s.pagu, 0);
            const totalBayarDusun = spptsInDusun.filter(s => s.status === 'Lunas').reduce((sum, s) => sum + s.pagu, 0);
            const persentase = totalPaguDusun > 0 ? Math.round((totalBayarDusun / totalPaguDusun) * 100) : 0;

            return (
              <div key={d.id} className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100/80 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{d.nama}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5 block">Kadus: {d.kepala_dusun}</span>
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg">
                      {persentase}%
                    </span>
                  </div>

                  {/* Progress indicators */}
                  <div className="w-full bg-slate-200/60 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${persentase}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 text-left mt-4 border-t border-slate-100/50 pt-3">
                  <div>
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase leading-none block">DIBAYAR</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-1">{formatRp(totalBayarDusun)}</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] text-slate-400 font-extrabold uppercase leading-none block">TOTAL TAGIHAN</span>
                    <span className="text-xs font-extrabold text-slate-800 block mt-1">{formatRp(totalPaguDusun)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
