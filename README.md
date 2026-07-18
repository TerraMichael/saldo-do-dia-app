# Saldo do Dia

Aplicativo mobile que responde, de forma simples, **quanto você pode gastar hoje sem ficar sem dinheiro até o próximo recebimento**.

Este repositório contém somente a fundação técnica do produto. Os fluxos financeiros ainda não foram implementados.

O domínio de limite diário já está disponível como funções puras, sem dependência da interface. Valores monetários são representados por números inteiros em centavos.

## Stack

- React Native com Expo (SDK 57)
- TypeScript em modo estrito
- Expo Router para navegação baseada em arquivos
- Persistência exclusivamente local (a camada de armazenamento será implementada conforme os fluxos forem criados)
- npm

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

## Estrutura principal

```text
app/                  # Rotas e layouts do Expo Router
src/
  features/           # Domínios futuros (onboarding, saldo, contas, gastos etc.)
  storage/            # Abstrações futuras de persistência exclusivamente local
tests/                # Verificações automatizadas da fundação do projeto
```

As funcionalidades serão separadas por domínio dentro de `src/features`, evitando acoplamento entre as telas, as regras do cálculo diário e a persistência. Rotas devem apenas compor os fluxos e delegar regras de negócio aos respectivos módulos.
