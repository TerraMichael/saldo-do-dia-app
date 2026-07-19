export const LIMITE_DESCRICAO_GASTO = 80;

export class ErroDescricaoGasto extends Error {
  readonly codigo = 'DESCRICAO_MUITO_LONGA';

  constructor() {
    super(`A descrição deve ter no máximo ${LIMITE_DESCRICAO_GASTO} caracteres.`);
    this.name = 'ErroDescricaoGasto';
  }
}

export function normalizarDescricaoGasto(
  valor: string | undefined,
): string | undefined {
  if (valor === undefined) return undefined;

  const descricao = valor.trim();
  if (!descricao) return undefined;
  if (descricao.length > LIMITE_DESCRICAO_GASTO) {
    throw new ErroDescricaoGasto();
  }

  return descricao;
}
