import React, { useState } from 'react';
import { Pengguna } from '../types';
import { Plus, Edit2, Trash2, Search, Users, ShieldAlert, X, Shield, Key } from 'lucide-react';

interface PenggunaViewProps {
  pengguna: Pengguna[];
  onAdd: (newUser: Pengguna) => void;
  onEdit: (updatedUser: Pengguna) => void;
  onDelete: (id: string) => void;
}

export default function PenggunaView({
  pengguna,
  onAdd,
  onEdit,
  onDelete
}: PenggunaViewProps) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [id, setId] = useState('');
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Kolektor'>('Kolektor');
  const [error, setError] = useState('');

  const openAddModal = () => {
    const maxId = pengguna.reduce((max, p) => {
      const num = parseInt(p.ID_User.replace(/\D/g, ''));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    setId(`U${String(maxId + 1).padStart(3, '0')}`);
    setNama('');
    setUsername('');
    setPassword('');
    setRole('Kolektor');
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: Pengguna) => {
    setId(item.ID_User);
    setNama(item.Nama);
    setUsername(item.Username);
    setPassword(item.Password || '');
    setRole(item.Role);
    setEditingId(item.ID_User);
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !nama.trim() || !username.trim() || !password.trim()) {
      setError('Harap lengkapi seluruh kolom.');
      return;
    }

    if (!editingId && pengguna.some(p => p.Username === username.trim())) {
      setError('Username sudah digunakan. Tentukan username lain.');
      return;
    }

    const payload: Pengguna = {
      ID_User: id.trim(),
      Nama: nama.trim(),
      Username: username.trim(),
      Password: password.trim(),
      Role: role
    };

    if (editingId) {
      onEdit(payload);
    } else {
      onAdd(payload);
    }
    setModalOpen(false);
  };

  // Filter accounts
  const filtered = pengguna.filter(p => 
    p.Nama.toLowerCase().includes(search.toLowerCase()) ||
    p.Username.toLowerCase().includes(search.toLowerCase()) ||
    p.Role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600 animate-pulse" />
            Manajemen Pengguna & Hak Akses Staff
          </h3>
          <p className="text-xs text-slate-500">Mendaftarkan administrator, petugas loket kantor desa, maupun kolektor lapangan tingkat RT</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Staff Baru
        </button>
      </div>

      {/* Warning alert */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex gap-3 text-slate-500 font-semibold text-xxs leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-indigo-505 flex-shrink-0 mt-0.5" />
        <p>
          Akun dengan Hak Akses <strong>Administrator</strong> memiliki kedaulatan penuh untuk melakukan penambahan data master, penyetelan sistem, pembongkaran database, dan manajemen staff. Petugas loket/Kolektor hanya diizinkan untuk melihat, mencari tagihan SPPT, memproses transaksi tunai, cetak bukti kuitansi bayar, dan melihat laporan performa.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative w-full sm:max-w-xs">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Cari nama staff atau username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs font-medium pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
        />
      </div>

      {/* Users table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-55 border-b border-slate-100 text-slate-500 text-xxs font-extrabold uppercase tracking-widest bg-slate-50/60">
              <th className="p-4">ID Staff</th>
              <th className="p-4">Nama Lengkap</th>
              <th className="p-4">Nama Akun (Username)</th>
              <th className="p-4">Kunci Sandi (Password)</th>
              <th className="p-4">Hak Pengguna (Role)</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada data staff ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isAdmin = item.Role.toLowerCase() === 'admin';
                return (
                  <tr key={item.ID_User} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-slate-500 font-mono font-bold">{item.ID_User}</td>
                    <td className="p-4 font-bold text-slate-900">{item.Nama}</td>
                    <td className="p-4">{item.Username}</td>
                    <td className="p-4 font-mono text-slate-400">{item.Password}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1
                        ${isAdmin 
                          ? 'bg-purple-55 border-purple-200 text-purple-700 bg-purple-50' 
                          : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                        <Shield className="w-3.5 h-3.5" />
                        {item.Role}
                      </span>
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
                            if (pengguna.filter(p => p.Role === 'Admin').length === 1 && isAdmin) {
                              alert('Gagal menghapus. Minimal harus tersisa 1 Administrator di sistem agar Anda tidak terkunci.');
                              return;
                            }
                            if (confirm(`Yakin ingin menghapus staff ${item.Nama}?`)) {
                              onDelete(item.ID_User);
                            }
                          }}
                          className="hover:bg-red-50 text-red-650 p-1.5 rounded-lg border border-slate-150 transition"
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

      {/* Users modal add edit block */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Data User' : 'Daftarkan Staff Baru'}
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
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">ID User unik (ReadOnly)</label>
                <input
                  type="text"
                  value={id}
                  disabled
                  className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 outline-none bg-slate-100 text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap Staff</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Username Login</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    disabled={editingId !== null}
                    placeholder="e.g. budikeren"
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Kunci Sandi (Password)</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. buditop1"
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Tingkatan Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'Admin' | 'Kolektor')}
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                >
                  <option value="Kolektor">Kolektor / Petugas Lapangan</option>
                  <option value="Admin">Administrator Desa</option>
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
                  Simpan Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
