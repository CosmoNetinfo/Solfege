const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(__dirname, '../app/api');
const apiTempPath = path.join(__dirname, '../api_temp');
const superadminPath = path.join(__dirname, '../app/(superadmin)');
const superadminTempPath = path.join(__dirname, '../superadmin_temp');
const invitePath = path.join(__dirname, '../app/(auth)/accept-invite');
const inviteTempPath = path.join(__dirname, '../accept-invite_temp');
const actionsDir = path.join(__dirname, '../app/actions');

console.log('Preparing Tauri static export build...');

// Safety check: if a previous build was interrupted, restore the folders first
if (!fs.existsSync(apiPath) && fs.existsSync(apiTempPath)) {
  fs.renameSync(apiTempPath, apiPath);
  console.log('[SAFETY] Restored app/api from interrupted previous build');
}
if (!fs.existsSync(superadminPath) && fs.existsSync(superadminTempPath)) {
  fs.renameSync(superadminTempPath, superadminPath);
  console.log('[SAFETY] Restored app/(superadmin) from interrupted previous build');
}
if (!fs.existsSync(invitePath) && fs.existsSync(inviteTempPath)) {
  fs.renameSync(inviteTempPath, invitePath);
  console.log('[SAFETY] Restored app/(auth)/accept-invite from interrupted previous build');
}

let apiMoved = false;
let superadminMoved = false;
let inviteMoved = false;
let backupContents = {};


const mocks = {
  'email-actions.ts': `
    export async function sendWelcomeEmail(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
    export async function sendPaymentReminder(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
    export async function sendCredenziali(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
    export async function sendNuoveCredenziali(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
  `,
  'portal-actions.ts': `
    export async function inviteStudent(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
  `,
  'public-actions.ts': `
    export async function registerPublicStudent(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
  `,
  'teacher-actions.ts': `
    export async function createTeacherWithAccess(...args: any[]): Promise<any> { return { success: true, message: '', error: null, teacher: { id: '' } }; }
    export async function inviteExistingTeacher(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
    export async function resetTeacherPassword(...args: any[]): Promise<any> { return { success: true, message: '', error: null }; }
    export async function deleteTeacher(...args: any[]): Promise<any> { return { success: true, error: null }; }
  `,
  'user-actions.ts': `
    export async function deleteStaffUser(...args: any[]): Promise<any> { return { success: true, error: null }; }
    export async function updateUserRole(...args: any[]): Promise<any> { return { success: true, error: null }; }
  `
};

try {
  // 1. Move API directory outside app folder
  if (fs.existsSync(apiPath)) {
    fs.renameSync(apiPath, apiTempPath);
    apiMoved = true;
    console.log('Temporarily moved app/api to root api_temp');
  }

  // 2. Move (superadmin) group directory outside app folder
  if (fs.existsSync(superadminPath)) {
    fs.renameSync(superadminPath, superadminTempPath);
    superadminMoved = true;
    console.log('Temporarily moved app/(superadmin) to root superadmin_temp');
  }

  // 3. Move accept-invite page outside app folder (not used in desktop, avoids Supabase client init crash during static build)
  if (fs.existsSync(invitePath)) {
    fs.renameSync(invitePath, inviteTempPath);
    inviteMoved = true;
    console.log('Temporarily moved app/(auth)/accept-invite to root accept-invite_temp');
  }

  // 4. Mock app/actions to remove server-side node dependencies and "use server" directives
  if (fs.existsSync(actionsDir)) {
    const files = fs.readdirSync(actionsDir);
    for (const file of files) {
      if (mocks[file]) {
        const filePath = path.join(actionsDir, file);
        const originalContent = fs.readFileSync(filePath, 'utf8');
        backupContents[filePath] = originalContent;
        fs.writeFileSync(filePath, mocks[file], 'utf8');
        console.log(`Temporarily mocked app/actions/${file}`);
      }
    }
  }

  // Run next build with TAURI_BUILD=true
  console.log('Running Next.js build...');
  execSync('npx next build', {
    env: { ...process.env, TAURI_BUILD: 'true' },
    stdio: 'inherit'
  });
  console.log('Next.js static export build completed successfully.');
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
} finally {
  // 1. Restore API directory
  if (apiMoved && fs.existsSync(apiTempPath)) {
    fs.renameSync(apiTempPath, apiPath);
    console.log('Restored app/api from root api_temp');
  }

  // 2. Restore (superadmin) group directory
  if (superadminMoved && fs.existsSync(superadminTempPath)) {
    fs.renameSync(superadminTempPath, superadminPath);
    console.log('Restored app/(superadmin) from root superadmin_temp');
  }

  // 3. Restore accept-invite page
  if (inviteMoved && fs.existsSync(inviteTempPath)) {
    fs.renameSync(inviteTempPath, invitePath);
    console.log('Restored app/(auth)/accept-invite from root accept-invite_temp');
  }

  // 4. Restore actions contents
  for (const [filePath, content] of Object.entries(backupContents)) {
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Restored original content of: app/actions/${path.basename(filePath)}`);
    }
  }
}
