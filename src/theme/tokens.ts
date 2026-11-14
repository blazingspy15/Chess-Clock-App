export type ThemeId = 'graphite' | 'midnight' | 'emerald' | 'wood';

export interface ThemeColors {
  id: ThemeId;
  name: string;
  bgApp: string;
  surface: string;
  surfaceElevated: string;
  surfaceInactive: string;
  surfaceActive: string;
  surfacePaused: string;
  surfaceFlagged: string;
  borderSubtle: string;
  borderActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentGold: string;
  accentBlue: string;
  flagRed: string;
  flagSubText: string;
  activeTextColor: string;
  activeSubTextColor: string;
}

export const THEMES: Record<ThemeId, ThemeColors> = {
  graphite: {
    id: 'graphite',
    name: 'Tournament Graphite',
    bgApp: '#0c0e12',
    surface: '#151921',
    surfaceElevated: '#1e2430',
    surfaceInactive: '#161b24',
    surfaceActive: '#047857', // Deep Emerald Green
    surfacePaused: '#065f46',
    surfaceFlagged: '#b91c1c', // Deep Crimson
    borderSubtle: '#262f3d',
    borderActive: '#10b981',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    accentGold: '#d97706',
    accentBlue: '#2563eb',
    flagRed: '#ef4444',
    flagSubText: '#fee2e2',
    activeTextColor: '#ffffff',
    activeSubTextColor: '#a7f3d0',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Black',
    bgApp: '#05070a',
    surface: '#0f141c',
    surfaceElevated: '#1a2230',
    surfaceInactive: '#111722',
    surfaceActive: '#0284c7', // Midnight Cyan/Blue
    surfacePaused: '#0369a1',
    surfaceFlagged: '#dc2626',
    borderSubtle: '#1e293b',
    borderActive: '#38bdf8',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    accentGold: '#f59e0b',
    accentBlue: '#38bdf8',
    flagRed: '#ef4444',
    flagSubText: '#fecaca',
    activeTextColor: '#ffffff',
    activeSubTextColor: '#bae6fd',
  },
  emerald: {
    id: 'emerald',
    name: 'Masters Emerald',
    bgApp: '#06130d',
    surface: '#0d2218',
    surfaceElevated: '#143627',
    surfaceInactive: '#0e261b',
    surfaceActive: '#059669', // Masters Green
    surfacePaused: '#047857',
    surfaceFlagged: '#dc2626',
    borderSubtle: '#1a4331',
    borderActive: '#34d399',
    textPrimary: '#f0fdf4',
    textSecondary: '#bbf7d0',
    textMuted: '#6ee7b7',
    accentGold: '#fbbf24',
    accentBlue: '#38bdf8',
    flagRed: '#f87171',
    flagSubText: '#fee2e2',
    activeTextColor: '#ffffff',
    activeSubTextColor: '#d1fae5',
  },
  wood: {
    id: 'wood',
    name: 'Classic Club Wood',
    bgApp: '#14100c',
    surface: '#221b16',
    surfaceElevated: '#332921',
    surfaceInactive: '#261e18',
    surfaceActive: '#854d0e', // Rich Warm Amber/Mahogany
    surfacePaused: '#713f12',
    surfaceFlagged: '#991b1b',
    borderSubtle: '#44352a',
    borderActive: '#eab308',
    textPrimary: '#fef3c7',
    textSecondary: '#fde68a',
    textMuted: '#a8a29e',
    accentGold: '#eab308',
    accentBlue: '#38bdf8',
    flagRed: '#ef4444',
    flagSubText: '#fee2e2',
    activeTextColor: '#ffffff',
    activeSubTextColor: '#fef08a',
  },
};
