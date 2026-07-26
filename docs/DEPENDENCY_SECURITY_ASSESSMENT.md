# Avaliação de segurança das dependências

Data da repetição: 2026-07-25
Base comparada: `b0ceef3` / lockfile de 2026-07-20
Comandos: `npm audit --json`, `npm audit --omit=dev --json`,
`npm ls brace-expansion postcss tar uuid` e comparação do lockfile com `HEAD`.

## Resultado e causa da variação

| Escopo | Moderadas | Altas | Críticas |
|---|---:|---:|---:|
| árvore completa | 11 | 44 | 0 |
| `--omit=dev` | 11 | 35 | 0 |

Os números 44/35 não representam 44 advisories independentes. O npm propaga a
severidade pelos pacotes que levam a quatro advisories altos de dois pacotes:
um em `brace-expansion` e três em `postcss`.

As versões de `brace-expansion` 5.0.7, `postcss` 8.4.49, `tar` 7.5.20,
`uuid` 7.0.3, Expo 54.0.36 e React Native 0.81.5 são idênticas no lockfile-base
e no atual. Logo, o salto não foi causado por atualização desses pacotes.
Esta branch adicionou Jest/RNTL/c8 e, portanto, novos caminhos de
desenvolvimento para `brace-expansion`; isso explica parte da diferença entre
44 e 35. O aumento no escopo `--omit=dev` decorre da atualização da base de
advisories do npm: há versões corretivas de `brace-expansion` publicadas em
2026-07-23 e de PostCSS publicadas até 2026-07-24, depois do relatório-base.

## Advisories altos

### GHSA-mh99-v99m-4gvg — brace-expansion

- Afetado: `brace-expansion <=5.0.7`.
- Vetor: padrão de glob/chaves controlado pelo atacante com expansão sem limite,
  causando consumo de memória e encerramento do processo Node.
- Caminhos de produção declarados pelo npm:
  - `expo -> @expo/cli -> minimatch -> brace-expansion`;
  - `expo -> @expo/cli -> @react-native/dev-middleware -> ... -> glob ->
    minimatch -> brace-expansion`;
  - `expo -> babel-preset-expo -> @react-native/codegen -> glob -> minimatch ->
    brace-expansion`;
  - `react-native -> glob -> minimatch -> brace-expansion`.
- Caminhos adicionados nesta branch: RNTL/Jest, c8 e seus reporters/test-exclude.
  São exclusivamente executados nos testes.
- Dependências diretas de origem: `expo`, `react-native`,
  `@testing-library/react-native`, `jest-expo`, `c8`, ESLint.
- Empacotamento/dispositivo: os helpers de glob e o Expo CLI são ferramentas
  Node de build/teste; não são módulos importados por `app/` ou `src/` nem
  executados pelo Hermes no dispositivo.
- Exposição concreta: arquivos e padrões usados pelos scripts vêm do
  repositório/comandos do desenvolvedor. O aplicativo não recebe padrões glob
  do usuário nem de rede.
- Correção: versão corrigida existe na linha mais nova, mas o `npm audit`
  oferece Expo 57/React Native 0.86 ou downgrade incompatível de RNTL; não há
  correção suportada mantendo o conjunto oficial do SDK 54.
- Classificação: **não alcançável no aplicativo instalado**; risco de
  disponibilidade restrito ao ambiente local/CI caso se execute entrada de
  build não confiável.

### GHSA-qx2v-qp2m-jg93 — PostCSS stringify

- Afetado: `postcss <8.5.10`.
- Vetor: CSS controlado pelo atacante contendo fechamento `</style>` é
  serializado para uso em HTML sem escape, possibilitando XSS no documento
  consumidor.
- Caminho: `expo -> @expo/metro-config -> postcss@8.4.49`.
- Dependência direta de origem: `expo`.
- Presença na base: mesmo pacote/versão já existia no lockfile-base.
- Empacotamento/dispositivo: PostCSS é carregado pelo Metro no Node; não existe
  import de PostCSS no código React Native e ele não faz parte do runtime Hermes.
- Exposição concreta: não há página HTML produzida com CSS fornecido por usuário,
  editor de CSS, WebView ou ingestão remota de folhas de estilo.
- Correção: PostCSS 8.5.10 ou posterior; o grafo oficial do SDK 54 fixa 8.4.49 e
  a correção proposta pelo audit é Expo 57.
- Classificação: **não alcançável**.

### GHSA-6g55-p6wh-862q — PostCSS sourceMappingURL

- Afetado: `postcss <=8.5.11`.
- Vetor: comentário `sourceMappingURL` em CSS controlado pelo atacante força
  leitura de arquivo local durante processamento Node.
- Caminho/origem/base/empacotamento: iguais ao advisory PostCSS anterior.
- Exposição concreta: Metro processa somente fontes versionadas e dependências
  instaladas durante o build; o aplicativo não oferece upload ou processamento
  de CSS. No dispositivo não existe PostCSS nem acesso desse código ao
  AsyncStorage financeiro.
- Correção: PostCSS posterior a 8.5.11, não disponível pelo conjunto suportado
  do SDK 54 sem override não validado ou atualização ampla.
- Classificação: **não alcançável no aplicativo**; ambiente de build deve evitar
  dependências/CSS de origem não confiável.

### GHSA-r28c-9q8g-f849 — PostCSS path traversal em source map

- Afetado: `postcss <=8.5.17`.
- Vetor: CSS controlado pelo atacante referencia source map com travessia de
  diretório, expondo arquivo ao processo que executa o build.
- Caminho/origem/base/empacotamento: `expo -> @expo/metro-config -> postcss`,
  já presente na base e não empacotado no runtime.
- Exposição concreta: não há processamento de CSS fornecido pelo usuário ou por
  servidor. O repositório não implementa download de código/estilos.
- Correção: PostCSS 8.5.18 ou posterior; a resolução suportada indicada exige
  Expo 57.
- Classificação: **não alcançável no aplicativo**.

## Advisories moderados relacionados

- `tar <=7.5.20`, via `expo -> @expo/cli`: DoS por caminho especialmente longo
  durante seleção de membros. Ferramenta Node, não runtime; correção transitiva
  não foi aplicada isoladamente para não desalinhar o SDK.
- `uuid <11.1.1`, via `expo -> @expo/config-plugins -> xcode`: bounds check nas
  variantes UUID que recebem buffer. Ferramenta de configuração Apple; não é o
  gerador `expo-crypto` usado pelos ciclos e não roda no Android instalado.

## Decisão

Não há advisory alto alcançável por entrada do usuário no APK ou executado no
dispositivo. O risco residual é aceito temporariamente para o ambiente de
build/teste controlado, sem ocultar as contagens brutas. Não foi usado
`npm audit fix --force`, override transitivo ou atualização isolada de
Expo/React Native. Atualizar o SDK permanece uma pendência técnica e deve repetir
esta análise.
