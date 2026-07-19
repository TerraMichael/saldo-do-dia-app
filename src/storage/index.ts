import { adaptadorAsyncStorage } from './async-storage-adapter';
import { criarArmazenamentoPlanejamento } from './planning-storage';

export {
  atualizarPlanejamentoParaData,
  hidratarPlanejamento,
  type EstadoRestauracaoPlanejamento,
} from './hydration';
export { AdaptadorMemoria } from './memory-storage-adapter';
export {
  CHAVE_PLANEJAMENTO,
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
  registrarGastoPersistido,
  type PlanejamentoConfirmado,
} from './planning-service';
export {
  desserializarPlanejamento,
  desserializarPlanejamentoV1,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
  validarEstadoPersistidoV1,
  VERSAO_PLANEJAMENTO_PERSISTIDO,
  VERSAO_PLANEJAMENTO_LEGADO,
  type EstadoPersistidoV1,
  type EstadoPersistidoV2,
} from './serialization';
export {
  criarIdDeterministicoGastoLegado,
  migrarConfiguracaoV1ParaV2,
} from './migration';

export const armazenamentoPlanejamento = criarArmazenamentoPlanejamento(
  adaptadorAsyncStorage,
);
