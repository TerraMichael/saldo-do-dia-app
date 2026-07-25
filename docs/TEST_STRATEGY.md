# Estratégia de testes

- `npm test`: testes Node de domínio, persistência, presenters, configuração, segurança e regressão.
- `npm run test:financial-matrix`: oráculo independente, matriz determinística e propriedades.
- `npm run test:coverage`: cobertura nativa do Node para módulos financeiros críticos.
- `npm run test:ui`: 56 testes Jest Expo/Testing Library: sete contratos
  compartilhados e 49 integrações comportamentais com telas reais de
  apresentação/onboarding, Home, registro, edição, exclusão, novo ciclo,
  tutorial e Configurações.
- `npm run benchmark`: volumes de 1.000/10.000 gastos e 100 ciclos, sem limite frágil de tempo.
- `npm run audit:security` e `npm run audit:android`: rede/logs e configuração Android.
- `npm run validate:e2e` ou `npm run validate:maestro`: validação estrutural dos fluxos Maestro.

Seeds são fixas e podem ser reproduzidas. O oráculo não importa a implementação do cálculo. Testes visuais, TalkBack e E2E reais exigem APK instalado; os YAMLs não substituem essa execução.

O checklist manual do APK deve cobrir instalação limpa, migrações, falha de gravação, temas, fonte aumentada, Reduzir movimento, TalkBack, retorno do background, muitos gastos e todos os fluxos Maestro.

Router, AsyncStorage e APIs nativas são falsos somente nas fronteiras. O Jest
não substitui medições físicas do tour, teclado/DatePicker nativo, partida fria,
TalkBack ou execução no APK; esses itens permanecem na etapa seguinte.

A matriz requisito por requisito e o teste que fornece cada evidência ficam em
`UI_HARDENING_MATRIX.md`. Sucesso, falha, processamento e prevenção de
duplicidade são exercitados nas mutações de planejamento, gasto, edição,
exclusão e novo ciclo. A semântica financeira profunda continua nos testes Node,
sem duplicar fórmulas nas integrações de interface.
