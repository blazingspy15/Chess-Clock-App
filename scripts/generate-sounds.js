/**
 * Generates 3 tournament-grade WAV audio files for Chess Clock Pro:
 * 1. assets/sounds/clock-click.wav (Crisp mechanical clock switch snap)
 * 2. assets/sounds/low-time.wav (Subtle high-frequency countdown tick)
 * 3. assets/sounds/timeout-alarm.wav (Two-tone urgent tournament flag alert)
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit signed PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp sample between -1.0 and 1.0
    const s = Math.max(-1.0, Math.min(1.0, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

// 1. Clock Click: crisp mechanical tactile snap (~55ms)
function generateClockClick() {
  const durationSec = 0.055;
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / durationSec;

    // Fast exponential decay
    const env = Math.exp(-progress * 14);

    // Initial click snap transient (frequency sweeps down sharply from 1200Hz to 160Hz)
    const freq = 160 + (1200 - 160) * Math.exp(-progress * 28);
    const phase = 2 * Math.PI * freq * t;
    const primarySnap = Math.sin(phase);

    // Subtle wooden/plastic chassis resonance harmonic
    const bodyResonance = 0.35 * Math.sin(2 * Math.PI * 340 * t) * Math.exp(-progress * 10);

    // Sharp noise burst in first 3ms for tactile switch transient
    const noise = t < 0.004 ? (Math.random() * 2 - 1) * 0.45 * (1 - t / 0.004) : 0;

    samples[i] = (primarySnap * 0.7 + bodyResonance + noise) * env;
  }

  return samples;
}

// 2. Low Time Tick: subtle clear warning tick (~35ms)
function generateLowTimeTick() {
  const durationSec = 0.038;
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / durationSec;
    const env = Math.exp(-progress * 18);

    // Pure 1100Hz triangle wave tone with slight 2200Hz overtone
    const fundamental = Math.sin(2 * Math.PI * 1100 * t);
    const overtone = 0.2 * Math.sin(2 * Math.PI * 2200 * t);

    samples[i] = (fundamental + overtone) * 0.75 * env;
  }

  return samples;
}

// 3. Timeout Alarm: distinct urgent two-tone tournament buzzer (~460ms)
function generateTimeoutAlarm() {
  const durationSec = 0.46;
  const totalSamples = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Pulse 1: 0 to 0.14s (587 Hz - D5)
    // Gap: 0.14 to 0.18s
    // Pulse 2: 0.18 to 0.42s (440 Hz - A4)
    let val = 0;
    if (t < 0.14) {
      const pulseT = t;
      const env = Math.sin((pulseT / 0.14) * Math.PI);
      const tone = Math.sin(2 * Math.PI * 587 * t) + 0.3 * Math.sin(2 * Math.PI * 1174 * t);
      val = tone * 0.8 * Math.pow(env, 0.4);
    } else if (t >= 0.18 && t < 0.44) {
      const pulseT = t - 0.18;
      const env = Math.sin((pulseT / 0.26) * Math.PI);
      const tone = Math.sin(2 * Math.PI * 440 * t) + 0.35 * Math.sin(2 * Math.PI * 880 * t);
      val = tone * 0.85 * Math.pow(env, 0.4);
    }

    samples[i] = val;
  }

  return samples;
}

const soundsDir = path.join(__dirname, '..', 'assets', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

fs.writeFileSync(path.join(soundsDir, 'clock-click.wav'), createWavBuffer(generateClockClick()));
fs.writeFileSync(path.join(soundsDir, 'low-time.wav'), createWavBuffer(generateLowTimeTick()));
fs.writeFileSync(path.join(soundsDir, 'timeout-alarm.wav'), createWavBuffer(generateTimeoutAlarm()));

console.log('✓ Successfully generated all 3 tournament sound assets in assets/sounds/');
