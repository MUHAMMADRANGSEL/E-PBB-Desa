import React, { useState } from 'react';
import { Dusun, RT, SPPT, ObjekPajak, Periode } from '../types';
import { BarChart3, Printer, MapPin, Users, Download, FileSpreadsheet, Eye } from 'lucide-react';

interface LaporanViewProps {
  dusun: Dusun[];
  rt: RT[];
  sppt: SPPT[];
  objek: ObjekPajak[];
  periode: Periode[];
}

export default function LaporanView({
  dusun,
  rt,
  sppt,
  objek,
  periode
}: LaporanViewProps) {
  const activeTahun = periode.find(p => p.status === 'Aktif')?.tahun || '2026';
  const [selectedTahun, setSelectedTahun] = useState(activeTahun);
  const [reportType, setReportType] = useState<'dusun' | 'rt'>('dusun');

  // Format IDR Rupiah helper
  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Compile calculations based on type
  const compileDusunReport = () => {
    return dusun.map(d => {
      // Find RTs in this Dusun
      const rts = rt.filter(r => r.id_dusun === d.id);
      const rtIds = rts.map(r => r.id);
      
      // Find land units
      const lands = objek.filter(o => rtIds.includes(o.id_rt));
      const nops = lands.map(l => l.nop);
      
      // SPPT bills
      const bills = sppt.filter(s => nops.includes(s.nop) && s.tahun === selectedTahun);

      const totalPagu = bills.reduce((sum, s) => sum + s.pagu, 0);
      const totalBayar = bills.filter(s => s.status === 'Lunas').reduce((sum, s) => sum + s.pagu, 0);
      const sisaDuit = totalPagu - totalBayar;
      const terpenuhi = totalPagu > 0 ? (totalBayar / totalPagu) * 100 : 0;

      return {
        id: d.id,
        nama: d.nama,
        penanggung: d.kepala_dusun,
        totalLembar: bills.length,
        totalPagu,
        totalBayar,
        sisaDuit,
        terpenuhi: terpenuhi.toFixed(1) + '%'
      };
    });
  };

  const compileRtReport = () => {
    return rt.map(r => {
      // Find parent Dusun
      const parentDusun = dusun.find(d => d.id === r.id_dusun)?.nama || '-';

      // Find land units
      const lands = objek.filter(o => o.id_rt === r.id);
      const nops = lands.map(l => l.nop);

      // SPPT bills
      const bills = sppt.filter(s => nops.includes(s.nop) && s.tahun === selectedTahun);

      const totalPagu = bills.reduce((sum, s) => sum + s.pagu, 0);
      const totalBayar = bills.filter(s => s.status === 'Lunas').reduce((sum, s) => sum + s.pagu, 0);
      const sisaDuit = totalPagu - totalBayar;
      const terpenuhi = totalPagu > 0 ? (totalBayar / totalPagu) * 100 : 0;

      return {
        id: r.id,
        nama: r.nama,
        penanggung: parentDusun,
        totalLembar: bills.length,
        totalPagu,
        totalBayar,
        sisaDuit,
        terpenuhi: terpenuhi.toFixed(1) + '%'
      };
    });
  };

  const currentReportData = reportType === 'dusun' ? compileDusunReport() : compileRtReport();

  // Grand totals
  const totalLembarSum = currentReportData.reduce((sum, item) => sum + item.totalLembar, 0);
  const totalPaguSum = currentReportData.reduce((sum, item) => sum + item.totalPagu, 0);
  const totalBayarSum = currentReportData.reduce((sum, item) => sum + item.totalBayar, 0);
  const totalSisaSum = totalPaguSum - totalBayarSum;
  const averageTerpenuhi = totalPaguSum > 0 ? ((totalBayarSum / totalPaguSum) * 100).toFixed(1) + '%' : '0%';

  const triggerExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentReportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Laporan_PBB_${reportType}_${selectedTahun}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 animate-pulse" />
            Rekap Laporan Realisasi Pajak Daerah
          </h3>
          <p className="text-xs text-slate-500">Menganalisis kemajuan target penerimaan PBB berdasarkan wilayah dusun atau rukun tetangga</p>
        </div>
        
        <div className="flex gap-2.5">
          <button
            onClick={triggerExportJSON}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200"
          >
            <Download className="w-4 h-4" /> Ekspor JSON
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Sorters and selectors panel */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/60 p-4 rounded-xl border border-slate-150/80">
        <div className="flex gap-3">
          {/* Sorter tabs */}
          <button
            onClick={() => setReportType('dusun')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer
              ${reportType === 'dusun' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-100'}`}
          >
            <MapPin className="w-4 h-4" /> Rekap Per Dusun
          </button>

          <button
            onClick={() => setReportType('rt')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer
              ${reportType === 'rt' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-100'}`}
          >
            <Users className="w-4 h-4" /> Rekap Per RT
          </button>
        </div>

        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Tahun Laporan :</span>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 text-slate-700 cursor-pointer"
          >
            {periode.map(p => (
              <option key={p.tahun} value={p.tahun}>{p.tahun}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table report breakdown */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
        <table className="w-full text-left border-collapse" id="report-tabular">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 text-xxs font-extrabold uppercase tracking-widest">
              <th className="p-4">Kode ID</th>
              <th className="p-4">{reportType === 'dusun' ? 'Nama Wilayah Dusun' : 'Rincian RT'}</th>
              <th className="p-4">{reportType === 'dusun' ? 'Penanggung Jawab (Kadus)' : 'Kaitan Dusun'}</th>
              <th className="p-4 text-center">Volume SPPT</th>
              <th className="p-4 text-right">Target Pagu</th>
              <th className="p-4 text-right">Realisasi (Bayar)</th>
              <th className="p-4 text-right">Kurang (Piutang)</th>
              <th className="p-4 text-right">Realisasi (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {currentReportData.map((row, idx) => {
              const check100 = parseFloat(row.terpenuhi) >= 100;
              return (
                <tr key={`${row.id}-${idx}`} className="hover:bg-slate-50/40 transition">
                  <td className="p-4 text-slate-500 font-mono font-bold">{row.id}</td>
                  <td className="p-4 font-bold text-slate-900">{row.nama}</td>
                  <td className="p-4 text-slate-500">{row.penanggung}</td>
                  <td className="p-4 text-center font-mono">{row.totalLembar} lembar</td>
                  <td className="p-4 text-right font-black text-slate-850">{formatRp(row.totalPagu)}</td>
                  <td className="p-4 text-right font-black text-emerald-600">{formatRp(row.totalBayar)}</td>
                  <td className="p-4 text-right font-black text-red-650">{formatRp(row.sisaDuit)}</td>
                  <td className="p-4 text-right">
                    <span className={`font-black tracking-tight text-xs
                      ${check100 ? 'text-green-600' : 'text-blue-700'}`}>
                      {row.terpenuhi}
                    </span>
                  </td>
                </tr>
              );
            })}
            
            {/* Consolidated totals row */}
            <tr className="bg-slate-950/20 border-t-2 border-slate-300 font-extrabold text-slate-950 text-xs">
              <td colSpan={3} className="p-4 text-left uppercase">TOTAL REKAP DESA</td>
              <td className="p-4 text-center font-mono">{totalLembarSum} lembar</td>
              <td className="p-4 text-right font-black">{formatRp(totalPaguSum)}</td>
              <td className="p-4 text-right font-black text-emerald-650">{formatRp(totalBayarSum)}</td>
              <td className="p-4 text-right font-black text-red-650">{formatRp(totalSisaSum)}</td>
              <td className="p-4 text-right">
                <span className="font-extrabold text-sm text-blue-800">{averageTerpenuhi}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Info footer box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 text-[10.5px] leading-relaxed text-slate-400 font-semibold uppercase text-center">
        DIKELUARKAN SECARA RESMI OLEH DIREKTORAT KOLEKSI PBB DESA - TAHUN TIMESTAMPS: {new Date().getFullYear()}
      </div>
    </div>
  );
}
