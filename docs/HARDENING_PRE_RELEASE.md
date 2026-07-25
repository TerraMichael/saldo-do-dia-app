# Hardening profissional pré-release

- Data: 2026-07-20
- Base: `b0ceef3`
- Branch: `chore/hardening-pre-release`
- Escopo: motor, operações, armazenamento, concorrência, Android, segurança, dependências, testes, desempenho e gates.

## Linha de base

Antes das alterações: Node 24.17.0, npm 11.13.0, 273 testes em 3,15 s, lint e typecheck aprovados, Expo Doctor 18/18 e export Android aprovado (1.423 módulos; `dist` aproximado de 5,15 MB). O manifest permitia backup e expunha permissões de desenvolvimento/armazenamento. Não havia teste de UI executável, cobertura crítica, E2E preparado nem auditorias automatizadas.

## Achados e correções

| ID | Área | Severidade | Evidência | Correção | Status |
|---|---|---|---|---|---|
| HR-01 | Domínio | alto | Entradas diretas aceitavam reserva/contas negativas e gasto zero | Validação mínima no domínio e regressões | corrigido |
| HR-02 | Concorrência | crítico | Operações do Context podiam partir do mesmo snapshot | Coordenador exclusivo e leitura do último estado confirmado | corrigido |
| HR-03 | Android | alto | `allowBackup=true` para dados financeiros locais | `allowBackup=false` e auditoria automatizada | corrigido |
| HR-04 | Android | médio | Permissões não usadas no produto apareciam no manifest | `blockedPermissions` oficial e introspecção | em validação final |
| HR-05 | Testes UI | alto | A suíte inicial cobria apenas sete componentes compartilhados | 57 testes, incluindo 50 integrações com telas reais, falha, processamento e duplicidade; matriz rastreável em `UI_HARDENING_MATRIX.md` | corrigido |
| HR-06 | Supply chain | médio | Versão inicial de RNTL exigia React 19.2 | Fixada série 13.3.3 compatível | corrigido |
| HR-07 | APK | informativo | Nenhum APK permitido neste PR | E2E/roteiro preparados para próxima etapa | pendente planejado |

## Garantias implementadas

O oráculo financeiro é independente; cenários determinísticos exibem seed e entrada em divergências. O documento financeiro completo é enviado em uma única chamada AsyncStorage, sem alegar transação do sistema de arquivos. Falhas não publicam estado nem sucesso. Migrações salvam v3 antes de remover legados e corrupção não é apagada automaticamente.

## Riscos e pendências

## Resultados finais

- `npm test`: 303/303 após seis regressões da auditoria de arquivos sensíveis.
- `npm run test:ui`: 57/57 em duas execuções consecutivas sem alteração de produção entre elas.
- matriz: 720 cenários; propriedades: 1.000 casos; seed `1511853338`.
- cobertura crítica: motor com 100% statements/functions/lines, 95,45% branches
  bruto e 100% das branches semânticas. Os dois ranges artificiais estão
  demonstrados em `COVERAGE_DECISION_RECORD.md`.
- lint, typecheck, Expo Doctor (18/18), introspecção, `npm ls --all`, auditorias e export Android: aprovados.
- export: 1.424 módulos, aproximadamente 5,40 MB; único warning foi cache Metro vazio após `--clear`.
- benchmarks finais desta repetição: 1.000 gastos em 10,65 ms/1,59 MB;
  10.000 em 53,98 ms/6,63 MB. Testes adicionais cobrem 100 ciclos; tempos são
  observacionais e não gates frágeis.
- Android: apenas `INTERNET`; armazenamento, overlay e vibração bloqueados; MainActivity exportada somente para launcher/deep link `saldododia`; nenhum service, receiver ou provider do app.
- npm audit: 55 achados (11 moderados, 44 altos) na árvore completa e 46
  (11 moderados, 35 altos) com `--omit=dev`, zero críticos. Os caminhos são
  tooling de build/teste do Expo/Metro/Jest (`brace-expansion`, `postcss`,
  `tar`, `uuid`); não há entrada de conteúdo remoto não confiável nesses
  utilitários durante o uso do APK. As correções completas propostas exigem
  Expo/jest-expo 57 e são incompatíveis com o escopo SDK 54. Risco temporário
  aceito para a cadeia de build, com atualização do SDK preservada no backlog.
  A análise advisory por advisory, os caminhos e a comparação do lockfile estão
  em `DEPENDENCY_SECURITY_ASSESSMENT.md`; nenhum advisory alto é alcançável no
  aplicativo instalado.

## Mutações de sanidade

| Mutação | Teste eliminador |
|---|---|
| reserva subtraída como soma | matriz/oráculo e metamorfismos |
| `floor` por `ceil` | arredondamento e matriz |
| retirar `totalGastosHoje` do início do dia | matriz/oráculo |
| permitir `restanteHoje` negativo | propriedades/matriz |
| não devolver saldo na exclusão | inversos e expense-management |
| não ajustar saldo na edição | inversos e expense-management |
| retornar antes de salvar novo ciclo | testes de falha persistida |
| remover validação civil de data | matriz e datas inválidas |
| somar gasto antigo como gasto de hoje | propriedades/metamorfismos |
| arquivar ciclo sem gastos | cycle-history e sequência |

Uma mutação preliminar de data, que ainda preservava a validação de formato,
sobreviveu; foi corretamente classificada como mutante fraco, substituída pela
remoção efetiva e então eliminada.

## Decisão

Os dois gates executáveis anteriormente abertos foram tratados: a suíte UI
exercita componentes reais de todos os fluxos críticos e rastreia cada requisito
em `UI_HARDENING_MATRIX.md`; as duas branches nominais do c8 foram analisadas
individualmente sem `ignore` ou redução de meta. A regressão final reúne 303
testes Node e 57 testes UI em duas execuções consecutivas, além de lint,
typecheck, Doctor, introspecção, auditorias, benchmarks, validação estrutural do
Maestro e export Android. Não há bloqueador ou crítico executável aberto.

Decisão: **APROVADO PARA RELEASE CANDIDATE**. APK real, E2E real, partida fria,
TalkBack e fabricantes diversos permanecem gates da etapa seguinte e não foram
declarados executados.

Consulte também `FINANCIAL_ENGINE_SPEC.md`, `PRIVACY_DATA_MAP.md`,
`TEST_STRATEGY.md`, `UI_HARDENING_MATRIX.md`, `RELEASE_GATES.md`,
`DEPENDENCY_SECURITY_ASSESSMENT.md` e `E2E_ANDROID.md`.
