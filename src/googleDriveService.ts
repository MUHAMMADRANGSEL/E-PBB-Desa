import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { LocalDatabase } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize firebase safely (prevent duplicate initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Drive and Spreadsheets scopes for full file lists, backup, and direct sheets synchronization
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Sync observer to track authorization state in-memory
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger official Google pop-up sign-in
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    console.warn('Sign-in process is already in progress.');
    return null;
  }
  
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code === 'auth/cancelled-popup-request' || error?.code === 'auth/popup-closed-by-user') {
      console.warn('Google Sign-In popup was cancelled by the user.');
      return null;
    }
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Helper to get or create a backup directory on Google Drive
 */
async function getOrCreateBackupFolder(accessToken: string): Promise<string | null> {
  try {
    const query = encodeURIComponent("name = 'E-PBB_Backup_Sistem' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    if (!response.ok) {
      throw new Error('Gagal mencari folder pencadangan.');
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Otherwise, create the folder
    const createResp = await fetch(
      'https://www.googleapis.com/drive/v3/files',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'E-PBB_Backup_Sistem',
          mimeType: 'application/vnd.google-apps.folder',
        }),
      }
    );

    if (!createResp.ok) {
      throw new Error('Gagal membuat folder baru di Google Drive.');
    }

    const folder = await createResp.json();
    return folder.id || null;
  } catch (err) {
    console.error('Error in getOrCreateBackupFolder:', err);
    return null;
  }
}

/**
 * Back up the full LocalDatabase model as JSON inside the folder
 */
export async function backupDatabaseToDrive(
  db: LocalDatabase,
  filename: string
): Promise<{ id: string; name: string }> {
  const token = cachedAccessToken || (await getAccessToken());
  if (!token) {
    throw new Error('Akses Google tidak diotorisasi. Sila login ulang.');
  }

  // Get or create parent folder
  const folderId = await getOrCreateBackupFolder(token);
  
  const metadata: any = {
    name: filename,
    mimeType: 'application/json',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const fileContentString = JSON.stringify(db, null, 2);
  const boundary = 'epbb_multipart_boundary_xyz';

  const multipartBody = 
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    fileContentString + '\r\n' +
    `--${boundary}--`;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal menyimpan file ke Google Drive: ${errText || response.statusText}`);
  }

  const result = await response.json();
  return { id: result.id, name: result.name };
}

/**
 * List all backup files in Google Drive
 */
export async function listBackupsFromDrive(): Promise<Array<{ id: string; name: string; createdTime: string; size: string }>> {
  const token = cachedAccessToken || (await getAccessToken());
  if (!token) {
    throw new Error('Akses Google tidak diotorisasi. Sila login ulang.');
  }

  const folderId = await getOrCreateBackupFolder(token);
  let queryStr = "name contains 'Backup_EPBB_' and trashed = false";
  if (folderId) {
    queryStr = `'${folderId}' in parents and trashed = false`;
  }

  const encodedQuery = encodeURIComponent(queryStr);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodedQuery}&fields=files(id,name,mimeType,createdTime,size)&orderBy=createdTime+desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Gagal membaca daftar file di Google Drive.');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Restore a backup file by ID
 */
export async function restoreBackupFromDrive(fileId: string): Promise<LocalDatabase> {
  const token = cachedAccessToken || (await getAccessToken());
  if (!token) {
    throw new Error('Akses Google tidak diotorisasi. Sila login ulang.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Gagal mengunduh data file cadangan dari Google Drive.');
  }

  const data = await response.json();
  
  // Basic validation check to verify if it is indeed a valid E-PBB LocalDatabase backup
  if (!data.dusun || !data.rt || !data.sppt) {
    throw new Error('Format file tidak kompatibel. Pastikan ini adalah file cadangan E-PBB.');
  }

  return data as LocalDatabase;
}

/**
 * Export specific report as TXT/CSV directly to Google Drive
 */
export async function uploadReportToDrive(
  csvContent: string,
  filename: string,
  mimeType = 'text/csv'
): Promise<{ id: string; name: string }> {
  const token = cachedAccessToken || (await getAccessToken());
  if (!token) {
    throw new Error('Akses Google tidak diotorisasi. Sila login ulang.');
  }

  const folderId = await getOrCreateBackupFolder(token);
  
  const metadata: any = {
    name: filename,
    mimeType: mimeType,
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = 'epbb_report_boundary_xyz';
  const multipartBody = 
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) + '\r\n' +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    csvContent + '\r\n' +
    `--${boundary}--`;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal mengunggah laporan ke Drive: ${errText || response.statusText}`);
  }

  const result = await response.json();
  return { id: result.id, name: result.name };
}
