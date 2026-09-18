import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = (
  process.env.BASE_URL || "https://preethesh16.github.io/Tideplan/"
).replace(/\/?$/, "/");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  await page
    .locator(".profile")
    .filter({ hasText: "Team Vibecoders" })
    .waitFor();
  await page.getByRole("button", { name: "Plan studio", exact: true }).click();
  await page.locator("#shock").fill("60");
  assert.equal(
    await page
      .getByRole("button", { name: "Approve as demo lender" })
      .isDisabled(),
    true,
  );
  const videoResponse = await page.goto(base + "demo/index.html");
  assert.equal(videoResponse.status(), 200);
  await page.waitForFunction(
    () => document.querySelector("video")?.readyState >= 1,
    {},
    { timeout: 30000 },
  );
  const metadata = await page
    .locator("video")
    .evaluate((v) => ({
      duration: v.duration,
      width: v.videoWidth,
      height: v.videoHeight,
      error: v.error,
    }));
  assert.ok(metadata.duration > 120 && metadata.duration < 180);
  assert.equal(metadata.width, 1440);
  assert.equal(metadata.height, 1000);
  assert.equal(metadata.error, null);
  await page.waitForFunction(
    () => document.querySelectorAll("#chapters button").length === 7,
  );
  await page.locator("video").evaluate(async (v) => {
    v.muted = true;
    await v.play();
  });
  await page.waitForTimeout(1800);
  assert.ok(
    await page.locator("video").evaluate((v) => v.currentTime > 0 && !v.paused),
  );
  await page.locator("#chapters button").nth(5).click();
  await page.waitForTimeout(1200);
  assert.ok(
    await page
      .locator("video")
      .evaluate((v) => v.currentTime > 105 && !v.error),
  );
  const captions = await page.request.get(base + "demo/captions.vtt");
  assert.equal(captions.status(), 200);
  assert.ok((await captions.text()).startsWith("WEBVTT"));
  const transcript = await page.request.get(base + "demo/transcript.txt");
  assert.equal(transcript.status(), 200);
  assert.ok((await transcript.text()).includes("Team Vibecoders"));
  assert.deepEqual(errors, []);
  console.log(
    "PASS: published app, stress guard, video decoding/playback, aspect ratio, seven chapters, seeking, captions and transcript.",
    metadata,
  );
} finally {
  await browser.close();
}
