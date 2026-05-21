import React, { useState } from 'react';
import { SPPT, ObjekPajak, RT, Subjek, Periode } from '../types';
import { Plus, Search, FileText, X, Check, ToggleLeft, Sparkles, Filter, CheckCircle2, Clock, MapPin, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface SPPTViewProps {
  sppt: SPPT[];
  objek: ObjekPajak[];
  rt: RT[];
  subjek: Subjek[];
  periode: Periode[];
  onAdd: (newSPPT: SPPT) => void;
  onBulkGenerate: (tahun: string) => void;
  onUpdateStatus: (id: string, newStatus: 'Lunas' | 'Belum Lunas') => void;
  onDelete: (id: string) => void;
  initialSearch?: string;
  onClearInitialSearch?: () => void;
}

export default function SPPTView({
  sppt,
  objek,
  rt,
  subjek,
  periode,
  onAdd,
  onBulkGenerate,
  onUpdateStatus,
  onDelete,
  initialSearch,
  onClearInitialSearch
}: SPPTViewProps) {
  const [search, setSearch] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRt, setFilterRt] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      if (onClearInitialSearch) {
        onClearInitialSearch();
      }
    }
  }, [initialSearch, onClearInitialSearch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedSpptForQr, setSelectedSpptForQr] = useState<SPPT | null>(null);
  const [error, setError] = useState('');

  // Form states for manual single SPPT creation
  const [id, setId] = useState('');
  const [selectedNop, setSelectedNop] = useState('');
  const [tahun, setTahun] = useState('2026');
  const [pagu, setPagu] = useState<number>(100000);
  const [status, setStatus] = useState<'Lunas' | 'Belum Lunas'>('Belum Lunas');

  // Form states for Bulk Generate
  const [bulkTahun, setBulkTahun] = useState('2026');

  const openAddModal = () => {
    setId(`SPPT${String(tahun).slice(-2)}-${String(sppt.length + 1).padStart(3, '0')}`);
    setSelectedNop(objek[0]?.nop || '');
    // Pull default land tax rate as initial pagu
    const defaultPagu = objek[0]?.jumlah_pajak || 120000;
    setPagu(defaultPagu);
    setStatus('Belum Lunas');
    setError('');
    setModalOpen(true);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!id.trim() || !selectedNop || !tahun) {
      setError('Harap isi semua kolom.');
      return;
    }

    if (sppt.some(s => s.id === id.trim())) {
      setError('ID SPPT sudah terdaftar.');
      return;
    }

    if (sppt.some(s => s.nop === selectedNop && s.tahun === tahun)) {
      setError('SPPT untuk NOP ini pada tahun terpilih sudah pernah diterbitkan.');
      return;
    }

    onAdd({
      id: id.trim(),
      nop: selectedNop,
      tahun,
      pagu: Number(pagu),
      status
    });
    setModalOpen(false);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTahun) return;

    if (confirm(`Yakin ingin menerbitkan SPPT secara masal untuk Tahun ${bulkTahun}? Sistem akan memindai seluruh Objek Pajak yang belum memiliki lembar SPPT di tahun tersebut.`)) {
      onBulkGenerate(bulkTahun);
      setBulkModalOpen(false);
    }
  };

  // List filter calculations
  const filtered = sppt.filter(item => {
    const tMatch = filterTahun ? item.tahun === filterTahun : true;
    const sMatch = filterStatus ? item.status === filterStatus : true;
    
    // Find Object properties to search by RT
    const obj = objek.find(o => o.nop === item.nop);
    const rtMatch = filterRt ? obj?.id_rt === filterRt : true;

    // Search matches NOP, WP name, NIK, or ID
    const wp = obj ? subjek.find(s => s.nik === obj.nik) : null;
    const query = search.toLowerCase();
    const qMatch = 
      item.id.toLowerCase().includes(query) ||
      String(item.nop).includes(query) ||
      (wp && wp.nama.toLowerCase().includes(query)) ||
      (wp && String(wp.nik).includes(query)) ||
      (obj && obj.nama_pemilik_sppt.toLowerCase().includes(query));

    return tMatch && sMatch && rtMatch && qMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const formatRp = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 animate-pulse" />
            Pengelolaan Lembar Surat Pajak SPPT
          </h3>
          <p className="text-xs text-slate-500">Penerbitan ketetapan lembar SPPT Pajak Bumi dan Bangunan tahunan bagi tiap objek pajak</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Generation Button */}
          <button
            onClick={() => {
              setBulkTahun('2026');
              setBulkModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-750 hover:to-blue-750 text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Terbitkan SPPT Masal
          </button>

          <button
            onClick={openAddModal}
            disabled={objek.length === 0}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Terbit Manual (Satu SPPT)
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-50/65 p-4 rounded-2xl border border-slate-150/80 flex flex-col md:flex-row gap-4 items-end">
        <div className="space-y-1 w-full md:max-w-xs">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kata Kunci Pencarian</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari ID SPPT, NOP, atau nama..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-semibold pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full md:flex-1">
          {/* Year Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Pajak</label>
            <select
              value={filterTahun}
              onChange={(e) => {
                setFilterTahun(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Tahun</option>
              {periode.map(p => (
                <option key={p.tahun} value={p.tahun}>{p.tahun}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Bayar</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>

          {/* RT Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit RT</label>
            <select
              value={filterRt}
              onChange={(e) => {
                setFilterRt(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white"
            >
              <option value="">Semua RT</option>
              {rt.map(r => (
                <option key={r.id} value={r.id}>{r.nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SPPT Grid Results */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-55 border-b border-slate-100 text-slate-500 text-xxs font-extrabold uppercase tracking-widest bg-slate-50/60">
              <th className="p-4">ID SPPT</th>
              <th className="p-4">NOP Objek</th>
              <th className="p-4">NIK WP</th>
              <th className="p-4">RT</th>
              <th className="p-4">Nama WP (Subjek) / SPPT</th>
              <th className="p-4">Tahun Pajak</th>
              <th className="p-4">Tagihan (Pagu)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {paginatedData.length === 0 ? (
               <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada dokumen SPPT ditemukan.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const obj = objek.find(o => o.nop === item.nop);
                const owner = obj ? subjek.find(s => s.nik === obj.nik) : null;
                const linkedRt = obj ? rt.find(r => r.id === obj.id_rt) : null;
                
                const isLunas = item.status === 'Lunas';

                return (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-slate-500 font-mono font-bold">{item.id}</td>
                    <td className="p-4 text-blue-700 font-mono font-bold tracking-tight">{item.nop}</td>
                    <td className="p-4 text-slate-600 font-mono">{obj ? obj.nik : '-'}</td>
                    <td className="p-4 text-slate-600 font-medium">{linkedRt ? linkedRt.nama : '-'}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">
                        {obj ? obj.nama_pemilik_sppt : '-'}
                      </span>
                      {owner ? (
                        <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">
                          WP: {owner.nama} {linkedRt ? `(${linkedRt.nama})` : ''}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold">
                        {item.tahun}
                      </span>
                      {(() => {
                        const p = periode.find(p => p.tahun === item.tahun);
                        return p?.tanggal_jatuh_tempo ? (
                          <p className="text-[9px] text-amber-700 font-bold mt-1">Tempo: {p.tanggal_jatuh_tempo}</p>
                        ) : null;
                      })()}
                    </td>
                    <td className="p-4 font-black text-slate-800">{formatRp(item.pagu)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onUpdateStatus(item.id, isLunas ? 'Belum Lunas' : 'Lunas')}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 transition shadow-inner cursor-pointer
                          ${isLunas 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-red-50 text-red-600 border-red-100'}`}
                      >
                        {isLunas ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {item.status}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => {
                            setSelectedSpptForQr(item);
                            setQrModalOpen(true);
                          }}
                          className="text-[10.5px] font-bold text-indigo-650 hover:bg-slate-100 p-1.5 rounded-lg border border-transparent transition cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin membatalkan/menghapus SPPT ${item.id}? Tindakan ini akan menghapus tagihan tahun pajak terkait.`)) {
                              onDelete(item.id);
                            }
                          }}
                          disabled={isLunas}
                          className="text-[10.5px] font-bold text-red-650 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent p-1.5 rounded-lg border border-transparent transition cursor-pointer"
                        >
                          Hapus
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

      {/* Pop Manual Publish Modal Box */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in animate-duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                Daftar Single SPPT Pajak
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleManualSave} className="p-5 space-y-4">
              {error && (
                <div className="text-xxs font-bold text-red-650 bg-red-50/70 p-3 rounded-xl border border-red-150">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">ID Koleksi SPPT (Manual/Otomatis)</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. SPPT26-XXX"
                  className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Bidang Objek Lahan NOP</label>
                <select
                  value={selectedNop}
                  onChange={(e) => {
                    setSelectedNop(e.target.value);
                    const matchingObj = objek.find(o => o.nop === e.target.value);
                    if (matchingObj) setPagu(matchingObj.jumlah_pajak);
                  }}
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                >
                  <option value="" disabled>Pilih Bidang Objek...</option>
                  {objek.map(o => (
                    <option key={o.nop} value={o.nop}>{o.nama_pemilik_sppt} - (NOP: {o.nop})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Pajak</label>
                  <select
                    value={tahun}
                    onChange={(e) => {
                      setTahun(e.target.value);
                      // Update SPPT ID dynamically
                      setId(`SPPT${e.target.value.slice(-2)}-${String(sppt.length + 1).padStart(3, '0')}`);
                    }}
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                  >
                    {periode.map(p => (
                      <option key={p.tahun} value={p.tahun}>{p.tahun}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Ketetapan Pajak (Rp)</label>
                  <input
                    type="number"
                    value={pagu}
                    onChange={(e) => setPagu(Math.max(0, Number(e.target.value)))}
                    placeholder="Contoh: 125000"
                    className="w-full text-xs font-bold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Status Awal</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Lunas' | 'Belum Lunas')}
                  className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                >
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="Lunas">Lunas</option>
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
                  Terbitkan SPPT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop Bulk Generate wizard */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in animate-duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-gradient-to-r from-indigo-950 to-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                Terbitkan SPPT Secara Masal
              </h4>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900 text-[11px] font-medium leading-relaxed">
                Fitur ini akan secara otomatis membuat dan menerbitkan Surat Pemberitahuan Pajak Terutang (SPPT) untuk <strong>seluruh Objek Pajak</strong> yang belum memiliki rincian SPPT aktif di tahun yang dipilih. Besaran nominal ketetapan pajak akan disalin dari jumlah ketetapan Objek Pajak terdaftar.
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Tahun Siklus Penerbitan</label>
                <select
                  value={bulkTahun}
                  onChange={(e) => setBulkTahun(e.target.value)}
                  className="w-full text-xs font-black p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                >
                  {periode.map(p => (
                    <option key={p.tahun} value={p.tahun}>{p.tahun} {p.status === 'Aktif' ? '(Tahun Aktif)' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  Mulai Terbitkan SPPT Masal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop QR Code Modal */}
      {qrModalOpen && selectedSpptForQr && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in animate-duration-300">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col scale-up">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-400" />
                QR Code SPPT
              </h4>
              <button 
                onClick={() => { setQrModalOpen(false); setSelectedSpptForQr(null); }} 
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              <QRCodeSVG 
                 value={JSON.stringify({ nop: selectedSpptForQr.nop, id: selectedSpptForQr.id })} 
                 size={256}
                 level="H"
              />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">{selectedSpptForQr.id}</p>
                <p className="text-xs text-slate-500">NOP: {selectedSpptForQr.nop}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
