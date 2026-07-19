import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { AppStateView } from '../../../ui';
import { useOnboarding } from '../context';

export function PlanningStateScreen() {
  const router = useRouter();
  const {
    status,
    falhaHidratacao,
    tentarHidratar,
    recomecarPlanejamento,
  } = useOnboarding();
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const acaoEmAndamento = useRef(false);

  async function executar(acao: () => Promise<void>) {
    if (acaoEmAndamento.current) return;
    acaoEmAndamento.current = true;
    setProcessando(true);
    setErroAcao(null);
    try {
      await acao();
    } catch (erro) {
      setErroAcao(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível concluir a operação. Tente novamente.',
      );
    } finally {
      acaoEmAndamento.current = false;
      setProcessando(false);
    }
  }

  if (status === 'carregando') {
    return (
      <AppStateView
        description="Aguarde só um instante."
        loading
        title="Carregando seu planejamento"
      />
    );
  }

  if (status === 'expirado') {
    return (
      <AppStateView
        description="A data do seu recebimento passou. Atualize seu planejamento."
        feedback={erroAcao}
        primaryAction={{
          label: 'Já recebi — iniciar novo ciclo',
          onPress: () => router.push('/novo-ciclo'),
          processing: processando,
        }}
        secondaryAction={{
          label: 'Ainda não recebi — ajustar planejamento',
          onPress: () => router.replace('/onboarding'),
          variant: 'secondary',
        }}
        title="Atualize seu planejamento"
      />
    );
  }

  const dadosCorrompidos =
    status === 'erro' && falhaHidratacao?.origem === 'dados-corrompidos';

  return (
    <AppStateView
      description={
        falhaHidratacao?.mensagem ??
        'Não foi possível carregar os dados do planejamento.'
      }
      feedback={erroAcao}
      primaryAction={
        dadosCorrompidos
          ? {
              label: 'Recomeçar planejamento',
              onPress: () =>
                void executar(async () => {
                  await recomecarPlanejamento();
                  router.replace('/');
                }),
              processing: processando,
              variant: 'destructive',
            }
          : {
              label: 'Tentar novamente',
              onPress: () => void executar(tentarHidratar),
              processing: processando,
            }
      }
      title="Não foi possível carregar"
    />
  );
}
