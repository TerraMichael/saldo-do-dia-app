# Validação Android da Release Candidate

Data: 25/07/2026

Branch: `chore/hardening-pre-release`

Commit de produto testado: `bb6a34db17631e20f2ac507ed06b25256ae5fa1d`

## Artefato

- EAS Build: `1315f832-5f06-4559-ae6d-f19f0edc7d97`
- Perfil: `preview`
- Package: `com.terramichael.saldododia`
- Versão: `1.0.0`
- Version code: `1`
- SHA-256: `87AE3CCEEC8B909CE5894475BB121EA79CC1D86C5754DDB9CC9A4D515ADC88D7`
- Assinatura: APK Signature Scheme v2; certificado com SHA-256
  `80D0F47AC3524613F43ED79F94BD4D6089066F1A1372A27CA1D1209D31A0E2D4`.

O manifesto efetivo preserva `allowBackup=false`. A `MainActivity` é
exportada somente para launcher e deep links. Os providers identificados
são não exportados. Não foram encontrados services ou receivers inesperados.

## Ambiente executado

- Emulador: Android Emulator, perfil Pixel 6 (`SaldoDoDia_API35`)
- Android: 15 / API 35
- Arquitetura: x86_64
- Resolução principal: 1080 x 2400
- Densidade principal: 420 dpi
- Idioma: português do Brasil
- Java: JBR 21.0.10
- Android Platform Tools: 37.0.0
- Maestro: 2.7.0

O transporte ADB apresentou ocorrências transitórias de `device offline`
ao iniciar novas sessões do Maestro depois do reinício do Windows. Um cold
boot do mesmo AVD estabilizou o ambiente. Essas falhas ocorreram antes do
primeiro comando de produto e não foram classificadas como falha do app.

### Dispositivo físico Samsung

- Fabricante e modelo: Samsung Galaxy S24 Ultra (`SM-S928B`)
- Android: 16 / API 36
- Arquitetura: arm64-v8a
- Resolução: 1440 x 3120
- Densidade física: 600 dpi
- Densidade configurada: 560 dpi
- Driver ADB: Samsung Electronics Co., Ltd. 2.21.4.0
- Serial usado explicitamente no Maestro: `RQCX30463KY`

Todos os comandos de shell destinados ao Galaxy foram executados com
`adb -d`. Todos os fluxos Maestro foram executados com
`--udid RQCX30463KY`, mantendo o emulador conectado sem risco de seleção
acidental.

## Resultado dos fluxos Maestro

| Fluxo | Resultado no APK | Evidência principal |
| --- | --- | --- |
| 01 primeiro acesso | passou | instalação limpa e apresentação |
| 02 planejamento | passou | formulário, revisão, persistência e tour de quatro passos |
| 03 registrar gasto | passou | registro real e feedback posterior à persistência |
| 04 editar e excluir | passou | cancelamento, edição real, exclusão real e estado vazio |
| 05 novo ciclo | passou | revisão, arquivamento, ciclo novo vazio e ciclo anterior listado |
| 06 persistência | passou | force-stop, nova abertura e histórico disponível |
| 07 configurações | passou | temas, Ajuda, versão, release e assinatura Leahcim |

Os sete fluxos passaram tanto no emulador quanto no Galaxy S24 Ultra físico.
No Galaxy, não houve `FATAL EXCEPTION`, ANR,
`RetryableMountingLayerException` ou `Unable to find viewState`.

Os artefatos locais do Maestro, screenshots e logs ficam fora do
repositório em `%LOCALAPPDATA%\AndroidValidation\reports`.

## Instalação, reinicialização e modo offline

- Instalação limpa: passou.
- Reinstalação com `adb install -r`: passou com a mesma assinatura.
- Dados após reinstalação: preservados.
- Force-stop e abertura pelo launcher: passaram.
- Persistência após partida fria do processo: passou.
- Wi-Fi e dados móveis desativados: registro de gasto, force-stop, reabertura
  e histórico passaram sem dependência de rede.
- Reinício completo do Windows e cold boot do AVD: o APK e os dados
  permaneceram utilizáveis.
- Instalação limpa no Galaxy S24 Ultra: passou.
- Modo avião real no Galaxy: registro, persistência, force-stop e reabertura
  passaram; o modo avião foi restaurado ao estado anterior.
- Fonte ampliada no Galaxy: Home, histórico, temas, Ajuda e Sobre passaram
  com escala 1,3; a escala original 0,9 foi restaurada.

Isso não equivale a uma atualização de loja: não existe APK anterior com
version code e assinatura adequados para validar esse cenário.

## Tema e tamanhos

- Tema escuro forçado: passou e foi capturado.
- Tema claro forçado: passou e foi capturado.
- Retorno para tema do aparelho: passou.
- Layout pequeno: 720 x 1280, 320 dpi, passou.
- Layout principal: 1080 x 2400, 420 dpi, passou.
- Layout equivalente a tablet: 1600 x 2560, 320 dpi, passou.

Os tamanhos pequeno e tablet foram exercitados por overrides oficiais
`adb shell wm size/density` no mesmo emulador. Isso valida responsividade,
mas não representa hardware de fabricantes diferentes.

## Defeitos encontrados e corrigidos

Durante o fluxo real de persistência, duas versões anteriores do preview
expuseram uma exceção de montagem Fabric/Reanimated ao navegar imediatamente
depois de uma mutação:

`RetryableMountingLayerException: Unable to find viewState`

A correção final mantém estável o slot do indicador de processamento do
`AppButton` e cancela animações de pressão no unmount. A regressão Node,
UI, lint, typecheck, Expo Doctor e export Android passou antes da geração
do APK `bb6a34d`. Os fluxos reais de planejamento, registro, edição,
exclusão e novo ciclo passaram nesse APK sem a exceção.

## Gates ainda manuais

Não foram aprovados nesta execução:

- TalkBack operado por uma pessoa;
- aparelho físico Motorola;
- atualização real de loja;
- reinício completo do Galaxy e abertura após boot;
- Play Console e publicação.

O Galaxy S24 Ultra físico está aprovado nos fluxos automatizados, modo avião,
fonte ampliada, temas e partida fria do processo. TalkBack continua pendente
porque exige navegação e avaliação humanas. A Draft PR deve permanecer sem
merge até execução dos itens restantes ou decisão humana explícita sobre
esses riscos residuais.

## Checklist humano restante

1. Ativar TalkBack no Galaxy e validar ordem, labels, estados busy/disabled,
   campos, erros, valores monetários, modais,
   exclusão destrutiva, tour e isolamento do conteúdo atrás do overlay.
2. Confirmar que não há anúncios duplicados nem elementos invisíveis focáveis.
3. Reiniciar completamente o Galaxy e confirmar dados e preferências.
4. Instalar e repetir os fluxos críticos em um Motorola compatível.
5. Registrar modelo, Android, resolução, densidade, resultado e evidências.

## Decisão desta rodada

**BLOQUEADO PARA MERGE**

O APK e os sete fluxos automatizados reais foram aprovados no emulador e no
Galaxy S24 Ultra físico. O bloqueio permanece nos gates humanos de TalkBack,
reinício completo do Galaxy e validação em Motorola físico. A PR permanece
Draft e nenhum merge ou envio à loja foi feito.
