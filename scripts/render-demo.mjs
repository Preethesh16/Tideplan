import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const { preRoll, scenes } = JSON.parse(
  await readFile("work/recording/scenes.json", "utf8"),
);
const run = (args) =>
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
// The browser opens before the first spoken scene. Preserve original aspect ratio.
run([
  "-f",
  "lavfi",
  "-i",
  "anullsrc=r=48000:cl=mono",
  "-t",
  String(preRoll),
  "work/voice/intro.wav",
]);
const files = ["intro.wav"];
let timestamp = preRoll;
let vtt = "WEBVTT\n\n";
const chapters = [];
const time = (s) => new Date(s * 1000).toISOString().slice(11, 23);
for (let i = 0; i < scenes.length; i++) {
  const n = String(i).padStart(2, "0"),
    s = scenes[i];
  chapters.push({ title: s.title, start: Number(timestamp.toFixed(2)) });
  run([
    "-i",
    `work/voice/${n}.mp3`,
    "-af",
    "apad",
    "-t",
    String(s.duration),
    "-ar",
    "48000",
    "-ac",
    "1",
    `work/voice/${n}.wav`,
  ]);
  files.push(`${n}.wav`);
  // Short caption cues, rather than a paragraph covering the product screen.
  const phrases = s.text.match(/[^.!?]+[.!?]+/g) || [s.text];
  const total = phrases.join("").length;
  let t = timestamp;
  for (const phrase of phrases) {
    const duration = (s.audioDuration * phrase.length) / total;
    vtt += `${time(t)} --> ${time(t + duration)}\n${phrase.trim()}\n\n`;
    t += duration;
  }
  timestamp += s.duration;
}
await writeFile(
  "work/voice/concat.txt",
  files.map((f) => `file '${f}'`).join("\n"),
);
await writeFile("public/demo/captions.vtt", vtt);
await writeFile("public/demo/chapters.json", JSON.stringify(chapters, null, 2));
await writeFile(
  "public/demo/transcript.txt",
  scenes.map((s) => s.title + "\n" + s.text).join("\n\n"),
);
run([
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  "work/voice/concat.txt",
  "-c:a",
  "pcm_s16le",
  "work/voice/full.wav",
]);
run([
  "-i",
  "work/recording/tideplan-screen.webm",
  "-i",
  "work/voice/full.wav",
  "-map",
  "0:v:0",
  "-map",
  "1:a:0",
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-crf",
  "25",
  "-pix_fmt",
  "yuv420p",
  "-af",
  "loudnorm=I=-16:TP=-1.5:LRA=11",
  "-ar",
  "48000",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-movflags",
  "+faststart",
  "-shortest",
  "public/demo/tideplan-demo.mp4",
]);
console.log(
  "Narrated video and captions ready:",
  timestamp.toFixed(1),
  "seconds",
);
