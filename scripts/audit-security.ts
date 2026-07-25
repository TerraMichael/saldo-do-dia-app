import { readdir, readFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import path from 'node:path';

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
  const repositoryFiles = execSync(
    'git ls-files --cached --others --exclude-standard',
    { encoding: 'utf8' },
  )
    .split(/\r?\n/)
    .filter(Boolean);
  for (const file of repositoryFiles) {
    if (/\.(?:jks|keystore|p12|pem|key)$/i.test(file) ||
        /(?:google-services\.json|service-account.*\.json|^|\/)\.env(?:\.|$)/i.test(file)) {
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

void main();
