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
  verde. Ele é uma fundação, não um design system final.
- Não há assets binários versionados; eles foram deliberadamente removidos da
  fundação inicial.

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
- A Home destaca quanto ainda pode ser gasto hoje e mostra gasto de hoje, limite
  planejado do dia, eventual excedente, previsão a partir de amanhã, saldo atual,
  valor disponível, contas, reserva, dias restantes e data do recebimento.
- Em valor disponível zero, informa que não há dinheiro livre.
- Em déficit, preserva o resultado negativo do domínio, mas mostra limite visual
  de `R$ 0,00` e destaca separadamente o valor que falta.
- **Editar planejamento** retorna ao onboarding com os dados atuais preenchidos.
- **Registrar gasto** abre um formulário de valor único; após confirmar, saldo,
  total gasto e orçamento restante de hoje são atualizados em memória.
- O provider do planejamento fica no layout raiz, hidrata a configuração local e
  compartilha configuração e resultado entre onboarding e Home.

### Registro de gastos em memória

- `src/features/expenses/register-expense.ts` contém o caso de uso puro.
- Ao registrar `X`, o saldo corrente é reduzido por `X`, o gasto datado
  `{ valor: X, data: dataAtual }` é anexado a `gastosRegistrados`, `dataAtual`
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
- A Home mostra o total do ciclo e os agregados do dia; lista, edição e exclusão
  ficam fora desta etapa.
- Configuração e resultado são mantidos juntos em uma única atualização do
  Context, somente depois que a configuração foi persistida.
- Parsing e formatação monetária genéricos ficam em `src/shared/money.ts`, com os
  exports anteriores do onboarding preservados.

### Domínios previstos

O catálogo atual em `src/features/index.ts` prevê:

1. `onboarding` — apresentação e configuração inicial;
2. `balance` — saldo disponível;
3. `income` — próximo recebimento;
4. `bills` — contas pendentes;
5. `expenses` — registro de gastos;
6. `daily-limit` — cálculo do limite diário;
7. `history` — histórico local.

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
`@saldo-do-dia/planejamento:v1`, e o documento possui o formato:

```ts
{
  versao: 1;
  configuracao: EntradaCalculoDiario;
}
```

Somente a configuração, que é a fonte de verdade, é armazenada.
`ResultadoCalculoDiario` nunca é persistido: ele é recalculado por
`calcularPlanoDiario` após cada leitura ou operação.

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

Confirmação do onboarding e registro de gasto seguem a ordem calcular, persistir
configuração e então publicar configuração/resultado juntos. Uma falha de
gravação mantém o estado anterior consistente e permite tentar novamente.

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
`tests/expenses.test.ts` e `tests/storage.test.ts` com o test runner nativo do
Node.js por meio do `tsx`.
Os caminhos explícitos mantêm o comando compatível com Windows PowerShell sem
depender da expansão de globs feita pelo shell.

O `README.md` ainda descreve o repositório como contendo somente a fundação e diz
que os fluxos financeiros não foram implementados. Interprete isso como “nenhum
fluxo completo de usuário foi implementado”: a regra isolada de `daily-limit` já
existe, embora ainda não esteja ligada a uma tela ou persistência.

## 8. O que ainda não existe

- histórico detalhado, edição e exclusão de gastos;
- histórico;
- componentes compartilhados ou design system formal;
- tratamento de acessibilidade além dos papéis básicos já presentes;
- testes de interface ou navegação;

Não descreva esses itens como prontos e não invente requisitos de interação para
eles. Quando houver alternativas de produto relevantes, apresente-as ao usuário
antes de consolidar uma decisão.

## 9. Direção recomendada para as próximas etapas

Esta seção é um **roadmap sugerido**, não um conjunto de requisitos já aprovado:

1. evoluir histórico e edição somente depois do ciclo principal funcionar;
2. definir migrações somente quando uma versão futura do formato exigir.

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

