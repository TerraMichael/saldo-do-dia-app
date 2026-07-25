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

const SECRET_CONTENT =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._-]{20,}|EXPO_TOKEN[ \t]*=[ \t]*(?:"[A-Za-z0-9._-]{20,}"|'[A-Za-z0-9._-]{20,}'|[A-Za-z0-9._-]{20,})/i;

export function isSensitiveFilePath(filePath: string): boolean {
  const basename = path.basename(filePath.replaceAll('\\', '/')).toLowerCase();

  if (SENSITIVE_FILE_EXTENSIONS.has(path.extname(basename))) return true;
  if (basename === 'google-services.json') return true;
  if (/^service-account.*\.json$/.test(basename)) return true;
  if (basename === '.env.example') return false;

  return basename === '.env' || basename.startsWith('.env.');
}

export function parseGitFileList(output: string): string[] {
  return output.split('\0').filter(Boolean);
}

export function listRepositoryFiles(directory = process.cwd()): string[] {
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: directory, encoding: 'utf8' },
  );

  return parseGitFileList(output);
}

function decodeTextFile(content: Buffer): string | null {
  if (content.length === 0) return '';

  if (content[0] === 0xff && content[1] === 0xfe) {
    return content.subarray(2).toString('utf16le');
  }
  if (content[0] === 0xfe && content[1] === 0xff) {
    const bytes = content.subarray(2);
    if (bytes.length % 2 !== 0) return null;
    const littleEndian = Buffer.allocUnsafe(bytes.length);
    for (let index = 0; index < bytes.length; index += 2) {
      littleEndian[index] = bytes[index + 1];
      littleEndian[index + 1] = bytes[index];
    }
    return littleEndian.toString('utf16le');
  }
  if (content.includes(0)) return null;

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(content);
  } catch {
    // A codificação inválida, isoladamente, não prova que o arquivo é binário.
    // Latin-1 preserva sequências ASCII de possíveis segredos para inspeção.
    return content.toString('latin1');
  }
}

export async function findRepositorySecretFindings(
  directory = process.cwd(),
): Promise<string[]> {
  const findings: string[] = [];

  for (const file of listRepositoryFiles(directory)) {
    if (isSensitiveFilePath(file)) {
      findings.push(`${file}: arquivo sensível`);
      continue;
    }

    const content = decodeTextFile(await readFile(path.join(directory, file)));
    if (content !== null && SECRET_CONTENT.test(content)) {
      findings.push(`${file}: possível segredo`);
    }
  }

  return findings;
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

  findings.push(...await findRepositorySecretFindings());

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
