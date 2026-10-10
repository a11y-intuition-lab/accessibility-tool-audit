// Generates the synthetic audio fixtures in assets/ail/media/ (D-023).
//
//   node scripts/media/generate-audio.mjs
//
// Pure arithmetic, no randomness and no external tools: the same script always writes byte-identical files.
// The output is AIL's own work, released under CC0 1.0 (see assets/ail/media/README.md).
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = path.join(root, 'assets/ail/media');
const RATE = 16000;

// 16-bit mono PCM WAV.
function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// A calm arpeggio (C major, A minor, F major, G major), two notes a second, soft attack and decay.
function backgroundMusic(seconds) {
  const chords = [
    [261.63, 329.63, 392.0, 523.25],
    [220.0, 261.63, 329.63, 440.0],
    [174.61, 220.0, 261.63, 349.23],
    [196.0, 246.94, 293.66, 392.0],
  ];
  const noteLength = 0.5;
  const samples = new Float64Array(Math.round(seconds * RATE));
  for (let i = 0; i < samples.length; i++) {
    const t = i / RATE;
    const note = Math.floor(t / noteLength);
    const chord = chords[Math.floor(note / 4) % chords.length];
    const freq = chord[note % 4];
    const nt = t - note * noteLength;
    const envelope = Math.min(1, nt / 0.02) * Math.exp(-nt * 4);
    samples[i] = 0.3 * envelope * (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t));
  }
  return samples;
}

const files = {
  // 1.4.2: longer than 3 seconds, so an autoplaying element needs a way to pause or stop it.
  'background-music-12s.wav': backgroundMusic(12),
};

for (const [name, samples] of Object.entries(files)) {
  writeFileSync(path.join(outDir, name), wav(samples));
  console.log(`Wrote assets/ail/media/${name} (${(samples.length / RATE).toFixed(1)} s)`);
}
