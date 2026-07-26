# Matriz de hardening da interface

Data: 2026-07-25
Comando: `npm run test:ui`
Infraestrutura: Jest Expo, React Native Testing Library e componentes reais das features.

Os nomes abaixo identificam testes em `tests-ui/feature-flows.test.tsx`. Os sete
contratos compartilhados permanecem em `tests-ui/release-critical.test.tsx`.
Router, armazenamento e APIs nativas são substituídos somente nas fronteiras.

## Apresentação e onboarding

| Requisito | Evidência comportamental |
|---|---|
| Passos 1–3, Continuar, Anterior, pular e concluir | `apresentação avança, retorna e conclui antes de navegar` e `revisão da apresentação não altera flags e retorna às configurações` |
| Quatro campos e textos de ajuda | `formulário mostra os quatro campos, ajudas e rejeita negativos` |
| Saldo inválido | `saldo inválido impede revisão e mantém os dados do formulário` |
| Reserva/contas negativas e data anterior | `formulário mostra... rejeita negativos` e `formulário rejeita reserva negativa e data anterior` |
| Revisão e publicação única do rascunho | `formulário válido publica rascunho uma vez e abre revisão` |
| Processing, duplo toque e persistência antes da navegação | `revisão bloqueia duplo toque e navega só após persistência` |
| Falha, formulário preservado e nova tentativa | `falha de persistência preserva revisão e permite tentar novamente` |

## Home

| Requisito | Evidência comportamental |
|---|---|
| Estado positivo e ações principais | `estado positivo mantém foco e ações principais` |
| Valor livre zero | `valor livre zero mostra zero sem déficit fictício` |
| Déficit | `déficit permanece explícito e valor gastável não fica negativo` |
| Gasto acima do limite | `gasto acima do limite mostra excedente e restante zero` |
| Detalhes recolhidos/expandidos e conteúdo financeiro | `detalhes começam recolhidos, expandem e recolhem` |
| Navegações únicas, inclusive novo recebimento | `ações navegam uma única vez para gasto, histórico, configurações e novo recebimento` |
| Loading sem Home parcial | `loading não mostra Home parcialmente pronta` |
| Erro e retry único | `erro oferece retry único sem expor a Home` |
| Recuperação somente após ação explícita | `dados corrompidos só recomeçam após ação explícita` |

## Registro, edição e exclusão

| Requisito | Evidência comportamental |
|---|---|
| Obrigatório, zero, negativo e inválido | `registro valida valor obrigatório...` e os três casos `registro rejeita valor inválido` |
| Descrição opcional, vazia e limite | `descrição vazia é omitida e descrição acima do limite é rejeitada` |
| Registro único, processing, sucesso após salvar | `registro bloqueia duplicidade, dá sucesso e navega após persistir` |
| Falha sem sucesso/navegação, dados preservados e retry | `falha no registro não navega e permite repetir` |
| Edição preenchida e no-op | `edição carrega dados e no-op não apresenta falso sucesso` |
| Edição única e sucesso após salvar | `edição bloqueia duplo toque e só navega após persistência` |
| Edição ausente/falha | `gasto inexistente apresenta recuperação segura` e `falha de edição preserva formulário e não navega` |
| Exclusão: cancelar, confirmar uma vez e sucesso após salvar | `cancelar exclusão não muta; confirmar bloqueia duplicidade e mostra sucesso` |
| Exclusão: falha mantém item e permite retry | `falha de exclusão mantém item e permite tentar novamente` |

## Novo recebimento

| Requisito | Evidência comportamental |
|---|---|
| Dica inicial, Entendi e falha de persistência sem bloquear sessão | `dica do novo recebimento aparece uma vez e fecha na sessão mesmo se salvar falhar` |
| Dica vista não reaparece | `dica vista não reaparece` |
| Formulário completo e validações | `formulário de novo ciclo mostra campos, valida negativos e não prepara rascunho inválido` |
| Revisão e cancelamento sem arquivar | `formulário válido prepara uma única revisão e cancelar não arquiva` e `cancelar formulário limpa somente rascunho e não cria ciclo` |
| Aviso permanente, processing, duplo toque e persistência antes da navegação | `revisão de novo ciclo preserva aviso, bloqueia duplicidade e navega após salvar` |
| Falha preserva fluxo e permite retry | `falha no novo ciclo não navega e libera uma nova tentativa` |
| ID inválido não duplica nem navega | `ID inválido no novo ciclo não navega nem permite duplicação` |

A criação de exatamente um ciclo novo, o arquivamento imutável de exatamente um
ciclo anterior, a preservação dos gastos e IDs duplicados são ainda comprovados
nos testes Node de `new-cycle`, `cycle-history`, `financial-sequences` e
`storage-hardening`; a integração UI comprova que a tela chama essa operação uma
única vez e somente navega depois que ela resolve.

## Tour da Home

| Requisito | Evidência comportamental |
|---|---|
| Abre pendente e isola fundo | `Home pendente monta o tour e isola o conteúdo financeiro` |
| Não abre concluído | `tour concluído não abre e falha de gravação não reabre na sessão` |
| Quatro passos, Próximo, Anterior e Entendi | `tour real percorre quatro passos com Próximo e Anterior` |
| Pular/Fechar, modal acessível e alvo não acionado | `tour possui modal acessível e Pular/Fechar conclui sem acionar alvo` |
| Reduzir movimento preserva quatro passos | `reduzir movimento preserva os quatro passos e suas ações` |
| Repetir altera somente o tour | `Ajuda abre revisão e repetição redefine somente o tour` |
| Falha ao salvar conclusão não bloqueia a sessão | `falha ao persistir conclusão do tour não bloqueia a sessão` |

O botão visual “Pular tour” possui o rótulo acessível “Fechar e concluir tour”;
portanto, pular e fechar são a mesma ação intencional. Posicionamento físico,
rolagem e foco TalkBack continuam cobertos por funções puras e checklist do APK,
não por coordenadas simuladas no Jest.

## Aparência e Configurações

| Requisito | Evidência comportamental |
|---|---|
| Sistema inicialmente selecionado; opções Claro/Escuro | `Configurações expõe aparência, ajuda e Sobre acessíveis` e `seleção manual de aparência é aplicada pela opção acessível` |
| Persistência, processing e seleção manual | `tema manual é persistido e selecionado sem anúncio duplicado` |
| Falha mantém tema na sessão e mostra um único alerta acessível | `falha ao persistir aparência mantém seleção na sessão e mostra aviso acessível` |
| Ajuda e revisão | `Ajuda abre revisão e repetição redefine somente o tour` |
| Sobre não interativo, versão/release/Leahcim | `Configurações expõe aparência, ajuda e Sobre acessíveis` e contratos de `release-critical` |

## Limites transferidos ao APK

Jest não valida splash/partida fria nativas, teclado e DatePicker reais,
posicionamento físico após rolagem, animações no UI thread, TalkBack real,
fabricantes, consumo de memória do processo Android ou os fluxos Maestro. Essas
validações permanecem explicitamente na etapa do APK e não foram declaradas
executadas.
