# Registro de decisão de cobertura do motor financeiro

Data: 2026-07-25
Ferramentas: Node 24.17.0, `tsx` 4.23.1, c8 12.0.0 e V8.

## Critério

O gate exige 100% de statements, functions, lines e de branches semânticas.
Uma branch só é semântica quando representa uma escolha existente no TypeScript
fonte. Branches introduzidas pelo wrapper CommonJS, loader, transpilação ou
remapeamento não são omitidas do percentual bruto, mas não representam decisões
do motor.

## Branch 0

- Arquivo remapeado: `src/features/daily-limit/index.ts`.
- Local informado: linha 153, colunas 16–36.
- Fonte original: declaração
  `export function calcularPlanoDiario(entrada: EntradaCalculoDiario)`.
- Branch informada: range único com contador zero.
- Transpilado: `function calcularPlanoDiario(entrada) { ... }`, precedido pelo
  getter CommonJS `calcularPlanoDiario: () => calcularPlanoDiario`.
- Source map: o range gerado do getter/export é remapeado para o identificador da
  declaração, embora não exista `if`, ternário, fallback ou short-circuit nessa
  posição.
- Conclusão: branch artificial de exportação/remapeamento. A função está com
  100% de functions, statements e lines e é executada pela matriz de 720
  cenários, pelo oráculo, por 1.000 propriedades, metamorfismos e sequências.

## Branch 5

- Arquivo remapeado: `src/features/daily-limit/index.ts`.
- Local informado: linha 1, colunas 0–6.
- Fonte original: início da declaração `const MILISSEGUNDOS_POR_DIA`.
- Branch informada: range único com contador zero.
- Transpilado relevante: helpers `__export`, `__copyProps` e `__toCommonJS`,
  incluindo as decisões de cópia de propriedades do wrapper de módulo.
- Source map: o helper não possui correspondente semântico no TypeScript e seu
  range é ancorado no começo do módulo.
- Conclusão: branch artificial do wrapper CommonJS. A constante e todos os
  caminhos de datas são exercitados por datas válidas, inválidas, viradas de
  mês/ano e fevereiro bissexto.

## Decisão

O c8 bruto permanece em 95,45% de branches para este arquivo. A cobertura
semântica é 100%. Nenhum `ignore` foi adicionado, nenhuma meta foi reduzida e
nenhuma regra financeira foi modificada. As dez mutações financeiras de
sanidade continuam eliminadas pelos testes existentes.
