import { execSync } from 'child_process';

try {
  execSync('pnpm db:migrate', { stdio: 'inherit', cwd: process.cwd() });
  console.log('Migrations applied successfully');
} catch {
  console.error('Migration failed');
  process.exit(1);
}
