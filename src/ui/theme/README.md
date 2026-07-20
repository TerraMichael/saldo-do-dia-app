# Tema

- `colors.ts`: contrato `AppColors` e paletas `lightColors` e `darkColors`.
- `tokens.ts`: espaçamento, raios, tipografia, dimensões e elevação.
- `appearance.ts`: preferências Sistema, Claro e Escuro e resolução pura.
- `create-theme.ts`: criação da apresentação do tema resolvido.
- `ThemeProvider.tsx`: integração React Native com `useColorScheme` e hidratação
  da preferência.

A paleta clara preserva a identidade anterior. A paleta escura usa fundo
`#0D1511`, superfícies verde-escuras e cores semânticas próprias. Nenhuma cor da
paleta aprovada foi ajustada.

O provider usa o armazenamento isolado de aparência. Nenhuma preferência é
incluída no estado financeiro ou em suas migrações.
