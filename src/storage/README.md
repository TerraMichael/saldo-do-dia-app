# Armazenamento local

Esta pasta contém o contrato de persistência do planejamento, a validação do
formato versionado, o adaptador AsyncStorage e um adaptador em memória para
testes.

- chave: `@saldo-do-dia/planejamento:v1`;
- versão do documento: `1`;
- fonte persistida: somente `EntradaCalculoDiario`;
- `ResultadoCalculoDiario` é sempre recalculado;
- dados inválidos não são removidos silenciosamente.

AsyncStorage não é criptografado. Não armazene senhas, tokens, credenciais ou
segredos. Os módulos de produto dependem de `ArmazenamentoPlanejamento`, e não
importam AsyncStorage diretamente.
