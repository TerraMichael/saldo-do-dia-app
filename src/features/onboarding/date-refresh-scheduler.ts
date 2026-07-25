import {
  CoordenadorMutacoes,
  ErroOperacaoEmAndamento,
} from '../../storage/mutation-coordinator';

type AtualizarData = (podePublicar: () => boolean) => Promise<void>;

export class AgendadorAtualizacaoData {
  private ativo = true;
  private agendado = false;
  private execucao: Promise<void> | null = null;

  constructor(
    private readonly coordenador: CoordenadorMutacoes,
    private readonly atualizar: AtualizarData,
  ) {}

  solicitar(): Promise<void> {
    if (!this.ativo) return Promise.resolve();
    if (this.execucao) return this.execucao;

    this.agendado = true;
    const execucao = this.executarQuandoPossivel();
    this.execucao = execucao;
    void execucao.finally(() => {
      if (this.execucao === execucao) this.execucao = null;
    });
    return execucao;
  }

  desmontar(): void {
    this.ativo = false;
  }

  private async executarQuandoPossivel(): Promise<void> {
    try {
      while (this.ativo) {
        await this.coordenador.aguardarLiberacao();
        if (!this.ativo) return;

        try {
          await this.coordenador.executar(
            () => this.atualizar(() => this.ativo),
          );
          return;
        } catch (erro) {
          if (erro instanceof ErroOperacaoEmAndamento) continue;
          return;
        }
      }
    } finally {
      this.agendado = false;
    }
  }
}
