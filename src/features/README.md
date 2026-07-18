# Módulos de produto

Os próximos fluxos serão criados aqui, isolados por domínio:

- `onboarding`: apresentação e configuração inicial;
- `balance`: saldo disponível;
- `income`: próximo recebimento;
- `bills`: contas pendentes;
- `expenses`: registro de gastos;
- `daily-limit`: funções puras para cálculo do limite diário, implementadas com valores inteiros em centavos;
- `history`: histórico local.

Cada módulo poderá reunir componentes, regras, tipos e testes próprios sem colocar lógica financeira nas rotas.

O saldo atual já representa a posição financeira depois dos gastos realizados. Por isso, os gastos do ciclo são totalizados para consulta, mas não são descontados novamente do valor disponível.
