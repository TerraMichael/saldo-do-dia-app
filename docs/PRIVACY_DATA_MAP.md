# Mapa de privacidade e dados

| Dado | Finalidade | Local/chave | Retenção e exclusão | Sai do aparelho? | Risco e proteção atual |
|---|---|---|---|---|---|
| Saldo, contas, reserva, gastos, descrições, datas e ciclos | Planejamento financeiro local | AsyncStorage `@saldo-do-dia/planejamento:v3` | Até reinicialização explícita do planejamento | O app não implementa envio | Sensível; AsyncStorage não é criptografado e backup Android está desativado |
| Aparência | Tema escolhido | `@saldo-do-dia/aparencia:v1` | Até alteração/limpeza do app | Não pelo app | Baixo |
| Tutorial | Progresso educativo | `@saldo-do-dia/tutorial:v1` | Até alteração/limpeza do app | Não pelo app | Baixo |
| Versão e release | Identificação do binário | Metadados Expo; não persistidos | Vida do binário | Não aplicável | Informativo |

Não existem senhas, tokens, credenciais, backend, autenticação, sincronização, integração bancária, analytics, publicidade ou IA. Descrições são texto livre do usuário e não devem conter segredos. O aplicativo não implementa envio de dados financeiros para servidores nesta versão; isso não é uma afirmação sobre tráfego próprio do sistema operacional ou da infraestrutura de desenvolvimento.

O backup automático Android está desativado (`allowBackup: false`) porque ainda não há restauração controlada nem criptografia de aplicação. Exportação controlada e nuvem permanecem no backlog.
