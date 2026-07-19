# Assets de marca — Saldo do Dia

Este pacote contém os assets prontos para integração no aplicativo **Saldo do Dia**.

## Arquivos

- `brand-mark.png` — símbolo principal com fundo transparente, para uso interno no app.
- `app-icon.png` — ícone completo com fundo claro, pronto para configuração em `app.json`.
- `adaptive-icon-foreground.png` — foreground transparente para adaptive icon do Android.
- `adaptive-icon-monochrome.png` — versão monocromática para themed icons do Android 13+.
- `splash-icon.png` — símbolo para a splash screen nativa e para a tela interna de loading.

## Especificações

- Formato: PNG
- Resolução: 1024x1024 px
- Fundo padrão da marca: `#F4F8F5`

## Paleta

- Verde principal: `#28734F`
- Verde escuro: `#1E6847`
- Verde suave: `#E3F2E8`
- Fundo: `#F4F8F5`
- Texto: `#17251E`
- Destaque do dia: `#FFC857`

## Direção visual

O símbolo combina:

- **ciclo financeiro**: círculo externo;
- **dia atual**: disco amarelo superior;
- **orçamento distribuído**: cinco segmentos ascendentes, representando divisão e planejamento do saldo até o próximo recebimento.

A intenção é comunicar **finanças + dia + controle**, evitando aparência genérica de banco e mantendo legibilidade em tamanhos pequenos.

## Sugestão de integração no Expo

- `icon`: `./assets/brand/app-icon.png`
- `android.adaptiveIcon.foregroundImage`: `./assets/brand/adaptive-icon-foreground.png`
- `android.adaptiveIcon.monochromeImage`: `./assets/brand/adaptive-icon-monochrome.png`
- `expo-splash-screen.image`: `./assets/brand/splash-icon.png`

## Observações

- O adaptive icon deve usar `backgroundColor: "#F4F8F5"`.
- A splash e a tela de loading devem manter o mesmo fundo `#F4F8F5` para evitar flash visual.
- Os arquivos foram preparados para integração direta pelo Codex.
- A integração usa `imageWidth: 160` e `resizeMode: "contain"` no plugin
  `expo-splash-screen`; os PNGs originais permanecem inalterados.
- A aparência nativa deve ser validada em preview APK, pois o Expo Go não
  reproduz integralmente splash, adaptive icon e themed icon.
