# Armazenamento local

Esta pasta contém o contrato de persistência do planejamento, a validação do
formato versionado, o adaptador AsyncStorage e um adaptador em memória para
testes.

- chave atual: `@saldo-do-dia/planejamento:v3`;
- chaves legadas: `@saldo-do-dia/planejamento:v2` e `:v1`;
- versão atual do documento: `3`;
- fonte persistida: ciclo atual e ciclos encerrados no mesmo documento;
- `ResultadoCalculoDiario` é sempre recalculado;
- dados inválidos não são removidos silenciosamente.

A descrição de gasto é opcional e aditiva. Por isso o documento continua em v3:
dados anteriores sem `descricao` permanecem válidos, enquanto textos presentes
são normalizados e validados sem truncamento.

Na leitura, a prioridade é v3, v2 e v1. V2 é convertido em ciclo atual com ID
determinístico, `inicio: null` e nenhum ciclo encerrado. V1 primeiro recebe os IDs
determinísticos de gastos e então segue a mesma migração. V3 sempre é confirmada
antes de qualquer tentativa de remoção da origem.

Na remoção explícita, as chaves são removidas na ordem v1, v2 e v3.
Assim, uma falha parcial preserva a versão mais recente disponível.

AsyncStorage não é criptografado. Não armazene senhas, tokens, credenciais ou
segredos. Os módulos de produto dependem de `ArmazenamentoPlanejamento`, e não
importam AsyncStorage diretamente.

A preferência visual usa a chave independente
`@saldo-do-dia/aparencia:v1`. Falhas nessa chave usam o tema do sistema como
fallback e não bloqueiam, removem ou modificam o planejamento financeiro v3.
