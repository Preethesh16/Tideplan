import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const scenes = JSON.parse(await readFile("scripts/demo-scenes.json", "utf8"));
for (let i = 0; i < scenes.length; i++) {
  scenes[i].audioDuration = Number(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        `work/voice/${String(i).padStart(2, "0")}.mp3`,
      ],
      { encoding: "utf8" },
    ).trim(),
  );
  scenes[i].duration = scenes[i].audioDuration + 1.2;
}
await mkdir("work/recording", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  recordVideo: { dir: "work/recording", size: { width: 1440, height: 1000 } },
});
const page = await context.newPage();
const openedAt = Date.now();
await page.goto(process.env.BASE_URL || "http://localhost:4180");
await page
  .getByRole("heading", { name: "See the person behind the payment." })
  .waitFor();
await page.evaluate(() => {
  const c = document.createElement("div");
  c.id = "demo-pointer";
  c.style.cssText =
    "position:fixed;width:18px;height:18px;border:2px solid #416f50;background:#cbdca577;border-radius:50%;pointer-events:none;z-index:99999;left:-50px;top:-50px;box-shadow:0 0 0 5px #cbdca522";
  document.body.append(c);
  document.addEventListener("mousemove", (e) => {
    c.style.left = e.clientX - 9 + "px";
    c.style.top = e.clientY - 9 + "px";
  });
});
const pause = (ms) => page.waitForTimeout(ms);
async function click(locator) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 20 });
  await pause(200);
  await locator.click();
  await pause(400);
}
async function scroll(y) {
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: "smooth" }),
    y,
  );
  await pause(900);
}
const nav = (name) => click(page.getByRole("button", { name, exact: true }));
const person = (name) =>
  click(page.getByRole("button", { name: new RegExp(name) }));
let samplePath;
await pause(1300);
// Keep the opening still briefly; no artificial zoom, stretch or slideshow.
const actions = {
  intro: async () => {
    await page.mouse.move(780, 160, { steps: 20 });
    await pause(3800);
    await scroll(200);
  },
  asha: async () => {
    await scroll(0);
    await pause(2500);
    await page.mouse.move(820, 670, { steps: 30 });
    await pause(3000);
    await scroll(390);
  },
  evidence: async () => {
    await scroll(230);
    await page.mouse.move(1160, 560, { steps: 35 });
    await pause(8000);
    await scroll(420);
  },
  profiles: async () => {
    await scroll(0);
    await person("Meera Shah");
    await pause(5500);
    await person("Ravi Kumar");
    await pause(6000);
  },
  studio: async () => {
    await person("Asha Devi");
    await nav("Plan studio");
    await pause(1300);
    await page.locator("#buffer").fill("3000");
    await pause(1400);
    await page.locator("#buffer").fill("2000");
    await page.locator("#shock").fill("10");
    await pause(2000);
  },
  failure: async () => {
    await page.locator("#shock").fill("60");
    await pause(1400);
    await scroll(660);
    await pause(1600);
    await page
      .getByRole("button", { name: "Approve as demo lender" })
      .scrollIntoViewIfNeeded();
  },
  import: async () => {
    await page
      .getByRole("button", { name: "Download sample data", exact: true })
      .scrollIntoViewIfNeeded();
    const pending = page.waitForEvent("download");
    await click(
      page.getByRole("button", { name: "Download sample data", exact: true }),
    );
    samplePath = await (await pending).path();
    await pause(2500);
    await page
      .locator("input[type=file]")
      .setInputFiles({
        name: "incomplete.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(
          "month,income,essentials,obligations\n2026-01,10000,5000,1000",
        ),
      });
    await pause(4500);
    await page.locator("input[type=file]").setInputFiles(samplePath);
    await pause(4500);
  },
  consent: async () => {
    await scroll(0);
    await page.locator("#shock").fill("5");
    await pause(1200);
    await scroll(620);
    await pause(1600);
    await click(page.getByRole("button", { name: "Approve as demo lender" }));
    await pause(1000);
    await page.getByRole("checkbox").scrollIntoViewIfNeeded();
    await pause(1200);
    await click(page.getByRole("checkbox"));
    await pause(700);
    await click(page.getByRole("button", { name: /Accept as demo borrower/ }));
  },
  versions: async () => {
    await scroll(0);
    await page.locator("#buffer").fill("2500");
    await pause(2000);
    await page
      .getByRole("button", { name: "Approve as demo lender" })
      .scrollIntoViewIfNeeded();
    await pause(5500);
    await scroll(0);
    await page.locator("#buffer").fill("2000");
    await pause(1000);
    await page.getByText("Both parties have agreed.").scrollIntoViewIfNeeded();
  },
  trust: async () => {
    await click(page.getByRole("button", { name: /Trust ledger/ }));
    await pause(1800);
    await click(page.getByRole("button", { name: /Authorize ₹1,000/ }));
    await pause(1000);
    await click(
      page.getByRole("button", { name: "Verify chain", exact: true }),
    );
    await pause(1000);
    await click(page.getByRole("button", { name: /Test a tampered copy/ }));
    await pause(1500);
  },
  method: async () => {
    await nav("How it works");
    await pause(3000);
    await scroll(400);
    await pause(3000);
  },
};
const preRoll = (Date.now() - openedAt) / 1000;
for (const scene of scenes) {
  const start = Date.now();
  await actions[scene.id]();
  const elapsed = (Date.now() - start) / 1000;
  await pause(Math.max(800, (scene.duration - elapsed) * 1000));
  scene.duration = (Date.now() - start) / 1000;
  console.log("Recorded", scene.id, scene.duration.toFixed(1));
}
const video = page.video();
await context.close();
await video.saveAs("work/recording/tideplan-screen.webm");
await browser.close();
await writeFile(
  "work/recording/scenes.json",
  JSON.stringify({ preRoll, scenes }, null, 2),
);
console.log("Recording complete.");
