import { execSync } from 'node:child_process';

const raw = execSync('npx expo config --type introspect --json', {
  encoding: 'utf8',
});
const config = JSON.parse(raw);
const manifest = config._internal.modResults.android.manifest.manifest;
const entries: { $: { 'android:name': string; 'tools:node'?: string } }[] =
  manifest['uses-permission'] ?? [];
const permissions = entries
  .filter((entry) => entry.$['tools:node'] !== 'remove')
  .map((entry) => entry.$['android:name']);
const blocked = entries
  .filter((entry) => entry.$['tools:node'] === 'remove')
  .map((entry) => entry.$['android:name']);
const application = manifest.application?.[0]?.$ ?? manifest.application?.$;

if (application?.['android:allowBackup'] !== 'false') {
  throw new Error('android:allowBackup não está desativado no manifest final.');
}
const sensitive = permissions.filter((permission) =>
  /CAMERA|RECORD_AUDIO|CONTACTS|LOCATION|SMS|CALL_PHONE|CALENDAR|NOTIFICATION|EXTERNAL_STORAGE/.test(permission),
);
if (sensitive.length) {
  throw new Error(`Permissões sensíveis inesperadas: ${sensitive.join(', ')}`);
}
console.log(`Permissões finais: ${permissions.join(', ') || 'nenhuma'}`);
console.log(`Permissões bloqueadas: ${blocked.join(', ') || 'nenhuma'}`);
console.log('Backup Android desativado e nenhuma permissão sensível encontrada.');
