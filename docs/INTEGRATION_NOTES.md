# Brief de integração para o Codex

Este pacote entrega os assets finais de marca do aplicativo **Saldo do Dia**.

## Objetivo
Integrar:
- ícone principal do app;
- adaptive icon Android;
- ícone monocromático Android 13+;
- splash screen nativa;
- loading interno coerente com a splash;
- uso discreto do símbolo dentro do app.

## Estrutura principal
- `assets/brand/brand-mark.png`
- `assets/brand/app-icon.png`
- `assets/brand/adaptive-icon-foreground.png`
- `assets/brand/adaptive-icon-monochrome.png`
- `assets/brand/splash-icon.png`
- `assets/brand/README.md`
- `docs/brand-guide.png`

## Regras visuais
- preservar exatamente as proporções do símbolo;
- não adicionar texto dentro do ícone;
- usar `#F4F8F5` como fundo da splash, raiz React e loading;
- usar o símbolo apenas em pontos institucionais ou de estado;
- não exagerar em sombras ou gradientes;
- manter o tema claro nesta etapa.

## Sugestão de app.json
```json
{
  "expo": {
    "icon": "./assets/brand/app-icon.png",
    "backgroundColor": "#F4F8F5",
    "primaryColor": "#28734F",
    "android": {
      "package": "com.terramichael.saldododia",
      "backgroundColor": "#F4F8F5",
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/adaptive-icon-foreground.png",
        "monochromeImage": "./assets/brand/adaptive-icon-monochrome.png",
        "backgroundColor": "#F4F8F5"
      }
    },
    "plugins": [
      "expo-router",
      "expo-localization",
      "@react-native-community/datetimepicker",
      [
        "expo-splash-screen",
        {
          "image": "./assets/brand/splash-icon.png",
          "imageWidth": 160,
          "resizeMode": "contain",
          "backgroundColor": "#F4F8F5"
        }
      ]
    ]
  }
}
```

## Observação técnica
A implementação da splash deve chamar `SplashScreen.preventAutoHideAsync()` em escopo global e ocultar a splash somente depois que a hidratação inicial estiver pronta e a primeira tela correta tiver realizado layout.
