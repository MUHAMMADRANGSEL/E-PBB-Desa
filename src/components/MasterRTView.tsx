import React, { useState } from 'react';
import { Dusun, RT, SPPT, ObjekPajak } from '../types';
import { Plus, Edit2, Trash2, Search, Users, X, MapPin } from 'lucide-react';

interface MasterRTViewProps {
  rt: RT[];
  dusun: Dusun[];
  sppt: SPPT[];
  objek: ObjekPajak[];
  onAdd: (newRT: RT) => void;
  onEdit: (updatedRT: RT) => void;
  onDelete: (id: string) => void;
}

export default function MasterRTView({
  rt,
  dusun,
  sppt,
  objek,
  onAdd,
  onEdit,
  onDelete
}: MasterRTViewProps) {
  const [search, setSearch] = useState('');
  const [selectedDusunId, setSelectedDusunId] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRtPagu = (rtId: string) => {
    const opsInRt = objek.filter(o => o.id_rt === rtId);
    const opsNops = opsInRt.map(o => o.nop);
    const spptsInRt = sppt.filter(s => opsNops.includes(s.nop));
    return spptsInRt.reduce((sum, s) => sum + s.pagu, 0);
  };

  // Form fields
  const [id, setId] = useState('');
  const [nama, setNama] = useState('');
  const [idDusun, setIdDusun] = useState('');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setId(`RT00${rt.length + 1}`);
    setNama('');
    setIdDusun(dusun[0]?.id || '');
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: RT) => {
    setId(item.id);
    setNama(item.nama);
    setIdDusun(item.id_dusun);
    setEditingId(item.id);
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !nama.trim() || !idDusun) {
      setError('Harap lengkapi semua baris.');
      return;
    }

    if (!editingId && rt.some(r => r.id === id)) {
      setError('ID RT sudah terdaftar. Masukkan ID lain.');
      return;
    }

    const payload: RT = {
      id: id.trim(),
      nama: nama.trim(),
      id_dusun: idDusun
    };

    if (editingId) {
      onEdit(payload);
    } else {
      onAdd(payload);
    }
    setModalOpen(false);
  };

  // Listings filter
  const filtered = rt.filter(item => {
    const dMatch = selectedDusunId ? item.id_dusun === selectedDusunId : true;
    const sMatch = 
      item.nama.toLowerCase().includes(search.toLowerCase()) || 
      item.id.toLowerCase().includes(search.toLowerCase());
    return dMatch && sMatch;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 animate-pulse" />
            Data Master Wilayah RT
          </h3>
          <p className="text-xs text-slate-500">Mendaftarkan unit Rukun Tetangga (RT) rincian dari masing-masing kepala dusun</p>
        </div>
        <button
          onClick={openAddModal}
          disabled={dusun.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah RT
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari kode/nama RT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-150 rounded-xl px-3 py-1.5 bg-slate-50/50">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Saring Dusun :</span>
          <select
            value={selectedDusunId}
            onChange={(e) => setSelectedDusunId(e.target.value)}
            className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 text-slate-700 cursor-pointer"
          >
            <option value="">Semua Dusun</option>
            {dusun.map(d => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RT Table Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-xxs font-extrabold uppercase tracking-widest">
              <th className="p-4">ID RT</th>
              <th className="p-4">Nama RT</th>
              <th className="p-4">Kaitan Dusun</th>
              <th className="p-4 text-right">Total Pagu</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada data RT ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const parentDusun = dusun.find(d => d.id === item.id_dusun);
                const totalPagu = getRtPagu(item.id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-slate-500 font-mono font-bold">{item.id}</td>
                    <td className="p-4 font-bold text-slate-900">{item.nama}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <MapPin className="w-2.5 h-2.5" />
                        </span>
                        <span className="text-slate-800">{parentDusun ? parentDusun.nama : `Dusun tidak ditemukan (${item.id_dusun})`}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-slate-950">
                      {formatRp(totalPagu)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="hover:bg-blue-50 text-blue-650 p-1.5 rounded-lg border border-slate-150 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus ${item.nama}? Objek pajak yang terkait dengan wilayah RT ini perlu disesuaikan kembali.`)) {
                              onDelete(item.id);
                            }
                          }}
                          className="hover:bg-red-50 text-red-600 p-1.5 rounded-lg border border-slate-150 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pop Floating Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Data RT' : 'Tambah RT Baru'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {error && (
                <div className="text-xxs font-bold text-red-650 bg-red-50/70 p-3 rounded-xl border border-red-150">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">ID RT (Unik)</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={editingId !== null}
                  placeholder="Contoh: RT001"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Kode/Nama RT</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: RT 01 / RW 01"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Wilayah Dusun (Hamlet)</label>
                <select
                  value={idDusun}
                  onChange={(e) => setIdDusun(e.target.value)}
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                >
                  <option value="" disabled>Pilih Dusun...</option>
                  {dusun.map(d => (
                    <option key={d.id} value={d.id}>{d.nama} - (Kadus: {d.kepala_dusun})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-blue-500/10 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
