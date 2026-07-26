# Especificação do motor financeiro

Todos os valores monetários são números inteiros de centavos. Gastos registrados já estão refletidos em `saldoAtual`; portanto, nunca são subtraídos novamente de `valorDisponivel`.

## Entradas e derivados

- `saldoAtual`: saldo corrente real, já descontados os gastos registrados.
- `reserva`: valor protegido, não negativo.
- `contasPendentes`: compromissos ainda não pagos, não negativos.
- `totalGastosRegistrados`: soma segura de `gasto.valor` em todo o ciclo.
- `totalGastosHoje`: soma segura dos gastos cuja `data` é `dataAtual`.
- `quantidadeDeDiasRestantes`: diferença civil inclusiva até o recebimento, no mínimo 1.

## Fórmulas

```text
valorDisponivel = saldoAtual - reserva - contasPendentes
valorDisponivelNoInicioDoDia = valorDisponivel + totalGastosHoje
limitePlanejadoHoje = floor(valorDisponivelNoInicioDoDia / quantidadeDeDiasRestantes)
restanteHoje = max(0, limitePlanejadoHoje - totalGastosHoje)
limitePermitidoHoje = max(0, limitePlanejadoHoje)
excedenteHoje = max(0, totalGastosHoje - limitePermitidoHoje)
quantidadeDeDiasFuturos = max(0, quantidadeDeDiasRestantes - 1)
valorDisponivelParaDiasFuturos = valorDisponivel - restanteHoje
limiteDiasFuturos =
  quantidadeDeDiasFuturos > 0
    ? floor(valorDisponivelParaDiasFuturos / quantidadeDeDiasFuturos)
    : null
```

`Math.floor` é deliberado: positivos arredondam para baixo e negativos em direção a menos infinito. Isso é conservador; a diferença da divisão é inferior a um centavo por período distribuído. Alterar para `trunc`, `ceil` ou `round` exige decisão explícita de produto.

Todas as entradas e todos os resultados monetários devem permanecer inteiros seguros. Datas civis usam `AAAA-MM-DD`, sem `toISOString`.
