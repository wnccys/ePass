# About ePass: On-Chain Football Receivables & RWA Compliance

ePass is a decentralized, on-chain marketplace for tokenizing football player rights, future transfer receivables, and image rights. It bridges the cash flow gap for football clubs by tokenizing future receivables and solidarity mechanism rights, releasing immediate liquidity.

---

## 1. Domain Overview & The Core Financial Problem

Football clubs, particularly in developing markets (such as Latin America and lower-tier European leagues), frequently suffer from severe cash flow imbalances. While player transfers yield high valuations, buyers rarely pay the full sum upfront. Instead, transfer fees are structured in installments paid over 6 to 24 months. 

Meanwhile, clubs have immediate, short-term operational expenses:
* Monthly payroll obligations for athletes and coaching staff.
* Infrastructure maintenance and youth development funding.
* Debts and fiscal obligations that require immediate liquidity.

### The ePass Solution (RWA Tokenization)
ePass bridges this gap by tokenizing future transfer receivables and solidarity mechanism rights on-chain:
```
[Physical Transfer Contract / Solidary Right]
                     │
                     ▼ (Legal Wrapper & IPFS Upload)
      [EIP-712 Multi-Party Consent]
                     │
                     ▼ (On-Chain Minting)
        [ERC-721 Master Agreement NFT]
                     │
                     ▼ (TokenFactory Clone Deploy)
     [ERC-20 Fractional Shares ($P_IMAGE)]
                     │
                     ▼ (DeFi Lending Pool Collateral)
 [Immediate Liquidity Release in Stablecoins (USDC)]
```
By collateralizing the contract on-chain, clubs obtain immediate capital in stablecoins (USDC) from decentralized liquidity pools, which are subsequently repaid as world-world transfer installments flow into the SPV (Special Purpose Vehicle).

---

## 2. Regulatory Bodies & Traditional Transfer Systems

A primary barrier to complete on-chain automation is integration with traditional sports regulatory frameworks. ePass coordinates with these entities off-chain through legal wrappers:

### FIFA TMS (Transfer Matching System)
* **What it is**: A closed, centralized Web2 system operated by FIFA to register international transfers. Both the buying and selling clubs must upload identical contracts (PDFs) and match transaction details (fees, bank accounts, training compensation, installments).
* **The Constraint**: Discrepancies as small as €50,000 will halt the matching process, blocking the player's International Transfer Certificate (ITC). ePass matches these parameters in its smart contract builder to align exactly with TMS submissions.

### FIFA Clearing House (Paris)
* **What it is**: An automated regulatory clearing house that processes international payments to verify and distribute the **Solidarity Mechanism** (typically 5% of any transfer fee split proportionally among the clubs that trained the player between the ages of 12 and 23).
* **The Constraint**: Currently runs entirely within traditional banking rails. ePass models this by allowing youth clubs to tokenize their future training solidarity shares, providing immediate funding for grassroot facilities.

### CBF BID (Boletim Informativo Diário - Brazil)
* **What it is**: The national registration system operated by the Brazilian Football Confederation (CBF). A player is only legally cleared to play in official matches once their employment contract is registered and published on the BID.
* **The Constraint**: On-chain status updates must mirror BID registries, which serves as the legal trigger for active contract validation.

---

## 3. Legal Contract Typology in Football

ePass handles three distinct legal contract categories when tokenizing player assets:

### 1. Transfer Agreement (Club-to-Club)
An agreement signed exclusively between the selling club and the buying club.
* **Key Terms**: Transfer fee, payment schedules (installments), target bank accounts, future sell-on percentage clauses, and performance bonuses.
* **Tokenization Scope**: Locked in the Escrow Vault to collateralize the initial USDC loan.

### 2. CETD (Contrato Especial de Trabalho Desportivo)
The employment contract between the player and their employing club.
* **Key Terms**: Base salary, sign-on fees (*luvas*), contract duration (typically capped at 5 years), and release clauses (*multas rescisórias*).
* **Tokenization Scope**: Governs the default parameters (contract duration and early-termination penalties).

### 3. Image Rights Agreement (Civil Contract)
A civil contract signed between the club and a corporate entity (PJ) owned by the player.
* **Key Terms**: Licensing rights to the player's likeness for club marketing and sponsorship distributions.
* **The Rule**: In regions like Brazil, image rights are legally capped at **40% of the player's total compensation** to prevent clubs from bypassing employment taxes.
* **Tokenization Scope**: This civil receivable is the easiest asset class to fractionalize into ERC-20s (`$P_IMAGE`) because it operates under civil contract law rather than strict labor union regulations.

---

## 4. Social & Youth Development Integration

In Latin America and lower-tier leagues, clubs operate not only as commercial entities but as vital social projects and youth academies (*formadores*). They invest heavily in feeding, educating, and training youth players, hoping to recoup costs through future training compensation and solidarity mechanisms when these players turn professional.

### Social Tokenization Flow in ePass
To support these youth academies, ePass extends its tokenization capability to future solidarity mechanisms:
1. **Academy Enrollment**: A youth academy records its training history of a young player on-chain.
2. **Solidarity Tokenization**: The academy mints a fractional contract representing its future 0.5%–5% solidarity receivables for that specific player.
3. **Micro-Investments**: Local supporters and global Web3 investors purchase these micro-fractions.
4. **Social Reinvestment**: The immediate stablecoins obtained are reinvested directly into the academy's infrastructure (training fields, school supplies, medical equipment, coaching salaries).
5. **Future Settlement**: When the player gets signed professionally or transferred internationally, the Gnosis Safe SPV collects the solidarity payout from the FIFA Clearing House, converting it to stablecoins to pay back the micro-investors.
