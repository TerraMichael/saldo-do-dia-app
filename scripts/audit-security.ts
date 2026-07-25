import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SENSITIVE_FILE_EXTENSIONS = new Set([
  '.jks',
  '.keystore',
  '.p12',
  '.pem',
  '.key',
]);

export function isSensitiveFilePath(filePath: string): boolean {
  const basename = path.basename(filePath.replaceAll('\\', '/')).toLowerCase();

  if (SENSITIVE_FILE_EXTENSIONS.has(path.extname(basename))) return true;
  if (basename === 'google-services.json') return true;
  if (/^service-account.*\.json$/.test(basename)) return true;
  if (basename === '.env.example') return false;

  return basename === '.env' || basename.startsWith('.env.');
}

export function listRepositoryFiles(directory = process.cwd()): string[] {
  return execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: directory, encoding: 'utf8' },
  )
    .split(/\r?\n/)
    .filter(Boolean);
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (/\.(ts|tsx|js|json)$/.test(entry.name)) files.push(target);
  }
  return files;
}

async function main() {
  const forbiddenNetwork =
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|axios|analytics|telemetry|crashlytics|admob/i;
  const findings: string[] = [];
  for (const file of [...await walk('app'), ...await walk('src')]) {
    const content = await readFile(file, 'utf8');
    if (forbiddenNetwork.test(content)) findings.push(`${file}: comunicação de rede`);
  }

  for (const file of listRepositoryFiles()) {
    if (isSensitiveFilePath(file)) {
      findings.push(`${file}: arquivo sensível`);
      continue;
    }
    if (!/\.(?:ts|tsx|js|json|md|yaml|yml)$/i.test(file)) continue;
    const content = await readFile(file, 'utf8');
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]{20,}|EXPO_TOKEN\s*=/i.test(content)) {
      findings.push(`${file}: possível segredo`);
    }
  }

  if (findings.length) {
    throw new Error(`Auditoria de segurança falhou:\n${findings.join('\n')}`);
  }
  console.log('Auditoria de segurança: nenhuma chamada de rede de produto encontrada.');
}

const executedFile = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : undefined;

if (import.meta.url === executedFile) {
  void main();
}
