# Validation record

TidePlan is a synthetic-data decision-support prototype, not a validated underwriting or payment system. This record describes executable checks, not real-world financial outcomes.

## Automated checks

Run `npm test`, `npm run build`, and `npm run test:browser:ci` (after installing Playwright Chromium). The GitHub Actions workflow runs these checks before publishing.

### Model and audit tests — 12 test cases

- Seasonal farmer and sustained-decline example produce the expected distinct signals.
- The farmer's base aligned schedule preserves ₹18,000 while respecting monthly capacity.
- Severe shock reveals unscheduled debt.
- Larger buffers or shocks cannot increase safe capacity.
- **507 combinations** of three profiles, thirteen buffers and thirteen shocks preserve integer totals and capacity bounds.
- History validation rejects gaps, duplicates, negative/invalid amounts and short histories.
- Canonical hashes do not depend on object key order.
- Edited, reordered and non-prefix-deleted event sequences fail verification.
- A living-cost shortfall blocks feasibility even if the full debt can be scheduled.
- Invalid buffers, shocks and fractional debt amounts are rejected.
- Insufficient year-on-year history is disclosed.
- Malformed audit events fail verification safely.

### Browser journey

Checks Team Vibecoders branding, rejects an incomplete CSV, imports a complete CSV, blocks severe-shock approval, requires borrower acceptance, recognises scenario changes, gates reserve access, exports a parseable decision report, caps support at the reserve balance, verifies and tests the audit chain, restores saved history on refresh, and checks the mobile layout for horizontal overflow.

Screenshots in `docs/images/` are captured from this running journey. Unit tests do not validate the illustrative Fabric or Solidity contracts; those remain separate, unaudited integration blueprints.

## Reproducible example

| Asha, base scenario      |   Fixed | Aligned |
| ------------------------ | ------: | ------: |
| Scheduled obligation     | ₹18,000 | ₹18,000 |
| Buffer-breach months     |       2 |       0 |
| Total buffer shortfall   |  ₹2,547 |      ₹0 |
| Lowest post-payment cash |    ₹306 |  ₹2,850 |

Assumptions: synthetic history, zero interest, ₹2,000 buffer, 15% conservative haircut, no added shock, no inter-month savings carry-forward. These are computed examples, not pilot results.

## Not yet validated

Forecast calibration, seasonality classification accuracy, real borrower affordability, default probabilities, lender recovery, fairness across groups, data-provider integrations, legal suitability, production security and operational adoption require further work. A locally valid hash chain cannot establish the truth of source data or detect a fully rewritten chain without an independent anchor.
