# ePass

Este documento define termos e informações relevantes sobre todo o desenvolvimento.


## Visão Geral

// TODO O tópico abaixo deve ser refeito para se adaptar á demanda de projeto social. Atualmente ela foca muito em transferências internacionais.
// STUB Existem razões jurídicas pesadas para isso: a FIFA exige que ela própria seja a validadora centralizada do sistema, e o mercado de futebol depende de garantias bancárias tradicionais e da regulamentação de bancos centrais (como o Banco Central do Brasil) para compliance de lavagem de dinheiro.

## Transferências

// STUB Reescrever e expandir este trecho.
* O Software Suíço (FIFA TMS): Para transferências internacionais (ex: Brasil para Europa), tudo passa pelo Transfer Matching System (TMS) da FIFA.
O clube que compra e o clube que vende precisam fazer o upload de todos os contratos em PDF e preencher os dados da operação (valores, contas bancárias, prazos).
Se o time europeu colocar que comprou por €10 milhões e o time brasileiro colocar €10,5 milhões, o sistema trava o "match" e a transferência não ocorre.

* A "Câmara de Compensação" (FIFA Clearing House): Fica em Paris.
Hoje, todo pagamento internacional passa por lá para garantir que os clubes que formaram o jogador na base recebam automaticamente seus 5% do Mecanismo de Solidariedade.

* O Sistema Nacional (CBF BID): Para transferências entre clubes brasileiros, usa-se o Sistema de Registro Desportivo (SRD) da CBF. Quando o contrato é validado, o nome do jogador sai no Boletim Informativo Diário (BID). Só então ele tem condição legal de jogo.

### Contratos (Como são feitos?)

// STUB Refinar o texto

* Transfer Agreement (Contrato de Transferência): Assinado entre os dois clubes.
Define o valor, o número de parcelas, o banco de destino e as cláusulas de bônus.

* Contrato Especial de Trabalho Desportivo (CETD): O contrato de trabalho entre o jogador (CLT) e o novo clube.
Define salário, luvas (bônus de assinatura) e a multa rescisória.

* Contrato de Licenciamento de Imagem: Um contrato de natureza civil (não trabalhista) feito entre o clube e uma empresa (PJ) aberta pelo jogador.
No Brasil, isso pode representar até 40% da remuneração total e paga menos impostos que o salário CLT.


## Problema Central

Clubes de futebol sofrem muito com problemas de fluxo de caixa (precisam pagar salários hoje, mas a parcela da venda do jogador só entra daqui a 6 meses). É aqui que os contratos inteligentes estão começando a ser testados através de RWA (Real World Assets - Ativos do Mundo Real).