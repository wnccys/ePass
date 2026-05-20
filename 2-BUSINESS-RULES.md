# Casos de Análise

Este documento define casos de análise interessantes que balizarão as implementações em software, portanto, apresentando as regras que seguiremos.
Cada tópico contém um outro tópico aninhado de regras de negócio, onde os requisitos para implementação devem ser definidos.

## Caso Endrick

* A FIFA (Artigo 19) proíbe a transferência internacional de menores de 18 anos. Por isso, quando o Real Madrid se interessou por Endrick aos 16 anos, eles assinaram um Acordo de Transferência Futura.
O contrato estipulava um valor fixo (cerca de €35 milhões) e um valor variável (até €25 milhões) baseado em metas (add-ons). É aqui que o ativo "acumulou riqueza":

* A cada 5 gols que Endrick marcava pelo Palmeiras, o Real Madrid era obrigado a disparar uma transferência bancária (via sistema SWIFT) de €2,5 milhões para o Brasil.

* Convocações para a Seleção Principal também ativavam pagamentos.

* O caminho do dinheiro: O Banco Santander (ou outro banco corporativo do Real Madrid na Espanha) enviava os euros. O dinheiro batia no Brasil e o Palmeiras precisava registrar um "Contrato de Câmbio" no Sisbacen (sistema do Banco Central do Brasil) para justificar a entrada da moeda estrangeira e convertê-la para Reais nas contas do clube (geralmente em bancos como Itaú ou Banco do Brasil).

### Regras de Negócio

## Caso Wesley

Ele quase foi vendido para a Atalanta da Itália em agosto de 2024 (e não para a Roma).

Os clubes chegaram a um acordo financeiro verbal e por e-mail.
A Atalanta enviou o Transfer Agreement assinado.
Porém, os dirigentes do Flamengo demoraram algumas horas a mais para revisar as minutas e devolver o contrato assinado para ser inserido no FIFA TMS.
Como a janela de transferências na Itália estava se fechando e a Atalanta precisava do jogador garantido para a temporada, eles se irritaram com a demora do Flamengo, retiraram a proposta e a negociação colapsou.
O jogador permaneceu no Brasil. Se não está no TMS antes do relógio zerar, a transferência não existe no mundo real.

### Regras de Negócio

## Análise de Casos

* Internacional (Santos → Inter de Milão)	Exige aprovação no FIFA TMS. O dinheiro cruza fronteiras via SWIFT.
O Santos tem que lidar com taxas de câmbio, IOF e retenção de impostos europeus.
O jogador precisa tirar visto de trabalho no consulado italiano antes de viajar.

* Empréstimo (Inter → Flamengo)	A Inter cede os Direitos Federativos temporariamente.
O Flamengo assina um contrato assumindo 100% (ou uma fatia) do salário do Gabigol.
Ao final do prazo, o registro volta automaticamente para a Itália no sistema da FIFA.

* Nacional (Cruzeiro → Santos ou Flamengo)	Muito mais rápido.
Os clubes assinam a rescisão. O clube comprador paga via TED/Pix direto para o clube vendedor.
Tudo é registrado na CBF, e assim que a taxa de transferência é paga à federação estadual, o nome "cai no BID". Não há risco cambial.