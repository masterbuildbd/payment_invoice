import { execSync } from 'child_process';
try {
  console.log("Restoring src/pages/Dashboard.tsx...");
  execSync('git checkout -- src/pages/Dashboard.tsx');
  console.log("Success!");
} catch (e) {
  console.error("Error:", e);
}
