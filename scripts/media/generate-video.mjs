// Generates the synthetic video fixtures in assets/ail/media/ (D-023).
//
//   node scripts/media/generate-video.mjs        (run scripts/media/generate-audio.mjs first)
//
// A canvas animation is drawn in Playwright's Chromium and recorded in real time with MediaRecorder (WebM, VP8, plus
// Opus when the video has sound). Every frame is a pure function of the elapsed time, so the content is the same on
// every run, but the encoded file is not byte-identical (frame timing and encoder state vary). The checksum of the
// committed file is in assets/ail/media/README.md. The output is AIL's own work, released under CC0 1.0.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'assets/ail/media');
const SECONDS = 12;

// "How to repot a plant" in four steps of three seconds. The steps are only shown, never spoken.
const STEPS = [
  'Water the plant the day before',
  'Tip the pot and ease the plant out',
  'Add fresh compost to a bigger pot',
  'Set the plant in and fill around it',
];

// Runs in the browser. Draws frame `t` (seconds) on a 640 x 360 canvas.
function draw(ctx, t, steps) {
  const step = Math.min(steps.length - 1, Math.floor(t / 3));
  const local = t - step * 3;
  ctx.fillStyle = '#fdfdfb';
  ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#103c52';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`Step ${step + 1} of ${steps.length}`, 32, 52);
  ctx.font = '26px sans-serif';
  ctx.fillText(steps[step], 32, 96);
  // Pot, sliding in from the right at each step.
  const x = 440 + Math.max(0, 1 - local / 0.6) * 200;
  ctx.fillStyle = '#b5532c';
  ctx.beginPath();
  ctx.moveTo(x - 70, 240); ctx.lineTo(x + 70, 240); ctx.lineTo(x + 50, 335); ctx.lineTo(x - 50, 335);
  ctx.closePath(); ctx.fill();
  // Plant: grows a little with each step; on step 2 it is lifted out of the pot.
  const lift = step === 1 ? Math.min(1, local / 1.5) * 50 : 0;
  ctx.fillStyle = '#476136';
  for (let i = 0; i < 3 + step; i++) {
    const angle = -Math.PI / 2 + (i - (2 + step) / 2) * 0.45 + Math.sin(t * 2 + i) * 0.05;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(angle) * 45, 225 - lift + Math.sin(angle) * 45, 34, 13, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  // Step 0: water drops; step 2: compost bag.
  if (step === 0) {
    ctx.fillStyle = '#1c516b';
    for (let i = 0; i < 4; i++) {
      const y = 140 + ((local * 120 + i * 30) % 90);
      ctx.beginPath(); ctx.arc(x - 30 + i * 20, y, 6, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (step === 2) {
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(120, 220 - Math.min(1, local) * 40, 120, 110);
    ctx.fillStyle = '#fdfdfb';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('COMPOST', 128, 280 - Math.min(1, local) * 40);
  }
  // Progress bar.
  ctx.fillStyle = '#d9d9d6';
  ctx.fillRect(32, 344, 576, 6);
  ctx.fillStyle = '#1c516b';
  ctx.fillRect(32, 344, (576 * t) / (steps.length * 3), 6);
}

async function record(page, { name, withAudio }) {
  const audioB64 = withAudio ? readFileSync(path.join(outDir, 'background-music-12s.wav')).toString('base64') : null;
  const b64 = await page.evaluate(
    async ({ drawSource, steps, seconds, audioB64 }) => {
      const draw = new Function(`return (${drawSource})`)();
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      document.body.append(canvas);
      const ctx = canvas.getContext('2d');
      draw(ctx, 0, steps);
      const stream = canvas.captureStream(25);
      let source;
      if (audioB64) {
        const ac = new AudioContext();
        const bytes = Uint8Array.from(atob(audioB64), (c) => c.charCodeAt(0));
        const buffer = await ac.decodeAudioData(bytes.buffer);
        const dest = ac.createMediaStreamDestination();
        source = ac.createBufferSource();
        source.buffer = buffer;
        source.connect(dest);
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      }
      const mimeType = audioB64 ? 'video/webm;codecs=vp8,opus' : 'video/webm;codecs=vp8';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 400_000, audioBitsPerSecond: 64_000 });
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      const done = new Promise((resolve) => (recorder.onstop = resolve));
      recorder.start();
      source?.start();
      const start = performance.now();
      await new Promise((resolve) => {
        const tick = () => {
          const t = (performance.now() - start) / 1000;
          draw(ctx, Math.min(t, seconds - 0.001), steps);
          if (t < seconds) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      recorder.stop();
      await done;
      const blob = new Blob(chunks, { type: 'video/webm' });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    },
    { drawSource: draw.toString(), steps: STEPS, seconds: SECONDS, audioB64 },
  );
  writeFileSync(path.join(outDir, name), Buffer.from(b64, 'base64'));
  console.log(`Wrote assets/ail/media/${name}`);
}

const browser = await chromium.launch({
  executablePath: chromium.executablePath(),
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
await page.setContent('<!doctype html><title>video</title><body style="margin:0">');
await record(page, { name: 'repot-a-plant-silent.webm', withAudio: false });
await record(page, { name: 'repot-a-plant-music.webm', withAudio: true });
await browser.close();
