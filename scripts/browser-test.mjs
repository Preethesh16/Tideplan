import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("docs/images", { recursive: true });
await page.goto(process.env.BASE_URL || "http://localhost:4180");
await page
  .getByRole("heading", { name: "See the person behind the payment." })
  .waitFor();
await page.locator(".profile").filter({ hasText: "Team Vibecoders" }).waitFor();
await page.waitForTimeout(1500);
await page.screenshot({ path: "docs/images/dashboard.png", fullPage: true });
await page.getByRole("button", { name: /Ravi Kumar/ }).click();
assert.ok(
  await page.getByText("Sustained decline", { exact: true }).isVisible(),
);
await page.getByRole("button", { name: /Asha Devi/ }).click();
await page.getByRole("button", { name: "Plan studio", exact: true }).click();
const samplePromise = page.waitForEvent("download");
await page
  .getByRole("button", { name: "Download sample data", exact: true })
  .click();
const sample = await samplePromise;
const samplePath = await sample.path();
await page
  .locator("input[type=file]")
  .setInputFiles({
    name: "bad.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "month,income,essentials,obligations\n2026-01,5000,3000,0",
    ),
  });
await page
  .getByRole("status")
  .filter({ hasText: "12–60 consecutive" })
  .waitFor();
await page.locator("input[type=file]").setInputFiles(samplePath);
await page
  .getByRole("status")
  .filter({ hasText: "Imported 24 monthly records" })
  .waitFor();
await page.locator("#shock").fill("60");
assert.equal(
  await page
    .getByRole("button", { name: "Approve as demo lender" })
    .isDisabled(),
  true,
);
await page.locator("#shock").fill("5");
await page.getByRole("button", { name: "Approve as demo lender" }).click();
await page.getByText("Lender approved. Borrower consent next.").waitFor();
await page.getByRole("button", { name: /Trust ledger/ }).click();
assert.equal(
  await page.getByRole("button", { name: /Authorize ₹1,000/ }).isDisabled(),
  true,
);
await page.getByRole("button", { name: "Plan studio", exact: true }).click();
assert.equal(
  await page
    .getByRole("button", { name: /Accept as demo borrower/ })
    .isDisabled(),
  true,
);
await page.getByRole("checkbox").check();
await page.getByRole("button", { name: /Accept as demo borrower/ }).click();
await page.getByText("Both parties have agreed.").waitFor();
await page.locator("#buffer").fill("2500");
assert.equal(
  await page
    .getByRole("button", { name: "Approve as demo lender" })
    .isEnabled(),
  true,
);
await page.locator("#buffer").fill("2000");
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/images/plan-studio.png", fullPage: true });
await page.getByRole("button", { name: /Trust ledger/ }).click();
await page.getByRole("button", { name: /Authorize ₹1,000/ }).click();
await page.getByText("Reserve grant simulated", { exact: true }).waitFor();
await page.getByRole("button", { name: "Verify chain", exact: true }).click();
await page.getByText("All recorded hashes and links verified.").waitFor();
const reportPromise = page.waitForEvent("download");
await page.getByRole("button", { name: "Export report", exact: true }).click();
const report = await reportPromise;
const stream = await report.createReadStream();
let content = "";
for await (const chunk of stream) content += chunk;
const json = JSON.parse(content);
assert.equal(json.approvedSnapshot.consented, true);
assert.equal(json.approvedSnapshot.reserveReleased, 1000);
assert.equal(json.audit.length, 3);
await page.getByRole("button", { name: /Test a tampered copy/ }).click();
await page
  .getByRole("status")
  .filter({ hasText: "Tampered copy rejected" })
  .waitFor();
await page.screenshot({ path: "docs/images/trust-ledger.png", fullPage: true });
for (let i = 0; i < 4; i++) {
  await page.getByRole("button", { name: /Authorize ₹1,000/ }).click();
  await page.waitForFunction(
    (n) =>
      JSON.parse(localStorage.getItem("tideplan-v1")).snapshots.asha
        .reserveReleased === n,
    (i + 2) * 1000,
  );
}
assert.equal(
  await page.getByRole("button", { name: /Authorize ₹1,000/ }).isDisabled(),
  true,
);
await page.reload();
await page.getByRole("button", { name: /Trust ledger/ }).click();
await page
  .getByText("Reserve grant simulated", { exact: true })
  .first()
  .waitFor();
await page.getByRole("button", { name: "How it works", exact: true }).click();
await page
  .getByRole("heading", { name: "Good decisions need good foundations." })
  .waitFor();
await page.screenshot({ path: "docs/images/methodology.png", fullPage: true });
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});
await mobile.goto(process.env.BASE_URL || "http://localhost:4180");
await mobile.waitForTimeout(1000);
assert.equal(
  await mobile.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  ),
  true,
  "mobile should not overflow",
);
await mobile.getByRole("button", { name: "Toggle navigation" }).click();
await mobile.getByRole("button", { name: "Plan studio", exact: true }).click();
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: "docs/images/mobile.png", fullPage: true });
assert.deepEqual(errors, []);
await browser.close();
console.log(
  "PASS: branding, CSV rejection/import, desktop workflow, stress guard, explicit consent, stale-plan guard, reserve gates/cap, JSON export, tamper detection, persistence, methodology, mobile layout.",
);
