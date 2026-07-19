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

- Expo SDK 57 e React Native 0.86;
- React 19;
- TypeScript 6 em modo `strict`;
- Expo Router com rotas tipadas;
- Expo Localization configurado para `pt-BR` no Android;
- nova arquitetura do React Native habilitada;
- ESLint com a configuração flat do Expo;
- testes baseados no test runner nativo do Node;
- identificador Android: `com.terramichael.saldododia`;
- scheme: `saldododia`;
- tema atual fixado como claro.

Requisitos documentados: Node.js 20.19 ou superior e npm 10 ou superior.

## 4. Estado atual do que foi implementado

### Fundação do aplicativo

- `app/_layout.tsx` cria a pilha raiz sem cabeçalho e usa status bar escura.
- `app/index.tsx` contém uma tela inicial estática com o nome **Saldo do Dia**, a
  frase **Descubra quanto você pode gastar hoje** e o botão **Começar**.
- O botão ainda não navega nem executa ação.
- O visual atual usa fundo verde muito claro, tipografia escura e ação principal
  verde. Ele é uma fundação, não um design system final.
- Não há assets binários versionados; eles foram deliberadamente removidos da
  fundação inicial.

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
- gastos já registrados no ciclo.

A regra implementada é:

```text
valor disponível = saldo atual - reserva - contas pendentes
limite diário = piso(valor disponível / quantidade de dias restantes)
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
- gastos registrados são somados e retornados como informação, mas **não são
  descontados novamente**, pois o saldo atual fornecido já representa o estado
  corrente do dinheiro;
- entradas monetárias que não sejam inteiros seguros e datas inválidas produzem
  `ErroCalculoFinanceiro` com código de domínio;
- a data do próximo recebimento anterior à data atual é rejeitada.

Os testes escritos para esse domínio cobrem cenário normal, centavos, reserva,
saldo negativo ou insuficiente, contas maiores que o saldo, recebimento hoje,
datas inválidas e prevenção de `NaN`/`Infinity`.

## 5. Persistência e dados

Ainda não há implementação de persistência. `src/storage` contém somente a
orientação arquitetural: módulos devem depender de abstrações locais, e dados
financeiros não devem sair do aparelho.

Antes de escolher uma tecnologia local, confirme as necessidades concretas dos
fluxos. Não instale uma biblioteca apenas para antecipar uma necessidade. A futura
camada deve permitir que os domínios permaneçam independentes do mecanismo físico
de armazenamento.

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

Existe uma atenção importante no estado atual: `npm test` executa
`node --test tests/*.test.js`, portanto alcança `tests/foundation.test.js`, mas não
executa diretamente `tests/daily-limit.test.ts`. O TypeScript desse teste é
verificado por `npm run typecheck`, porém os casos do domínio precisam ter seu
runner de execução integrado em uma etapa futura. Ao corrigir isso, escolha a
solução mínima compatível com Node/TypeScript e não esconda testes por meio de
conversões manuais frágeis.

O `README.md` ainda descreve o repositório como contendo somente a fundação e diz
que os fluxos financeiros não foram implementados. Interprete isso como “nenhum
fluxo completo de usuário foi implementado”: a regra isolada de `daily-limit` já
existe, embora ainda não esteja ligada a uma tela ou persistência.

## 8. O que ainda não existe

- fluxo funcional de onboarding;
- formulários para saldo, recebimento, reserva ou contas;
- navegação disparada pelo botão **Começar**;
- tela que exiba o limite diário calculado;
- cadastro e edição de gastos;
- histórico;
- persistência local concreta;
- componentes compartilhados ou design system formal;
- tratamento de acessibilidade além dos papéis básicos já presentes;
- testes de interface ou navegação;
- execução dos testes TypeScript pelo script `npm test`.

Não descreva esses itens como prontos e não invente requisitos de interação para
eles. Quando houver alternativas de produto relevantes, apresente-as ao usuário
antes de consolidar uma decisão.

## 9. Direção recomendada para as próximas etapas

Esta seção é um **roadmap sugerido**, não um conjunto de requisitos já aprovado:

1. integrar corretamente os testes do `daily-limit` ao comando oficial de testes;
2. definir o menor onboarding possível para coletar saldo atual, reserva, contas
   pendentes e próximo recebimento;
3. modelar os dados e contratos de armazenamento local necessários a esse fluxo;
4. conectar o botão inicial ao onboarding via Expo Router;
5. criar uma tela principal que apresente o limite diário e explique de forma
   humana como ele foi obtido;
6. adicionar registro de gastos e atualização coerente do saldo;
7. evoluir histórico e edição somente depois do ciclo principal funcionar.

Em cada etapa, mantenha estados de erro, valores negativos, datas-limite,
arredondamento e acessibilidade visíveis no desenho da solução.

## 10. Histórico disponível no Git

O histórico versionado registra esta evolução:

1. commit inicial;
2. remoção de assets binários da fundação;
3. merge da fundação Expo + TypeScript;
4. implementação do domínio de cálculo financeiro diário;
5. sincronização de branch e merge da fundação, domínio, UI e testes.

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

