# Sistema de movimento

A identidade de movimento do Saldo do Dia é rápida, estável e tranquila.
Tokens compartilhados evitam durações e deslocamentos arbitrários. Interações
comuns duram no máximo 240 ms; o feedback permanece visível por 2,2 segundos e
o ciclo contínuo do loading dura 1,8 segundo.

Toda animação acompanha um estado real. Persistência, recálculo, navegação,
erros e o botão Voltar nunca aguardam uma animação.

O comportamento global usa `ReduceMotion.System`. Com redução ativa, conteúdo
e mensagens continuam presentes, mas deslocamentos e escalas são removidos. O
símbolo do loading permanece estático.

