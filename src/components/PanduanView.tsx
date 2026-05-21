import React from 'react';
import { Book, HelpCircle, ChevronRight, Info, AlertTriangle, Lightbulb } from 'lucide-react';

export default function PanduanView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 animate-scale-in">
          <Book className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Panduan Penggunaan</h2>
          <p className="text-sm text-slate-500 font-medium">Buku Panduan E-PBB Desa Digital</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table of Contents Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" /> Daftar Isi Panduan
          </h3>
        </div>

        <div className="p-6 space-y-8">
          {/* Section 1 */}
          <section>
            <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm flex items-center justify-center font-bold">1</span>
              Memulai Aplikasi (Tarik Data/Sinkronisasi)
            </h4>
            <div className="prose prose-sm text-slate-600 max-w-none pl-9">
              <p>Untuk pertama kali menggunakan aplikasi atau memperbarui data secara menyeluruh, Anda wajib melakukan Sinkronisasi Awal dari Google Sheets.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Akses menu <strong>Integrasi Cloud Sheets</strong>.</li>
                <li>Pastikan URL Google Apps Script Anda (GAS URL) sudah terhubung dan sesuai.</li>
                <li>Tekan tombol <strong>Tarik Data (Pull)</strong> untuk mengunduh seluruh data wajib pajak dan SPPT dari Sheets ke komputer Anda.</li>
                <li>Setelah ditarik, aplikasi bisa digunakan secara offline.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm flex items-center justify-center font-bold">2</span>
              Melakukan Transaksi Pembayaran SPPT
            </h4>
            <div className="prose prose-sm text-slate-600 max-w-none pl-9">
              <p>Kasir/Petugas dapat menerima pembayaran PBB melalui menu Pembayaran & Kas.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Buka menu <strong>Pembayaran & Kas</strong>.</li>
                <li>Ketik NOP, NIK, atau Nama WP pada kolom pencarian Cerdas.</li>
                <li>Pilih SPPT yang masih berstatus Belum Bayar.</li>
                <li>Klik tombol <strong>Terima Pembayaran</strong>, masukkan jumlah uang tunai yang diterima, secara default bernilai pas sesuai tagihan.</li>
                <li>Cetak Kuitansi thermal atau kirim bukti via WhatsApp jika perlu.</li>
              </ul>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mt-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">Data yang dibayarkan di komputer ini akan tersimpan secara luring (lokal) dan disinkronisasikan ke Google Sheets jika komputer Anda terkoneksi ke Internet dan fitur Auto-Sync aktif.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm flex items-center justify-center font-bold">3</span>
              Melihat dan Mencetak Laporan
            </h4>
            <div className="prose prose-sm text-slate-600 max-w-none pl-9">
              <p>Admin dapat memantau uang masuk dan realisasi pajak lewat menu <strong>Rekap Laporan</strong>.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Laporan dapat disaring berdasarkan tanggal bayar/tutup buku.</li>
                <li>Terdapat visualisasi capaian (target vs realisasi) per dusun.</li>
                <li>Terdapat opsi untuk mencetak laporan ke format PDF di bagian kanan atas halaman laporan.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h4 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-sm flex items-center justify-center font-bold">4</span>
              Pengaturan Aplikasi & Backup
            </h4>
            <div className="prose prose-sm text-slate-600 max-w-none pl-9">
              <p>Konfigurasi nama Desa, nama Administrator, serta perbaikan data Master berada pada menu Pengaturan dan Setup.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Pengaturan Aplikasi:</strong> Mengganti Nama Aplikasi, Desa, Kecamatan, dan mengaitkan Google Apps Script.</li>
                <li>Kami menyarankan Anda untuk rutin menjadwalkan <strong>Kirim Data (Push)</strong> ke portal Google Sheets setiap usai jam kerja.</li>
              </ul>
            </div>
          </section>

        </div>
        
        <div className="px-6 py-5 bg-indigo-50 border-t border-indigo-100">
           <div className="flex items-start gap-3">
             <Lightbulb className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
             <div>
               <h5 className="font-bold text-indigo-900 text-sm">Tips Kelancaran Data</h5>
               <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                 Apabila Anda memiliki lebih dari 1 komputer/kasir (Multi-loket), sangat disarankan semua kasir melakukan "Tarik Data (Pull)" di pagi hari sebelum bertugas, dan melakukan "Kirim Data (Push)" bergantian di akhir hari, agar pembukuan Google Sheets tetap sinkron dan tidak tumpang tindih. (Proses push secara default sudah dijalankan di background oleh aplikasi setiap terjadi transaksi).
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
