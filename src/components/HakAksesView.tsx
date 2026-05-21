import React, { useState } from 'react';
import { Pengguna, MenuPermission } from '../types';
import { ShieldCheck, Save, CheckCircle2 } from 'lucide-react';

interface HakAksesViewProps {
  pengguna: Pengguna[];
  onEdit: (updatedUser: Pengguna) => void;
}

const MENU_LIST = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'panduan', label: 'Panduan' },
  { id: 'dusun', label: 'Data Dusun' },
  { id: 'rt', label: 'Data RT' },
  { id: 'periode', label: 'Periode Pajak' },
  { id: 'subjek', label: 'Subjek Pajak (WP)' },
  { id: 'objek', label: 'Objek Pajak (OP)' },
  { id: 'sppt', label: 'Data SPPT' },
  { id: 'pembayaran', label: 'Pembayaran & Kas' },
  { id: 'laporan', label: 'Rekap Laporan' },
  { id: 'local_setup', label: 'Setup Database Lokal' },
  { id: 'cloud_sheets', label: 'Integrasi Cloud Sheets' },
  { id: 'pengguna', label: 'Pengguna & Akses' },
  { id: 'hak_akses', label: 'Hak Akses User' },
  { id: 'pengaturan', label: 'Pengaturan Aplikasi' },
];

export default function HakAksesView({ pengguna, onEdit }: HakAksesViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(pengguna[0]?.ID_User || null);

  React.useEffect(() => {
    if (!selectedUserId && pengguna.length > 0) {
      setSelectedUserId(pengguna[0].ID_User);
    }
  }, [pengguna, selectedUserId]);

  const selectedUser = pengguna.find(p => p.ID_User === selectedUserId);

  const updatePermission = (menuId: string, field: keyof MenuPermission, value: boolean) => {
    if (!selectedUser) return;

    const existingPerms = selectedUser.permissions || [];
    const permIndex = existingPerms.findIndex(p => p.menuId === menuId);

    let newPerms = [...existingPerms];
    if (permIndex === -1) {
      newPerms.push({ menuId, canView: false, canEdit: false, canDelete: false });
    }

    // Update the specific permission
    const updatedPerms = newPerms.map(p => {
        if (p.menuId === menuId) {
            return { ...p, [field]: value };
        }
        return p;
    });

    onEdit({ ...selectedUser, permissions: updatedPerms });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 fade-in text-slate-700 space-y-6">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-indigo-600" />
        Pengaturan Hak Akses User
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase">Pilih Staff</label>
          <div className="space-y-1">
            {pengguna.map(p => (
              <button
                key={p.ID_User}
                onClick={() => setSelectedUserId(p.ID_User)}
                className={`w-full text-left p-3 rounded-xl border border-slate-100 transition ${selectedUserId === p.ID_User ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}
              >
                  <p className="font-bold text-sm">{p.Nama}</p>
                  <p className="text-xs text-slate-500">{p.Role}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Formulation */}
        <div className="col-span-2 bg-slate-50 rounded-2xl p-5 border border-slate-100">
            {selectedUser ? (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-500 text-xxs font-extrabold uppercase uppercase">
                            <th className="p-3">Menu</th>
                            <th className="p-3 text-center">Lihat</th>
                            <th className="p-3 text-center">Edit</th>
                            <th className="p-3 text-center">Hapus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {MENU_LIST.map(menu => {
                            const userPerm = selectedUser.permissions?.find(p => p.menuId === menu.id) || { canView: false, canEdit: false, canDelete: false };
                            
                            return (
                                <tr key={menu.id}>
                                    <td className="p-3 text-xs font-bold">{menu.label}</td>
                                    <td className="p-3 text-center">
                                        <input type="checkbox" checked={userPerm.canView} onChange={(e) => updatePermission(menu.id, 'canView', e.target.checked)} />
                                    </td>
                                    <td className="p-3 text-center">
                                        <input type="checkbox" checked={userPerm.canEdit} onChange={(e) => updatePermission(menu.id, 'canEdit', e.target.checked)} />
                                    </td>
                                    <td className="p-3 text-center">
                                        <input type="checkbox" checked={userPerm.canDelete} onChange={(e) => updatePermission(menu.id, 'canDelete', e.target.checked)} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="text-center text-slate-400 p-10">Pilih user untuk mengatur hak akses</div>
            )}
        </div>
      </div>
    </div>
  );
}
