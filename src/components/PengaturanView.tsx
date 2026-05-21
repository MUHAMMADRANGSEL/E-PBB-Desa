import React, { useState } from 'react';
import { Pengaturan, Desa } from '../types';
import { 
  Settings, 
  Save,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface PengaturanViewProps {
  settings: Pengaturan;
  onSave: (updatedSettings: Pengaturan) => void;
}

export default function PengaturanView({
  settings,
  onSave
}: PengaturanViewProps) {
  // Form elements
  const [appName, setAppName] = useState(settings.nama_aplikasi || '');
  const [desaName, setDesaName] = useState(settings.nama_desa || '');
  const [kecName, setKecName] = useState(settings.nama_kecamatan || '');
  const [kabName, setKabName] = useState(settings.nama_kabupaten || '');
  const [logoApp, setLogoApp] = useState(settings.logo_app || '');
  const [logoDesa, setLogoDesa] = useState(settings.logo_desa || '');
  const [gasUrl, setGasUrl] = useState(settings.gas_url || '');
  const [footerText, setFooterText] = useState(settings.footer_text || '');
  const [daftarDesa, setDaftarDesa] = useState<Desa[]>(settings.daftar_desa || []);

  React.useEffect(() => {
    setAppName(settings.nama_aplikasi || '');
    setDesaName(settings.nama_desa || '');
    setKecName(settings.nama_kecamatan || '');
    setKabName(settings.nama_kabupaten || '');
    setLogoApp(settings.logo_app || '');
    setLogoDesa(settings.logo_desa || '');
    setGasUrl(settings.gas_url || '');
    setFooterText(settings.footer_text || '');
    setDaftarDesa(settings.daftar_desa || []);
  }, [settings]);

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const updateDesa = (index: number, field: keyof Desa, value: string) => {
    const newDaftar = [...daftarDesa];
    newDaftar[index] = { ...newDaftar[index], [field]: value };
    setDaftarDesa(newDaftar);
  };
  
  const addDesa = () => {
    setDaftarDesa([...daftarDesa, { id: Date.now().toString(), nama: '', gas_url: '' }]);
  };

  const removeDesa = (index: number) => {
    setDaftarDesa(daftarDesa.filter((_, i) => i !== index));
  };

  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      if (
        appName !== (settings.nama_aplikasi || '') ||
        desaName !== (settings.nama_desa || '') ||
        kecName !== (settings.nama_kecamatan || '') ||
        kabName !== (settings.nama_kabupaten || '') ||
        logoApp !== (settings.logo_app || '') ||
        logoDesa !== (settings.logo_desa || '') ||
        gasUrl !== (settings.gas_url || '') ||
        footerText !== (settings.footer_text || '') ||
        JSON.stringify(daftarDesa) !== JSON.stringify(settings.daftar_desa || [])
      ) {
        onSave({
          ...settings,
          nama_aplikasi: appName.trim(),
          nama_desa: desaName.trim(),
          nama_kecamatan: kecName.trim(),
          nama_kabupaten: kabName.trim(),
          logo_app: logoApp.trim(),
          logo_desa: logoDesa.trim(),
          gas_url: gasUrl.trim(),
          footer_text: footerText.trim(),
          daftar_desa: daftarDesa
        });
        setMessage('Tersimpan otomatis!');
        setTimeout(() => setMessage(''), 3000);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [appName, desaName, kecName, kabName, logoApp, logoDesa, gasUrl, footerText, daftarDesa, settings, onSave]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');

    if (!appName.trim() || !desaName.trim()) {
      setErrorMsg('Nama Aplikasi dan Nama Desa adalah wajib.');
      return;
    }

    onSave({
      ...settings,
      nama_aplikasi: appName.trim(),
      nama_desa: desaName.trim(),
      nama_kecamatan: kecName.trim(),
      nama_kabupaten: kabName.trim(),
      logo_app: logoApp.trim(),
      logo_desa: logoDesa.trim(),
      gas_url: gasUrl.trim(),
      footer_text: footerText.trim(),
      daftar_desa: daftarDesa
    });

    setMessage('Pengaturan aplikasi berhasil disimpan!');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="space-y-6 fade-in text-slate-700">
      
      <div className="max-w-4xl mx-auto">
        
        {/* Core settings configuration */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Konfigurasi Karakteristik Identitas Aplikasi
            </h3>
            <p className="text-xs text-slate-500">Sesuaikan logo, wilayah kedaulatan desa, kabupaten, kecamatan, serta URL Google Sheets API</p>
          </div>

          {message && (
            <div className="p-3 text-xxs font-bold text-green-700 bg-emerald-50 rounded-xl border border-emerald-150 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {message}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xxs font-bold text-red-650 bg-red-50 rounded-xl border border-red-150 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-650" /> {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Aplikasi Portal</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Contoh: E-PBB Desa"
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition cursor-text"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Branding Nama Desa</label>
              <input
                type="text"
                value={desaName}
                onChange={(e) => setDesaName(e.target.value)}
                placeholder="Contoh: Nama Desa"
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Kecamatan</label>
              <input
                type="text"
                value={kecName}
                onChange={(e) => setKecName(e.target.value)}
                placeholder="e.g. Kecamatan Pancoran"
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Nama Kabupaten / Kota</label>
              <input
                type="text"
                value={kabName}
                onChange={(e) => setKabName(e.target.value)}
                placeholder="e.g. Kabupaten Bogor"
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Tautan Gambar Logo Aplikasi</label>
              <input
                type="text"
                value={logoApp}
                onChange={(e) => setLogoApp(e.target.value)}
                placeholder="URL Gambar logo"
                className="w-full text-xs font-mono font-semibold p-3 rounded-xl border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Tautan Lambang Crest Desa (PNG/SVG)</label>
              <input
                type="text"
                value={logoDesa}
                onChange={(e) => setLogoDesa(e.target.value)}
                placeholder="URL Lambang garuda atau lambang desa"
                className="w-full text-xs font-mono font-semibold p-3 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1 p-4 bg-slate-50 border rounded-2xl mt-2">
            <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Teks Footer Aplikasi
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Contoh: © 2026 E-PBB DESA MAKMUR JAYA"
              className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 bg-white"
            />
          </div>

          <div className="space-y-1 p-4 bg-slate-50 border rounded-2xl mt-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              Daftar Desa dalam Portal
              <button onClick={addDesa} className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                <Plus className="w-4 h-4" />
              </button>
            </h4>
            
            <div className="space-y-2 pt-2">
              {daftarDesa.map((desa, index) => (
                <div key={desa.id} className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                  <input
                    type="text"
                    value={desa.nama}
                    onChange={(e) => updateDesa(index, 'nama', e.target.value)}
                    placeholder="Nama Desa"
                    className="text-xs p-2 rounded-lg border border-slate-200"
                  />
                  <input
                    type="text"
                    value={desa.gas_url}
                    onChange={(e) => updateDesa(index, 'gas_url', e.target.value)}
                    placeholder="GAS URL"
                    className="text-xs p-2 rounded-lg border border-slate-200"
                  />
                  <button onClick={() => removeDesa(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {daftarDesa.length === 0 && (
                <p className="text-xs text-slate-400 italic">Belum ada desa ditambahkan.</p>
              )}
            </div>
          </div>

      <div className="space-y-1 p-4 bg-slate-50 border rounded-2xl mt-2">
            <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Google Apps Script Sync URL (GAS_URL) <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Web App URL hasil deploy script Google Sheets Anda" />
            </label>
            <input
              type="text"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full text-xs font-mono font-semibold p-3.5 rounded-xl border border-slate-200 bg-white"
            />
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold mt-1">
              Biarkan kosong jika ingin menggunakan mode <strong>Penyimpanan Lokal (Offline-First)</strong> yang super kencang. Jika diisi oleh Google Web App URL, sistem akan mengunduh dan merekam seluruh transaksi secara periodik kepada baris tabel Google Sheets Anda.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Simpan Konfigurasi Portal
          </button>
        </form>
      </div>
    </div>
  );
}
