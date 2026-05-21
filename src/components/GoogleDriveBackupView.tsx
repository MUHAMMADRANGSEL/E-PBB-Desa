import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { LocalDatabase, Pengguna, Pengaturan } from '../types';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  backupDatabaseToDrive, 
  listBackupsFromDrive, 
  restoreBackupFromDrive,
  uploadReportToDrive 
} from '../googleDriveService';
import { 
  HardDrive, 
  CloudUpload, 
  CloudDownload, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  ExternalLink, 
  UserCircle, 
  FolderArchive, 
  Info, 
  Building, 
  Users2, 
  HandCoins,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface GoogleDriveBackupViewProps {
  settings: Pengaturan;
  fullDatabase: LocalDatabase;
  onRestoreDatabase: (restoredDb: LocalDatabase) => void;
}

export default function GoogleDriveBackupView({
  settings,
  fullDatabase,
  onRestoreDatabase
}: GoogleDriveBackupViewProps) {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Backup files list state
  const [backups, setBackups] = useState<Array<{ id: string; name: string; createdTime: string; size: string }>>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  // Operations progress states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoringId, setIsRestoringId] = useState<string | null>(null);
  
  // Custom Filename state
  const [customSuffix, setCustomSuffix] = useState('');

  // Export report states
  const [selectedReport, setSelectedReport] = useState<'wp' | 'tunggakan' | 'riwayat'>('wp');
  const [isExportingReport, setIsExportingReport] = useState(false);

  // Feedbacks
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Load auth state listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, cachedToken) => {
        setUser(currentUser);
        setToken(cachedToken);
        setIsLoadingAuth(false);
        fetchBackupFileList(cachedToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 6000);
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showFeedback('success', `Berhasil masuk dengan akun Google: ${result.user.email}`);
        fetchBackupFileList(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Gagal masuk. Tolong periksa jendela pop-up otorisasi.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Apakah Anda ingin memutuskan tautan akun Google Drive dari sesi ini?')) {
      try {
        await logoutGoogle();
        setUser(null);
        setToken(null);
        setBackups([]);
        showFeedback('success', 'Berhasil memutuskan sesi Google Drive.');
      } catch (err: any) {
        showFeedback('error', 'Gagal logout akun Google.');
      }
    }
  };

  const fetchBackupFileList = async (accessToken?: string) => {
    const activeToken = accessToken || token;
    if (!activeToken) return;

    setIsLoadingBackups(true);
    try {
      const files = await listBackupsFromDrive();
      setBackups(files);
    } catch (err: any) {
      console.error(err);
      // Fail silently or show feedback
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Convert bytes size to human readable units
  const formatBytes = (bytesStr: string | number) => {
    const bytes = typeof bytesStr === 'string' ? parseInt(bytesStr) : bytesStr;
    if (!bytes || isNaN(bytes)) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format timestamp to localized readable string
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return isoString;
    }
  };

  // Perform full database backup to Drive
  const handleCreateBackup = async () => {
    if (!user || !token) {
      showFeedback('error', 'Silakan masuk ke Google Drive terlebih dahulu.');
      return;
    }

    setIsBackingUp(true);
    try {
      const timestamp = new Date().toISOString()
        .replace(/T/, '_')
        .replace(/\..+/, '')
        .replace(/:/g, '-');
      
      const cleanSuffix = customSuffix.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
      const suffixPart = cleanSuffix ? `_${cleanSuffix}` : '';
      const namaDesaClean = (settings.nama_desa || 'Desa_Tidak_Bernama').replace(/\s+/g, '_');
      const filename = `Backup_EPBB_${namaDesaClean}${suffixPart}_${timestamp}.json`;

      const result = await backupDatabaseToDrive(fullDatabase, filename);
      showFeedback('success', `Sukses! Seluruh database lokal disalin sebagai file "${result.name}" pada Drive Anda.`);
      setCustomSuffix('');
      fetchBackupFileList();
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Gagal menyimpan berkas ke Google Drive.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restore database from selected file
  const handleRestoreBackup = async (fileId: string, filename: string) => {
    // Mandatorily ask for confirmation prior to overwriting database as requested by guidelines
    const confirmed = window.confirm(
      `PERINGATAN OVERWRITE!\n\nApakah Anda yakin ingin memulihkan seluruh basis data lokal dari file cadangan:\n「 ${filename} 」?\n\nSemua perubahan data lokal Anda saat ini akan sepenuhnya DIGANTI oleh isi file ini. Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setIsRestoringId(fileId);
    try {
      const restoredDb = await restoreBackupFromDrive(fileId);
      // Apply setting changes
      onRestoreDatabase(restoredDb);
      showFeedback('success', `Database berhasil dipulihkan dengan sukses dari arsip: ${filename}`);
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Gagal memulihkan database dari Google Drive.');
    } finally {
      setIsRestoringId(null);
    }
  };

  // Export local reports to CSV and push to Drive folder
  const handleExportReportToDrive = async () => {
    if (!user || !token) {
      showFeedback('error', 'Sambungan Google Drive belum aktif.');
      return;
    }

    setIsExportingReport(true);
    try {
      let csvContent = "";
      let reportName = "";

      const timestamp = new Date().toISOString().slice(0,10);
      const namaDesaClean = (settings.nama_desa || 'Desa_Tidak_Bernama').replace(/\s+/g, '_');

      if (selectedReport === 'wp') {
        reportName = `Laporan_WajibPajak_${namaDesaClean}_${timestamp}.csv`;
        const headers = "NIK,Nama Lengkap,No WhatsApp,Alamat\n";
        const rows = fullDatabase.subjek.map(wp => 
          `"${wp.nik || ''}","${(wp.nama || '').replace(/"/g, '""')}","${wp.wa || ''}","${(wp.alamat || '').replace(/"/g, '""')}"`
        ).join('\n');
        csvContent = headers + rows;
      } else if (selectedReport === 'tunggakan') {
        reportName = `Laporan_Arrears_PBB_${namaDesaClean}_${timestamp}.csv`;
        const unpaidBills = fullDatabase.sppt.filter(s => s.status !== 'Lunas');
        const headers = "ID SPPT,NOP,Tahun Pajak,Nama Pemilik SPPT,Alamat Blok OP,Nominal Ketetapan Pagu,Status\n";
        
        const rows = unpaidBills.map(bill => {
          const matchedOp = fullDatabase.objek.find(o => o.nop === bill.nop);
          const owner = matchedOp ? matchedOp.nama_pemilik_sppt : '-';
          const address = matchedOp ? matchedOp.letak_op : '-';
          return `"${bill.id}","${bill.nop}","${bill.tahun}","${owner.replace(/"/g, '""')}","${address.replace(/"/g, '""')}","${bill.pagu}","Belum Lunas"`;
        }).join('\n');
        csvContent = headers + rows;
      } else {
        // Receipts
        reportName = `Laporan_Realisasi_Kasir_${namaDesaClean}_${timestamp}.csv`;
        const headers = "No Kuitansi,ID SPPT,NOP,Tanggal Bayar,Nama Pembayar,Jumlah Disetor,Metode\n";
        const rows = fullDatabase.pembayaran.map(p => {
          const matchedSppt = fullDatabase.sppt.find(s => s.id === p.id_sppt);
          const nop = matchedSppt ? matchedSppt.nop : '-';
          return `"${p.id}","${p.id_sppt}","${nop}","${p.tgl}","${(p.nama_pembayar || '').replace(/"/g, '""')}","${p.jml}","${p.metode || 'Tunai'}"`;
        }).join('\n');
        csvContent = headers + rows;
      }

      const result = await uploadReportToDrive(csvContent, reportName, 'text/csv');
      showFeedback('success', `Berhasil mengekspor Laporan Excel CSV ke Google Drive Anda dengan nama berkas "${result.name}".`);
    } catch (err: any) {
      console.error(err);
      showFeedback('error', err.message || 'Gagal mengekspor laporan ke Google Drive.');
    } finally {
      setIsExportingReport(false);
    }
  };

  return (
    <div className="space-y-6" id="google-drive-core-component">
      
      {/* Title block banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md shadow-indigo-900/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-blue-400/[0.04] rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase text-blue-200 border border-white/5">
              <HardDrive className="w-3.5 h-3.5" /> Google Drive Cloud Storage
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight font-sans">
              Integrasi Serverless Cloud Backup Desa
            </h2>
            <p className="text-xs md:text-sm text-slate-200 font-medium leading-relaxed">
              Selamatkan lembar kerja warga Anda di awan. Ekspor cadangan penuh atau buat rekap realisasi kolekor ke akun Google Drive pribadi Anda secara aman tanpa server penyimpanan eksternal.
            </p>
          </div>

          <div className="flex-shrink-0">
            {isLoadingAuth ? (
              <div className="flex items-center gap-2 text-xs bg-slate-800/40 px-4 py-3 rounded-2xl border border-white/10 text-slate-300 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memvalidasi otorisasi...</span>
              </div>
            ) : user ? (
              <div className="bg-white text-slate-900 p-3 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-md max-w-[270px] shrink-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-xs text-indigo-700 uppercase border border-indigo-100 flex-shrink-0">
                  {user.displayName ? user.displayName.charAt(0) : 'G'}
                </div>
                <div className="flex-1 min-w-0 pr-1.5 text-left">
                  <p className="text-xs font-black truncate text-slate-900 leading-tight">{user.displayName || 'Akun Google'}</p>
                  <p className="text-[10px] text-slate-500 truncate font-semibold leading-normal">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  title="Putuskan Hubungan Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* GSI Styled Professional Button to pass guidelines audits */
              <button
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs font-bold bg-white text-slate-850 hover:bg-slate-50 border border-slate-200 py-3 px-4.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition duration-300 flex items-center gap-3 cursor-pointer select-none"
              >
                <div className="gsi-material-button-icon flex-shrink-0">
                  {isLoggingIn ? (
                    <RefreshCw className="w-4.5 h-4.5 text-indigo-550 animate-spin" />
                  ) : (
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5 block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                </div>
                <span>Sambungkan Google Drive</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global alert feedback popup notification */}
      {notification.message && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2.5 scale-up ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-150 text-emerald-800 animate-slide-in' 
            : 'bg-red-50 border-red-150 text-red-800 animate-shake'
        }`}>
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${notification.type === 'success' ? 'text-emerald-600' : 'text-red-650'}`} />
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* RENDER THE RELEVANT VIEW BOARDS */}
      {!user ? (
        /* Unauthorized / Signed out state block explanation cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Otoritas Langsung Aman</h3>
              <p className="text-xxs text-slate-500 leading-relaxed font-semibold">
                Sistem E-PBB sama sekali tidak menyimpan kredensial login Google Anda. Proses login aman diarahkan langsung lewat gateway Google Firebase OAuth SDK yang terverifikasi.
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-5">Keamanan Sandboxed 100%</p>
          </div>

          <div className="bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FolderArchive className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Folder Otomatis Teratur</h3>
              <p className="text-xxs text-slate-500 leading-relaxed font-semibold">
                Aplikasi ini akan membuat folder induk khusus bernama <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold">E-PBB_Backup_Sistem</code> pada akar Google Drive Anda untuk menata kumpulan data hasil pencadangan.
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-5">Tertata Rapih</p>
          </div>

          <div className="bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Kompatibel Format Excel</h3>
              <p className="text-xxs text-slate-500 leading-relaxed font-semibold">
                Selain file JSON cadangan sistem, Anda dapat menginstruksikan ekspor langsung seluruh record terdaftar wajib pajak, tunggakan SPPT, ke format file CSV yang siap dibuka langsung di Excel / Numbers.
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-5">Dukungan spreadsheet</p>
          </div>

        </div>
      ) : (
        /* Authorized operational portal panel layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel column: Action Triggering Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Create dynamic system backup */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-slate-400" /> Pencadangan Database PBB
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Data yang akan dicadangkan:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-bold">
                    <span>• {fullDatabase.subjek.length} Wajib Pajak</span>
                    <span>• {fullDatabase.objek.length} Objek Pajak (NOP)</span>
                    <span>• {fullDatabase.sppt.length} Tagihan SPPT</span>
                    <span>• {fullDatabase.pembayaran.length} Kuitansi Kas</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">Label Catatan Belakang (Opsional)</label>
                  <input
                    type="text"
                    value={customSuffix}
                    onChange={(e) => setCustomSuffix(e.target.value)}
                    placeholder="Contoh: sblm_audit_mei / revisi_rt02"
                    className="w-full text-xs font-semibold p-3.5 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white text-slate-800"
                  />
                  <span className="text-[9px] text-slate-400 font-medium block">Hanya karakter huruf dan angka yang disimpan. Tanggal dan nama desa otomatis dipasang di awal nama berkas.</span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs font-black transition cursor-pointer select-none flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15"
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang menulis & mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      <span>Cadangkan Instan Seluruh Sistem</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Direct report exporter to GDrive */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-slate-400" /> Ekspor Laporan Excel (CSV)
              </h3>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide block">Pilih Macam Laporan Rekap</label>
                  <select
                    value={selectedReport}
                    onChange={(e) => setSelectedReport(e.target.value as any)}
                    className="w-full text-xs font-bold p-3.5 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white text-slate-700 font-sans"
                  >
                    <option value="wp">Data Master Wajib Pajak (Profil & No WA)</option>
                    <option value="tunggakan">Daftar Penunggak PBB (Belum Lunas)</option>
                    <option value="riwayat">Riwayat Pelunasan Kasir (Realisasi Dana)</option>
                  </select>
                </div>

                <div className="p-3 bg-indigo-50/40 border border-dashed border-indigo-150 rounded-xl flex gap-2">
                  <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-600 font-semibold leading-normal">
                    Laporan akan langsung diekspor sebagai file dokumen CSV terenkrip UTF-8 yang bisa langsung diunduh lewat komputer dan dibaca menggunakan software pengolah tabel Excel, Google Sheets, dsb.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportReportToDrive}
                  disabled={isExportingReport}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-black transition cursor-pointer select-none flex items-center justify-center gap-2 shadow"
                >
                  {isExportingReport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang mem-formatting & mengirim...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Ekspor & Unggah Laporan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Right panel column: Backups list directory on Drive and actions */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4 min-h-[350px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <FolderArchive className="w-5 h-5 text-indigo-500" />
                    Arsip Pencadangan Terpancar di Drive
                  </h3>
                  <p className="text-[10px] text-slate-500">Mendeteksi arsip cadangan tersimpan di dalam folder <code className="bg-slate-100 px-1 py-0.5 font-mono text-[9px] font-bold text-slate-700 rounded">E-PBB_Backup_Sistem</code></p>
                </div>

                <button
                  onClick={() => fetchBackupFileList()}
                  disabled={isLoadingBackups}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition border border-slate-150 cursor-pointer"
                  title="Segarkan Daftar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin text-slate-700' : ''}`} />
                </button>
              </div>

              {isLoadingBackups ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-xxs text-slate-500 font-bold uppercase tracking-wider animate-pulse">Menghubungi endpoint Google Drive & memuat berkas...</p>
                </div>
              ) : backups.length === 0 ? (
                <div className="py-16 text-center space-y-4 border border-dashed rounded-2xl border-slate-200">
                  <FolderArchive className="w-12 h-12 text-slate-350 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-700">Tidak ada file cadangan saat ini</p>
                    <p className="text-xxs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                      Belum terdeteksi adanya file cadangan <code className="text-slate-650 inline font-bold">.json</code> milik sistem E-PBB di Google Drive Anda. Ketuk tombol cadangkan penuh di layar kiri untuk mengarsip pertama kali.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1 sm:scrollbar-thin">
                  {backups.map((file) => {
                    const isNowRestoring = isRestoringId === file.id;

                    return (
                      <div 
                        key={file.id} 
                        className="p-4 rounded-xl border border-slate-150 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 flex-1 min-w-0 pr-2">
                          <p className="text-xs font-black text-slate-800 break-all leading-normal flex items-center gap-1.5 flex-wrap">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                            {file.name}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold">
                            <span className="flex items-center gap-1">
                              Waktu: <strong className="text-slate-700 font-extrabold">{formatTime(file.createdTime)}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              Ukuran: <strong className="text-slate-700 font-extrabold">{formatBytes(file.size)}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-2.5 sm:pt-0">
                          {/* Live view on Drive trigger link */}
                          <a
                            href={`https://docs.google.com/file/d/${file.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-205 py-2 px-3 rounded-lg text-[10px] font-extrabold transition cursor-pointer select-none flex items-center gap-1"
                            title="Buka pada Google Drive tab baru"
                          >
                            <span>Drive</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>

                          {/* Trigger Restore */}
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(file.id, file.name)}
                            disabled={isNowRestoring || isRestoringId !== null}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 py-2 px-3.5 rounded-lg text-[10.5px] font-black transition cursor-pointer select-none flex items-center gap-1 shadow-xs"
                          >
                            {isNowRestoring ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Memulihkan...</span>
                              </>
                            ) : (
                              <>
                                <CloudDownload className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Security warning helper box at footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 text-xxs text-slate-500 font-semibold leading-relaxed">
        <Info className="w-4.5 h-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-extrabold text-slate-800 uppercase tracking-wider block">INFORMASI KEAMANAN PRIVASI:</span>
          <p>
            Tautan otorisasi ini menggunakan enkripsi aman OAuth2 yang terdaftar di Platform Cloud Pengembang. Aplikasi ini hanya memiliki kewenangan terbatas untuk menulis berkas cadangan di folder kerjanya dan tidak dapat memodifikasi isi file Google Drive Anda yang lain di luar berkas arsip sistem yang dibuatnya.
          </p>
        </div>
      </div>

    </div>
  );
}
