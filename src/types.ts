export interface Dusun {
  id: string;
  nama: string;
  kepala_dusun: string;
  // Dynamic fields computed at runtime
  total_pagu?: number;
  total_bayar?: number;
  kekurangan?: number;
  terpenuhi?: string;
}

export interface RT {
  id: string;
  nama: string;
  id_dusun: string;
  // Dynamic fields computed at runtime
  total_pagu?: number;
  total_bayar?: number;
  kekurangan?: number;
  terpenuhi?: string;
}

export interface Periode {
  tahun: string;
  status: 'Aktif' | 'Nonaktif';
  tanggal_jatuh_tempo?: string; // New field
  // Dynamic fields computed at runtime
  total_pagu?: number;
  total_bayar?: number;
  kekurangan?: number;
  terpenuhi?: string;
}

export interface Subjek {
  id_wp?: string;
  nik: string;
  nama: string;
  wa: string;
  alamat: string;
}

export interface ObjekPajak {
  nop: string;
  nik: string;
  id_rt: string;
  nama_pemilik_sppt: string;
  letak_op: string;
  jenis_op: string; // Sawah, Darat, Pemukiman, dll
  klas: string;
  njop: number; // Nilai Jual Objek Pajak per m2
  luas_b: number; // Luas Bumi / Tanah
  luas_bangunan?: number; // Optional
  total_njop?: number; // Auto computed
  jumlah_pajak: number; // Jumlah pajak terhutang setahun
  periode: string; // Tahun pengenalan / update
}

export interface SPPT {
  id: string;
  nop: string;
  tahun: string;
  pagu: number;
  status: 'Lunas' | 'Belum Lunas';
  // Extended info computed for rendering
  nik_pemilik?: string;
  nama_wp?: string;
  nama_pemilik_sppt?: string;
  letak_op?: string;
  id_rt?: string;
  id_dusun?: string;
}

export interface Pembayaran {
  id: string;
  id_sppt: string;
  tgl: string;
  jml: number;
  nama_pembayar: string;
  wa_pembayar?: string;
  metode?: string; // Tunai, Transfer, dll
  // Joined detail
  nop?: string;
  tahun?: string;
  nama_wp?: string;
}

export interface MenuPermission {
  menuId: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Pengguna {
  ID_User: string;
  Nama: string;
  Username: string;
  Password?: string; // Stored simply in simulation
  Role: 'Admin' | 'Kolektor';
  permissions?: MenuPermission[];
}

export interface Pengaturan {
  nama_aplikasi: string;
  nama_desa: string;
  nama_kecamatan: string;
  nama_kabupaten: string;
  logo_app: string;
  logo_desa: string;
  gas_url: string;
  spreadsheet_id?: string;
  footer_text?: string;
}

export interface LocalDatabase {
  dusun: Dusun[];
  rt: RT[];
  periode: Periode[];
  subjek: Subjek[];
  objek: ObjekPajak[];
  sppt: SPPT[];
  pembayaran: Pembayaran[];
  pengguna: Pengguna[];
  pengaturan: Pengaturan;
}
