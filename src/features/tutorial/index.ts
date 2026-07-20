export { TutorialProvider, useTutorial } from './context';
export {
  DICA_NOVO_RECEBIMENTO,
  ESTADO_TUTORIAL_PADRAO,
  PASSOS_APRESENTACAO,
  PASSOS_TOUR_HOME,
  resolverDestinoInicial,
  validarEstadoTutorial,
  VERSAO_TUTORIAL,
  type DestinoInicial,
  type EstadoTutorialV1,
  type PassoApresentacao,
  type PassoTourHome,
} from './model';
export {
  armazenamentoTutorial,
  CHAVE_TUTORIAL,
  criarArmazenamentoTutorial,
  type ArmazenamentoTutorial,
} from './storage';
export * from './tour-positioning';
