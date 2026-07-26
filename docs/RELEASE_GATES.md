# Gates de release

## Bloqueadores

Crash, perda de dados, cálculo incorreto, migração destrutiva, duplicação financeira, publicação antes da persistência, segredo versionado, permissão sensível injustificada, divergência financeira, corrupção automática ou export/build impossível.

## Críticos

Fluxo principal quebrado, concorrência que duplica operação, recuperação impossível, falha grave de acessibilidade, versão incorreta, persistência inconsistente ou vulnerabilidade de produção explorável.

A Release Candidate exige: nenhum bloqueador/crítico aberto; motor, persistência,
privacidade e Android aprovados; testes executáveis passando; fluxos críticos
com integração UI; 100% das branches semânticas do motor, com qualquer artefato
nominal documentado individualmente; E2E preparado. APK real, E2E real e
auditoria TalkBack são gates da etapa seguinte e não podem ser declarados
executados neste PR.

## Estado do hardening

Os gates executáveis deste PR estão atendidos: 100% das branches semânticas do
motor, zero mutante financeiro efetivo sobrevivente, matriz UI completa,
persistência/concorrência aprovadas e nenhum advisory alto alcançável no
aplicativo instalado. A autorização para iniciar a Release Candidate não
equivale à aprovação do APK; E2E real, partida fria, TalkBack e aparelhos físicos
continuam obrigatórios na etapa seguinte.
