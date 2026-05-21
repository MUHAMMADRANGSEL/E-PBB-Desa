/**
 * Google Apps Script - Web App Sync Controller
 * E-PBB Desa Digital Sync Engine (v2.0.0)
 * 
 * SCRIPT INSTRUCTIONS:
 * 1. Buka Google Sheets baru yang ingin Anda gunakan sebagai database.
 * 2. Pada bar navigasi atas Google Sheets, klik: Extensions > Apps Script.
 * 3. Hapus seluruh kode bawaan yang ada di editor, lalu tempelkan seluruh kode ini.
 * 4. Klik ikon Simpan (Save project).
 * 5. Klik tombol "Deploy" di sudut kanan atas > pilih "New deployment".
 * 6. Klik ikon Gear di sebelah "Select type" > pilih "Web app".
 * 7. Konfigurasikan detail berikut:
 *    - Description: E-PBB Database Sync Engine
 *    - Execute as: "Me" (Email Anda)
 *    - Who has access: "Anyone" (Agar aplikasi lokal kasir dapat mengaksesnya)
 * 8. Klik "Deploy", lalu jika muncul pop-up otorisasi "Authorize Access", klik setujui izinnya.
 * 9. Salin URL "Web App URL" yang terbentuk (berakhir dengan /exec) dan tempel ke menu Sinkronisasi Cloud.
 */

// Global configuration
var REQUIRED_SHEETS = ["dusun", "rt", "periode", "subjek", "objek", "sppt", "pembayaran", "pengguna", "pengaturan"];

/**
 * Handle HTTP GET Requests (untuk ujicoba / pengujian sederhana via browser)
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Google Apps Script Engine E-PBB Online aktif dan berjalan sempurna! Gunakan metode POST untuk integrasi data.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle HTTP POST Requests (Untuk transaksi tarik dan dorong data dari portal E-PBB)
 */
function doPost(e) {
  // CORS & Preflight Response Header Safe Guard
  var response = { status: "error", message: "Aksi tidak dikenal / Request kosong" };
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Konten muatan data (POST body) kosong.");
    }

    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var payload = request.payload;
    
    // Inisialisasi Spreadsheet pasif
    var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // ----------------------------------------------------
    // ACTION CODE REDIRECTORS
    // ----------------------------------------------------
    
    // 1. Tes Koneksi (Connection Heartbeat)
    if (action === "testConnection") {
      // Inisialisasi sheet otomatis jika belum ada untuk memudahkan pengguna awal
      initializeSheetsIfMissing(spreadSheet);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Koneksi Berhasil! Basis data Google Sheets terdeteksi dan terhubung sempurna dengan portal E-PBB.",
        spreadSheetName: spreadSheet.getName(),
        sheetsCount: spreadSheet.getSheets().length
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. Tarik Data (Pull)
    if (action === "getData") {
      var tableName = payload.table;
      
      // Validasi lembar kerja
      var sheet = spreadSheet.getSheetByName(tableName);
      if (!sheet) {
        // Jika lembar kerja belum ada, kembalikan array kosong agar aplikasi tidak crash
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          table: tableName,
          data: []
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var tableData = getSheetRecords(sheet);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        table: tableName,
        data: tableData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. Kirim / Timpa Data (Push Table)
    if (action === "saveTable") {
      var tableName = payload.table;
      var tableData = payload.data; // Merupakan array of object
      
      // Dapatkan atau buat otomatis sheet jika hilang
      var sheet = spreadSheet.getSheetByName(tableName);
      if (!sheet) {
        sheet = spreadSheet.insertSheet(tableName);
      }
      
      saveRecordsToSheet(sheet, tableData);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Menyimpan " + (tableData ? tableData.length : 0) + " baris data ke tabel " + tableName + " berhasil."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. Batch Push (Save Seluruh Database Sekaligus untuk menghemat kuota koneksi)
    if (action === "saveFullDatabase") {
      var db = payload.db; // Mengandung key: dusun, rt, subjek, objek, sppt, pembayaran dll
      
      for (var k = 0; k < REQUIRED_SHEETS.length; k++) {
        var key = REQUIRED_SHEETS[k];
        if (db[key] !== undefined) {
          var targetSheet = spreadSheet.getSheetByName(key) || spreadSheet.insertSheet(key);
          saveRecordsToSheet(targetSheet, db[key]);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Sinkronisasi mutlak seluruh tabel sukses diunggah ke Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    response = { 
      status: "error", 
      message: "Terjadi kesalahan sistem Apps Script: " + error.toString() 
    };
  }
  
  // Return format output JSON mutlak
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Membaca baris tabel spreadsheet menjadi format JSON array of Object
 */
function getSheetRecords(sheet) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return []; // Hanya header saja atau kosong
  
  var headers = values[0];
  var list = [];
  
  for (var r = 1; r < values.length; r++) {
    var obj = {};
    var rowValues = values[r];
    var hasValue = false;
    
    for (var c = 0; c < headers.length; c++) {
      var colName = headers[c];
      if (colName) {
        var val = rowValues[c];
        
        // Cek paksa tipe numerik jika value berupa text angka murni
        if (typeof val === "string" && !isNaN(val) && val.trim() !== "") {
          if (val.indexOf(".") !== -1) {
            val = parseFloat(val);
          } else {
            val = parseInt(val, 10);
          }
        }
        
        obj[colName] = val;
        if (val !== undefined && val !== null && val !== "") {
          hasValue = true;
        }
      }
    }
    
    // Abaikan baris kosong yang tidak sengaja tertulis di bagian bawah
    if (hasValue) {
      list.push(obj);
    }
  }
  return list;
}

/**
 * Menyimpan array of JSON secara total melindas sheet yang ada
 */
function saveRecordsToSheet(sheet, list) {
  sheet.clear(); // Bersihkan worksheet demi menjaga konsistensi id yang terhapus tingkat client
  
  if (!list || list.length === 0) {
    return;
  }
  
  // Dapatkan seluruh header kolom unik dari silsilah JSON pertama
  var headers = Object.keys(list[0]);
  sheet.appendRow(headers); // Tulis Row 1 untuk Header nama kolom
  
  var allRows = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var row = [];
    for (var c = 0; c < headers.length; c++) {
      var cellVal = item[headers[c]];
      row.push(cellVal !== undefined && cellVal !== null ? cellVal : "");
    }
    allRows.push(row);
  }
  
  // Tulis baris sekaligus (batch writing) demi mengoptimalkan performa batasan limit runtime GAS
  if (allRows.length > 0) {
    sheet.getRange(2, 1, allRows.length, headers.length).setValues(allRows);
    
    // Rapikan garis grid agar estetis dibaca di Google Spreadsheet secara manual
    sheet.getRange(1, 1, allRows.length + 1, headers.length)
         .setBorder(true, true, true, true, true, true, "#e2e8f0", SpreadsheetApp.BorderStyle.SOLID);
         
    // Bold baris Header paling atas
    sheet.getRange(1, 1, 1, headers.length)
         .setFontWeight("bold")
         .setBackground("#f8fafc")
         .setFontColor("#1e293b");
         
    sheet.autoResizeColumns(1, headers.length);
  }
}

/**
 * Mengautomasi konfigurasi awal lembar kerja sheet jika user kesulitan
 */
function initializeSheetsIfMissing(spreadSheet) {
  for (var i = 0; i < REQUIRED_SHEETS.length; i++) {
    var sName = REQUIRED_SHEETS[i];
    var sheet = spreadSheet.getSheetByName(sName);
    if (!sheet) {
      sheet = spreadSheet.insertSheet(sName);
      
      // Buatkan default header kolom bawaan template sebagai petunjuk
      if (sName === "dusun") {
        sheet.appendRow(["id", "nama", "kepala_dusun"]);
      } else if (sName === "rt") {
        sheet.appendRow(["id", "nama", "id_dusun", "ketua_rt"]);
      } else if (sName === "periode") {
        sheet.appendRow(["tahun", "status"]);
      } else if (sName === "subjek") {
        sheet.appendRow(["nik", "nama", "alamat", "wa"]);
      } else if (sName === "objek") {
        sheet.appendRow(["nop", "nik", "id_rt", "nama_pemilik_sppt", "letak_op", "jenis_op", "klas", "njop", "luas_b", "luas_bangunan", "jumlah_pajak", "periode"]);
      } else if (sName === "sppt") {
        sheet.appendRow(["id", "nop", "tahun", "pagu", "status"]);
      } else if (sName === "pembayaran") {
        sheet.appendRow(["id", "id_sppt", "tgl", "jml", "nama_pembayar", "wa_pembayar", "metode"]);
      } else if (sName === "pengguna") {
        sheet.appendRow(["ID_User", "Nama", "Username", "Password", "Role"]);
      } else if (sName === "pengaturan") {
        sheet.appendRow(["nama_aplikasi", "nama_desa", "nama_kecamatan", "nama_kabupaten", "logo_app", "logo_desa", "gas_url"]);
      }
      
      // Percantik header kolom pertama
      sheet.getRange(1, 1, 1, sheet.getLastColumn())
           .setFontWeight("bold")
           .setBackground("#f1f5f9")
           .setFontColor("#0f172a");
    }
  }
}
