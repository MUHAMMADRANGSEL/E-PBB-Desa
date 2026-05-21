import React, { useState } from 'react';
import { Subjek } from '../types';
import { Plus, Edit2, Trash2, Search, Contact2, X, MessageSquare, ExternalLink } from 'lucide-react';

interface MasterSubjekViewProps {
  subjek: Subjek[];
  onAdd: (newSubjek: Subjek) => void;
  onEdit: (updatedSubjek: Subjek, oldNik?: string) => void;
  onDelete: (nik: string) => void;
}

export default function MasterSubjekView({
  subjek,
  onAdd,
  onEdit,
  onDelete
}: MasterSubjekViewProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [idWp, setIdWp] = useState('');
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [wa, setWa] = useState('');
  const [alamat, setAlamat] = useState('');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setIdWp(`WP-${String(subjek.length + 1).padStart(3, '0')}`);
    setNik('');
    setNama('');
    setWa('628');
    setAlamat('');
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: Subjek) => {
    setIdWp(item.id_wp || `WP-${String(subjek.findIndex(s => s.nik === item.nik) + 1).padStart(3, '0')}`);
    setNik(item.nik ? String(item.nik) : '');
    setNama(item.nama || '');
    setWa(item.wa || '');
    setAlamat(item.alamat || '');
    setEditingId(item.nik ? String(item.nik) : '');
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedNik = String(nik || '').trim();
    const trimmedNama = String(nama || '').trim();
    const trimmedWa = String(wa || '').trim();
    const trimmedIdWp = String(idWp || '').trim();
    const trimmedAlamat = String(alamat || '').trim();

    if (!trimmedNik || !trimmedNama || !trimmedWa) {
      setError('Harap isi kolom NIK, Nama, dan WhatsApp.');
      return;
    }

    const nikRegex = /^\d{16}$/;
    if (!nikRegex.test(trimmedNik)) {
      setError('Format NIK tidak valid. NIK harus terdiri dari tepat 16 digit angka.');
      return;
    }

    if (editingId) {
      const trimmedEditingId = String(editingId).trim();
      if (trimmedNik !== trimmedEditingId && subjek.some(s => String(s.nik || '').trim() === trimmedNik)) {
        setError('NIK baru ini sudah terdaftar sebagai wajib pajak lain.');
        return;
      }
    } else {
      if (subjek.some(s => String(s.nik || '').trim() === trimmedNik)) {
        setError('NIK ini sudah terdaftar sebagai wajib pajak.');
        return;
      }
    }

    // Clean up whatsapp number
    let cleanWa = trimmedWa.replace(/[^0-9]/g, '');
    if (cleanWa.startsWith('0')) {
      cleanWa = '62' + cleanWa.slice(1);
    } else if (cleanWa.startsWith('8')) {
      cleanWa = '62' + cleanWa;
    }

    if (!cleanWa.startsWith('62')) {
      setError('Format WhatsApp disrankan menggunakan kode negara 62 (contoh: 62812...)');
      return;
    }

    const payload: Subjek = {
      id_wp: trimmedIdWp || `WP-${String(subjek.length + 1).padStart(3, '0')}`,
      nik: trimmedNik,
      nama: trimmedNama,
      wa: cleanWa,
      alamat: trimmedAlamat
    };

    if (editingId) {
      onEdit(payload, String(editingId).trim());
    } else {
      onAdd(payload);
    }
    setModalOpen(false);
  };

  // Listings filter
  const filtered = subjek.filter(item => 
    item.nama.toLowerCase().includes(search.toLowerCase()) ||
    String(item.nik).includes(search) ||
    item.alamat.toLowerCase().includes(search.toLowerCase()) ||
    (item.wa && String(item.wa).includes(search))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Direct send message
  const triggerWaAnnouncement = (wp: Subjek) => {
    const text = encodeURIComponent(
      `Halo Bapak/Ibu ${wp.nama},\nKami dari Kantor Pelayanan Pajak Desa. Mengingatkan bahwa data pendaftaran wajib pajak PBB Anda telah aktif dengan NIK ${wp.nik}. Silakan datangi petugas balai desa untuk mengonfirmasikan SPPT PBB tahunan Anda.\n\nTerima kasih.`
    );
    window.open(`https://wa.me/${wp.wa}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Contact2 className="w-5 h-5 text-blue-600 animate-pulse" />
            Pendataan Subjek Pajak (Wajib Pajak)
          </h3>
          <p className="text-xs text-slate-500">Mencatat kelengkapan identitas Wajib Pajak (WP) penduduk lokal maupun pemilik lahan luar desa</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Daftar Wajib Pajak (WP)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative w-full sm:max-w-xs">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Cari NIK, Nama, nomor WA, atau alamat WP..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full text-xs font-medium pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
        />
      </div>

      {/* WP Tables */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-55 border-b border-slate-100 text-slate-500 text-xxs font-extrabold uppercase tracking-widest bg-slate-50/60">
              <th className="p-4">ID WP</th>
              <th className="p-4">NIK (Wajib Pajak)</th>
              <th className="p-4">Nama Lengkap</th>
              <th className="p-4">Koneksi WhatsApp</th>
              <th className="p-4">Alamat Domisili / Korespondensi</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada data Wajib Pajak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                return (
                  <tr key={`${item.nik}-${idx}`} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-blue-600 font-mono font-bold tracking-tight">{item.id_wp || `WP-${String(startIndex + idx + 1).padStart(3, '0')}`}</td>
                    <td className="p-4 text-slate-500 font-mono font-bold tracking-tight">{item.nik}</td>
                    <td className="p-4 font-bold text-slate-950">{item.nama}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 font-mono">+{item.wa}</span>
                        <button
                          onClick={() => triggerWaAnnouncement(item)}
                          className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100 flex items-center gap-1 transition cursor-pointer"
                          title="Hubungi"
                        >
                          <MessageSquare className="w-3 h-3" /> Chat WA
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 truncate max-w-xs" title={item.alamat}>
                      {item.alamat || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="hover:bg-blue-55 hover:text-blue-700 text-blue-650 p-1.5 rounded-lg border border-slate-150 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus wajib pajak ${item.nama}? Seluruh objek bumi dan bangunan yang terikat pada NIK ini akan kehilangan subjek pemilik.`)) {
                              onDelete(item.nik);
                            }
                          }}
                          className="hover:bg-red-50 text-red-650 p-1.5 rounded-lg border border-slate-150 transition cursor-pointer"
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-4 text-xs font-semibold text-slate-500">
          <div>
            Menampilkan <span className="text-slate-900 font-bold">{startIndex + 1}</span> - <span className="text-slate-900 font-bold">{Math.min(startIndex + itemsPerPage, filtered.length)}</span> dari <span className="text-slate-900 font-bold">{filtered.length}</span> data
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
            >
              Sebelumnya
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition border cursor-pointer
                      ${currentPage === pageNum 
                        ? 'bg-blue-600 border-blue-605 text-white font-bold' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Floating Modal Frame */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Contact2 className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Wajib Pajak' : 'Daftarkan Wajib Pajak (WP) Baru'}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">ID Wajib Pajak</label>
                  <input
                    type="text"
                    value={idWp}
                    onChange={(e) => setIdWp(e.target.value)}
                    placeholder="Contoh: WP-001"
                    className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-55 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nomor NIK (16 digit)</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="16 digit angka KTP"
                    className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Penduduk</label>
                  <input
                    type="text"
                    value={wa}
                    onChange={(e) => setWa(e.target.value.replace(/[^0-9+]/g, ''))}
                    placeholder="Contoh: 6281234..."
                    className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap (Wajib Pajak)</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Ahmad Subarjo"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Korespondensi / Domisili</label>
                <textarea
                  value={alamat}
                  rows={2}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Utama No. 1 RT 02 RW 01"
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
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
                  Simpan Wajib Pajak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
