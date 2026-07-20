# Saldo do Dia

Aplicativo mobile que responde, de forma simples, **quanto você pode gastar hoje sem ficar sem dinheiro até o próximo recebimento**.

O MVP possui uma fundação técnica, onboarding inicial e uma tela principal que
apresenta o planejamento calculado. O planejamento é mantido localmente no
dispositivo.

## Stack

- React Native 0.81 com Expo SDK 54
- TypeScript em modo estrito
- Expo Router para navegação baseada em arquivos
- Persistência local com AsyncStorage
- UUID v4 com `expo-crypto` para identificar gastos
- npm

> **Compatibilidade temporária:** o projeto está no Expo SDK 54 para abrir no
> Expo Go atualmente distribuído pela Play Store. As dependências devem continuar
> alinhadas com `npx expo install --fix` até uma futura atualização planejada do
> SDK.

## Requisitos

- Node.js 20.19 ou superior
- npm 10 ou superior
- Android Studio com um emulador Android configurado, ou um dispositivo Android com Expo Go compatível

## Instalação e execução

```bash
npm install
npm start
```

No terminal do Expo, pressione `a` para abrir no Android. Também é possível iniciar diretamente com:

```bash
npm run android
```

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
```

O comando `npm test` executa explicitamente os testes JavaScript e TypeScript
existentes com o test runner nativo do Node.js por meio do `tsx`.

## Fluxo disponível

O botão **Começar** abre um onboarding:

1. preenchimento do saldo atual, próximo recebimento, contas pendentes e reserva;
2. revisão dos dados;
3. confirmação e acesso à tela principal.

Os valores são convertidos para centavos e o cálculo reutiliza o domínio
`daily-limit`. A tela principal mostra quanto ainda pode ser gasto hoje, o limite
planejado do dia, o gasto de hoje e a previsão para os dias futuros, além dos valores do planejamento
e os estados positivo, sem valor livre ou déficit. É possível editar o
planejamento e registrar gastos, que reduzem o saldo atual e recalculam
imediatamente o restante do dia. Gastos são datados em memória para que o valor
consumido hoje não seja redistribuído novamente pelo mesmo dia. A Home mostra
o total gasto no ciclo e oferece acesso ao histórico individual.

## Ciclo atual e novo recebimento

O planejamento ativo continua representando o ciclo vigente. A Home oferece
a ação discreta **Novo recebimento**, que pode ser usada mesmo quando o pagamento
chega antes da data prevista. Quando a data passa, o aplicativo distingue:

- **Já recebi — iniciar novo ciclo:** informa o saldo real depois de receber,
  novas contas, reserva e a próxima data;
- **Ainda não recebi — ajustar planejamento:** corrige o planejamento existente
  e preserva os gastos já registrados.

No novo ciclo, o saldo informado é a nova fonte de verdade; ele não é somado ao
saldo anterior. A revisão informa quantos gastos e qual total deixarão de aparecer.
Somente após a confirmação e a gravação bem-sucedida os gastos são zerados, o
histórico fica vazio e o novo planejamento passa a ser exibido.

Ao confirmar um novo recebimento, o ciclo vigente é arquivado na mesma gravação
que cria o próximo ciclo. A tela **Ciclos anteriores**, acessível pelo histórico
de gastos, lista os ciclos encerrados e seus gastos em modo somente leitura.
Comparação, exclusão, restauração, relatório e backup de ciclos ainda não existem.

## Histórico de gastos

A tela **Histórico de gastos** usa `configuracao.gastosRegistrados` como única
fonte de dados. Os registros do ciclo atual são agrupados pela data civil,
ordenados do dia mais recente para o mais antigo e apresentados em reais. Dentro
do mesmo dia, o gasto anexado mais recentemente aparece primeiro.

O resumo informa total do ciclo, total gasto hoje e quantidade de registros. O
histórico vazio oferece acesso direto ao registro do primeiro gasto. Cada registro
possui ações para editar seu valor ou excluí-lo. Uma descrição curta e opcional
pode ser informada no registro e alterada depois; quando ausente, o histórico
mostra **Gasto registrado**. A edição preserva ID e data e
ajusta o saldo pela diferença; a exclusão devolve o valor ao saldo. Em ambos os
casos, o planejamento é recalculado e persistido antes da atualização visual.
Ainda não há edição de data ou categoria de gastos.

## Persistência local

O AsyncStorage usa a chave versionada `@saldo-do-dia/planejamento:v3`. O documento
contém o ciclo atual, sua fotografia inicial imutável e a coleção de ciclos
encerrados. O resultado financeiro e os totais de apresentação nunca são
persistidos; o ciclo atual é recalculado por `calcularPlanoDiario`.

Cada gasto persistido possui `id`, `valor` em centavos, `data` civil e pode ter
`descricao`. A descrição é opcional e aditiva, portanto a persistência permanece
na versão 3 e documentos anteriores sem esse campo continuam válidos. Instalações
com dados v1 ou v2 são validadas e migradas automaticamente. Os IDs
determinísticos dos gastos legados são preservados, e a origem só é removida
depois que o documento v3 completo foi gravado.

Instalações v2 são migradas com `inicio: null`, pois seus dados não permitem
inventar a fotografia inicial. A prioridade é v3, v2, v1; qualquer chave legada
só é removida depois da gravação v3 confirmada. Não existe chave separada para o
histórico: arquivamento e criação do novo ciclo são uma única gravação atômica.

Ao abrir o aplicativo, os dados são lidos, validados campo a campo e atualizados
para a data civil local. Quando o aplicativo volta ao primeiro plano em um novo
dia, a data e o orçamento são recalculados e salvos novamente. Se a data do
recebimento tiver passado, os dados são preservados e o aplicativo solicita a
edição do planejamento.

JSON inválido, versão desconhecida ou campos corrompidos não causam exclusão
automática. O aplicativo apresenta uma recuperação e só remove os dados quando o
usuário escolhe **Recomeçar planejamento**. Falhas temporárias de leitura ou
gravação permitem nova tentativa.

AsyncStorage é persistente e assíncrono, mas **não é criptografado**. Ele é usado
somente para o planejamento financeiro local; senhas, tokens, credenciais e
segredos não devem ser armazenados nessa camada.

## Estrutura principal

```text
app/                  # Rotas e layouts do Expo Router
src/
  features/           # Domínios futuros (onboarding, saldo, contas, gastos etc.)
  ui/                 # Tokens e componentes visuais compartilhados
  storage/            # Contratos, validação e adaptador AsyncStorage
tests/                # Verificações automatizadas da fundação do projeto
```

As funcionalidades serão separadas por domínio dentro de `src/features`, evitando acoplamento entre as telas, as regras do cálculo diário e a persistência. Rotas devem apenas compor os fluxos e delegar regras de negócio aos respectivos módulos.

## Interface e experiência

O aplicativo oferece aparência **Sistema**, **Claro** e **Escuro**. Sistema é o
padrão, acompanha o Android em runtime e usa o tema claro como fallback seguro.
Claro e Escuro podem ser forçados pela tela de configurações. Ambos mantêm a
identidade verde, com âmbar em alertas e vermelho reservado para erro, déficit e
exclusão.

Os tokens de cor, espaçamento, tipografia, raio, borda, elevação e dimensões
mínimas ficam em `src/ui/theme/`. `AppThemeProvider` observa `useColorScheme`,
hidrata a preferência visual e fornece `useAppTheme`, permitindo troca imediata.
A preferência usa a chave isolada `@saldo-do-dia/aparencia:v1`; ela não faz
parte da persistência financeira v3.
A camada `src/ui` também reúne componentes
reutilizados de tela, cabeçalho, botão, card, campo monetário, linha informativa,
feedback e estados do sistema. Esses componentes são somente visuais e não
conhecem cálculo financeiro, Context ou persistência.

O sistema de movimento usa `react-native-reanimated` e tokens centralizados em
`src/ui/motion`. As interações são curtas e funcionais: botões respondem à
pressão, detalhes expandem com continuidade, o valor principal da Home sinaliza
mudanças e o histórico reorganiza itens somente depois da exclusão persistida.
O feedback global confirma registro, edição e exclusão por aproximadamente 2,2
segundos e nunca faz parte dos dados persistidos.

`ReducedMotionConfig` segue a preferência **Reduzir movimento** do aparelho.
Quando ativa, conteúdo e feedback continuam presentes, mas deslocamentos,
escalas e a respiração do loading chegam imediatamente ao estado final. As
animações acompanham o estado real e não atrasam persistência, recálculo ou
navegação.

A Home mantém o valor disponível hoje como foco e deixa **Registrar gasto** e
**Ver histórico** sempre acessíveis. Resumo do dia, planejamento e opções ficam
na seção local **Detalhes do planejamento**, recolhida por padrão. Déficit,
excedente e alertas críticos permanecem visíveis no card principal.

No primeiro acesso sem planejamento, uma apresentação opcional de três telas
explica a proposta, o cálculo e o armazenamento local desta versão. Depois da
confirmação do primeiro planejamento, um tour curto apresenta quatro elementos
reais da Home. Ambos podem ser pulados; a apresentação pode ser revista e o tour
repetido pela seção **Ajuda** das Configurações. O estado educativo usa a chave
isolada `@saldo-do-dia/tutorial:v1`, não altera o planejamento financeiro v3 e
não interfere na preferência de aparência.

Os campos do planejamento explicam saldo, recebimento, contas e reserva junto
dos controles. Na primeira abertura de **Novo recebimento**, uma dica informa
que o ciclo atual será arquivado; a revisão mantém permanentemente o aviso de
que o novo ciclo começará sem gastos.

No tour da Home, o painel explicativo é posicionado dinamicamente acima ou
abaixo do alvo. Safe Area, tamanho da janela, fonte aumentada e um afastamento
mínimo são considerados; se necessário, a Home rola e mede o alvo novamente
antes de mostrar o painel.
Formulários, revisões, histórico e estados de carregamento ou erro compartilham
hierarquia, áreas de toque e feedback consistentes. A implementação usa apenas
React Native, `StyleSheet` e componentes nativos; nenhuma biblioteca externa de
UI ou estilos foi adicionada.

Os assets definitivos de marca ficam em `assets/brand/` e são usados sem
transformações no ícone principal, adaptive icon, ícone monocromático do Android
13+, splash nativa e pontos institucionais da interface. A splash e a raiz React
usam `#F4F8F5` no tema claro e `#0D1511` no tema escuro.

O `expo-splash-screen` mantém a splash visível durante a hidratação local. A
ocultação só começa depois que a configuração foi resolvida e a tela inicial
correta realizou seu primeiro layout. Há no máximo duas tentativas assíncronas e
um fallback nativo final, sem repetição após sucesso. Assim, primeiro acesso,
Home restaurada e estados de recuperação não exibem uma rota intermediária.

Os ícones da interface usam exclusivamente `MaterialCommunityIcons` e sempre
complementam textos de ação. Não existem efeitos decorativos, animações
personalizadas de navegação ou contadores monetários. A validação nativa
definitiva da splash clara/escura, adaptive icon, partida fria e fundo anterior
ao JavaScript exige um APK próprio, pois o Expo Go não reproduz integralmente
essas configurações. A indicação `Bundling (%)` pertence ao ambiente de
desenvolvimento do Expo e não é controlada pelo `LaunchLoadingScreen`.

## Continuidade no Codex CLI

O arquivo [`CONTEXTO_CODEX.md`](./CONTEXTO_CODEX.md) consolida a visão do produto,
as decisões técnicas, o estado atual, as limitações conhecidas e um prompt de
início para continuar o desenvolvimento em uma nova sessão do Codex CLI.
