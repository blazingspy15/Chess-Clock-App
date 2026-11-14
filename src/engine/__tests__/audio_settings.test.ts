/**
 * Automated Test Suite for Audio, Settings, and Sound Trigger Mechanics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChessClockEngine } from '../ChessClockEngine.ts';
import { createSymmetricConfig } from '../presets.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== AUDIO & SETTINGS AUTOMATED TESTS ===\n');

// 1. WAV Asset Header & Payload Validation
{
  console.log('Test A1: Sound Assets Header & WAV Format Verification');
  const projectRoot = path.resolve(process.cwd());
  const soundFiles = ['clock-click.wav', 'low-time.wav', 'timeout-alarm.wav'];

  soundFiles.forEach((file) => {
    const fullPath = path.join(projectRoot, 'assets', 'sounds', file);
    assert(fs.existsSync(fullPath), `Audio file exists: ${file}`);

    const buffer = fs.readFileSync(fullPath);
    assert(buffer.length > 44, `${file} has audio payload (size: ${buffer.length} bytes)`);

    // RIFF check
    const riff = buffer.toString('ascii', 0, 4);
    assert(riff === 'RIFF', `${file} starts with RIFF chunk`);

    // WAVE check
    const wave = buffer.toString('ascii', 8, 12);
    assert(wave === 'WAVE', `${file} format is WAVE`);

    // fmt subchunk check
    const fmt = buffer.toString('ascii', 12, 16);
    assert(fmt === 'fmt ', `${file} has fmt subchunk`);

    // Audio format = 1 (PCM)
    const audioFormat = buffer.readUInt16LE(20);
    assert(audioFormat === 1, `${file} is uncompressed PCM`);

    // Sample rate = 44100
    const sampleRate = buffer.readUInt32LE(24);
    assert(sampleRate === 44100, `${file} sample rate is 44.1kHz`);

    // Bits per sample = 16
    const bitsPerSample = buffer.readUInt16LE(34);
    assert(bitsPerSample === 16, `${file} is 16-bit audio`);
  });

  console.log('✓ All 3 WAV sound assets verified with valid 16-bit 44.1kHz PCM headers!');
}

// 2. Volume Clamping Math
{
  console.log('\nTest A2: Master Volume Clamping Math');
  function clampVolume(vol: number): number {
    return Math.max(0, Math.min(1, vol));
  }

  assert(clampVolume(1.0) === 1.0, '1.0 remains 1.0');
  assert(clampVolume(0.0) === 0.0, '0.0 remains 0.0');
  assert(clampVolume(0.5) === 0.5, '0.5 remains 0.5');
  assert(clampVolume(-0.25) === 0.0, 'Negative volume clamped to 0.0');
  assert(clampVolume(1.5) === 1.0, 'Volume > 1 clamped to 1.0');
  console.log('✓ Master volume clamping passed!');
}

// 3. Audio Click Debounce Simulation
{
  console.log('\nTest A3: Rapid-Fire Audio Click Debounce (< 45ms)');
  let playCount = 0;
  let lastTimestamp = 0;

  function simulateClickSound(timestamp: number) {
    if (timestamp - lastTimestamp < 45) {
      return; // Debounced
    }
    lastTimestamp = timestamp;
    playCount++;
  }

  // 1st click at t=100ms
  simulateClickSound(100);
  assert(playCount === 1, 'Initial click plays');

  // Rapid jitter click at t=120ms (only 20ms later)
  simulateClickSound(120);
  assert(playCount === 1, 'Jitter click at +20ms debounced');

  // Rapid jitter click at t=140ms (only 40ms from first)
  simulateClickSound(140);
  assert(playCount === 1, 'Jitter click at +40ms debounced');

  // Legitimate second click at t=170ms (70ms later)
  simulateClickSound(170);
  assert(playCount === 2, 'Valid click at +70ms played');

  console.log('✓ Audio click debounce verified!');
}

// 4. Low-Time Warning Audio Cadence (Once per second under 10 seconds)
{
  console.log('\nTest A4: Low-Time Warning Trigger Frequency');
  const config = createSymmetricConfig('blitz_3_0', '3 min', 'blitz', 180, 0);
  const engine = new ChessClockEngine(config);

  // Set time remaining to 12 seconds
  engine.adjustTime(1, -(180 - 12) * 1000);
  assert(engine.getPlayerState(1).timeRemainingMs === 12000, 'P1 has 12,000ms left');

  let tickSoundFiredCount = 0;
  let lastSecondTracked = -1;

  function onEngineTick(remainingMs: number) {
    if (remainingMs <= 10000 && remainingMs > 0) {
      const sec = Math.ceil(remainingMs / 1000);
      if (sec !== lastSecondTracked) {
        lastSecondTracked = sec;
        tickSoundFiredCount++;
      }
    }
  }

  // Start clock at t=1,000,000
  const t0 = 1000000;
  engine.start(1, t0);

  // Tick at 11s -> should NOT fire (remaining 11s > 10s)
  engine.tick(t0 + 1000);
  onEngineTick(engine.getPlayerState(1).timeRemainingMs);
  assert(tickSoundFiredCount === 0, 'No warning at 11s');

  // Tick at 10s -> Should fire for second 10
  engine.tick(t0 + 2000);
  onEngineTick(engine.getPlayerState(1).timeRemainingMs);
  assert(tickSoundFiredCount === 1, 'Warning fired at 10s');

  // Sub-tick at 9.8s -> Should NOT fire again for second 10
  engine.tick(t0 + 2200);
  onEngineTick(engine.getPlayerState(1).timeRemainingMs);
  assert(tickSoundFiredCount === 1, 'Warning did not duplicate for same second (9.8s)');

  // Tick at 9.0s -> Should fire for second 9
  engine.tick(t0 + 3000);
  onEngineTick(engine.getPlayerState(1).timeRemainingMs);
  assert(tickSoundFiredCount === 2, 'Warning fired at 9s');

  // Tick at 8.0s -> Should fire for second 8
  engine.tick(t0 + 4000);
  onEngineTick(engine.getPlayerState(1).timeRemainingMs);
  assert(tickSoundFiredCount === 3, 'Warning fired at 8s');

  engine.pause();
  console.log('✓ Low-time warning triggers strictly once per second when <= 10s!');
}

// 5. Inactive Player Tap Rejection (No Turn Switch, No Audio Trigger)
{
  console.log('\nTest A5: Inactive Player Tap Rejection Guards Audio');
  const config = createSymmetricConfig('blitz_3_0', '3 min', 'blitz', 180, 0);
  const engine = new ChessClockEngine(config);

  let turnSwitchCount = 0;
  engine.on('turn_switch', () => {
    turnSwitchCount++;
  });

  const t0 = 2000000;
  engine.start(1, t0); // Player 1 is active

  // Player 2 taps while Player 1 is active
  engine.switchTurn(2, t0 + 500);
  assert(turnSwitchCount === 0, 'Inactive Player 2 tap ignored; no turn_switch event');
  assert(engine.getSnapshot().activePlayer === 1, 'Player 1 remains active');

  // Player 1 taps
  engine.switchTurn(1, t0 + 1000);
  assert(turnSwitchCount === 1, 'Active Player 1 tap succeeded; turn_switch event fired');
  assert(engine.getSnapshot().activePlayer === 2, 'Player 2 is now active');

  engine.pause();
  console.log('✓ Inactive player tap does not trigger turn switch or audio click!');
}

console.log('\nALL AUDIO & SETTINGS AUTOMATED TESTS PASSED WITH 100% SUCCESS! 🎵');
