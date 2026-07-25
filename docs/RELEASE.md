# Versão e release

A primeira publicação Android do Saldo do Dia usa:

- versão pública: `1.0.0`;
- release Android (`versionCode`): `1`;
- assinatura de marca: `Powered by Leahcim`.

`expo.version` e `package.json.version` devem permanecer sincronizados e seguir
Semantic Versioning:

- correção compatível incrementa PATCH, como `1.0.1`;
- nova funcionalidade compatível incrementa MINOR, como `1.1.0`;
- mudança incompatível incrementa MAJOR, como `2.0.0`.

O `android.versionCode` é um inteiro positivo interno da publicação. Ele deve
aumentar em todo novo envio Android e não pode ser reutilizado depois que uma
release é enviada à loja. A versão pública e a release possuem objetivos
diferentes; por isso uma versão pública pode ter mais de uma release interna.
Por exemplo: versão `1.0.1`, release `2`.

O projeto está vinculado ao EAS somente para validação da Release Candidate.
`eas.json` possui exclusivamente o perfil `preview`, com distribuição interna e
APK Android. Não existe perfil de produção ou submissão, auto incremento,
`ios.buildNumber`, canal de atualização ou credencial versionada. O vínculo usa
o proprietário `michaelterra`; segredos e keystore permanecem gerenciados fora
do repositório.

Leahcim é a assinatura de marca atual do produto e não representa, neste
repositório, a declaração de uma entidade jurídica registrada.
