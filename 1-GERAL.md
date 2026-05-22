# ePass

Este documento define termos e informações relevantes sobre todo o desenvolvimento.

## TODOs

Esse tópico define uma lista de tarefas para serem concluídas. Uma mesma tarefa pode (e é recomendado) ser quebrada em tarefas menores no que a ideia for amadurecendo.

- [] Definir Nome
- [] Definir Ideia de Projeto (Vai mesmo ser uma Multi-Sig Ledger?)

- [] Definir Requisitos
    - [] Obrigatórios
        - [] Uso de blockchain
        - [] Registro verificável de ações de impacto
        - [] Histórico auditável
        - [] Smart contract funcional
        - [] Repositório GitHub funcional
            - [] Smart contract deployado: Link da testnet pública e endereço do smart contract deployado, quando aplicável à solução.
            - [] Demonstração funcional: Demonstração do fluxo principal da solução, incluindo registro, consulta, validação ou certificação de uma ação de impacto.
            - [] Demonstração auditável: Exemplo de registro e validação de impacto, com Vídeo demo, prints, links, transações, instruções ou evidências que permitam à banca verificar o funcionamento.
            - [] Link da aplicação, quando aplicável: Link da aplicação publicada, protótipo navegável, dashboard ou ambiente de demonstração.

        - [] Código minimamente comentado
        - [] README explicando o funcionamento da solução
        - [] Vídeo-pitch demonstrando a execução
        - [] Apresentação de slides

    - [] De Implementação (Funcional)

    - [] De Implementação (Não-Funcional -- Não é uma ação direta do usuário)

## Video-Pitch e Documentação Escrita

Retirado do Manual Educacional. Características que agregam pontos.

- [] Uso de blockchain;
- [] Registro de ações de impacto;
- [] Uso de smart contracts;
- [] Histórico auditável;
- [] Emissão automática de certificados, NFTs ou reconhecimentos, quando aplicável;
- [] Clareza da solução;
- [] Valor social, ambiental ou comunitário;
- [] Aplicação prática real;
- [] Quais dados são registrados;
- [] Quais evidências são vinculadas às ações;
- [] Como a informação pode ser consultada ou verificada;
- [] Quem participa do fluxo;
- [] Qual métrica de impacto está sendo acompanhada;
- [] Como a solução aumenta transparência e confiança.

- [] Transparência dos dados;
- [] Impacto social ou ambiental claro;
- [] Boa visualização das informações;
- [] Automações bem definidas;
- [] Experiência do usuário;
- [] Potencial real de adoção;
- [] Dashboard simples e compreensível;
- [] Uso adequado de certificados digitais ou NFTs;
- [] Integração funcional entre frontend, blockchain e smart contracts;
- [] Clareza sobre quais dados ficam on-chain e quais ficam off-chain;
- [] Uso de IPFS ou solução equivalente para evidências, quando fizer sentido;
- [] Métricas de impacto bem definidas;
- [] Solução conectada a um problema real de ONGs, empresas, governos ou comunidades.

## Não-Obrigatório

* Tokens com valor financeiro real;
* Integração bancária real;
* Auditoria profissional;
* Aplicativo mobile completo;
* Deploy em produção;
* Sistema escalável para uso comercial;
* Dashboard avançado;
* Integração com órgãos públicos ou bases oficiais;
* Validação real por uma ONG, empresa ou governo.

### Desafio

Selecionar a categoria mais adequada pro problema.

A equipe deverá escolher um problema real relacionado a impacto social,
ambiental ou comunitário e propor uma solução capaz de gerar histórico verificável, registrar evidências e, quando fizer sentido, automatizar certificações digitais.

A categoria escolhida foi exatamente:

- [x] projetos sociais.

// TODO explicar melhor

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

Alguns clubes de menor porte na Europa e na América Latina começaram a usar plataformas DeFi (Finanças Descentralizadas) para dar como garantia os contratos de venda de seus jogadores

```
[Contrato de Venda Tradicional (PDF)]
       │
       ▼ (Tokenização em plataforma RWA)
[Smart Contract na Blockchain] ──> Garante o colateral (Recebível futuro)
       │
       ▼ (Execução automatizada)
[Pool de Liquidez DeFi] ──> Libera capital imediato para o clube em Stablecoins
```

Se o clube comprador atrasar a parcela, o smart contract pode executar travas automáticas ou redirecionar outras receitas tokenizadas do clube devedor diretamente para os investidores da pool.

Por que os Smart Contracts ainda não dominam as transferências?
A barreira não é tecnológica, é regulatória.

Para que a venda do Endrick ocorresse em um contrato inteligente, o Real Madrid e o Palmeiras precisariam de wallets institucionais, e o Banco Central do Brasil precisaria aceitar uma transação em blockchain (como o DREX, que está em desenvolvimento) para validar a entrada de divisas estrangeiras. Além disso, as regras de conformidade ("Know Your Customer" ou KYC) impostas pela FIFA para evitar que o futebol seja usado para lavagem de dinheiro hoje rodam dentro do ecossistema fechado do FIFA TMS, que é totalmente Web2.