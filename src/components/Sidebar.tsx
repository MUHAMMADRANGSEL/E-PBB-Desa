import { Dusun, RT, Periode, Subjek, ObjekPajak, SPPT, Pembayaran, Pengguna, Pengaturan } from '../types';
import { 
  Home, 
  MapPin, 
  Users, 
  Calendar, 
  UserCheck, 
  Building, 
  FileText, 
  HandCoins, 
  BarChart3, 
  Settings, 
  Users2, 
  LogOut,
  AppWindow,
  Menu,
  X,
  RefreshCcw,
  Crown,
  ShieldCheck,
  User,
  Fingerprint,
  Wrench,
  Cloud,
  Book
} from 'lucide-react';

interface SidebarProps {
  currentUser: Pengguna;
  currentMenu: string;
  onChangeMenu: (menu: string) => void;
  onLogout: () => void;
  settings: Pengaturan;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export default function Sidebar({
  currentUser,
  currentMenu,
  onChangeMenu,
  onLogout,
  settings,
  collapsed,
  setCollapsed
}: SidebarProps) {
  const isAdmin = currentUser.Role.toLowerCase() === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, section: 'Utama' },
    { id: 'panduan', label: 'Panduan', icon: Book, section: 'Utama' },
    
    // Master data
    { id: 'dusun', label: 'Data Dusun', icon: MapPin, section: 'Master Data', adminOnly: true },
    { id: 'rt', label: 'Data RT', icon: Users, section: 'Master Data', adminOnly: true },
    { id: 'periode', label: 'Periode Pajak', icon: Calendar, section: 'Master Data', adminOnly: true },
    { id: 'subjek', label: 'Subjek Pajak (WP)', icon: UserCheck, section: 'Master Data', adminOnly: true },
    { id: 'objek', label: 'Objek Pajak (OP)', icon: Building, iconColor: 'text-slate-400', section: 'Master Data', adminOnly: true },
    
    // Transactions
    { id: 'sppt', label: 'Data SPPT', icon: FileText, section: 'Transaksi' },
    { id: 'pembayaran', label: 'Pembayaran & Kas', icon: HandCoins, section: 'Transaksi' },
    
    // Reports & settings
    { id: 'laporan', label: 'Rekap Laporan', icon: BarChart3, section: 'Laporan & Pengaturan' },
    { id: 'local_setup', label: 'Setup Database Lokal', icon: Wrench, section: 'Laporan & Pengaturan', adminOnly: true },
    { id: 'cloud_sheets', label: 'Integrasi Cloud Sheets', icon: Cloud, section: 'Laporan & Pengaturan', adminOnly: true },
    { id: 'pengguna', label: 'Pengguna & Akses', icon: Users2, section: 'Laporan & Pengaturan', adminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan Aplikasi', icon: Settings, section: 'Laporan & Pengaturan', adminOnly: true }
  ];

  // Group items by section
  const sections = ['Utama', 'Master Data', 'Transaksi', 'Laporan & Pengaturan'];

  return (
    <>
      {/* Mobile Drawer Backdrop Mask Overlay */}
      {!collapsed && (
        <div 
          onClick={() => setCollapsed(true)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[25] md:hidden cursor-pointer animate-fade-in"
        />
      )}

      <aside 
        className={`bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen overflow-hidden transition-all duration-350 ease-in-out select-none
          fixed md:relative inset-y-0 left-0 z-30 md:z-auto
          ${collapsed 
            ? 'w-20 -translate-x-full md:translate-x-0' 
            : 'w-64 translate-x-0'}`}
        id="sidebar"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            {settings.logo_desa ? (
              <img 
                src={settings.logo_desa} 
                alt="Logo Desa" 
                className="w-9 h-9 min-w-9 min-h-9 rounded-lg bg-white p-1 object-contain shadow-inner" 
              />
            ) : (
              <div className="w-9 h-9 min-w-9 min-h-9 rounded-lg bg-blue-600 text-white font-bold text-center flex items-center justify-center text-lg shadow-md">
                P
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-wide text-white">E-PBB Desa</span>
                <span className="text-xxs text-amber-500 font-semibold truncate leading-none mt-0.5 uppercase">
                  {settings.nama_desa || 'Makmur'}
                </span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition"
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5 text-slate-350 hover:text-white block md:hidden" />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {sections.map((sectionName) => {
            const items = menuItems.filter(
              (item) => item.section === sectionName && (!item.adminOnly || isAdmin)
            );

            if (items.length === 0) return null;

            return (
              <div key={sectionName} className="space-y-1">
                {!collapsed && (
                  <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
                    {sectionName}
                  </p>
                )}
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChangeMenu(item.id);
                        if (window.innerWidth < 768) {
                          setCollapsed(true);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-sm font-medium
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`}
                      title={collapsed ? item.label : undefined}
                    >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer with Logged In User & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 space-y-3" id="sidebar-footer">
        {!collapsed ? (
          <div 
            id="user-auth-card"
            className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all duration-300 relative overflow-hidden backdrop-blur-md
              ${isAdmin 
                ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/25 shadow-md shadow-amber-500/5' 
                : 'bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900 border-blue-500/25 shadow-md shadow-blue-500/5'
              }`}
          >
            {/* Top Row: Avatar & Profile */}
            <div className="flex items-center gap-3">
              {/* Profile Avatar with Mini Floating Badge */}
              <div className="relative flex-shrink-0">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner transition-all duration-300
                    ${isAdmin 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40' 
                      : 'bg-blue-500/20 text-blue-400 border border-blue-400/40'
                    }`}
                >
                  {currentUser.Nama.charAt(0).toUpperCase()}
                </div>
                {/* Floating indicator */}
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
              </div>

              {/* Identity & Status */}
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-xs font-extrabold text-slate-100 truncate tracking-wide flex items-center gap-1">
                  {currentUser.Nama}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold truncate">
                  @{currentUser.Username || 'user'}
                </span>
              </div>
            </div>

            {/* Bottom Row: High-visibility Role Badge */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Fingerprint className="w-3.5 h-3.5 text-slate-500 stroke-[1.5]" />
                Level Akses
              </span>
              
              {isAdmin ? (
                <div className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-lg">
                  <Crown className="w-3 h-3 text-amber-400 fill-amber-400/20 animate-bounce" style={{ animationDuration: '3s' }} />
                  <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-wider">
                    Administrator
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/40 px-2 py-0.5 rounded-lg">
                  <ShieldCheck className="w-3 h-3 text-blue-400 fill-blue-400/20" />
                  <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-wider">
                    {currentUser.Role || 'Operator'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed State: Show Compact Interactive Badge */
          <div className="flex justify-center mb-2" id="user-auth-card-collapsed">
            <div 
              className="relative group cursor-help"
              title={`${currentUser.Nama} (${currentUser.Role}) - Aktif`}
            >
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border hover:scale-105 transition-all duration-300
                  ${isAdmin 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
              >
                {currentUser.Nama.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              
              {/* Tooltip on hovering collapsed avatar */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 shadow-xl hidden group-hover:block z-35 whitespace-nowrap min-w-44">
                <p className="text-xs font-bold text-slate-100">{currentUser.Nama}</p>
                <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-800/80">
                  {isAdmin ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400/10" />
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Admin</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">{currentUser.Role}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={onLogout}
          id="btn-logout-sidebar"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-white hover:bg-red-500/10 transition text-sm font-semibold
            ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="truncate">Keluar</span>}
        </button>
      </div>
    </aside>
  </>
);
}
