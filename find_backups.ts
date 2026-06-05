import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("Searching for backup of Dashboard.tsx...");

function searchDir(dir: string) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!fullPath.includes('node_modules') && !fullPath.includes('.npm') && !fullPath.includes('.cache')) {
            searchDir(fullPath);
          }
        } else if (file.toLowerCase().includes('dashboard') && file.endsWith('.tsx') && fullPath !== '/app/applet/src/pages/Dashboard.tsx') {
          console.log("Found possible backup:", fullPath, stat.size, stat.mtime);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

searchDir('/app');
searchDir('/tmp');
console.log("Search complete.");
