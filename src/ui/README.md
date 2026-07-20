# Camada visual compartilhada

`src/ui` contém componentes visuais sem conhecimento de regras financeiras,
Context do planejamento, rotas ou persistência.

O tema usa `useColorScheme` por meio de `AppThemeProvider` quando a preferência
é Sistema. Claro e Escuro podem ser forçados, e a preferência é carregada antes
da liberação da splash. Componentes obtêm cores com `useAppTheme` e criam estilos
memorizados, respondendo a mudanças sem recarregar o bundle. Espaçamento, raios,
tipografia e dimensões continuam estáveis entre os temas.

A preferência visual usa uma chave AsyncStorage isolada e nunca entra no
documento financeiro.

## Movimento

- `motion/tokens.ts` centraliza durações, escalas, opacidades, distâncias e
  curvas.
- `ReducedMotionConfig` segue a configuração do aparelho; componentes contínuos
  também consultam `useReducedMotion`.
- `AppButton`, `CollapsibleSection`, `AnimatedValueText` e
  `LaunchLoadingScreen` usam Reanimated sem atrasar operações.
- `feedback/` mantém confirmações temporárias acima da navegação, com timer
  limpo no unmount e sem persistência.
- O histórico não anima a entrada inicial; apenas a saída confirmada e a
  reorganização dos itens.

`Bundling (%)` pertence ao ambiente de desenvolvimento do Expo e não ao loading
React. As transições nativas do Expo Router também não foram substituídas.
