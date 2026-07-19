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
  criarArmazenamentoPlanejamento,
  ErroArmazenamentoPlanejamento,
  type AdaptadorChaveValor,
  type ArmazenamentoPlanejamento,
} from './planning-storage';
export {
  confirmarPlanejamentoPersistido,
  registrarGastoPersistido,
  type PlanejamentoConfirmado,
} from './planning-service';
export {
  desserializarPlanejamento,
  ErroSerializacaoPlanejamento,
  serializarPlanejamento,
  validarEstadoPersistido,
  VERSAO_PLANEJAMENTO_PERSISTIDO,
  type EstadoPersistidoV1,
} from './serialization';

export const armazenamentoPlanejamento = criarArmazenamentoPlanejamento(
  adaptadorAsyncStorage,
);
