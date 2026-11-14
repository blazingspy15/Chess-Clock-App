import { ChessClockEngine } from '../ChessClockEngine.ts';
import {
  createSymmetricConfig,
  createHandicapConfig,
  createMultiStageConfig,
  PRESET_TIME_CONTROLS,
} from '../presets.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('=== CHESS CLOCK ENGINE UNIT TESTS ===\n');

// 1. Fischer Increment Test (3 | 2 Blitz)
{
  console.log('Test 1: Fischer Increment (3 min + 2s increment)');
  const config = createSymmetricConfig('blitz_3_2', '3 | 2', 'blitz', 180, 2, 'fischer');
  const engine = new ChessClockEngine(config);

  const initialP1Time = 180 * 1000;
  assert(engine.getPlayerState(1).timeRemainingMs === initialP1Time, 'P1 starts with 180,000ms');

  const baseTime = 1000000;
  // Start with Player 1 active at deterministic baseTime
  engine.start(1, baseTime);
  const snapStart = engine.getSnapshot();
  assert(snapStart.status === 'running', 'Status is running');
  assert(snapStart.activePlayer === 1, 'Player 1 is active');

  // Simulate tick of 1000ms
  engine.tick(baseTime + 1000);
  assert(
    engine.getPlayerState(1).timeRemainingMs === initialP1Time - 1000,
    `P1 lost 1000ms during tick (expected ${initialP1Time - 1000}, got ${engine.getPlayerState(1).timeRemainingMs})`
  );

  // Switch turn (P1 presses clock at baseTime + 1000). Fischer adds 2000ms!
  engine.switchTurn(1, baseTime + 1000);
  const expectedAfterMove = initialP1Time - 1000 + 2000;
  assert(
    engine.getPlayerState(1).timeRemainingMs === expectedAfterMove,
    `P1 received Fischer increment (expected ${expectedAfterMove}, got ${engine.getPlayerState(1).timeRemainingMs})`
  );
  assert(engine.getPlayerState(1).moveCount === 1, 'P1 move count incremented to 1');
  assert(engine.getSnapshot().activePlayer === 2, 'Player 2 is now active');

  engine.pause();
  console.log('✓ Fischer Increment passed!\n');
}

// 2. Bronstein Delay Test (3 min + 2s Bronstein)
{
  console.log('Test 2: Bronstein Delay (Cap at turn start time)');
  const config = createSymmetricConfig('bronstein_test', '3 b2', 'blitz', 180, 2, 'bronstein');
  const engine = new ChessClockEngine(config);

  const startMs = 180 * 1000;
  let t = 2000000;
  engine.start(1, t);

  // Scenario A: Move takes LESS than delay (1500ms < 2000ms)
  engine.tick(t + 1500);
  assert(engine.getPlayerState(1).timeRemainingMs === startMs - 1500, 'P1 time decreased during move');

  engine.switchTurn(1, t + 1500);
  // Time should be reimbursed exactly by 1500ms, bringing it back to startMs (not startMs + 500ms)
  assert(
    engine.getPlayerState(1).timeRemainingMs === startMs,
    `Bronstein caps at start time for fast move (expected ${startMs}, got ${engine.getPlayerState(1).timeRemainingMs})`
  );

  // Scenario B: P2 move takes MORE than delay (3500ms > 2000ms)
  t = t + 1500;
  engine.tick(t + 3500);
  assert(engine.getPlayerState(2).timeRemainingMs === startMs - 3500, 'P2 time decreased during move');

  engine.switchTurn(2, t + 3500);
  const expectedP2 = startMs - 3500 + 2000; // startMs - 1500
  assert(
    engine.getPlayerState(2).timeRemainingMs === expectedP2,
    `Bronstein reimburses max of 2000ms for slow move (expected ${expectedP2}, got ${engine.getPlayerState(2).timeRemainingMs})`
  );

  engine.pause();
  console.log('✓ Bronstein Delay passed!\n');
}

// 3. Simple Delay Test (5 min + 3s USCF Delay)
{
  console.log('Test 3: Simple Delay (Delay countdown protects main bank)');
  const config = createSymmetricConfig('delay_test', '5 d3', 'blitz', 300, 3, 'delay');
  const engine = new ChessClockEngine(config);

  const startMs = 300 * 1000;
  let t = 3000000;
  engine.start(1, t);

  assert(engine.getPlayerState(1).currentDelayRemainingMs === 3000, 'Initial delay is 3000ms');

  // Tick 2000ms (within the 3000ms delay window)
  engine.tick(t + 2000);

  assert(
    engine.getPlayerState(1).timeRemainingMs === startMs,
    `Main clock remained 100% untouched during first 2s delay (expected ${startMs}, got ${engine.getPlayerState(1).timeRemainingMs})`
  );
  assert(
    engine.getPlayerState(1).currentDelayRemainingMs === 1000,
    `Delay bank reduced by 2000ms (expected 1000, got ${engine.getPlayerState(1).currentDelayRemainingMs})`
  );

  // Tick another 2000ms (1000ms of delay used, 1000ms from main bank)
  engine.tick(t + 4000);

  assert(
    engine.getPlayerState(1).currentDelayRemainingMs === 0,
    'Delay bank exhausted'
  );
  assert(
    engine.getPlayerState(1).timeRemainingMs === startMs - 1000,
    `Main clock deducted by 1000ms after delay ran out (expected ${startMs - 1000}, got ${engine.getPlayerState(1).timeRemainingMs})`
  );

  engine.pause();
  console.log('✓ Simple Delay passed!\n');
}

// 4. Flagging Test (Time Out at 0:00)
{
  console.log('Test 4: Flagging & Win State');
  const config = createSymmetricConfig('flag_test', '10 sec', 'bullet', 10, 0, 'none');
  const engine = new ChessClockEngine(config);

  let flagEventFired = false;
  engine.on('flag', (_snap, data) => {
    flagEventFired = true;
    assert(data.flaggedPlayer === 1, 'Player 1 flagged');
  });

  const t = 4000000;
  engine.start(1, t);
  engine.tick(t + 10500); // Exceed 10s

  const snap = engine.getSnapshot();
  assert(flagEventFired, 'Flag event dispatched');
  assert(snap.status === 'flagged', 'Status is flagged');
  assert(snap.flaggedPlayer === 1, 'Flagged player is 1');
  assert(snap.winner === 2, 'Winner is Player 2');
  assert(snap.player1.timeRemainingMs === 0, 'P1 timeRemainingMs clamped at 0');
  engine.destroy();
  console.log('✓ Flagging & Win state passed!\n');
}

// 5. Asymmetric Handicap Test
{
  console.log('Test 5: Asymmetric Handicap');
  const handicap = createHandicapConfig(
    'Handicap 10m vs 1m',
    600, 0, 'none', // P1: 10 min
    60, 1, 'fischer' // P2: 1 min + 1s
  );
  const engine = new ChessClockEngine(handicap);

  assert(engine.getPlayerState(1).timeRemainingMs === 600 * 1000, 'P1 has 10 min');
  assert(engine.getPlayerState(2).timeRemainingMs === 60 * 1000, 'P2 has 1 min');
  assert(engine.getPlayerStage(2).incrementMs === 1000, 'P2 has 1s increment');
  engine.destroy();
  console.log('✓ Asymmetric Handicap passed!\n');
}

// 6. Multi-Stage Tournament Test
{
  console.log('Test 6: Multi-Stage Tournament Control');
  const multiStage = createMultiStageConfig('test_multi', 'Stage Test', [
    { movesThreshold: 2, baseTimeMinutes: 1, incrementSeconds: 0, timingMethod: 'none' }, // Stage 0: 60s for 2 moves
    { baseTimeMinutes: 2, incrementSeconds: 5, timingMethod: 'fischer' },                 // Stage 1: +120s bonus
  ]);
  const engine = new ChessClockEngine(multiStage);

  engine.start(1);
  assert(engine.getPlayerState(1).currentStageIndex === 0, 'P1 starts in stage 0');
  assert(engine.getPlayerState(1).timeRemainingMs === 60000, 'P1 starts with 60,000ms');

  // Move 1
  engine.switchTurn(1);
  assert(engine.getPlayerState(1).moveCount === 1, 'P1 move 1 complete');
  assert(engine.getPlayerState(1).currentStageIndex === 0, 'P1 still in stage 0');

  // Move 2 by P2
  engine.switchTurn(2);

  // Move 2 by P1 (triggers stage threshold of 2 moves!)
  let stageAdvancedFired = false;
  engine.on('stage_advanced', (_snap, data) => {
    stageAdvancedFired = true;
    assert(data.player === 1, 'Player 1 triggered stage advance');
    assert(data.newStageIndex === 1, 'Advanced to stage 1');
    assert(data.addedTimeMs === 120000, 'Received 120,000ms bonus');
  });

  engine.switchTurn(1);
  assert(stageAdvancedFired, 'Stage advance event dispatched');
  assert(engine.getPlayerState(1).currentStageIndex === 1, 'P1 now in stage 1');
  assert(
    engine.getPlayerState(1).timeRemainingMs === 60000 + 120000,
    `Bonus 120s credited to P1 (expected ${60000 + 120000}, got ${engine.getPlayerState(1).timeRemainingMs})`
  );

  engine.destroy();
  console.log('✓ Multi-Stage Tournament passed!\n');
}

// 7. On-the-fly Time & Move Adjustment Test
{
  console.log('Test 7: On-the-Fly Mid-Game Adjustments');
  const engine = new ChessClockEngine();
  engine.start(1);
  engine.pause();

  const originalTime = engine.getPlayerState(1).timeRemainingMs;
  engine.adjustTime(1, 30000); // Add 30 seconds
  assert(engine.getPlayerState(1).timeRemainingMs === originalTime + 30000, 'Added 30s successfully');

  engine.adjustMoves(1, 5);
  assert(engine.getPlayerState(1).moveCount === 5, 'Adjusted move count to 5');

  engine.destroy();
  console.log('✓ On-the-fly adjustments passed!\n');
}

console.log('ALL 7 ENGINE UNIT TESTS PASSED WITH 100% PRECISION! 🏆\n');
process.exit(0);
