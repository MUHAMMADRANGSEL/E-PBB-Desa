import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Pembayaran } from '../types';
import { TrendingUp, Landmark, FileCheck } from 'lucide-react';

interface MonthlyPaymentChartProps {
  pembayaran: Pembayaran[];
  selectedTahun: string;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function MonthlyPaymentChart({ pembayaran, selectedTahun }: MonthlyPaymentChartProps) {
  // Aggregate payment data
  const chartData = React.useMemo(() => {
    // Initialize 12 months
    const monthlySummary = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      monthShort: MONTH_NAMES_SHORT[i],
      totalSetoran: 0,
      totalTransaksi: 0,
    }));

    // Filter payments for selected year
    const filtered = pembayaran.filter(p => {
      if (!p.tgl) return false;
      const datePart = p.tgl.split(' ')[0];
      const year = datePart.split('-')[0];
      return !selectedTahun || year === selectedTahun;
    });

    // Populate data
    filtered.forEach(p => {
      const datePart = p.tgl.split(' ')[0];
      const monthStr = datePart.split('-')[1];
      if (monthStr) {
        const mIdx = parseInt(monthStr, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthlySummary[mIdx].totalSetoran += p.jml;
          monthlySummary[mIdx].totalTransaksi += 1;
        }
      }
    });

    return monthlySummary;
  }, [pembayaran, selectedTahun]);

  // Derived metrics
  const stats = React.useMemo(() => {
    const totalSetoran = chartData.reduce((sum, d) => sum + d.totalSetoran, 0);
    const totalTransaksi = chartData.reduce((sum, d) => sum + d.totalTransaksi, 0);
    const maxMonth = [...chartData].sort((a, b) => b.totalSetoran - a.totalSetoran)[0];
    const avgSetoran = totalTransaksi > 0 ? totalSetoran / 12 : 0;

    return {
      totalSetoran,
      totalTransaksi,
      highestMonth: maxMonth.totalSetoran > 0 ? maxMonth.monthName : '-',
      highestAmount: maxMonth.totalSetoran,
      average: avgSetoran
    };
  }, [chartData]);

  // Format rupiah currency
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Safe wrapper for custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div id="recharts-custom-tooltip" className="bg-slate-900 border border-slate-800 text-white rounded-xl p-3.5 shadow-xl">
          <p className="text-xs font-bold text-slate-400 capitalize mb-1.5">{data.monthName}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6 items-center">
              <span className="text-[11px] text-slate-300">Total Setoran:</span>
              <span className="text-xs font-extrabold text-blue-400">{formatRp(data.totalSetoran)}</span>
            </div>
            <div className="flex justify-between gap-6 items-center">
              <span className="text-[11px] text-slate-300">Jumlah Transaksi:</span>
              <span className="text-xs font-bold text-slate-100">{data.totalTransaksi} kwitansi</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="monthly-payment-chart-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
      {/* Header and key overview metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Grafik Tren Penerimaan Bulanan {selectedTahun ? `Siklus ${selectedTahun}` : 'Semua Masa'}
          </h4>
          <p className="text-xxs text-slate-400 mt-0.5">
            Kronologi total rincian uang sebaran pembayaran kas masuk per bulan
          </p>
        </div>
        
        {/* Info stats pill */}
        <div className="flex gap-4 self-stretch md:self-auto overflow-x-auto pb-1 md:pb-0">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
            <Landmark className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase leading-none block">Akumulasi</span>
              <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{formatRp(stats.totalSetoran)}</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase leading-none block">Total Transaksi</span>
              <span className="text-xs font-extrabold text-slate-800 block mt-0.5">{stats.totalTransaksi} kwitansi</span>
            </div>
          </div>
          {stats.highestAmount > 0 && (
            <div className="bg-blue-50/55 border border-blue-100/50 rounded-xl px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <div>
                <span className="text-[10px] text-blue-800 font-bold uppercase leading-none block">Hektik Tertinggi</span>
                <span className="text-xs font-extrabold text-blue-950 block mt-0.5">{stats.highestMonth}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main interactive recharts chart area */}
        <div className="lg:col-span-9 h-72 md:h-80 w-full relative">
          {stats.totalSetoran === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Landmark className="w-10 h-10 text-slate-300 stroke-[1.5] mb-2" />
              <p className="text-xs">Urusan pembayaran kosong untuk tahun pajak ini</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSetoran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="monthShort" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'medium' }}
                />
                <YAxis 
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'medium' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="totalSetoran" 
                  stroke="#2563eb" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorSetoran)" 
                  activeDot={{ r: 6, strokeWidth: 1.5, stroke: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Small bento breakdown block on side */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="space-y-4">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sekilas Rapor Bulanan</h5>
            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Rata-rata Setoran</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{formatRp(stats.average)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-medium block">Nominal Hektik</span>
                <span className="text-sm font-extrabold text-slate-800 block mt-0.5">{formatRp(stats.highestAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <p className="text-[10px] text-slate-500 italic leading-relaxed">
              * Rapor tren ini otomatis berkorelasi dengan hasil penarikan Sinkronisasi Cloud Spreadsheet Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
