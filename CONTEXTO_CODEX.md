# Contexto do projeto para o Codex CLI

> Documento de continuidade do **Saldo do Dia**. Ao iniciar uma nova sessão local,
> peça ao Codex CLI para ler `AGENTS.md` e este arquivo antes de propor ou alterar
> código. O repositório continua sendo a fonte de verdade caso este resumo fique
> desatualizado.

## Prompt curto para iniciar uma sessão

Copie e envie ao Codex CLI:

```text
Estamos continuando o desenvolvimento do aplicativo Saldo do Dia. Antes de fazer
qualquer alteração, leia AGENTS.md, CONTEXTO_CODEX.md, README.md, package.json e os
arquivos relacionados à tarefa. Confira também git status e o histórico recente.
Siga as decisões documentadas, não presuma que itens do roadmap já foram aprovados
e mantenha este documento atualizado quando uma decisão duradoura mudar. Ao final,
execute npm run lint, npm run typecheck e npm test e explique qualquer limitação.
```

## 1. Visão e intenção do produto

O **Saldo do Dia** é um aplicativo mobile de finanças pessoais que pretende
responder uma pergunta central, em linguagem simples:

> **Quanto posso gastar hoje sem ficar sem dinheiro até o próximo recebimento?**

A intenção é reduzir a complexidade de acompanhar o dinheiro no curto prazo. O
produto não pretende ser um banco, agregador de contas ou plataforma completa de
investimentos. A experiência deve ser direta, acolhedora e útil para decisões do
dia a dia.

Princípios já estabelecidos:

- interface e mensagens em **português do Brasil**;
- foco inicial em **Android**, com uso em orientação **portrait**;
- dados financeiros permanecem no aparelho;
- nenhuma dependência de backend ou conexão bancária;
- regras financeiras previsíveis, testáveis e separadas da interface;
- evolução incremental, sem adicionar dependências antes de existir necessidade.

## 2. Limites de escopo

Estas restrições são obrigatórias e também estão resumidas em `AGENTS.md`:

- usar React Native, Expo, TypeScript estrito, Expo Router e npm;
- persistência exclusivamente local;
- não adicionar backend, autenticação, anúncios, integração bancária ou IA;
- regras de negócio devem ficar em módulos de domínio em `src/features`;
- arquivos em `app/` devem somente compor telas, navegação e fluxos;
- evitar dependências desnecessárias;
- validar alterações com `npm run lint`, `npm run typecheck` e `npm test`.

Não inclua uma funcionalidade proibida como solução provisória. Se uma tarefa
parecer exigir mudança desses limites, pare e confirme a decisão com o responsável
pelo produto.

## 3. Stack e configuração atuais

- Expo SDK 54 e React Native 0.81;
- React 19.1;
- TypeScript 5.9 em modo `strict`;
- Expo Router com rotas tipadas;
- AsyncStorage para persistência local do planejamento;
- Expo Crypto para UUID v4 dos novos gastos;
- Expo Localization configurado para `pt-BR` no Android;
- nova arquitetura do React Native habilitada;
- ESLint com a configuração flat do Expo;
- testes baseados no test runner nativo do Node, com `tsx` para executar arquivos
  JavaScript e TypeScript;
- identificador Android: `com.terramichael.saldododia`;
- scheme: `saldododia`;
- tema atual fixado como claro.

O uso do Expo SDK 54 é temporário e foi adotado para compatibilidade com o Expo
Go distribuído pela Play Store no dispositivo físico usado no desenvolvimento.
As dependências foram alinhadas pelo `npx expo install --fix`; não atualize
pacotes Expo isoladamente sem repetir essa verificação.

Requisitos documentados: Node.js 20.19 ou superior e npm 10 ou superior.

## 4. Estado atual do que foi implementado

### Fundação do aplicativo

- `app/_layout.tsx` cria a pilha raiz sem cabeçalho e usa status bar escura.
- `app/index.tsx` contém uma tela inicial com o nome **Saldo do Dia**, a
  frase **Descubra quanto você pode gastar hoje** e o botão **Começar**.
- O botão navega para o onboarding; após preenchimento e revisão, a confirmação
  abre a tela principal.
- O visual atual usa fundo verde muito claro, tipografia escura e ação principal
  verde. Tokens e componentes reutilizáveis ficam em `src/ui`, sem dependência
  externa de componentes ou estilos.
- Não há assets binários versionados; eles foram deliberadamente removidos da
  fundação inicial.

### Fundação visual compartilhada

- `src/ui/theme.ts` centraliza cores, espaçamentos, raios, tipografia, bordas,
  elevação leve e dimensões mínimas de interação.
- `src/ui/components` contém estruturas reutilizadas de tela, cabeçalho, botão,
  card, campo monetário controlado, linha informativa, feedback, seção e estado.
- A camada visual não importa Context, armazenamento, presenters ou regras
  financeiras.
- A direção permanece clara e acolhedora, com verde como cor principal, âmbar
  para atenção e vermelho para erro, déficit e exclusão.
- Home, onboarding, novo ciclo, gastos, histórico, revisões e estados do sistema
  usam a mesma hierarquia visual e alvos de toque mínimos.
- A Home separa resumo de hoje e planejamento, posicionando **Registrar gasto**
  logo após o valor principal.
- Formulários preservam parsing e formatação das features; `MoneyInput` apenas
  apresenta valor, foco, ajuda, erro e estado desabilitado.
- Não foram adicionadas bibliotecas de UI, estilos ou testes de interface.
- Modo escuro e animações complexas continuam fora do escopo.

### Marca, splash e loading

- Os assets finais ficam em `assets/brand/` e não devem ser recortados,
  recoloridos ou regenerados.
- `app.json` configura o ícone principal, adaptive icon, ícone monocromático do
  Android 13+ e o plugin `expo-splash-screen`, todos sobre `#F4F8F5`.
- A splash é preservada durante a hidratação. Após a tela inicial correta
  realizar seu primeiro layout, a camada React permite no máximo duas tentativas
  de `hideAsync` e um fallback `hide`, sem nova chamada depois do sucesso.
- Primeiro acesso abre a apresentação; planejamento válido abre diretamente
  a Home; estados expirado e de erro abrem a recuperação sem flash de outra rota.
- `BrandMark` e `LaunchLoadingScreen` concentram o uso institucional do símbolo.
- Os ícones internos usam somente `MaterialCommunityIcons` e complementam os
  textos existentes.
- Expo Go não valida fielmente os assets nativos; splash, máscaras adaptativas e
  ícone monocromático ainda precisam de verificação em preview APK.

### Onboarding inicial

- `src/features/onboarding` concentra parsing e formatação de moeda brasileira,
  validações, construção da configuração e estado em memória com Context.
- O fluxo coleta saldo atual, próximo recebimento, contas pendentes e reserva.
- A data usa o seletor nativo de `@react-native-community/datetimepicker`.
- Datas selecionadas são convertidas pelos componentes locais da data, sem
  `toISOString`, evitando deslocamento de um dia por UTC.
- A revisão exibe os quatro dados antes da confirmação.
- A confirmação reutiliza `calcularPlanoDiario` e substitui o fluxo pela tela
  principal, evitando retornar à revisão pelo botão voltar.
- A confirmação persiste a configuração localmente antes de publicar o
  planejamento calculado.

### Tela principal

- `src/features/home/presenter.ts` transforma configuração e resultado financeiro
  em dados de apresentação, sem duplicar o cálculo do domínio.
- A Home destaca quanto ainda pode ser gasto hoje. Déficit, excedente e alertas
  críticos permanecem no card principal; gasto hoje, limite planejado, previsão
  futura, saldo, contas, reserva, dias e data ficam em **Detalhes do
  planejamento**, uma seção local recolhida por padrão.
- Em valor disponível zero, informa que não há dinheiro livre.
- Em déficit, preserva o resultado negativo do domínio, mas mostra limite visual
  de `R$ 0,00` e destaca separadamente o valor que falta.
- **Editar planejamento** retorna ao onboarding com os dados atuais preenchidos.
- **Registrar gasto** abre um formulário de valor único; após confirmar, saldo,
  total gasto e orçamento restante de hoje são atualizados em memória.
- **Ver histórico** abre os gastos individuais do ciclo atual, agrupados por data
  e ordenados do dia mais recente para o mais antigo.
- O provider do planejamento fica no layout raiz, hidrata a configuração local e
  compartilha configuração e resultado entre onboarding e Home.

### Registro de gastos local

- `src/features/expenses/register-expense.ts` contém o caso de uso puro.
- Ao registrar `X`, o saldo corrente é reduzido por `X`, o gasto datado
  `{ id, valor: X, data: dataAtual }` é anexado a `gastosRegistrados`, `dataAtual`
  recebe a data civil local e o plano é
  recalculado por `calcularPlanoDiario`.
- Gastos registrados não são descontados novamente do valor disponível; o saldo
  já representa o dinheiro corrente após o gasto.
- Gastos cuja data civil coincide com `dataAtual` reconstroem o disponível do
  início do dia. A partir dele, o domínio calcula limite planejado, restante e
  excedente de hoje, além do limite para os dias futuros.
- Gastos de datas anteriores permanecem no total do ciclo, mas não entram em
  `totalGastosHoje`; quando o dia muda, o orçamento é recalculado usando o saldo
  corrente e a nova quantidade de dias.
- Gastos maiores que o saldo são permitidos e podem levar a Home ao estado de
  déficit.
- A Home mostra o total do ciclo e os agregados do dia; a lista individual fica
  disponível no histórico.
- Novos gastos recebem UUID v4 por `Crypto.randomUUID()`. O gerador é injetado no
  caso de uso puro para permitir testes determinísticos.
- Gastos aceitam descrição opcional de até 80 caracteres. Espaços externos são
  removidos, conteúdo vazio é omitido e a descrição não participa dos cálculos.
- A edição preserva ID e data, corrige o saldo por
  `saldoAtual + valorAntigo - novoValor` e recalcula o plano.
- A exclusão localiza exclusivamente pelo ID, devolve o valor ao saldo e
  recalcula o plano. Gastos antigos seguem a mesma regra.
- Configuração e resultado são mantidos juntos em uma única atualização do
  Context, somente depois que a configuração foi persistida.
- Parsing e formatação monetária genéricos ficam em `src/shared/money.ts`, com os
  exports anteriores do onboarding preservados.

### Histórico local de gastos

- `src/features/history/presenter.ts` cria uma projeção pura de
  `configuracao.gastosRegistrados`, sem alterar saldo, resultado ou persistência.
- Gastos são agrupados pela data civil `AAAA-MM-DD`; grupos válidos são ordenados
  de forma decrescente e datas inválidas ficam ao final com apresentação segura.
- Dentro do mesmo dia, a ordem de inserção é invertida localmente, pois novos
  gastos são anexados ao final do array e ainda não existem horários.
- A tela mostra total do ciclo, total de hoje, quantidade de registros, total de
  cada data e cada valor individual.
- O estado vazio oferece a ação **Registrar gasto** e não é tratado como erro.
- O histórico não possui chave ou cópia persistida própria: a configuração
  versionada existente continua sendo a única fonte de verdade.
- Cada item usa seu ID persistido como chave e oferece ações acessíveis de
  edição e exclusão. A exclusão exige confirmação nativa.

### Ciclo atual, novo recebimento e histórico permanente

- Gastos editáveis e totais da Home representam exclusivamente o ciclo vigente.
- **Novo recebimento** pode ser acionado pela Home antes do vencimento.
- No estado expirado, **Já recebi — iniciar novo ciclo** abre um fluxo separado;
  **Ainda não recebi — ajustar planejamento** mantém o onboarding de edição.
- Ajustar o planejamento preserva os gastos. Iniciar outro ciclo usa o saldo
  real informado depois de receber e cria `gastosRegistrados: []`.
- O saldo anterior não é somado ao novo saldo, evitando perpetuar divergências
  causadas por gastos não registrados.
- A revisão mostra quantidade e total dos gastos que deixarão de aparecer.
- Cancelar, voltar ou falhar ao persistir mantém integralmente o ciclo anterior.
- A confirmação arquiva a configuração final do ciclo atual e cria o próximo
  ciclo numa única gravação v3. Ciclos encerrados são somente leitura.
- A lista e o detalhe de ciclos anteriores derivam totais e agrupamentos sem
  persistir resultados. Comparação, exclusão, restauração e backup não existem.

### Domínios previstos

O catálogo atual em `src/features/index.ts` prevê:

1. `onboarding` — apresentação e configuração inicial;
2. `balance` — saldo disponível;
3. `income` — próximo recebimento;
4. `bills` — contas pendentes;
5. `expenses` — registro de gastos;
6. `daily-limit` — cálculo do limite diário;
7. `history` — histórico local.
8. `cycle` — encerramento do ciclo vigente e início após novo recebimento.

Somente `daily-limit` possui regra de domínio implementada. Os demais nomes
representam a direção de organização, não funcionalidades prontas.

### Cálculo financeiro implementado

`src/features/daily-limit/index.ts` contém funções puras e tipos para o plano
diário. A entrada possui:

- saldo atual;
- reserva que o usuário quer proteger;
- total de contas pendentes;
- data atual;
- data do próximo recebimento;
- gastos já registrados no ciclo, cada um com valor em centavos e data civil.

A regra implementada é:

```text
valor disponível atual = saldo atual - reserva - contas pendentes
valor disponível no início do dia = valor disponível atual + gastos de hoje
limite planejado hoje = piso(valor disponível no início do dia / dias restantes)
restante hoje = máximo entre zero e (limite planejado hoje - gastos de hoje)
excedente hoje = máximo entre zero e (gastos de hoje - limite planejado hoje)
limite futuro = piso((valor disponível atual - restante hoje) / dias futuros)
```

Decisões importantes da implementação:

- todo valor monetário é um número inteiro em **centavos**;
- datas de domínio usam o formato civil `AAAA-MM-DD` e são calculadas em UTC para
  evitar variações de fuso horário;
- a diferença entre hoje e a data do recebimento define os dias restantes;
- quando o recebimento é hoje, usa-se 1 dia, evitando divisão por zero;
- o limite é arredondado para baixo para nunca oferecer mais que o disponível;
- valores negativos são preservados: saldo insuficiente resulta em valor
  disponível e limite negativos, em vez de ser silenciosamente truncado para zero;
- gastos registrados são datados, somados e retornados como informação, mas
  **não são descontados novamente**, pois o saldo atual fornecido já representa
  o estado corrente do dinheiro;
- quando não há dias futuros, o domínio retorna limite futuro ausente;
- entradas monetárias que não sejam inteiros seguros e datas inválidas produzem
  `ErroCalculoFinanceiro` com código de domínio;
- a data do próximo recebimento anterior à data atual é rejeitada.

Os testes escritos para esse domínio cobrem cenário normal, centavos, reserva,
saldo negativo ou insuficiente, contas maiores que o saldo, recebimento hoje,
datas inválidas e prevenção de `NaN`/`Infinity`.

## 5. Persistência e dados

O planejamento é persistido localmente com
`@react-native-async-storage/async-storage`. A chave centralizada é
`@saldo-do-dia/planejamento:v3`, e o documento possui o formato:

```ts
{
  versao: 3;
  dados: { cicloAtual: CicloAtual; ciclosEncerrados: CicloEncerrado[] };
}
```

Cada gasto contém `id`, `valor`, `data` e pode conter `descricao`. O ID é obrigatório, não vazio e único
dentro do planejamento.

A chave v2 e a chave legada v1 continuam suportadas para migração.
V2 vira um ciclo atual com ID determinístico, início desconhecido e histórico
encerrado vazio. V1 preserva a migração determinística dos gastos antes de chegar
a v3. A prioridade é v3, v2, v1, e nenhuma origem é removida antes da confirmação
da gravação v3.

Na ação explícita de remover o planejamento, as chaves são removidas na ordem
v1, v2 e v3, impedindo que uma falha parcial faça uma versão antiga substituir
silenciosamente a fonte mais recente.

Somente a configuração, que é a fonte de verdade, é armazenada.
`ResultadoCalculoDiario` nunca é persistido: ele é recalculado por
`calcularPlanoDiario` após cada leitura ou operação.

A persistência continua em v3 porque `descricao` é um campo opcional e aditivo.
Documentos v3 anteriores sem a propriedade permanecem válidos; descrições vazias
são omitidas e textos acima de 80 caracteres são rejeitados.

A desserialização parte de `unknown` e valida objeto raiz, versão, inteiros
seguros, restrições de sinal, datas civis e cada gasto datado. JSON inválido,
versão desconhecida ou campos corrompidos levam a uma tela de recuperação; os
dados só são removidos após a ação explícita **Recomeçar planejamento**. Falhas
temporárias de leitura permitem tentar novamente.

O provider começa em `carregando`, sem piscar onboarding ou Home. Ausência de
dados leva ao fluxo inicial; dados válidos levam à Home; recebimento vencido leva
ao estado `expirado`; falhas levam ao estado `erro`.

Na inicialização e quando o aplicativo retorna ao primeiro plano, a data civil
local é comparada com `dataAtual`. Em um novo dia, a configuração recebe a nova
data, o resultado é recalculado e a configuração é salva. Não se usa
`toISOString` para produzir a data local.

Se o recebimento passou, saldo, reserva, contas e gastos são preservados e a
interface solicita a edição do planejamento. Nenhum ciclo é criado
automaticamente.

Confirmação do onboarding, registro, edição e exclusão de gasto seguem a ordem
calcular, persistir configuração e então publicar configuração/resultado juntos.
Uma falha de gravação mantém saldo, configuração, resultado e histórico
anteriores e permite tentar novamente.

O novo ciclo segue a mesma garantia: valida e calcula uma configuração isolada,
arquiva o ciclo atual e cria o próximo dentro do mesmo documento v3. Somente
após a gravação única ter sucesso o Context publica configuração, resultado e
ciclos encerrados.

AsyncStorage é assíncrono, persistente e não criptografado. Não armazene senha,
token, credencial, segredo ou dado de autenticação nessa camada.

## 6. Arquitetura esperada

```text
app/                         rotas e composição dos fluxos Expo Router
src/features/<dominio>/      tipos, regras, componentes e casos de uso do domínio
src/storage/                 contratos e implementações de persistência local
tests/                       verificações automatizadas
```

Ao implementar uma tela, evite colocar cálculos, validações financeiras ou acesso
direto ao armazenamento na rota. Extraia essas responsabilidades para o domínio
apropriado. Prefira funções puras para regras financeiras e represente dinheiro em
centavos de ponta a ponta.

## 7. Estado dos testes e atenção técnica conhecida

Os scripts oficiais são:

```bash
npm run lint
npm run typecheck
npm test
```

`npm test` executa explicitamente `tests/foundation.test.js`,
`tests/daily-limit.test.ts`, `tests/onboarding.test.ts`, `tests/home.test.ts` e
`tests/expenses.test.ts`, `tests/expense-management.test.ts`,
`tests/storage.test.ts`, `tests/history.test.ts` e `tests/new-cycle.test.ts` com o
test runner nativo do Node.js por meio do `tsx`.
Os caminhos explícitos mantêm o comando compatível com Windows PowerShell sem
depender da expansão de globs feita pelo shell.

O `README.md` ainda descreve o repositório como contendo somente a fundação e diz
que os fluxos financeiros não foram implementados. Interprete isso como “nenhum
fluxo completo de usuário foi implementado”: a regra isolada de `daily-limit` já
existe, embora ainda não esteja ligada a uma tela ou persistência.

## 8. O que ainda não existe

- edição da data de gastos;
- categorias e horários individuais de gastos;
- validação visual automatizada e testes de interface;
- auditoria com leitores de tela em diferentes fabricantes Android;
- testes de interface ou navegação;
- histórico permanente de ciclos encerrados;

Não descreva esses itens como prontos e não invente requisitos de interação para
eles. Quando houver alternativas de produto relevantes, apresente-as ao usuário
antes de consolidar uma decisão.

## 9. Direção recomendada para as próximas etapas

Esta seção é um **roadmap sugerido**, não um conjunto de requisitos já aprovado:

1. categorias;
2. edição da data do gasto;
3. comparação simples entre ciclos;
4. exportação ou backup local;
5. modo escuro;
6. animações avançadas.

Em cada etapa, mantenha estados de erro, valores negativos, datas-limite,
arredondamento e acessibilidade visíveis no desenho da solução.

## 10. Histórico disponível no Git

O histórico versionado registra esta evolução:

1. commit inicial;
2. remoção de assets binários da fundação;
3. merge da fundação Expo + TypeScript;
4. implementação do domínio de cálculo financeiro diário;
5. sincronização de branch e merge da fundação, domínio, UI e testes.
6. alinhamento temporário ao Expo SDK 54 para testes no Expo Go da Play Store.

Use `git log --oneline --decorate` e `git show <commit>` para recuperar detalhes.
Este documento não contém transcrições privadas ou conteúdo que não esteja
disponível nesta sessão; ele consolida as decisões que podem ser verificadas no
repositório e no contexto fornecido. Se uma conversa anterior definiu algo que não
está aqui nem no Git, registre a decisão explicitamente antes de implementá-la.

## 11. Checklist para qualquer sessão do Codex CLI

Antes de editar:

- ler todos os `AGENTS.md` aplicáveis ao arquivo;
- ler este contexto e os arquivos diretamente relacionados à tarefa;
- executar `git status --short --branch` para não sobrescrever trabalho local;
- distinguir requisito confirmado de sugestão de roadmap;
- confirmar decisões de produto ambíguas em vez de inventá-las.

Durante a alteração:

- manter textos de UI em português do Brasil;
- manter regras em `src/features` e rotas finas em `app/`;
- usar centavos inteiros e datas civis explícitas nas regras financeiras;
- preservar persistência local e privacidade por padrão;
- evitar dependências sem justificativa.

Antes de concluir:

- revisar o diff;
- executar lint, typecheck e testes;
- informar claramente comandos que falharam e por quê;
- atualizar documentação e este arquivo se o estado ou uma decisão duradoura tiver
  mudado;
- não declarar como implementado algo que ainda seja apenas planejamento.

