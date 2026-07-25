export class ErroOperacaoEmAndamento extends Error {
  readonly codigo = 'OPERACAO_EM_ANDAMENTO';

  constructor() {
    super('Aguarde a operação atual terminar antes de tentar novamente.');
    this.name = 'ErroOperacaoEmAndamento';
  }
}

export class CoordenadorMutacoes {
  private emAndamento = false;

  get ocupado(): boolean {
    return this.emAndamento;
  }

  async executar<T>(operacao: () => Promise<T>): Promise<T> {
    if (this.emAndamento) {
      throw new ErroOperacaoEmAndamento();
    }

    this.emAndamento = true;
    try {
      return await operacao();
    } finally {
      this.emAndamento = false;
    }
  }
}
