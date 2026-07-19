# Armazenamento local

Esta pasta contém o contrato de persistência do planejamento, a validação do
formato versionado, o adaptador AsyncStorage e um adaptador em memória para
testes.

- chave atual: `@saldo-do-dia/planejamento:v2`;
- chave legada: `@saldo-do-dia/planejamento:v1`;
- versão atual do documento: `2`;
- fonte persistida: somente `EntradaCalculoDiario`;
- `ResultadoCalculoDiario` é sempre recalculado;
- dados inválidos não são removidos silenciosamente.

Na primeira leitura sem v2, um documento v1 válido é migrado com IDs
determinísticos por índice, data e valor. A gravação v2 precisa terminar antes de
a remoção da chave v1 ser tentada. Quando ambas existem, v2 é a fonte preferida.

Na remoção explícita do planejamento, a chave legada é removida antes da atual.
Assim, uma falha parcial não apaga v2 enquanto v1 ainda poderia restaurar dados
antigos na próxima inicialização.

AsyncStorage não é criptografado. Não armazene senhas, tokens, credenciais ou
segredos. Os módulos de produto dependem de `ArmazenamentoPlanejamento`, e não
importam AsyncStorage diretamente.
