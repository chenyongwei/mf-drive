import { execSync } from 'node:child_process';
import path from 'node:path';

const contractsDir = path.resolve(process.cwd(), '..', 'contracts');
execSync('npm run contract:check', { cwd: contractsDir, stdio: 'inherit' });
console.log('[drive] contract:check passed');
