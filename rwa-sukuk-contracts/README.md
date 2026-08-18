# RWA Tokenized Sukuk — Smart Contracts

Hardhat (TypeScript) project for a **RWA Tokenized Sukuk** system: a fiat-backed
stablecoin (`IDRX`) as the underlying asset, and an ERC-4626 yield-bearing vault
(`SukukVault`) that tokenizes investor shares as `sSUKUK`.

## Contracts

| File | Purpose |
|---|---|
| `contracts/IDRX.sol` | Mock fiat-backed stablecoin (18dp), owner-only `mint()` for testnet faucet. |
| `contracts/SukukVault.sol` | ERC-4626 vault with `AccessControl`, `Pausable`, `ReentrancyGuard` and a linear state machine. |
| `contracts/interfaces/ISukukVault.sol` | Public interface. |
| `contracts/libraries/VaultErrors.sol` | Custom errors + `VaultState` enum. |
| `contracts/mocks/*` | Test-only malicious token + reentrancy attacker. |

## Roles

- `PROTOCOL_ROLE` — admin/treasury: `createVault`, `protocolFill`, `sendPayout`/`depositYield`, `closeVault`, `pause`/`unpause`.
- `AUDITOR_ROLE` — a **Gnosis Safe / Safe{Core} multisig** (2-of-3 enforced off-chain by the Safe): `approveVault`, `approvePayout`.
- Investors (role-less): `deposit`, `mint`, `withdraw`, `redeem`.

## State machine (strictly linear)

```
OPEN → LOCKED → MATURED → APPROVED_FOR_PAYOUT → CLOSED
```

- `OPEN` & `LOCKED` are the explicit names from the source documentation.
- `MATURED` / `APPROVED_FOR_PAYOUT` / `CLOSED` are technical design additions so the
  documented guard rule ("`redeem()` must be blocked while LOCKED, re-enabled only
  after the auditor verifies the payout") can be enforced safely.

## Setup

```bash
npm install
cp .env.example .env   # then fill in PRIVATE_KEY, RPC URLs, AUDITOR_MULTISIG
```

## Compile & test

```bash
npx hardhat compile
npx hardhat test
```

## Deploy

```bash
npx hardhat run scripts/deploy.ts --network sepolia        # or arbitrumSepolia / polygonAmoy
npx hardhat run scripts/seed-testnet.ts --network sepolia  # mint faucet + createVault
```

Deployment addresses are written to `deployments/<network>.json`.

### Constructor arguments

`SukukVault(underlying, name, symbol, admin, auditorMultisig)`

- `admin` receives `DEFAULT_ADMIN_ROLE` + `PROTOCOL_ROLE`.
- `auditorMultisig` (Gnosis Safe) receives `AUDITOR_ROLE`.

## Networks

`hardhat` (local), `sepolia`, `arbitrumSepolia`, `polygonAmoy` — RPC URLs and
`PRIVATE_KEY` come from `.env` (never hardcoded).

## Yield model

The vault retains deposited principal. `sendPayout(yield)` transfers the profit into
the vault at maturity, so `totalAssets()` rises and the `sSUKUK` exchange rate grows
proportionally (e.g. deposit 1000 IDRX → 1000 sSUKUK → `sendPayout(50)` → redeem 1050).
