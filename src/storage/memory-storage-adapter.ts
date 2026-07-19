import type { AdaptadorChaveValor } from './planning-storage';

export class AdaptadorMemoria implements AdaptadorChaveValor {
  private readonly dados = new Map<string, string>();

  falharLeitura = false;
  falharGravacao = false;
  falharRemocao = false;

  constructor(dadosIniciais: Readonly<Record<string, string>> = {}) {
    Object.entries(dadosIniciais).forEach(([chave, valor]) => {
      this.dados.set(chave, valor);
    });
  }

  async obter(chave: string): Promise<string | null> {
    if (this.falharLeitura) {
      throw new Error('Falha simulada de leitura.');
    }
    return this.dados.get(chave) ?? null;
  }

  async salvar(chave: string, valor: string): Promise<void> {
    if (this.falharGravacao) {
      throw new Error('Falha simulada de gravação.');
    }
    this.dados.set(chave, valor);
  }

  async remover(chave: string): Promise<void> {
    if (this.falharRemocao) {
      throw new Error('Falha simulada de remoção.');
    }
    this.dados.delete(chave);
  }
}
