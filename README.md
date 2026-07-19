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
somente o total gasto no ciclo, sem
histórico individual.

## Persistência local

Somente a configuração que serve como fonte de verdade é armazenada no
AsyncStorage, usando a chave versionada
`@saldo-do-dia/planejamento:v1`. O formato atual contém `versao: 1` e
`configuracao`; o resultado financeiro nunca é persistido e sempre é recalculado
por `calcularPlanoDiario`.

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
  storage/            # Contratos, validação e adaptador AsyncStorage
tests/                # Verificações automatizadas da fundação do projeto
```

As funcionalidades serão separadas por domínio dentro de `src/features`, evitando acoplamento entre as telas, as regras do cálculo diário e a persistência. Rotas devem apenas compor os fluxos e delegar regras de negócio aos respectivos módulos.

## Continuidade no Codex CLI

O arquivo [`CONTEXTO_CODEX.md`](./CONTEXTO_CODEX.md) consolida a visão do produto,
as decisões técnicas, o estado atual, as limitações conhecidas e um prompt de
início para continuar o desenvolvimento em uma nova sessão do Codex CLI.
