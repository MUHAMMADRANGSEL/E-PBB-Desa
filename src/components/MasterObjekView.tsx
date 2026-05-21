import React, { useState } from 'react';
import { ObjekPajak, RT, Subjek } from '../types';
import { Plus, Edit2, Trash2, Search, Building, X, Calculator, ArrowRight, MapPin, FileText } from 'lucide-react';

interface MasterObjekViewProps {
  objek: ObjekPajak[];
  rt: RT[];
  subjek: Subjek[];
  onAdd: (newObjek: ObjekPajak) => void;
  onEdit: (updatedObjek: ObjekPajak) => void;
  onDelete: (nop: string) => void;
  onViewSPPT?: (nop: string) => void;
}

export default function MasterObjekView({
  objek,
  rt,
  subjek,
  onAdd,
  onEdit,
  onDelete,
  onViewSPPT
}: MasterObjekViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRtId, setSelectedRtId] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [nop, setNop] = useState('');
  const [nik, setNik] = useState('');
  const [idRt, setIdRt] = useState('');
  const [namaPemilikSppt, setNamaPemilikSppt] = useState('');
  const [letakOp, setLetakOp] = useState('');
  const [jenisOp, setJenisOp] = useState('Darat / Pemukiman');
  const [klas, setKlas] = useState('A24');
  const [njop, setNjop] = useState<number>(350000);
  const [luasB, setLuasB] = useState<number>(150);
  const [luasBangunan, setLuasBangunan] = useState<number>(75);
  const [jumlahPajak, setJumlahPajak] = useState<number>(120000);
  const [periode, setPeriode] = useState('2026');
  
  const [error, setError] = useState('');

  // Auto-calculate helper
  const calculateEstimate = () => {
    // Basic Indonesian PBB estimation model
    // Total NJOP = (Luas Bumi * NJOP Bumi) + (Luas Bangunan * NJOP Bumi * 1.5)
    const baseBumi = Number(luasB) * Number(njop);
    const baseBangunan = Number(luasBangunan) * Number(njop) * 1.5;
    const totalNjopEstimate = baseBumi + baseBangunan;
    
    // PBB is typically ~0.1% or ~0.2% of total NJOP minus tax-free values
    // Let's use a nice realistic village estimate: Math.round(totalNjop * 0.001) or minimum 10,000 IDR
    const estimatedTax = Math.max(10000, Math.round(totalNjopEstimate * 0.0008));
    setJumlahPajak(estimatedTax);
  };

  const openAddModal = () => {
    // Generate simulated NOP
    const nextNum = String(objek.length + 1).padStart(4, '0');
    setNop(`32.01.010.001.001-${nextNum}.0`);
    setNik(subjek[0]?.nik || '');
    setIdRt(rt[0]?.id || '');
    setNamaPemilikSppt('');
    setLetakOp('');
    setJenisOp('Darat / Pemukiman');
    setKlas('A24');
    setNjop(350000);
    setLuasB(150);
    setLuasBangunan(75);
    setJumlahPajak(120000);
    setPeriode('2026');
    setEditingId(null);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: ObjekPajak) => {
    setNop(item.nop);
    setNik(item.nik);
    setIdRt(item.id_rt);
    setNamaPemilikSppt(item.nama_pemilik_sppt);
    setLetakOp(item.letak_op);
    setJenisOp(item.jenis_op);
    setKlas(item.klas);
    setNjop(item.njop);
    setLuasB(item.luas_b);
    setLuasBangunan(item.luas_bangunan || 0);
    setJumlahPajak(item.jumlah_pajak);
    setPeriode(item.periode);
    setEditingId(item.nop);
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nop.trim() || !nik || !idRt || !namaPemilikSppt.trim() || !letakOp.trim()) {
      setError('Harap lengkapi seluruh baris wajib.');
      return;
    }

    if (!editingId && objek.some(o => o.nop === nop.trim())) {
      setError('Nomor Objek Pajak (NOP) ini sudah terdaftar.');
      return;
    }

    const payload: ObjekPajak = {
      nop: nop.trim(),
      nik,
      id_rt: idRt,
      nama_pemilik_sppt: namaPemilikSppt.trim(),
      letak_op: letakOp.trim(),
      jenis_op: jenisOp,
      klas,
      njop: Number(njop),
      luas_b: Number(luasB),
      luas_bangunan: Number(luasBangunan),
      jumlah_pajak: Number(jumlahPajak),
      periode
    };

    if (editingId) {
      onEdit(payload);
    } else {
      onAdd(payload);
    }
    setModalOpen(false);
  };

  // Listings filter
  const filtered = objek.filter(item => {
    const rtMatch = selectedRtId ? item.id_rt === selectedRtId : true;
    const searchLower = search.toLowerCase();
    const searchMatch = 
      String(item.nop).includes(search) ||
      item.nama_pemilik_sppt.toLowerCase().includes(searchLower) ||
      String(item.nik).includes(search) ||
      item.letak_op.toLowerCase().includes(searchLower);
    return rtMatch && searchMatch;
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
            <Building className="w-5 h-5 text-blue-600 animate-pulse" />
            Data Pendataan Objek Pajak (Bumi & Bangunan)
          </h3>
          <p className="text-xs text-slate-500">Mendaftarkan bidang tanah, jenis pemanfaatan lahan, klasifikasi NJOP, dan besaran pajak terhutang</p>
        </div>
        <button
          onClick={openAddModal}
          disabled={rt.length === 0 || subjek.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tambah Objek Pajak
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
            placeholder="Cari NOP, NIK, atau nama pemilik SPPT..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs font-medium pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 border border-slate-150 rounded-xl px-3 py-1.5 bg-slate-50/50">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">Saring RT :</span>
          <select
            value={selectedRtId}
            onChange={(e) => {
              setSelectedRtId(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-bold bg-transparent border-none outline-none focus:ring-0 text-slate-700 cursor-pointer"
          >
            <option value="">Semua RT</option>
            {rt.map(r => (
              <option key={r.id} value={r.id}>{r.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Objek Pajak Tables */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-55 border-b border-slate-100 text-slate-500 text-xxs font-extrabold uppercase tracking-widest bg-slate-50/60">
              <th className="p-4">NOP (Objek Pajak)</th>
              <th className="p-4">Subjek WP (NIK)</th>
              <th className="p-4">Nama SPPT</th>
              <th className="p-4">Letak Objek / RT</th>
              <th className="p-4">Ukuran Lahan</th>
              <th className="p-4 text-right">Pajak Tahunan</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada data Objek Pajak ditemukan.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const owner = subjek.find(s => s.nik === item.nik);
                const linkedRt = rt.find(r => r.id === item.id_rt);
                return (
                  <tr key={`${item.nop}-${idx}`} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 text-blue-700 font-mono font-bold tracking-tight">{item.nop}</td>
                    <td className="p-4" title={owner?.nama}>
                      <span className="font-mono text-slate-400 font-bold block">{item.nik}</span>
                      <span className="text-[10.5px] text-slate-500 truncate max-w-[120px] block font-semibold">{owner?.nama || '-'}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{item.nama_pemilik_sppt}</td>
                    <td className="p-4">
                      <span className="block font-semibold text-slate-800 truncate max-w-[140px]">{item.letak_op}</span>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                        {linkedRt ? linkedRt.nama : `RT: ${item.id_rt}`}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="block text-slate-800">T: {item.luas_b} m² (Klas {item.klas})</span>
                      {item.luas_bangunan ? (
                        <span className="text-xxs text-indigo-505 block font-bold">B: {item.luas_bangunan} m²</span>
                      ) : null}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-xs font-black text-slate-905">{formatRp(item.jumlah_pajak)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">NJOP: {formatRp(item.njop)} / m²</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-2">
                        {onViewSPPT && (
                          <button
                            id={`btn-view-sppt-${item.nop.replace(/[^a-zA-Z0-9]/g, '-')}`}
                            onClick={() => onViewSPPT(item.nop)}
                            className="hover:bg-blue-50 text-blue-600 p-1.5 rounded-lg border border-slate-150 transition flex items-center gap-1 cursor-pointer"
                            title="Lihat SPPT Terbit"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">SPPT</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="hover:bg-blue-50 text-blue-650 p-1.5 rounded-lg border border-slate-150 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus Objek Pajak NOP ${item.nop}? Tindakan ini permanen.`)) {
                              onDelete(item.nop);
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

      {/* Objek Pajak Edit/Add Modal dialog */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col scale-up my-8">
            <div className="bg-slate-950 p-4 border-b flex justify-between items-center text-white">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-400" />
                {editingId ? 'Edit Objek Pajak' : 'Daftarkan Objek Pajak Baru'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              {error && (
                <div className="text-xxs font-bold text-red-650 bg-red-50/70 p-3 rounded-xl border border-red-150">
                  {error}
                </div>
              )}

              {/* Box Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">ID NOP Objek Pajak (24 digit format)</label>
                  <input
                    type="text"
                    value={nop}
                    onChange={(e) => setNop(e.target.value)}
                    disabled={editingId !== null}
                    placeholder="Contoh: 32.01.010..."
                    className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Wajib Pajak Hubungan (Subjek / Pemilik)</label>
                  <select
                    value={nik}
                    onChange={(e) => {
                      setNik(e.target.value);
                      const selectedWP = subjek.find(s => s.nik === e.target.value);
                      if (selectedWP) {
                        setNamaPemilikSppt(selectedWP.nama);
                        setLetakOp(selectedWP.alamat);
                      }
                    }}
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                  >
                    <option value="" disabled>Pilih NIK / Nama...</option>
                    {subjek.map(s => (
                      <option key={s.nik} value={s.nik}>{s.nama} - ({s.nik})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Penanggung di Lembar SPPT</label>
                  <input
                    type="text"
                    value={namaPemilikSppt}
                    onChange={(e) => setNamaPemilikSppt(e.target.value)}
                    placeholder="Contoh: Ahmad Subarjo"
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Wilayah RT Rukun Tetangga</label>
                  <select
                    value={idRt}
                    onChange={(e) => setIdRt(e.target.value)}
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                  >
                    <option value="" disabled>Pilih RT / RW...</option>
                    {rt.map(r => (
                      <option key={r.id} value={r.id}>{r.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Letak Objek Pajak (Alamat Lahan)</label>
                  <input
                    type="text"
                    value={letakOp}
                    onChange={(e) => setLetakOp(e.target.value)}
                    placeholder="Contoh: Krajan Tengah Blok B No 12"
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Jenis Tanah / Bidang</label>
                  <select
                    value={jenisOp}
                    onChange={(e) => setJenisOp(e.target.value)}
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white transition cursor-pointer"
                  >
                    <option value="Darat / Pemukiman">Darat / Pemukiman</option>
                    <option value="Sawah Irigasi">Sawah Irigasi</option>
                    <option value="Kebun Campuran">Kebun Campuran</option>
                    <option value="Toko / Ruko">Toko / Ruko</option>
                    <option value="Industri / Gudang">Industri / Gudang</option>
                  </select>
                </div>
              </div>

              {/* Calculator Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 font-semibold text-xs space-y-4">
                <span className="text-[10px] font-bold text-blue-650 flex items-center gap-1 uppercase tracking-wider">
                  <Calculator className="w-4 h-4" /> Rumus Estimasi NJOP & Nilai Pajak
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">NJOP per m² (Rp)</label>
                    <input
                      type="number"
                      value={njop}
                      onChange={(e) => setNjop(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Luas Tanah (m²)</label>
                    <input
                      type="number"
                      value={luasB}
                      onChange={(e) => setLuasB(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Luas Bangunan (m²)</label>
                    <input
                      type="number"
                      value={luasBangunan}
                      onChange={(e) => setLuasBangunan(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider">Klas Lahan</label>
                    <input
                      type="text"
                      value={klas}
                      onChange={(e) => setKlas(e.target.value)}
                      placeholder="e.g. A24"
                      className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t pt-3 border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">ESTIMASI TOTAL NJOP BUMI & BANGUNAN :</span>
                    <p className="text-sm font-black text-slate-800">
                      {formatRp((luasB * njop) + (luasBangunan * njop * 1.5))}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={calculateEstimate}
                    className="bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg px-4 py-2 font-bold transition inline-flex items-center gap-1.5 cursor-pointer text-xxs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Prakirakan Pajak Terhutang
                  </button>
                </div>
              </div>

              {/* Set Annual tax manually or computed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Ketetapan Nominal Pajak (Rp / Tahun)</label>
                  <input
                    type="number"
                    value={jumlahPajak}
                    onChange={(e) => setJumlahPajak(Math.max(0, Number(e.target.value)))}
                    placeholder="Masukkan nominal ketetapan"
                    className="w-full text-xs font-black p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-blue-700 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Pendataan Masuk</label>
                  <input
                    type="text"
                    value={periode}
                    onChange={(e) => setPeriode(e.target.value)}
                    placeholder="Contoh: 2026"
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
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
                  Simpan Objek Pajak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
