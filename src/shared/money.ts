export type CodigoErroMoeda = 'VALOR_INVALIDO' | 'VALOR_FORA_INTERVALO';

export class ErroMoeda extends Error {
  constructor(
    public readonly codigo: CodigoErroMoeda,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroMoeda';
  }
}

const FORMATO_MOEDA_BRASILEIRA = /^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/;

export function converterMoedaBrasileiraParaCentavos(valor: string): number {
  const normalizado = valor.trim().replace(/^R\$\s?/, '').replace(/\s/g, '');

  if (!normalizado || !FORMATO_MOEDA_BRASILEIRA.test(normalizado)) {
    throw new ErroMoeda('VALOR_INVALIDO', 'Informe um valor válido, como R$ 1.234,56.');
  }

  const negativo = normalizado.startsWith('-');
  const semSinal = negativo ? normalizado.slice(1) : normalizado;
  const [reaisTexto, centavosTexto = ''] = semSinal.split(',');
  const reais = Number(reaisTexto.replace(/\./g, ''));
  const centavos = Number(centavosTexto.padEnd(2, '0'));
  const resultado = (reais * 100 + centavos) * (negativo ? -1 : 1);

  if (!Number.isSafeInteger(resultado)) {
    throw new ErroMoeda('VALOR_FORA_INTERVALO', 'O valor informado é grande demais.');
  }

  return resultado;
}

export function formatarCentavosComoMoedaBrasileira(valor: number): string {
  if (!Number.isSafeInteger(valor)) {
    throw new ErroMoeda('VALOR_INVALIDO', 'O valor monetário é inválido.');
  }

  const negativo = valor < 0;
  const absoluto = Math.abs(valor);
  const reais = Math.floor(absoluto / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const centavos = (absoluto % 100).toString().padStart(2, '0');

  return `R$ ${negativo ? '-' : ''}${reais},${centavos}`;
}
