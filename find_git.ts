import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

let current = process.cwd();
while (current !== '/') {
  if (fs.existsSync(path.join(current, '.git'))) {
    console.log("Found .git in:", current);
    try {
      const status = execSync(`git -C ${current} status`, { encoding: 'utf8' });
      console.log("Status:", status);
    } catch(e: any) {
      console.log("Error status:", e.message);
    }
  }
  current = path.dirname(current);
}
console.log("Git search done.");
