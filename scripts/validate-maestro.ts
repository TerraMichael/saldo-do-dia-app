import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const directory = path.resolve('.maestro');
  const files = (await readdir(directory))
    .filter((file) => file.endsWith('.yaml'))
    .sort();

  if (files.length !== 7) {
    throw new Error(`Esperados 7 fluxos Maestro; encontrados ${files.length}.`);
  }

  for (const file of files) {
    const content = await readFile(path.join(directory, file), 'utf8');
    if (!content.startsWith('appId: com.terramichael.saldododia\n---\n')) {
      throw new Error(`${file}: appId ou separador inicial inválido.`);
    }
    if (!content.includes('- launchApp')) {
      throw new Error(`${file}: fluxo não inicia o aplicativo.`);
    }
  }

  console.log(`Maestro: ${files.length} fluxos com estrutura básica válida.`);
}

void main();
