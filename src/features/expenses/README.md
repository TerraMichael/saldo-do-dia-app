# Gastos

Cada gasto possui ID, valor em centavos, data civil e uma descrição opcional de
até 80 caracteres. `normalizarDescricaoGasto` remove somente espaços externos,
preserva o conteúdo e omite a propriedade quando não há texto.

Registro e edição recebem `DadosFormularioGasto`, validam valor e descrição antes
de alterar a configuração e não usam a descrição em cálculos financeiros. Editar
somente a descrição não altera o saldo; excluir restitui somente o valor.

Categorias, edição da data, busca e filtros permanecem fora do escopo.
