# Arquitetura de Smart Contracts e Ciclo de Vida On-Chain

Este documento explica os smart contracts Solidity sob o diretório `/smart-contracts` e como eles gerenciam o ciclo de vida da tokenização de direitos de imagem de atletas de futebol.

---

## 1. Arquitetura de Smart Contracts

Os contratos principais interagem de forma modular para garantir cunhagens seguras e deploys de cofres (vaults) eficientes:

```
[RightsMinter.sol]
       │ (Verificação de assinatura EIP-712)
       ▼
[PlayerRightsMaster.sol] (Cunhagem de NFT ERC-721)
       │
       ▼ (NFT bloqueado no cofre)
[RightsVaultFactory.sol] (Fábrica de Clones EIP-1167)
       │
       ▼ (Clona lógica de implementação)
[RightsVaultImpl.sol] (Cotas fracionadas ERC-20 e depósito caução)
```

### Contratos Principais:
1. **`PlayerRightsMaster.sol`**: Um contrato ERC-721 representando o acordo legal (NFT Master). Inclui lógica customizada no método `_update` para bloquear transferências secundárias abertas, a menos que executadas por `authorizedOperators`.
2. **`RightsMinter.sol`**: Gerencia checagens criptográficas estruturadas EIP-712 (`playerSig`, `clubSig`, `attorneySig`). Recupera os endereços de assinatura via `ECDSA` para prevenir fraudes antes de disparar a cunhagem.
3. **`RightsVaultFactory.sol`**: Realiza o deploy de clones leves de `RightsVaultImpl` usando o padrão **EIP-1167 Minimal Proxy** para reduzir as taxas de gás de deploy em 90%.
4. **`RightsVaultImpl.sol`**: Rege as cotas fracionadas ERC-20, depósitos de caução (divisão de 50% para caução sob custódia e 50% para reserva resgatável) e cálculos de penalidades para rescisões antecipadas (65% de multa antes de 182,5 dias).

---

## 2. Fluxo do Ciclo de Vida On-Chain

Um acordo é processado em 5 etapas principais:

```
[NFT Cunhado para o Clube]
       │
       ▼ (Passo 1: Deploy do Proxy do Cofre)
RightsVaultFactory.createVault(...)
       │
       ▼ (Passo 2: Aprovar Transferência do NFT)
PlayerRightsMaster.approve(vaultAddress, tokenId)
       │
       ▼ (Passo 3: Fracionar Cotas)
RightsVault.fractionalize(tokenId, supply)  <--- Bloqueia NFT, cunha cotas $P_IMAGE
       │
       ▼ (Passo 4: Aprovar Caução USDC)
MockUSDC.approve(vaultAddress, cautionAmount)
       │
       ▼ (Passo 5: Ativar o Contrato)
RightsVault.depositCaution(cautionAmount)   <--- Status torna-se ACTIVE
  - OU -
RightsVault.depositAndMint(totalAmount)     <--- Alternativa: divide caução/reserva
```

### O Processo de 5 Passos:
1. **Deploy do Proxy do Cofre**: Chame `createVault(...)` na fábrica. Realiza o deploy de um cofre clone com status `PENDING`.
2. **Aprovar NFT**: O clube chama `approve(vaultAddress, tokenId)` no `PlayerRightsMaster` para autorizar o cofre clone a puxar o NFT.
3. **Fracionar**: O clube chama `fractionalize(tokenId, supply)` no cofre clone. O cofre puxa e bloqueia o NFT sob custódia, e então cunha a quantidade total de tokens ERC-20, distribuindo-os proporcionalmente ao Jogador, Clube e Advogado com base nos basis points (BPS) configurados.
4. **Aprovar Caução**: Aprove o cofre para puxar as stablecoins USDC.
5. **Ativar**: Chame `depositCaution` (deposita o valor da caução) ou `depositAndMint` (deposita USDC alocando 50% para caução e 50% para reserva resgatável, cunhando novas cotas para o clube). O status se torna `ACTIVE`.

---

## 3. Ações Pós-Ativação

* **`redeem(shares)`**: Detentores de cotas queimam tokens `$P_IMAGE` para sacar stablecoins proporcionalmente da `redeemableReserve` do cofre:
  $$\text{stablecoinAmount} = \frac{\text{shares} \times \text{redeemableReserve}}{\text{totalSupply}}$$
* **`rescindByPlayer()` / `rescindByClub()`**: Dispara a rescisão do contrato. 
  * Se antes de 182,5 dias (metade do tempo), uma **multa de 65%** é aplicada à caução e enviada para a parte não-rescindente.
  * Se após 182,5 dias, nenhuma penalidade é aplicada; a caução retorna 100% para o clube.
* **`expireContract()`**: Pode ser executado após 365 dias. Libera 100% da caução em custódia de volta para o clube.
* **`transferClub(newClub)`**: Transfere o papel do clube para um novo endereço. Atualiza o proprietário do cofre e transfere todas as cotas restantes do antigo clube para o novo.
