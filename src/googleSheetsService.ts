import { getAccessToken } from './googleDriveService';
import { LocalDatabase } from './types';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
}

const REQUIRED_SHEETS = ["dusun", "rt", "periode", "subjek", "objek", "sppt", "pembayaran", "pengguna", "pengaturan"];

const SHEET_HEADERS: Record<string, string[]> = {
  dusun: ["id", "nama", "kepala_dusun"],
  rt: ["id", "nama", "id_dusun"],
  periode: ["tahun", "status"],
  subjek: ["nik", "nama", "alamat", "wa"],
  objek: ["nop", "nik", "id_rt", "nama_pemilik_sppt", "letak_op", "jenis_op", "klas", "njop", "luas_b", "luas_bangunan", "jumlah_pajak", "periode"],
  sppt: ["id", "nop", "tahun", "pagu", "status"],
  pembayaran: ["id", "id_sppt", "tgl", "jml", "nama_pembayar", "wa_pembayar", "metode"],
  pengguna: ["ID_User", "Nama", "Username", "Password", "Role"],
  pengaturan: ["nama_aplikasi", "nama_desa", "nama_kecamatan", "nama_kabupaten", "logo_app", "logo_desa", "gas_url"]
};

// Search for existing PBB Spreadsheets created in Drive
export async function listSpreadsheets(accessToken: string): Promise<SpreadsheetInfo[]> {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'E-PBB' and trashed = false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&orderBy=createdTime+desc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gagal mencari Spreadsheet di Drive: ${err}`);
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    url: `https://docs.google.com/spreadsheets/d/${f.id}/edit`
  }));
}

// Create a new Spreadsheet with defined tables
export async function createPbbSpreadsheet(accessToken: string, filename: string): Promise<SpreadsheetInfo> {
  // First, create the basic spreadsheet
  const createResp = await fetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: filename,
        },
      }),
    }
  );

  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Gagal membuat spreadsheet baru: ${err}`);
  }

  const spreadsheet = await createResp.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // Let's create the required worksheets inside this spreadsheet using batchUpdate
  const requests = REQUIRED_SHEETS.map(sheetName => ({
    addSheet: {
      properties: {
        title: sheetName,
      }
    }
  }));

  // Also we want to delete 'Sheet1' (default sheet created by Google) if it exists, to keep it clean
  // But we must do it after we add sheets, because a spreadsheet must have at least one sheet.
  const batchResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests })
    }
  );

  if (!batchResp.ok) {
    console.warn('Batch add sheets failed, attempting fallback operations.', await batchResp.text());
  }

  // Set up headers for all worksheets
  for (const sheetName of REQUIRED_SHEETS) {
    const headers = SHEET_HEADERS[sheetName];
    await writeSheetValues(accessToken, spreadsheetId, `${sheetName}!A1`, [headers]);
  }

  // Format the headers to bold
  try {
    const formatRequests = REQUIRED_SHEETS.map((sheetName, index) => ({
      repeatCell: {
        range: {
          sheetId: index + 1, // Sheets are added in index sequence 1, 2, ...
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: SHEET_HEADERS[sheetName].length
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            },
            backgroundColor: {
              red: 0.95,
              green: 0.96,
              blue: 0.98
            }
          }
        },
        fields: "userEnteredFormat(textFormat,backgroundColor)"
      }
    }));

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: formatRequests })
      }
    );
  } catch (e) {
    console.warn('Formatting spreadsheet headers failed silently', e);
  }

  return {
    id: spreadsheetId,
    name: filename,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
  };
}

// Clear a specific worksheet
export async function clearSheet(accessToken: string, spreadsheetId: string, range: string) {
  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    }
  );
  if (!resp.ok) {
    throw new Error(`Gagal membersihkan data sheet ${range}: ${resp.statusText}`);
  }
}

// Write values to a range
export async function writeSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
) {
  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values
      })
    }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gagal mengupdate data sheet ${range}: ${errText}`);
  }
}

// Read values from a range
export async function readSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!resp.ok) {
    // If the sheet model fails or is empty, we handle gracefully
    return [];
  }

  const data = await resp.json();
  return data.values || [];
}

// Add a worksheet if it doesn't exist
export async function ensureSheetExists(accessToken: string, spreadsheetId: string, sheetName: string) {
  try {
    // Try to get sheet values to check if it exists
    await readSheetValues(accessToken, spreadsheetId, `${sheetName}!A1:A1`);
  } catch (e) {
    // If it fails, assume it doesn't exist and attempt to add it
    const resp = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
              }
            }
          }]
        })
      }
    );
    if (!resp.ok) {
      throw new Error(`Gagal membuat sheet ${sheetName}: ${await resp.text()}`);
    }
    
    // After adding the sheet, add the headers!
    const headers = SHEET_HEADERS[sheetName];
    if (headers) {
      await writeSheetValues(accessToken, spreadsheetId, `${sheetName}!A1`, [headers]);
    }
  }
}

// Push local database entirely to a spreadsheet
export async function pushDatabaseToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  db: LocalDatabase
): Promise<void> {
  for (const sheetName of REQUIRED_SHEETS) {
    let list = (db as any)[sheetName];
    if (sheetName === 'pengaturan' && list && !Array.isArray(list)) {
      list = [list];
    }
    // Ensure the sheet exists first
    await ensureSheetExists(accessToken, spreadsheetId, sheetName);

    const headers = SHEET_HEADERS[sheetName];
    
    // First clear existing data from row 2 downwards
    try {
      await clearSheet(accessToken, spreadsheetId, `${sheetName}!A2:Z10000`);
    } catch {
      // Ignored if range is empty
    }

    if (!list || list.length === 0) {
      continue;
    }

    // Convert objects to rows based on correct headers
    const rows = list.map((item: any) => {
      return headers.map(h => {
        const val = item[h];
        if (val === undefined || val === null) return "";
        
        // Prevent floating-point conversions or leading zeros drops for critical string IDs
        if (h === 'nik' || h === 'nop' || h === 'wa' || h === 'wa_pembayar') {
          return `'${val}`;
        }
        return val;
      });
    });

    // Write headers and rows sequentially
    await writeSheetValues(accessToken, spreadsheetId, `${sheetName}!A2`, rows);
  }
}

// Pull database from spreadsheet
export async function pullDatabaseFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  currentSettings: any
): Promise<LocalDatabase> {
  const pulledDb: any = {};

  for (const sheetName of REQUIRED_SHEETS) {
    const rows = await readSheetValues(accessToken, spreadsheetId, `${sheetName}!A1:Z10000`);
    if (rows.length <= 1) {
      // Empty or only has header
      pulledDb[sheetName] = [];
      continue;
    }

    const headers = rows[0].map(h => String(h).trim());
    const list: any[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const obj: any = {};
      let hasValue = false;

      for (let c = 0; c < headers.length; c++) {
        const headerName = headers[c];
        let val = row[c];
        
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          hasValue = true;
          // Trim leading single quote used to preserve formatting
          if (typeof val === 'string' && val.startsWith("'")) {
            val = val.substring(1);
          }
          
          // Cast numbers where applicable
          const lc = headerName.toLowerCase();
          if (
            typeof val === 'string' &&
            !isNaN(Number(val)) &&
            lc !== 'nik' && lc !== 'nop' && lc !== 'id' && lc !== 'id_rt' && lc !== 'id_dusun' && lc !== 'id_sppt' && lc !== 'wa' && lc !== 'wa_pembayar'
          ) {
            val = val.indexOf('.') !== -1 ? parseFloat(val) : parseInt(val, 10);
          }
          obj[headerName] = val;
        } else {
          obj[headerName] = "";
        }
      }

      if (hasValue) {
        list.push(obj);
      }
    }

    pulledDb[sheetName] = list;
  }

  // Safeguards
  if (!pulledDb.pengguna || pulledDb.pengguna.length === 0) {
    pulledDb.pengguna = [{ ID_User: "U001", Nama: "Administrator Desa", Username: "admin", Password: "admin", Role: "Admin" }];
  }
  if (!pulledDb.periode || pulledDb.periode.length === 0) {
    pulledDb.periode = [{ tahun: "2026", status: "Aktif" }];
  }
  if (!pulledDb.pengaturan || pulledDb.pengaturan.length === 0) {
    pulledDb.pengaturan = { ...currentSettings };
  } else {
    // Preserve local gas_url if already configured
    pulledDb.pengaturan = {
      ...currentSettings,
      ...pulledDb.pengaturan[0]
    };
  }

  return pulledDb as LocalDatabase;
}
