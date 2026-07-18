# Regras do repositório

- Use React Native, Expo, TypeScript estrito, Expo Router e npm.
- Mantenha textos da interface em português do Brasil e priorize Android em portrait.
- Organize regras por domínio em `src/features`; rotas apenas compõem telas e fluxos.
- Toda persistência deve ser local. Não adicione backend, autenticação, anúncios, integração bancária ou IA.
- Evite dependências sem necessidade e valide mudanças com `npm run lint`, `npm run typecheck` e `npm test`.
