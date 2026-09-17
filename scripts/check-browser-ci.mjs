import { spawn } from "node:child_process";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "4182",
    "--strictPort",
  ],
  { stdio: "inherit" },
);
const base = "http://127.0.0.1:4182";
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(base);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("Browser-test server did not start");
  const test = spawn(process.execPath, ["scripts/browser-test.mjs"], {
    stdio: "inherit",
    env: { ...process.env, BASE_URL: base },
  });
  const code = await new Promise((resolve) => test.on("exit", resolve));
  if (code !== 0) process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
