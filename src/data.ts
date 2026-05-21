import { LocalDatabase, Dusun, RT, Periode, Subjek, ObjekPajak, SPPT, Pembayaran, Pengguna, Pengaturan } from './types';

// Seed Initial Data
export const INITIAL_DUSUN: Dusun[] = [];

export const INITIAL_RT: RT[] = [];

export const INITIAL_PERIODE: Periode[] = [
  { tahun: new Date().getFullYear().toString(), status: "Aktif" }
];

export const INITIAL_SUBJEK: Subjek[] = [];

export const INITIAL_OBJEK: ObjekPajak[] = [];

export const INITIAL_SPPT: SPPT[] = [];

export const INITIAL_PEMBAYARAN: Pembayaran[] = [];

export const INITIAL_PENGGUNA: Pengguna[] = [
  { ID_User: "U001", Nama: "Administrator Desa", Username: "admin", Password: "admin", Role: "Admin" }
];

export const INITIAL_PENGATURAN: Pengaturan = {
  nama_aplikasi: "E-PBB",
  nama_desa: "",
  nama_kecamatan: "",
  nama_kabupaten: "",
  logo_app: "",
  logo_desa: "",
  gas_url: "",
  spreadsheet_id: ""
};

const DATABASE_KEY = 'epbb_desa_localdb';

// Simple direct Google Apps Script fetch function if configured
async function runGasApi(url: string, action: string, payload: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ action, payload })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to fetch from Google Apps Script Web App:", error);
    throw new Error("Gagal terhubung ke Google Sheets API: " + (error as Error).message);
  }
}

export class DatabaseManager {
  private db: LocalDatabase;

  constructor() {
    this.db = this.loadFromStorage();
  }

  private loadFromStorage(): LocalDatabase {
    const data = localStorage.getItem(DATABASE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data) as LocalDatabase;
        // Make sure all arrays and configs are safe
        return {
          dusun: parsed.dusun || INITIAL_DUSUN,
          rt: parsed.rt || INITIAL_RT,
          periode: parsed.periode || INITIAL_PERIODE,
          subjek: parsed.subjek || INITIAL_SUBJEK,
          objek: parsed.objek || INITIAL_OBJEK,
          sppt: parsed.sppt || INITIAL_SPPT,
          pembayaran: parsed.pembayaran || INITIAL_PEMBAYARAN,
          pengguna: parsed.pengguna || INITIAL_PENGGUNA,
          pengaturan: parsed.pengaturan || INITIAL_PENGATURAN
        };
      } catch (e) {
        console.error("Failed to parse database, resetting to seed data", e);
      }
    }
    
    // Seed and persist if not existing
    const defaultDb: LocalDatabase = {
      dusun: INITIAL_DUSUN,
      rt: INITIAL_RT,
      periode: INITIAL_PERIODE,
      subjek: INITIAL_SUBJEK,
      objek: INITIAL_OBJEK,
      sppt: INITIAL_SPPT,
      pembayaran: INITIAL_PEMBAYARAN,
      pengguna: INITIAL_PENGGUNA,
      pengaturan: INITIAL_PENGATURAN
    };
    localStorage.setItem(DATABASE_KEY, JSON.stringify(defaultDb));
    return defaultDb;
  }

  private saveToStorage() {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(this.db));
  }

  // Set All data at once (from import or sheets load)
  public setAll(newDb: LocalDatabase) {
    this.db = { ...newDb };
    this.saveToStorage();
  }

  public resetToDefault() {
    this.db = {
      dusun: [...INITIAL_DUSUN],
      rt: [...INITIAL_RT],
      periode: [...INITIAL_PERIODE],
      subjek: [...INITIAL_SUBJEK],
      objek: [...INITIAL_OBJEK],
      sppt: [...INITIAL_SPPT],
      pembayaran: [...INITIAL_PEMBAYARAN],
      pengguna: [...INITIAL_PENGGUNA],
      pengaturan: { ...INITIAL_PENGATURAN }
    };
    this.saveToStorage();
  }

  public getDatabase(): LocalDatabase {
    return this.db;
  }

  // Tables access
  public getTable<T extends keyof LocalDatabase>(table: T): LocalDatabase[T] {
    return this.db[table];
  }

  // Update table row or insert
  public writeRow<T extends keyof LocalDatabase>(table: T, row: any, idKey: string): boolean {
    const list = this.db[table] as any[];
    if (!list) return false;

    const idx = list.findIndex(r => r[idKey] === row[idKey]);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...row };
    } else {
      list.push(row);
    }
    this.saveToStorage();
    return true;
  }

  // Deletion helper
  public deleteRow<T extends keyof LocalDatabase>(table: T, value: string, idKey: string): boolean {
    const list = this.db[table] as any[];
    if (!list) return false;

    const initialLen = list.length;
    this.db[table] = list.filter(r => r[idKey] !== value) as any;
    
    if (list.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Custom API wrapper that supports local execution or remote API execution
  public async executeAction(action: string, payload: any = {}): Promise<any> {
    const gasUrl = this.db.pengaturan.gas_url;
    
    // If a Google Apps Script is provided, bypass local storage for real-time reads!
    if (gasUrl && gasUrl.trim() !== '') {
      try {
        const response = await runGasApi(gasUrl, action, payload);
        if (response.status === 'success') {
          // If it's a bulk read, we might want to mirror it to local cache for fast lookup!
          if (action === 'getData' && payload.table) {
            this.db[payload.table as keyof LocalDatabase] = response.data;
            this.saveToStorage();
          }
          return response.data;
        } else {
          throw new Error(response.message || "Gagal memproses dengan Google Sheets");
        }
      } catch (err: any) {
        console.warn("GAS execution failed, falling back to local action. Error:", err.message);
        // Fallback to local implementation so the app never breaks!
      }
    }

    // Local simulation logic fallback
    switch (action) {
      case 'getSettings':
        return this.db.pengaturan;

      case 'login': {
        const { user, pass } = payload;
        const matchingUser = this.db.pengguna.find(p => p.Username === user && p.Password === pass);
        if (matchingUser) {
          // Return user without password for privacy
          const { Password, ...safeUser } = matchingUser;
          return safeUser;
        }
        throw new Error("Username atau password salah!");
      }

      case 'searchPublic': {
        const { nop } = payload;
        const spps = this.db.sppt.filter(s => s.nop === nop);
        if (spps.length === 0) {
          throw new Error("Nomor Objek Pajak (NOP) tidak ditemukan!");
        }
        
        // Find owner details
        const obj = this.db.objek.find(o => o.nop === nop);
        const sub = obj ? this.db.subjek.find(s => s.nik === obj.nik) : null;
        
        return spps.map(s => ({
          id: s.id,
          tahun: s.tahun,
          pagu: s.pagu,
          status: s.status,
          nama_wp: sub ? sub.nama : (obj ? obj.nama_pemilik_sppt : "-")
        }));
      }

      case 'getData': {
        const { table } = payload;
        return this.db[table as keyof LocalDatabase] || [];
      }

      case 'getDashboard': {
        const { tahun } = payload;
        const activeTahun = tahun || this.db.periode.find(p => p.status === 'Aktif')?.tahun || '2026';
        
        const targetSPPTs = this.db.sppt.filter(s => !activeTahun || s.tahun === activeTahun);
        
        const total_sppt = targetSPPTs.length;
        const terbayar = targetSPPTs.filter(s => s.status === 'Lunas').length;
        const terhutang = total_sppt - terbayar;
        
        const total_pagu = targetSPPTs.reduce((acc, s) => acc + s.pagu, 0);
        const pagu_terbayar = targetSPPTs.filter(s => s.status === 'Lunas').reduce((acc, s) => acc + s.pagu, 0);
        const pagu_terhutang = total_pagu - pagu_terbayar;
        
        const jml_dusun = this.db.dusun.length;
        const jml_rt = this.db.rt.length;

        return {
          total_sppt,
          terbayar,
          terhutang,
          total_pagu,
          pagu_terbayar,
          pagu_terhutang,
          jml_dusun,
          jml_rt
        };
      }

      default:
        throw new Error(`Aksi "${action}" tidak dikenal!`);
    }
  }
}

export const dbManager = new DatabaseManager();
export default dbManager;
