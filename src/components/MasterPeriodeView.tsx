import React, { useState } from 'react';
import { Periode } from '../types';
import { Plus, Calendar, Check, X, ShieldAlert, Edit2 } from 'lucide-react';

interface MasterPeriodeViewProps {
  periode: Periode[];
  onAdd: (newPeriode: Periode) => void;
  onEdit: (updatedPeriode: Periode) => void;
  onToggleStatus: (tahun: string) => void;
  onDelete: (tahun: string) => void;
}

export default function MasterPeriodeView({
  periode,
  onAdd,
  onEdit,
  onToggleStatus,
  onDelete
}: MasterPeriodeViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [tahun, setTahun] = useState('');
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('');
  const [editingPeriode, setEditingPeriode] = useState<Periode | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editingPeriode) {
      if (!tahun.trim() || isNaN(Number(tahun)) || tahun.trim().length !== 4) {
        setError('Masukkan format tahun 4 digit angka (misal: 2026).');
        return;
      }
      if (periode.some(p => p.tahun === tahun.trim())) {
        setError('Tahun pajak sudah terdaftar di sistem.');
        return;
      }
    }
    
    if (!tanggalJatuhTempo.trim()) {
       setError('Harap tentukan tanggal jatuh tempo.');
       return;
    }

    if (editingPeriode) {
        onEdit({
            ...editingPeriode,
            tanggal_jatuh_tempo: tanggalJatuhTempo.trim()
        });
    } else {
        onAdd({
          tahun: tahun.trim(),
          status: 'Nonaktif',
          tanggal_jatuh_tempo: tanggalJatuhTempo.trim()
        });
    }
    setTahun('');
    setTanggalJatuhTempo('');
    setEditingPeriode(null);
    setModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 animate-pulse" />
            Pengaturan Periode Tahun Pajak (PBB)
          </h3>
          <p className="text-xs text-slate-500">Menentukan tahun tagihan PBB aktif dan meregistrasikan siklus tahun pajak baru</p>
        </div>
        <button
          onClick={() => {
            setTahun((new Date().getFullYear()).toString());
            setError('');
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Tahun Pajak
        </button>
      </div>

      {/* Info warning alert banner */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50 flex gap-3 text-amber-900 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold">Aturan Penentuan Status Aktif</p>
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            Hanya diperbolehkan ada <strong>1 (satu) tahun pajak</strong> dengan status <strong>Aktif</strong> pada waktu yang sama. Mengaktifkan satu periode secara otomatis menonaktifkan tahun pajak lainnya. Tahun pajak yang aktif akan dijadikan acuan awal pembuatan dan pencarian data SPPT.
          </p>
        </div>
      </div>

      {/* Dynamic listing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periode.map((p) => {
          const isActive = p.status === 'Aktif';
          return (
            <div 
              key={p.tahun}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between h-40
                ${isActive 
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm' 
                  : 'bg-slate-55 border-slate-150/80 hover:bg-slate-50'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-2xl font-black text-slate-900">{p.tahun}</span>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">TAHUN PAJAK</p>
                  <p className="text-[10px] text-emerald-700 font-bold mt-2">Jatuh Tempo: {p.tanggal_jatuh_tempo || '-'}</p>
                </div>
                
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border
                  ${isActive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {p.status}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/55 pt-3 mt-3">
                <button
                  type="button"
                  onClick={() => onToggleStatus(p.tahun)}
                  className={`text-xs font-bold inline-flex items-center gap-1.5 transition px-3 py-1.5 rounded-lg border cursor-pointer
                    ${isActive 
                      ? 'bg-white hover:bg-slate-100 text-blue-700 border-blue-200' 
                      : 'bg-indigo-600 hover:bg-indigo-750 text-white border-indigo-500/10'}`}
                >
                  {isActive ? 'Aktif Sekarang' : 'Set Aktif'}
                </button>

                <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPeriode(p);
                        setTahun(p.tahun);
                        setTanggalJatuhTempo(p.tanggal_jatuh_tempo || '');
                        setModalOpen(true);
                      }}
                       className="text-[10.5px] font-bold text-slate-600 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-transparent transition"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus periode ${p.tahun}? Hal ini tidak menghapus data SPPT yang sudah terbit, tetapi akan menyulitkan penyaringan.`)) {
                          onDelete(p.tahun);
                        }
                      }}
                      disabled={isActive}
                      className="text-[10.5px] font-bold text-red-650 hover:bg-red-50 disabled:text-slate-300 disabled:bg-transparent px-2.5 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition"
                    >
                      Hapus
                    </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Dialog Box */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                {editingPeriode ? 'Edit Tahun Pajak' : 'Tambah Tahun Pajak'}
              </h4>
              <button onClick={() => { setModalOpen(false); setEditingPeriode(null); }} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="text-xxs font-bold text-red-650 bg-red-50/70 p-3 rounded-xl border border-red-150">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Masukkan Angka Tahun</label>
                <input
                  type="text"
                  maxLength={4}
                  value={tahun}
                  disabled={!!editingPeriode}
                  onChange={(e) => setTahun(e.target.value)}
                  placeholder="Contoh: 2026"
                  className={`w-full text-center text-base font-black p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition ${editingPeriode ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={tanggalJatuhTempo}
                  onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                  className="w-full text-center text-base font-black p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setEditingPeriode(null); }}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Simpan Tahun Pajak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
