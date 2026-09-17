# Trust integration blueprints — not live infrastructure

The browser works without a blockchain. These files show the next integration boundary, not a claim that Fabric or escrow is deployed.

## Hyperledger Fabric

`fabric/index.cjs` records a plan evidence hash approved by `LenderMSP`, then requires the named borrower's Fabric certificate identity for consent. Each plan version has a unique ID. Production deployment also needs a consortium, certificate authorities, peer/orderer infrastructure, endorsement and access policies, private-data collections, key custody, and a backend gateway. Never put raw bank records or personal documents on a shared ledger. A hash proves consistency with a document, not that its contents were truthful.

## Reserve contract

`ResilienceReserve.sol` illustrates sponsor-funded, borrower-consented support. It caps releases and records an evidence hash. Native test-chain currency is not INR. No oracle supplies income facts, no default decision is automatic, and no real funds should be used. This minimal blueprint lacks production treasury lifecycle controls and has not had a security audit. Shared liquidity is not reserved per plan, so a proposal does not guarantee funding.

## Local demo boundary

`src/trust.ts` verifies a SHA-256 event chain. A browser owner can rewrite the complete chain, delete history, or modify local storage. It is **not independently immutable**, and role buttons are **not authentication**. Independent signatures and external anchoring would be needed to strengthen the trust model. The local reserve is a UI simulation only; it neither calls this contract nor changes loan balances.
