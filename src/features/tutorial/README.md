# Experiência educativa

A feature controla a apresentação opcional de três telas, o tour contextual da
Home e dicas exibidas uma única vez. Seu estado é persistido separadamente em
`@saldo-do-dia/tutorial:v1`.

O modelo armazena apenas flags de conclusão e IDs de dicas vistas. Passo atual,
posições, tema, movimento e dados financeiros permanecem fora do documento. O
provider aplica mudanças na sessão mesmo quando a gravação educativa falha; a
falha também não bloqueia a hidratação financeira.

O tour destaca quatro alvos medidos no conteúdo real da Home, rola sem
coordenadas fixas e bloqueia a interação com a interface ao fundo. Com Reduzir
movimento, as transições e a rolagem chegam imediatamente ao estado final.

O painel explicativo mede sua altura real e a posição do alvo na janela. Uma
função pura escolhe acima ou abaixo, aplica Safe Area, margens laterais e um gap
de 16 pontos, e valida a ausência de interseção antes da exibição. Quando falta
espaço, a Home rola, mede novamente e só então publica a posição; conteúdo alto
usa rolagem interna sem reduzir a fonte ou cobrir o alvo.
