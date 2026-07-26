# E2E Android

Os fluxos em `.maestro/` usam `com.terramichael.saldododia` e dados fictícios. Requerem Maestro instalado e um APK preview/release compatível já instalado.

```powershell
npm run validate:e2e
maestro test .maestro
```

Antes de instalação limpa, execute `adb shell pm clear com.terramichael.saldododia`. Registre versão do APK, aparelho/API, resultado e capturas das falhas. Os fluxos cobrem apresentação, planejamento, gastos, novo ciclo, persistência e Configurações.

Neste PR somente a estrutura é validada. Não há APK nem execução real; seleção de datas e variações de layout podem exigir ajustes após observar o binário instalado.
