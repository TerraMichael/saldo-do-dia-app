import { adaptadorAsyncStorage } from './async-storage-adapter';
import { criarArmazenamentoPlanejamento } from './planning-storage';

export {
  armazenamentoAparencia,
  carregarAparenciaComFallback,
  CHAVE_APARENCIA,
  criarArmazenamentoAparencia,
  type ArmazenamentoAparencia,
} from './appearance-storage';

export {
  atualizarPlanejamentoParaData,
  hidratarPlanejamento,
  type EstadoRestauracaoPlanejamento,
} from './hydration';
export { AdaptadorMemoria } from './memory-storage-adapter';
export {
  CHAVE_PLANEJAMENTO,
  CHAVE_PLANEJAMENTO_V2,
  CHAVE_PLANEJAMENTO_LEGADO,
  criarArmazenamentoPlanejamento,
  ErroArmazenamentoPlanejamento,
  type AdaptadorChaveValor,
  type ArmazenamentoPlanejamento,
} from './planning-storage';
export {
  confirmarPlanejamentoPersistido,
  editarGastoPersistido,
  excluirGastoPersistido,
  iniciarNovoCicloPersistido,
  registrarGastoPersistido,
  type PlanejamentoConfirmado,
} from './planning-service';
export {
  desserializarPlanejamento,
  desserializarPlanejamentoV1,
  desserializarPlanejamentoV2,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
  validarEstadoPersistidoV1,
  validarEstadoPersistidoV2,
  VERSAO_PLANEJAMENTO_PERSISTIDO,
  VERSAO_PLANEJAMENTO_LEGADO,
  type EstadoPersistidoV1,
  type EstadoPersistidoV2,
  type EstadoPersistidoV3,
} from './serialization';
export {
  criarIdDeterministicoGastoLegado,
  criarIdDeterministicoCicloMigrado,
  migrarConfiguracaoV1ParaV2,
  migrarConfiguracaoV2ParaV3,
} from './migration';

export const armazenamentoPlanejamento = criarArmazenamentoPlanejamento(
  adaptadorAsyncStorage,
);
