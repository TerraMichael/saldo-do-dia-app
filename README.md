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

O planejamento e o histórico representam somente o ciclo vigente. A Home oferece
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

Ainda não existe histórico permanente, relatório ou backup de ciclos encerrados.

## Histórico de gastos

A tela **Histórico de gastos** usa `configuracao.gastosRegistrados` como única
fonte de dados. Os registros do ciclo atual são agrupados pela data civil,
ordenados do dia mais recente para o mais antigo e apresentados em reais. Dentro
do mesmo dia, o gasto anexado mais recentemente aparece primeiro.

O resumo informa total do ciclo, total gasto hoje e quantidade de registros. O
histórico vazio oferece acesso direto ao registro do primeiro gasto. Cada registro
possui ações para editar seu valor ou excluí-lo. A edição preserva ID e data e
ajusta o saldo pela diferença; a exclusão devolve o valor ao saldo. Em ambos os
casos, o planejamento é recalculado e persistido antes da atualização visual.
Ainda não há edição de data, descrição ou categoria de gastos.

## Persistência local

Somente a configuração que serve como fonte de verdade é armazenada no
AsyncStorage, usando a chave versionada
`@saldo-do-dia/planejamento:v2`. O formato atual contém `versao: 2` e
`configuracao`; o resultado financeiro nunca é persistido e sempre é recalculado
por `calcularPlanoDiario`.

Cada gasto persistido possui `id`, `valor` em centavos e `data` civil. Instalações
com dados na chave antiga `@saldo-do-dia/planejamento:v1` são migradas
automaticamente: o aplicativo valida o documento legado, atribui IDs
determinísticos, confirma a gravação v2 e somente então tenta remover a chave v1.
Se a gravação v2 falhar, os dados v1 não são removidos. Se as duas chaves
existirem, v2 tem prioridade.

Iniciar um novo ciclo apenas substitui a configuração armazenada nessa mesma
estrutura v2. Nenhuma nova versão ou segunda cópia de histórico é criada.

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

O aplicativo mantém um tema claro, acolhedor e Android-first: superfícies brancas
sobre fundo verde muito claro, verde nas ações principais, âmbar em alertas e
vermelho reservado para erro, déficit e exclusão.

Os tokens de cor, espaçamento, tipografia, raio, borda, elevação e dimensões
mínimas ficam em `src/ui/theme.ts`. A camada `src/ui` também reúne componentes
reutilizados de tela, cabeçalho, botão, card, campo monetário, linha informativa,
feedback e estados do sistema. Esses componentes são somente visuais e não
conhecem cálculo financeiro, Context ou persistência.

A Home mantém o valor disponível hoje como foco e deixa **Registrar gasto** e
**Ver histórico** sempre acessíveis. Resumo do dia, planejamento e opções ficam
na seção local **Detalhes do planejamento**, recolhida por padrão. Déficit,
excedente e alertas críticos permanecem visíveis no card principal.
Formulários, revisões, histórico e estados de carregamento ou erro compartilham
hierarquia, áreas de toque e feedback consistentes. A implementação usa apenas
React Native, `StyleSheet` e componentes nativos; nenhuma biblioteca externa de
UI ou estilos foi adicionada.

Os assets definitivos de marca ficam em `assets/brand/` e são usados sem
transformações no ícone principal, adaptive icon, ícone monocromático do Android
13+, splash nativa e pontos institucionais da interface. A splash e a raiz React
compartilham o fundo `#F4F8F5`.

O `expo-splash-screen` mantém a splash visível durante a hidratação local. A
ocultação só começa depois que a configuração foi resolvida e a tela inicial
correta realizou seu primeiro layout. Há no máximo duas tentativas assíncronas e
um fallback nativo final, sem repetição após sucesso. Assim, primeiro acesso,
Home restaurada e estados de recuperação não exibem uma rota intermediária.

Os ícones da interface usam exclusivamente `MaterialCommunityIcons` e sempre
complementam textos de ação. Ainda não existem modo escuro nem animações
elaboradas. A validação nativa definitiva de splash, adaptive icon e ícone
temático exige um APK próprio, pois o Expo Go não reproduz integralmente essas
configurações.

## Continuidade no Codex CLI

O arquivo [`CONTEXTO_CODEX.md`](./CONTEXTO_CODEX.md) consolida a visão do produto,
as decisões técnicas, o estado atual, as limitações conhecidas e um prompt de
início para continuar o desenvolvimento em uma nova sessão do Codex CLI.
