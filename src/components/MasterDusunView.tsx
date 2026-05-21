import React, { useState } from 'react';
import { Dusun, RT, SPPT, ObjekPajak } from '../types';
import { Plus, Edit2, Trash2, Search, Map, User, Check, X, Users } from 'lucide-react';

interface MasterDusunViewProps {
  dusun: Dusun[];
  rt: RT[];
  sppt: SPPT[];
  objek: ObjekPajak[];
  onAdd: (newDusun: Dusun) => void;
  onEdit: (updatedDusun: Dusun) => void;
  onDelete: (id: string) => void;
}

export default function MasterDusunView({
  dusun,
  rt,
  sppt,
  objek,
  onAdd,
  onEdit,
  onDelete
}: MasterDusunViewProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [id, setId] = useState('');
  const [nama, setNama] = useState('');
  const [kepalaDusun, setKepalaDusun] = useState('');

  // Validate double ID
  const [error, setError] = useState('');

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getDusunPagu = (dusunId: string) => {
    const rtsInDusun = rt.filter(r => r.id_dusun === dusunId);
    const rtsIds = rtsInDusun.map(r => r.id);
    const opsInDusun = objek.filter(o => rtsIds.includes(o.id_rt));
    const opsNops = opsInDusun.map(o => o.nop);
    const spptsInDusun = sppt.filter(s => opsNops.includes(s.nop));
    return spptsInDusun.reduce((sum, s) => sum + s.pagu, 0);
  };

  const openAddModal = () => {
    setId(`DS00${dusun.length + 1}`);
    setNama('');
    setKepalaDusun('');
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: Dusun) => {
    setId(item.id);
    setNama(item.nama);
    setKepalaDusun(item.kepala_dusun);
    setEditingId(item.id);
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !nama.trim() || !kepalaDusun.trim()) {
      setError('Harap isi semua kolom.');
      return;
    }

    if (!editingId && dusun.some(d => d.id === id)) {
      setError('ID Dusun sudah digunakan. Masukkan ID unik.');
      return;
    }

    const payload: Dusun = {
      id: id.trim(),
      nama: nama.trim(),
      kepala_dusun: kepalaDusun.trim()
    };

    if (editingId) {
      onEdit(payload);
    } else {
      onAdd(payload);
    }
    setModalOpen(false);
  };

  // Filter listings
  const filtered = dusun.filter(item => 
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    item.kepala_dusun.toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600 animate-pulse" />
            Data Master Wilayah Dusun (Hamlet)
          </h3>
          <p className="text-xs text-slate-500">Form penginputan dan perubahan wilayah dusun serta nama kepala dusun terkait</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Dusun
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative w-full sm:max-w-xs">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Cari nama Dusun atau Kepala..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-medium pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
        />
      </div>

      {/* Dusun Table Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-500 text-xxs font-extrabold uppercase tracking-widest">
              <th className="p-4">ID</th>
              <th className="p-4">Nama Dusun</th>
              <th className="p-4">Kepala Dusun</th>
              <th className="p-4 text-center">Jumlah RT</th>
              <th className="p-4 text-right">Total Pagu</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada data dusun ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const rtCount = rt.filter(r => r.id_dusun === item.id).length;
                const totalPagu = getDusunPagu(item.id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-slate-500 font-mono font-bold">{item.id}</td>
                    <td className="p-4 font-bold text-slate-900">{item.nama}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-indigo-505 rounded-full"></span>
                        {item.kepala_dusun}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold inline-flex items-center gap-1">
                        <Users className="w-3 h-3" /> {rtCount} RT
                      </span>
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
                            if (confirm(`Yakin ingin menghapus ${item.nama}? Seluruh RT yang berhubungan akan kehilangan wilayah.`)) {
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

      {/* Floating Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Map className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Data Dusun' : 'Daftar Dusun Baru'}
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
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">ID Dusun (Unik)</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={editingId !== null}
                  placeholder="Contoh: DS001"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Wilayah Dusun</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Dusun Krajan"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Kepala Dusun (Kadus)</label>
                <input
                  type="text"
                  value={kepalaDusun}
                  onChange={(e) => setKepalaDusun(e.target.value)}
                  placeholder="Contoh: H. Sukiman"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
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
