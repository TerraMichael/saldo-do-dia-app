# ADR-001 — Local-first com futura sincronização em nuvem

## Status

Accepted

## Contexto

O Saldo do Dia funciona atualmente de forma local-first e offline. Os dados
financeiros e demais entidades persistentes são armazenados no dispositivo, e o
aplicativo não possui backend, conta de usuário ou sincronização em nuvem.

No futuro, o produto poderá evoluir, nesta ordem, para conta opcional, migração
explícita dos dados locais, backup em nuvem, restauração em outro dispositivo e,
somente depois, sincronização contínua. Usuários existentes deverão poder migrar
os dados locais já armazenados para uma conta sem perder seu histórico, mas
também poderão continuar utilizando o aplicativo localmente na primeira
implementação dessa evolução.

## Decisão

Backend, login e sincronização não serão implementados neste momento. O
aplicativo continuará funcionando localmente e offline.

Novas estruturas persistentes deverão ser projetadas com identidade estável e
evolução segura de schema, permitindo uma futura migração dos dados locais. Essa
migração e qualquer envio para uma conta somente poderão ocorrer após
consentimento informado e explícito do usuário. Não poderá haver upload
silencioso de dados.

## Consequências

- Enquanto essa evolução não ocorrer, o armazenamento local permanece como a
  única fonte de verdade.
- Futuras migrations devem preservar dados e compatibilidade com instalações
  existentes.
- A introdução de nuvem não deve exigir a reconstrução desnecessária de toda a
  camada de dados.
- Sempre que tecnicamente viável, o aplicativo deverá continuar utilizável
  offline mesmo depois da introdução de recursos de nuvem.
- Recursos de sincronização exigirão decisões próprias sobre conflitos,
  exclusões, idempotência, segurança e privacidade.
- A definição da fonte de verdade após a introdução da nuvem exigirá uma nova
  ADR.
- A sincronização contínua não poderá ser implementada antes da definição das
  regras de conflitos e exclusões.

## Diretrizes para desenvolvimento futuro

- Usar identificadores estáveis e permanentes para entidades persistidas.
- Versionar schemas e fornecer migrations seguras para mudanças incompatíveis.
- Não depender de posições ou índices de arrays como identidade de registros.
- Preservar IDs e dados existentes durante edições, arquivamentos e migrations.
- Projetar novos dados persistidos de modo que seja possível reconhecer se um
  registro local corresponde ao mesmo registro em um serviço futuro.
- Não antecipar `userId`, estado de sincronização, timestamps, tombstones ou
  outros campos de backend sem uma necessidade atual e uma semântica definida.
- Exigir consentimento informado e explícito antes de migrar ou enviar dados
  locais para uma conta ou serviço remoto, sem upload silencioso.
- Manter a conta opcional e preservar o uso exclusivamente local na primeira
  implementação dessa evolução.
- Preservar a experiência local-first e a operação offline sempre que possível.
