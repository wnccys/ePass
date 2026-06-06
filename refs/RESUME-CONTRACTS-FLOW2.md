# ePass Contract Lifecycle UI & Compiler Optimization: Technical Deep Dive

This document details the complete end-to-end implementation of the on-chain contract lifecycle, escrow management, and TypeScript build-system optimization for the **ePass** application.

---

## 1. Build System & TypeScript Optimization

During the build process, the Next.js compiler failed due to `BigInt` literal targeting issues. The project originally targeted `ES2017` in `tsconfig.json`. Because Wagmi, Viem, and the ePass smart contracts make extensive use of native EVM `uint256` inputs represented as Javascript `BigInt` types (e.g., `3000n`, `6000n`, `1000n`), the TS compiler threw:
> `Type error: BigInt literals are not available when targeting lower than ES2020.`

### Solution Implemented
* Updated `"target": "ES2017"` to `"target": "ES2022"` in `tsconfig.json`.
* This enables native support for `BigInt` literals and aligns the compiler with modern browser runtimes and Next.js version features.
* The application compiles successfully, and all pages build dynamically during production optimization steps.

---

## 2. On-Chain Hooks Integration

A series of read and write hooks generated from the Foundry compilation output (`src/generated.ts`) were integrated into the contract details page:

### Imports Added
```typescript
import { 
    useWriteRightsVaultImplRescindByPlayer,
    useWriteRightsVaultImplRescindByClub,
    useWriteRightsVaultImplExpireContract,
    useReadRightsVaultImplTimeRemaining,
    useReadRightsVaultImplIsBeforeHalfTime,
    // ... preexisting hooks
} from "@/src/generated";
```

### Instantiation
1. **Reads**:
   * `useReadRightsVaultImplTimeRemaining`: Fetches the remaining seconds in the 12-month contract duration from the vault clone.
   * `useReadRightsVaultImplIsBeforeHalfTime`: Performs a comparison check to determine if the active block timestamp has passed the penalty boundary (6 months).
2. **Mutations**:
   * `useWriteRightsVaultImplRescindByPlayer`: Executes the `rescindByPlayer()` method.
   * `useWriteRightsVaultImplRescindByClub`: Executes the `rescindByClub()` method.
   * `useWriteRightsVaultImplExpireContract`: Executes the `expireContract()` method.

---

## 3. Data Synchronization Pipeline

To guarantee that the UI represents the block state correctly without manual refreshes, the read hooks are integrated directly into the page's lifecycle refresh function.

```typescript
const fetchAgreement = async () => {
    const res = await getAgreement(id);
    if (res.success) {
        setAgreement(res.agreement);
        refetchApproved?.();
        refetchAuthorized?.();
        refetchAllowance?.();
        refetchUsdcBalance?.();
        refetchTimeRemaining?.();
        refetchHalfTime?.();
    }
    setLoading(false);
};
```
Whenever a transaction succeeds, this pipeline:
1. Reloads the database status.
2. Refetches the NFT approval and operator status on the master contract.
3. Refetches the USDC balance and allowance for the active user.
4. Refetches the remaining time and half-time flags from the vault proxy clone.

---

## 4. Escrow Transaction Flows (Step-by-Step)

The page now manages the full lifecycle of the escrow contract, covering transition phases for three statuses:

### A. The ACTIVE Status
When the status of the agreement is `active`, the caution deposit is locked inside the EIP-1167 proxy vault escrow clone. The interface displays the live contract tracking status board:

* **Live Status Board**:
  * Shows a vibrant pulsing green `● Live` status badge.
  * Calculates and formats the remaining time in days and hours:
    $$\text{Days} = \lfloor\text{timeRemaining} / 86400\rfloor$$
    $$\text{Hours} = \lfloor(\text{timeRemaining} \pmod{86400}) / 3600\rfloor$$
  * Displays the current contract phase, warning the user whether a penalty applies (First Half vs Second Half).

* **Rescission (Termination) Options**:
  * Rendered as conditional `ActionCard` components.
  * **As Player**: Visible only to the player's wallet address. Shows details of the financial distribution if executed (65% to Club, 35% to Player if before 6 months; 100% to Club if after).
  * **As Club**: Visible only to the club's wallet address. Explains penalty mechanics (65% to Player, 35% to Club if before 6 months; 100% to Club if after).

* **Natural Expiration**:
  * Visible to all connected wallets.
  * Triggers an `Expire Agreement` action when `timeRemaining === 0n`. Expiring the contract triggers the return of 100% of the caution stablecoins back to the club.

### B. The RESCINDED Status
When either party executes rescission, the transaction status is updated on-chain. Upon receipt confirmation:
1. The server action updates the MongoDB database status to `rescinded`.
2. The UI renders a descriptive caution panel letting the user know the contract has terminated and caution funds have been distributed.

### C. The EXPIRED Status
When the contract expires naturally and expiration is invoked:
1. The database status is updated to `expired`.
2. The UI displays a success panel confirming the complete lifecycle execution and total escrow caution refund to the Club.

---

## 5. UI Layout Integration

The actions block in the main column has been extended to support the new states:

```tsx
{/* Active Lifecycle Board */}
{agreement.status === 'active' && (
    <div className="space-y-6">
        <div className="glass-panel p-6 rounded-xl space-y-6 border-primary/20 bg-primary/5">
            {/* Live Indicator, Time Remaining, Contract Phase */}
        </div>

        {/* Rescission Trigger for Player */}
        {isPlayer && (
            <ActionCard
                title="Rescind Agreement (as Player)"
                description={isBeforeHalfTime 
                    ? "Step 1 of 1: Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Club, and you will receive 35%." 
                    : "Step 1 of 1: Terminate the agreement. Since it is after 6 months, the caution is returned to the Club without penalty."
                }
                actionName="Rescind Agreement"
                onAction={handleRescindByPlayer}
                status={actionStatus}
                // ... props
            />
        )}

        {/* Rescission Trigger for Club */}
        {isClub && (
            <ActionCard
                title="Rescind Agreement (as Club)"
                description={isBeforeHalfTime 
                    ? "Step 1 of 1: Terminate the agreement. Since it is before 6 months, a penalty of 65% of the caution will go to the Player, and you will receive 35%." 
                    : "Step 1 of 1: Terminate the agreement. Since it is after 6 months, the caution is returned back to you without penalty."
                }
                actionName="Rescind Agreement"
                onAction={handleRescindByClub}
                status={actionStatus}
                // ... props
            />
        )}

        {/* Expiration Trigger */}
        {timeRemaining !== undefined && timeRemaining === 0n && (
            <ActionCard
                title="Expire Agreement"
                description="The contract period has concluded. Expire the contract on-chain to return 100% of the caution deposit back to the Club."
                actionName="Expire Agreement"
                onAction={handleExpireContract}
                status={actionStatus}
                // ... props
            />
        )}
    </div>
)}

{/* Rescinded and Expired UI boards */}
{agreement.status === 'rescinded' && ( ... )}
{agreement.status === 'expired' && ( ... )}
```
This integration covers all possible transitions, aligning with the target technical specifications defined in the business logic files.
