const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const appOutDir = context.appOutDir;

  // 1. Keep only en-US locale to eliminate ~25MB of unused language packs
  const localesDir = path.join(appOutDir, 'locales');
  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);
    for (const file of files) {
      if (file !== 'en-US.pak') {
        try {
          fs.unlinkSync(path.join(localesDir, file));
        } catch {}
      }
    }
  }

  // 2. Remove dxcompiler.dll (25.7MB DirectX 12 compiler, unneeded for standard web UI)
  const dxcompiler = path.join(appOutDir, 'dxcompiler.dll');
  if (fs.existsSync(dxcompiler)) {
    try {
      fs.unlinkSync(dxcompiler);
    } catch {}
  }

  // 3. Compact LICENSES.chromium.html (20.5MB raw html)
  const licenses = path.join(appOutDir, 'LICENSES.chromium.html');
  if (fs.existsSync(licenses)) {
    try {
      fs.writeFileSync(licenses, '<!DOCTYPE html><meta charset="utf-8"><title>Open Source Notices</title><p>EMS Desktop Application - GIET Polytechnic College</p>');
    } catch {}
  }
};
