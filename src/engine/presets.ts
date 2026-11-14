import type { TimeControlConfig, Stage, TimingMethod } from './types.ts';

export function createSymmetricConfig(
  id: string,
  name: string,
  category: TimeControlConfig['category'],
  baseTimeSeconds: number,
  incrementSeconds: number = 0,
  timingMethod: TimingMethod = 'fischer',
  description?: string
): TimeControlConfig {
  const stage: Stage = {
    stageIndex: 0,
    baseTimeMs: baseTimeSeconds * 1000,
    incrementMs: incrementSeconds * 1000,
    timingMethod: incrementSeconds > 0 ? timingMethod : 'none',
  };

  return {
    id,
    name,
    description: description || `${Math.floor(baseTimeSeconds / 60)} | ${incrementSeconds}`,
    category,
    player1: { stages: [{ ...stage }] },
    player2: { stages: [{ ...stage }] },
    isHandicap: false,
  };
}

export function createHandicapConfig(
  name: string,
  p1BaseSeconds: number,
  p1IncrementSeconds: number,
  p1Method: TimingMethod,
  p2BaseSeconds: number,
  p2IncrementSeconds: number,
  p2Method: TimingMethod
): TimeControlConfig {
  return {
    id: `handicap_${Date.now()}`,
    name,
    description: `P1: ${Math.floor(p1BaseSeconds / 60)}m | P2: ${Math.floor(p2BaseSeconds / 60)}m`,
    category: 'custom',
    player1: {
      stages: [
        {
          stageIndex: 0,
          baseTimeMs: p1BaseSeconds * 1000,
          incrementMs: p1IncrementSeconds * 1000,
          timingMethod: p1IncrementSeconds > 0 ? p1Method : 'none',
        },
      ],
    },
    player2: {
      stages: [
        {
          stageIndex: 0,
          baseTimeMs: p2BaseSeconds * 1000,
          incrementMs: p2IncrementSeconds * 1000,
          timingMethod: p2IncrementSeconds > 0 ? p2Method : 'none',
        },
      ],
    },
    isHandicap: true,
  };
}

export function createMultiStageConfig(
  id: string,
  name: string,
  stages: {
    movesThreshold?: number;
    baseTimeMinutes: number;
    incrementSeconds: number;
    timingMethod: TimingMethod;
  }[]
): TimeControlConfig {
  const playerStages: Stage[] = stages.map((s, index) => ({
    stageIndex: index,
    baseTimeMs: s.baseTimeMinutes * 60 * 1000,
    incrementMs: s.incrementSeconds * 1000,
    timingMethod: s.incrementSeconds > 0 ? s.timingMethod : 'none',
    movesThreshold: s.movesThreshold,
  }));

  return {
    id,
    name,
    description: `${stages.length}-stage tournament control`,
    category: 'classical',
    player1: { stages: playerStages.map(s => ({ ...s })) },
    player2: { stages: playerStages.map(s => ({ ...s })) },
    isHandicap: false,
  };
}

export const PRESET_TIME_CONTROLS: TimeControlConfig[] = [
  // Bullet
  createSymmetricConfig('bullet_1_0', '1 min', 'bullet', 60, 0, 'none', '1 | 0 Bullet'),
  createSymmetricConfig('bullet_1_1', '1 | 1', 'bullet', 60, 1, 'fischer', '1m + 1s Fischer'),
  createSymmetricConfig('bullet_2_1', '2 | 1', 'bullet', 120, 1, 'fischer', '2m + 1s Fischer'),

  // Blitz
  createSymmetricConfig('blitz_3_0', '3 min', 'blitz', 180, 0, 'none', '3 | 0 Blitz'),
  createSymmetricConfig('blitz_3_2', '3 | 2', 'blitz', 180, 2, 'fischer', '3m + 2s Fischer'),
  createSymmetricConfig('blitz_5_0', '5 min', 'blitz', 300, 0, 'none', '5 | 0 Blitz'),
  createSymmetricConfig('blitz_5_5', '5 | 5', 'blitz', 300, 5, 'fischer', '5m + 5s Fischer'),

  // Rapid
  createSymmetricConfig('rapid_10_0', '10 min', 'rapid', 600, 0, 'none', '10 | 0 Rapid'),
  createSymmetricConfig('rapid_15_10', '15 | 10', 'rapid', 900, 10, 'fischer', '15m + 10s Fischer'),
  createSymmetricConfig('rapid_30_0', '30 min', 'rapid', 1800, 0, 'none', '30 | 0 Rapid'),
  createSymmetricConfig('rapid_60_0', '60 min', 'rapid', 3600, 0, 'none', '60 | 0 Classical / Long'),

  // Delay Presets (USCF standard delay & Bronstein)
  createSymmetricConfig('blitz_5_d3', '5 d3', 'blitz', 300, 3, 'delay', '5 min + 3s Simple Delay'),
  createSymmetricConfig('rapid_10_d5', '10 d5', 'rapid', 600, 5, 'delay', '10 min + 5s Simple Delay'),
  createSymmetricConfig('blitz_3_b2', '3 b2', 'blitz', 180, 2, 'bronstein', '3 min + 2s Bronstein Delay'),

  // Multi-Stage Tournament (FIDE Standard)
  createMultiStageConfig('fide_standard', 'FIDE 40/90m + 30m', [
    {
      movesThreshold: 40,
      baseTimeMinutes: 90,
      incrementSeconds: 30,
      timingMethod: 'fischer',
    },
    {
      baseTimeMinutes: 30,
      incrementSeconds: 30,
      timingMethod: 'fischer',
    },
  ]),
];

export const DEFAULT_TIME_CONTROL = PRESET_TIME_CONTROLS[4]; // 3 | 2 Blitz is a universal standard
