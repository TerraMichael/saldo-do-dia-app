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
