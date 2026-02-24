import { execSync } from 'node:child_process';
import path from 'node:path';

const contractsDir = path.resolve(process.cwd(), '..', 'contracts');
execSync('npm run contract:test', { cwd: contractsDir, stdio: 'inherit' });
console.log('[drive] contract:test passed');
