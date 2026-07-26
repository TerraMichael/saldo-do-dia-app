export class ErroOperacaoEmAndamento extends Error {
  readonly codigo = 'OPERACAO_EM_ANDAMENTO';

  constructor() {
    super('Aguarde a operação atual terminar antes de tentar novamente.');
    this.name = 'ErroOperacaoEmAndamento';
  }
}

export class CoordenadorMutacoes {
  private emAndamento = false;
  private readonly aguardandoLiberacao = new Set<() => void>();

  get ocupado(): boolean {
    return this.emAndamento;
  }

  aguardarLiberacao(): Promise<void> {
    if (!this.emAndamento) return Promise.resolve();

    return new Promise((resolve) => {
      this.aguardandoLiberacao.add(resolve);
    });
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
      const aguardando = [...this.aguardandoLiberacao];
      this.aguardandoLiberacao.clear();
      aguardando.forEach((resolver) => resolver());
    }
  }
}
