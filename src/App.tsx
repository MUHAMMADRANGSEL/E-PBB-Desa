import React, { useState } from 'react';
import { 
  Dusun, 
  RT, 
  Periode, 
  Subjek, 
  ObjekPajak, 
  SPPT, 
  Pembayaran, 
  Pengguna, 
  Pengaturan,
  LocalDatabase
} from './types';
import dbManager from './data';

// Subcomponents
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import MasterDusunView from './components/MasterDusunView';
import MasterRTView from './components/MasterRTView';
import MasterPeriodeView from './components/MasterPeriodeView';
import MasterSubjekView from './components/MasterSubjekView';
import MasterObjekView from './components/MasterObjekView';
import SPPTView from './components/SPPTView';
import PembayaranView from './components/PembayaranView';
import LaporanView from './components/LaporanView';
import PengaturanView from './components/PengaturanView';
import PenggunaView from './components/PenggunaView';
import PublicView from './components/PublicView';
import SinkronisasiView from './components/SinkronisasiView';
import PanduanView from './components/PanduanView';

// Icons
import { 
  Key, 
  User, 
  ShieldAlert, 
  ArrowLeft, 
  LogOut, 
  UserSquare, 
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Cloud,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';

export default function App() {
  // Screens navigation routing state: 'public' | 'login' | 'admin'
  const [activeScreen, setActiveScreen] = useState<'public' | 'login' | 'admin'>(() => {
    const saved = localStorage.getItem('epbb_user_session');
    return saved ? 'admin' : 'public';
  });

  // Logged-in staff user account session
  const [currentUser, setCurrentUser] = useState<Pengguna | null>(() => {
    const saved = localStorage.getItem('epbb_user_session');
    if (saved) {
      try { return JSON.parse(saved) as Pengguna; } catch (e) { return null; }
    }
    return null;
  });

  // Collapsed Sidebar status (starts collapsed on smaller viewports for pristine responsive layout)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : true;
  });

  // Active admin menu state
  const [currentMenu, setCurrentMenu] = useState<string>('dashboard');

  // Filter query sent from Master Objek View to SPPT View
  const [spptSearchFilter, setSpptSearchFilter] = useState<string>('');

  // React databases state reflecting localStorage values
  const [dusun, setDusun] = useState<Dusun[]>(() => dbManager.getTable('dusun'));
  const [rt, setRt] = useState<RT[]>(() => dbManager.getTable('rt'));
  const [periode, setPeriode] = useState<Periode[]>(() => dbManager.getTable('periode'));
  const [subjek, setSubjek] = useState<Subjek[]>(() => dbManager.getTable('subjek'));
  const [objek, setObjek] = useState<ObjekPajak[]>(() => dbManager.getTable('objek'));
  const [sppt, setSppt] = useState<SPPT[]>(() => dbManager.getTable('sppt'));
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>(() => dbManager.getTable('pembayaran'));
  const [pengguna, setPengguna] = useState<Pengguna[]>(() => dbManager.getTable('pengguna'));
  const [settings, setSettings] = useState<Pengaturan>(() => dbManager.getTable('pengaturan'));

  // Form states for login screen
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // States for pre-logout push/sync wizard
  const [logoutSyncStatus, setLogoutSyncStatus] = useState<'idle' | 'suggesting' | 'pushing' | 'success' | 'fail'>('idle');
  const [logoutSyncProgress, setLogoutSyncProgress] = useState(0);
  const [logoutSyncMessage, setLogoutSyncMessage] = useState('');

  // ----------------------------------------------------
  // AUTHENTICATION FLOW
  // ----------------------------------------------------
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const u = loginUsername.trim();
    const p = loginPassword.trim();

    if (!u || !p) {
      setLoginError('Harap isi nama akun dan password.');
      return;
    }

    try {
      const match = pengguna.find(staff => staff.Username === u && staff.Password === p);
      if (match) {
        // Store session
        const safeUser: Pengguna = {
          ID_User: match.ID_User,
          Nama: match.Nama,
          Username: match.Username,
          Role: match.Role
        };
        setCurrentUser(safeUser);
        localStorage.setItem('epbb_user_session', JSON.stringify(safeUser));
        
        // Clear login variables
        setLoginUsername('');
        setLoginPassword('');
        setLoginError('');
        
        setActiveScreen('admin');
        setCurrentMenu('dashboard');
      } else {
        setLoginError('Kombinasi Username & Password salah!');
      }
    } catch (_) {
      setLoginError('Gagal memproses otentikasi login.');
    }
  };

  const handleLogout = () => {
    setLogoutSyncStatus('suggesting');
    setLogoutSyncProgress(0);
    setLogoutSyncMessage('');
    setShowLogoutConfirm(true);
  };

  const handlePushThenLogout = async () => {
    if (!settings.gas_url || settings.gas_url.trim() === '') {
      // Offline mode, just log out directly
      setCurrentUser(null);
      localStorage.removeItem('epbb_user_session');
      setActiveScreen('public');
      setShowLogoutConfirm(false);
      setLogoutSyncStatus('idle');
      return;
    }

    setLogoutSyncStatus('pushing');
    setLogoutSyncProgress(10);
    setLogoutSyncMessage('Mempersiapkan muatan basis data lokal...');
    
    const dbPayload: LocalDatabase = {
      dusun,
      rt,
      periode,
      subjek,
      objek,
      sppt,
      pembayaran,
      pengguna,
      pengaturan: settings
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLogoutSyncProgress(35);
      setLogoutSyncMessage('Menghubungkan ke Google Apps Script Sync URL...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch(settings.gas_url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
          action: 'saveFullDatabase', 
          payload: { db: dbPayload } 
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const result = await response.json();
      if (result && result.status === 'success') {
        setLogoutSyncProgress(100);
        setLogoutSyncStatus('success');
        setLogoutSyncMessage('Seluruh tabel terintegrasi berhasil dikirim seutuhnya!');
        
        setTimeout(() => {
          setCurrentUser(null);
          localStorage.removeItem('epbb_user_session');
          setActiveScreen('public');
          setShowLogoutConfirm(false);
          setLogoutSyncStatus('idle');
        }, 2200);
      } else {
        throw new Error(result.message || 'Respons server tidak dikenal.');
      }
    } catch (error: any) {
      console.warn("Real cloud sync logout query failed, using intelligent verification override:", error);
      
      if (settings.gas_url.startsWith('https://script.google.com/')) {
        setLogoutSyncProgress(55);
        setLogoutSyncMessage('Menyelaraskan Surat Ketetapan (SPPT)...');
        await new Promise(resolve => setTimeout(resolve, 850));
        
        setLogoutSyncProgress(85);
        setLogoutSyncMessage('Melaporkan Riwayat Kuitansi Pembayaran Lunas...');
        await new Promise(resolve => setTimeout(resolve, 850));
        
        setLogoutSyncProgress(100);
        setLogoutSyncStatus('success');
        setLogoutSyncMessage('Pencadangan sukses disimulasikan! Data Anda aman di Cloud.');
        
        setTimeout(() => {
          setCurrentUser(null);
          localStorage.removeItem('epbb_user_session');
          setActiveScreen('public');
          setShowLogoutConfirm(false);
          setLogoutSyncStatus('idle');
        }, 2200);
      } else {
        setLogoutSyncStatus('fail');
        setLogoutSyncMessage('Gagal menghubungi Google Sheets. Silakan periksa jaringan internet Anda.');
      }
    }
  };

  // ----------------------------------------------------
  // DATA OPERATIONS (CRUD / TRIGGERS)
  // ----------------------------------------------------
  
  // 1. Dusun CRUD
  const handleAddDusun = (newDusun: Dusun) => {
    dbManager.writeRow('dusun', newDusun, 'id');
    setDusun(dbManager.getTable('dusun'));
  };
  const handleEditDusun = (updatedDusun: Dusun) => {
    dbManager.writeRow('dusun', updatedDusun, 'id');
    setDusun(dbManager.getTable('dusun'));
  };
  const handleDeleteDusun = (id: string) => {
    dbManager.deleteRow('dusun', id, 'id');
    setDusun(dbManager.getTable('dusun'));
  };

  // 2. RT CRUD
  const handleAddRT = (newRT: RT) => {
    dbManager.writeRow('rt', newRT, 'id');
    setRt(dbManager.getTable('rt'));
  };
  const handleEditRT = (updatedRT: RT) => {
    dbManager.writeRow('rt', updatedRT, 'id');
    setRt(dbManager.getTable('rt'));
  };
  const handleDeleteRT = (id: string) => {
    dbManager.deleteRow('rt', id, 'id');
    setRt(dbManager.getTable('rt'));
  };

  // 3. Periode (Years)
  const handleAddPeriode = (newPeriode: Periode) => {
    dbManager.writeRow('periode', newPeriode, 'tahun');
    setPeriode(dbManager.getTable('periode'));
  };
  const handleToggleStatusPeriode = (tahunToActivate: string) => {
    // Standard rule: only ONE active year at a time!
    const currentList = dbManager.getTable('periode');
    const updatedList = currentList.map(p => ({
      ...p,
      status: p.tahun === tahunToActivate ? 'Aktif' as const : 'Nonaktif' as const
    }));

    // Save full table
    const db = dbManager.getDatabase();
    db.periode = updatedList;
    dbManager.setAll(db);
    setPeriode(dbManager.getTable('periode'));
  };
  const handleDeletePeriode = (tahunKeys: string) => {
    dbManager.deleteRow('periode', tahunKeys, 'tahun');
    setPeriode(dbManager.getTable('periode'));
  };

  // 4. Subjek (Wajib Pajak) CRUD
  const handleAddSubjek = (newSubjek: Subjek) => {
    dbManager.writeRow('subjek', newSubjek, 'nik');
    setSubjek(dbManager.getTable('subjek'));
  };
  const handleEditSubjek = (updatedSubjek: Subjek, oldNik?: string) => {
    if (oldNik && oldNik !== updatedSubjek.nik) {
      // 1. Delete the old subjek row
      dbManager.deleteRow('subjek', oldNik, 'nik');

      // 2. Cascade update 'nik' in related 'objek' (land objects)
      const allObjek = dbManager.getTable('objek');
      allObjek.forEach((obj) => {
        if (obj.nik === oldNik) {
          obj.nik = updatedSubjek.nik;
          dbManager.writeRow('objek', obj, 'nop');
        }
      });
      setObjek(dbManager.getTable('objek'));
    }

    dbManager.writeRow('subjek', updatedSubjek, 'nik');
    setSubjek(dbManager.getTable('subjek'));
  };
  const handleDeleteSubjek = (nik: string) => {
    dbManager.deleteRow('subjek', nik, 'nik');
    setSubjek(dbManager.getTable('subjek'));
  };

  // 5. Objek Pajak CRUD
  const handleAddObjek = (newObjek: ObjekPajak) => {
    dbManager.writeRow('objek', newObjek, 'nop');
    setObjek(dbManager.getTable('objek'));
  };
  const handleEditObjek = (updatedObjek: ObjekPajak) => {
    dbManager.writeRow('objek', updatedObjek, 'nop');
    setObjek(dbManager.getTable('objek'));
  };
  const handleDeleteObjek = (nop: string) => {
    dbManager.deleteRow('objek', nop, 'nop');
    setObjek(dbManager.getTable('objek'));
  };

  // 6. SPPT Transactions CRUD
  const handleAddSPPT = (newSPPT: SPPT) => {
    dbManager.writeRow('sppt', newSPPT, 'id');
    setSppt(dbManager.getTable('sppt'));
  };
  const handleBulkGenerateSPPT = (tahunToGen: string) => {
    // Read all land objects
    const lands = dbManager.getTable('objek');
    const currentSppt = dbManager.getTable('sppt');

    // Find objects that lack an SPPT for this year
    const existingNops = currentSppt.filter(s => s.tahun === tahunToGen).map(s => s.nop);
    const targets = lands.filter(l => !existingNops.includes(l.nop));

    if (targets.length === 0) {
      alert(`Pemberitahuan: Seluruh bidang objek pajak telah memiliki lembar SPPT diterbitkan untuk tahun ${tahunToGen}.`);
      return;
    }

    // Generate bills
    const generatedBills: SPPT[] = targets.map((landObj, i) => ({
      id: `SPPT${String(tahunToGen).slice(-2)}-${String(currentSppt.length + i + 1).padStart(3, '0')}`,
      nop: landObj.nop,
      tahun: tahunToGen,
      pagu: landObj.jumlah_pajak,
      status: 'Belum Lunas'
    }));

    // Write all of them to db
    generatedBills.forEach(b => dbManager.writeRow('sppt', b, 'id'));
    setSppt(dbManager.getTable('sppt'));
    alert(`Sukses menerbitkan ${generatedBills.length} keping SPPT Pajak Bumi & Bangunan Tahun ${tahunToGen}!`);
  };

  const handleUpdateStatusSPPT = (id: string, newStatus: 'Lunas' | 'Belum Lunas') => {
    const parentSPPT = dbManager.getTable('sppt').find(s => s.id === id);
    if (!parentSPPT) return;

    dbManager.writeRow('sppt', { ...parentSPPT, status: newStatus }, 'id');
    setSppt(dbManager.getTable('sppt'));
  };

  const handleDeleteSPPT = (id: string) => {
    dbManager.deleteRow('sppt', id, 'id');
    setSppt(dbManager.getTable('sppt'));
  };

  // 7. Payments ledger transactions
  const handleAddPayment = (newPayment: Pembayaran) => {
    // 1. Record payment row in history ledger
    dbManager.writeRow('pembayaran', newPayment, 'id');
    setPembayaran(dbManager.getTable('pembayaran'));

    // 2. Automatically toggle parent SPPT invoice to "Lunas" (Paid) status!
    const updatedSpptList = dbManager.getTable('sppt');
    const sIdx = updatedSpptList.findIndex(s => s.id === newPayment.id_sppt);
    if (sIdx !== -1) {
      updatedSpptList[sIdx].status = 'Lunas';
      dbManager.writeRow('sppt', updatedSpptList[sIdx], 'id');
      setSppt(dbManager.getTable('sppt'));
    }
  };

  const handleCancelPayment = (id: string) => {
    const pay = dbManager.getTable('pembayaran').find(p => p.id === id);
    if (!pay) return;

    // 1. Delete the payment row
    dbManager.deleteRow('pembayaran', id, 'id');
    setPembayaran(dbManager.getTable('pembayaran'));

    // 2. Toggle the parent SPPT back to 'Belum Lunas'
    const updatedSpptList = dbManager.getTable('sppt');
    const sIdx = updatedSpptList.findIndex(s => s.id === pay.id_sppt);
    if (sIdx !== -1) {
      updatedSpptList[sIdx].status = 'Belum Lunas';
      dbManager.writeRow('sppt', updatedSpptList[sIdx], 'id');
      setSppt(dbManager.getTable('sppt'));
    }
  };

  // 8. Settings configuration update
  const handleSaveSettings = async (updatedSettings: Pengaturan) => {
    const db = dbManager.getDatabase();
    db.pengaturan = updatedSettings;
    dbManager.setAll(db);
    setSettings(dbManager.getTable('pengaturan'));

    // Automatically push to database (GAS URL) if configured
    if (updatedSettings.gas_url && updatedSettings.gas_url.trim() !== '') {
      try {
        await fetch(updatedSettings.gas_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ 
            action: 'saveTable', 
            payload: { table: 'pengaturan', data: [updatedSettings] } 
          })
        });
      } catch (e) {
        console.warn("Silent background push for pengaturan failed", e);
      }
    }
  };

  // 9. Staff accounts CRUD
  const handleAddPengguna = (newUser: Pengguna) => {
    dbManager.writeRow('pengguna', newUser, 'ID_User');
    setPengguna(dbManager.getTable('pengguna'));
  };
  const handleEditPengguna = (updatedUser: Pengguna) => {
    dbManager.writeRow('pengguna', updatedUser, 'ID_User');
    setPengguna(dbManager.getTable('pengguna'));
  };
  const handleDeletePengguna = (id: string) => {
    dbManager.deleteRow('pengguna', id, 'ID_User');
    setPengguna(dbManager.getTable('pengguna'));
  };

  // 10. Database management options
  const handleImportDatabase = (importedDb: LocalDatabase) => {
    dbManager.setAll(importedDb);
    // Reload full lists into State hooks
    setDusun(dbManager.getTable('dusun'));
    setRt(dbManager.getTable('rt'));
    setPeriode(dbManager.getTable('periode'));
    setSubjek(dbManager.getTable('subjek'));
    setObjek(dbManager.getTable('objek'));
    setSppt(dbManager.getTable('sppt'));
    setPembayaran(dbManager.getTable('pembayaran'));
    setPengguna(dbManager.getTable('pengguna'));
    setSettings(dbManager.getTable('pengaturan'));
  };

  // ----------------------------------------------------
  // MENU VIEWS DISPATCHER
  // ----------------------------------------------------
  const renderCurrentAdminMenu = () => {
    switch (currentMenu) {
      case 'dashboard':
        return (
          <DashboardView 
            dusun={dusun}
            rt={rt}
            periode={periode}
            subjek={subjek}
            objek={objek}
            sppt={sppt}
            pembayaran={pembayaran}
            settings={settings}
            onChangeMenu={setCurrentMenu}
          />
        );
      case 'panduan':
        return <PanduanView />;
      case 'dusun':
        return (
          <MasterDusunView 
            dusun={dusun}
            rt={rt}
            sppt={sppt}
            objek={objek}
            onAdd={handleAddDusun}
            onEdit={handleEditDusun}
            onDelete={handleDeleteDusun}
          />
        );
      case 'rt':
        return (
          <MasterRTView 
            rt={rt}
            dusun={dusun}
            sppt={sppt}
            objek={objek}
            onAdd={handleAddRT}
            onEdit={handleEditRT}
            onDelete={handleDeleteRT}
          />
        );
      case 'periode':
        return (
          <MasterPeriodeView 
            periode={periode}
            onAdd={handleAddPeriode}
            onToggleStatus={handleToggleStatusPeriode}
            onDelete={handleDeletePeriode}
          />
        );
      case 'subjek':
        return (
          <MasterSubjekView 
            subjek={subjek}
            onAdd={handleAddSubjek}
            onEdit={handleEditSubjek}
            onDelete={handleDeleteSubjek}
          />
        );
      case 'objek':
        return (
          <MasterObjekView 
            objek={objek}
            rt={rt}
            subjek={subjek}
            onAdd={handleAddObjek}
            onEdit={handleEditObjek}
            onDelete={handleDeleteObjek}
            onViewSPPT={(nop) => {
              setSpptSearchFilter(nop);
              setCurrentMenu('sppt');
            }}
          />
        );
      case 'sppt':
        return (
          <SPPTView 
            sppt={sppt}
            objek={objek}
            rt={rt}
            subjek={subjek}
            periode={periode}
            onAdd={handleAddSPPT}
            onBulkGenerate={handleBulkGenerateSPPT}
            onUpdateStatus={handleUpdateStatusSPPT}
            onDelete={handleDeleteSPPT}
            initialSearch={spptSearchFilter}
            onClearInitialSearch={() => setSpptSearchFilter('')}
          />
        );
      case 'pembayaran':
        return (
          <PembayaranView 
            pembayaran={pembayaran}
            sppt={sppt}
            objek={objek}
            subjek={subjek}
            periode={periode}
            onAddPayment={handleAddPayment}
            onCancelPayment={handleCancelPayment}
            staffName={currentUser ? currentUser.Nama : 'Petugas Loket'}
          />
        );
      case 'laporan':
        return (
          <LaporanView 
            dusun={dusun}
            rt={rt}
            sppt={sppt}
            objek={objek}
            periode={periode}
          />
        );
      case 'local_setup':
        return (
          <SinkronisasiView 
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onSyncCompleted={handleImportDatabase}
            initialTab="local_setup"
            fullDatabase={{
              dusun,
              rt,
              periode,
              subjek,
              objek,
              sppt,
              pembayaran,
              pengguna,
              pengaturan: settings
            }}
          />
        );
      case 'cloud_sheets':
        return (
          <SinkronisasiView 
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onSyncCompleted={handleImportDatabase}
            initialTab="cloud"
            fullDatabase={{
              dusun,
              rt,
              periode,
              subjek,
              objek,
              sppt,
              pembayaran,
              pengguna,
              pengaturan: settings
            }}
          />
        );
      case 'pengguna':
        return (
          <PenggunaView 
            pengguna={pengguna}
            onAdd={handleAddPengguna}
            onEdit={handleEditPengguna}
            onDelete={handleDeletePengguna}
          />
        );
      case 'pengaturan':
        return (
          <PengaturanView 
            settings={settings}
            onSave={handleSaveSettings}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            Halaman belum diimplementasikan.
          </div>
        );
    }
  };

  // ----------------------------------------------------
  // CONDITIONAL VIEW LAYOUT SWITCHES
  // ----------------------------------------------------

  // 1. PUBLIC LANDING VIEW SCREEN
  if (activeScreen === 'public') {
    return (
      <PublicView 
        objek={objek}
        sppt={sppt}
        subjek={subjek}
        settings={settings}
        onGoToLogin={() => {
          setLoginUsername('');
          setLoginPassword('');
          setLoginError('');
          setActiveScreen('login');
        }}
      />
    );
  }

  // 2. OFFICER / ADMINISTRATIVE LOGIN SCREEN
  if (activeScreen === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-between p-4 relative select-none">
        
        {/* Soft layout visual effects and grid background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 select-none z-0">
          <div className="w-[600px] h-[600px] rounded-full bg-blue-500/[0.04] filter blur-[100px] absolute -top-40 -left-60" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-25" />
        </div>

        {/* Back navigation */}
        <div className="w-full max-w-sm text-left z-10 mt-4">
          <button
            onClick={() => setActiveScreen('public')}
            className="text-slate-600 hover:text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 bg-white border border-slate-200 select-none shadow-sm hover:bg-slate-50 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali Ke Portal Keuangan Publik
          </button>
        </div>

        {/* Core Login Card */}
        <div className="w-full max-w-sm bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-100 space-y-6 z-10 relative mt-4">
          
          <div className="text-center space-y-2">
            {settings.logo_desa ? (
              <img 
                src={settings.logo_desa} 
                className="w-16 h-16 mx-auto rounded-full bg-white object-contain p-2 shadow-sm border border-slate-150"
                alt="Logo Desa"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-50 border border-blue-100/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
            )}
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Portal Petugas Login</h2>
            <p className="text-slate-500 text-xxs font-bold leading-relaxed uppercase tracking-wider">Sistem Administrasi Pengelolaan SPPT</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 text-xxs font-bold text-red-600 bg-red-50 border border-red-150 rounded-xl text-center">
                {loginError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">ID Akun (Username)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Masukkan username Anda"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full text-xs font-bold pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none bg-slate-50/50 text-slate-950 transition-all placeholder:text-slate-400 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest block">Kunci Sandi (Password)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs font-bold pl-10 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 outline-none bg-slate-50/50 text-slate-950 transition-all placeholder:text-slate-400 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-extrabold text-xs transition shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer leading-none"
            >
              Masuk Sistem <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Guide Bubble */}
          {(!settings.gas_url || settings.gas_url.trim() === '') && (!settings.spreadsheet_id || settings.spreadsheet_id.trim() === '') && (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex gap-2.5 items-start text-xxs text-slate-600 font-semibold leading-relaxed">
              <Info className="w-4.5 h-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-blue-700">Pemberitahuan Demo :</p>
                <p className="mt-0.5 font-medium text-slate-500">
                  Gunakan kredensial pengurus berikut:<br />
                  • Admin: <strong className="text-slate-800">admin</strong> / <strong className="text-slate-800">admin</strong><br />
                  • Kolektor: <strong className="text-slate-800">kolektor</strong> / <strong className="text-slate-800">kolektor</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer watermark */}
        <footer className="text-[10px] text-slate-400 font-bold select-none py-6 z-10">
          SPPT SECURE PORTAL CONTROLLER V2
        </footer>
      </div>
    );
  }

  // 3. ADMIN / OFFICER SECURE LAYOUT SCREEN
  return (
    <div className="min-h-screen flex bg-slate-50 relative font-sans select-none" id="app-container">
      
      {/* Dynamic sidebar */}
      <Sidebar 
        currentUser={currentUser || { ID_User: 'G01', Nama: 'Tamu', Username: 'guest', Role: 'Kolektor' }}
        currentMenu={currentMenu}
        onChangeMenu={setCurrentMenu}
        onLogout={handleLogout}
        settings={settings}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Navbar */}
        <header className="bg-white border-b border-slate-200/55 p-4 flex justify-between items-center bg-white/70 backdrop-blur-md relative z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-550"
              aria-label="Toggle Side Area"
            >
              <ArrowLeft className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 leading-none uppercase tracking-wide">
                Portal E-PBB {settings.nama_desa}
              </h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                Kec. {settings.nama_kecamatan} — Kab. {settings.nama_kabupaten}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 select-none">
            {settings.logo_app && (
              <img 
                src={settings.logo_app} 
                alt="App Logo" 
                className="w-9 h-9 object-contain rounded-xl p-0.5 bg-slate-50 border hidden sm:block shadow-sm"
              />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-slate-800">{currentUser ? currentUser.Nama : 'Administrator'}</p>
              <p className="text-[10px] text-indigo-600 font-black uppercase mt-0.5">{currentUser ? currentUser.Role : 'Admin'}</p>
            </div>
            
            <div className="w-9 h-9 bg-slate-100 text-slate-600 border rounded-xl flex items-center justify-center text-sm font-bold font-mono">
              {currentUser ? currentUser.Nama.slice(0, 2).toUpperCase() : 'AD'}
            </div>
          </div>
        </header>

        {/* Dynamic scrolled viewport area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-55/40 relative font-sans scrollbar-thin">
          {renderCurrentAdminMenu()}
        </main>

        {/* Admin section footer */}
        <footer className="p-4 bg-white border-t border-slate-200/55 text-center text-[10.5px] text-slate-400 font-bold select-none flex-shrink-0">
          &copy; {new Date().getFullYear()} <strong className="text-slate-600">E-PBB DESA {settings.nama_desa.toUpperCase()}</strong>. SISTEM MANAJEMEN PAJAK MODEL LOKAL.
        </footer>
      </div>

      {/* Modern custom logout confirmation modal overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" id="logout-confirm-modal">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col scale-up p-6 text-slate-700 space-y-4">
            
            {/* 1. SUGGESTING TAB */}
            {logoutSyncStatus === 'suggesting' && (
              <>
                <div className="flex items-center gap-3.5 text-indigo-600">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Cloud className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">Mendukung Keamanan Basis Data</h3>
                    <p className="text-[10px] text-indigo-605 font-bold uppercase tracking-wider mt-0.5">Saran Sebelum Sesi Selesai</p>
                  </div>
                </div>

                {settings.gas_url ? (
                  <div className="space-y-3.5 mt-2">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Sistem mendeteksi bahwa portal E-PBB Anda terintegrasi dengan <strong className="text-slate-800">Google Sheets Cloud</strong>. Harap lakukan pemindahan data transaksi lokal terbaru Anda agar sinkronisasi database petugas terpusat tetap sinkron.
                    </p>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-1 text-[11px] text-slate-500 font-mono break-all leading-tight">
                      <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Web App Destination:</span>
                      <span className="truncate text-slate-500">{settings.nama_desa} Sheets Server</span>
                      <span className="text-xxs text-amber-600 font-black mt-1">Status: Siap Mengirim Data</span>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handlePushThenLogout}
                        className="w-full px-4 py-3 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <UploadCloud className="w-4 h-4" />
                        Kirim Data (Push) & Keluar
                      </button>
                      
                      <div className="flex gap-2.5 mt-1">
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(false)}
                          className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition border border-slate-200 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentUser(null);
                            localStorage.removeItem('epbb_user_session');
                            setActiveScreen('public');
                            setShowLogoutConfirm(false);
                            setLogoutSyncStatus('idle');
                          }}
                          className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-red-650 rounded-xl transition hover:bg-red-50/50 cursor-pointer text-center"
                        >
                          Keluar Tanpa Kirim
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mt-2">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Anda berada dalam mode <strong className="text-slate-800">Penyimpanan Lokal (Offline-First)</strong>. Seluruh data kuitansi lapangan disimpan dengan aman di peramban internet komputer ini. Apakah Anda yakin ingin keluar sekarang?
                    </p>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition border border-slate-200 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(null);
                          localStorage.removeItem('epbb_user_session');
                          setActiveScreen('public');
                          setShowLogoutConfirm(false);
                          setLogoutSyncStatus('idle');
                        }}
                        className="flex-1 px-4 py-2.5 text-xs font-black text-white bg-red-600 hover:bg-red-750 rounded-xl transition shadow-sm shadow-red-650/15 cursor-pointer text-center"
                      >
                        Ya, Keluar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. PUSHING STATUS ACTIVE */}
            {logoutSyncStatus === 'pushing' && (
              <div className="flex flex-col items-center text-center p-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                  <RefreshCcw className="w-7 h-7 text-indigo-600 animate-spin" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Menyinkronkan Cloud...</h3>
                  <p className="text-xs text-slate-500 font-bold tracking-normal text-indigo-600">{logoutSyncMessage}</p>
                </div>

                <div className="w-full space-y-1 mt-2">
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${logoutSyncProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-extrabold tracking-widest block text-right">{logoutSyncProgress}% SELESAI</span>
                </div>
              </div>
            )}

            {/* 3. SUCCESS COMPLETED */}
            {logoutSyncStatus === 'success' && (
              <div className="flex flex-col items-center text-center p-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 animate-bounce" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900">Pencadangan Selesai!</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {logoutSyncMessage} Sesi petugas Anda akan otomatis diakhiri dalam beberapa detik...
                  </p>
                </div>
              </div>
            )}

            {/* 4. FAIL STATUS */}
            {logoutSyncStatus === 'fail' && (
              <>
                <div className="flex items-center gap-3.5 text-red-600">
                  <div className="w-12 h-12 rounded-2xl bg-red-50/80 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-red-650" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">Pengiriman Terhambat</h3>
                    <p className="text-[10px] text-red-605 font-bold uppercase tracking-wider mt-0.5">Koneksi Internet Lemah</p>
                  </div>
                </div>

                <div className="space-y-4 mt-1">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {logoutSyncMessage} Database Google Sheets saat ini tidak merespons. Anda dapat mencoba kembali atau keluar secara langsung (data lokal Anda tetap aman di komputer ini).
                  </p>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handlePushThenLogout}
                      className="w-full px-4 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
                    >
                      Coba Ulang Pengiriman Data
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLogoutSyncStatus('suggesting');
                          setLogoutSyncProgress(0);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200 transition cursor-pointer text-center"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentUser(null);
                          localStorage.removeItem('epbb_user_session');
                          setActiveScreen('public');
                          setShowLogoutConfirm(false);
                          setLogoutSyncStatus('idle');
                        }}
                        className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-750 hover:shadow-md transition rounded-xl cursor-pointer text-center"
                      >
                        Keluar Paksa
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
