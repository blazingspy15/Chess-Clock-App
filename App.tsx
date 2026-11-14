import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { PlayerClock } from './src/components/PlayerClock';
import { CenterControlBar } from './src/components/CenterControlBar';
import { PresetSelector } from './src/components/PresetSelector';
import { CustomPresetModal } from './src/components/CustomPresetModal';
import { TimeAdjustModal } from './src/components/TimeAdjustModal';
import { SettingsModal } from './src/components/SettingsModal';
import { SettingsProvider } from './src/state/SettingsContext';
import { useChessClock } from './src/state/useChessClock';
import { DEFAULT_TIME_CONTROL } from './src/engine/presets';
import { TimeControlConfig } from './src/engine/types';

const MainScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  const { snapshot, formattedTimes, actions } = useChessClock(DEFAULT_TIME_CONTROL);

  // Modal visibilities
  const [presetsVisible, setPresetsVisible] = useState(false);
  const [customBuilderVisible, setCustomBuilderVisible] = useState(false);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleOpenAdjust = () => {
    // Automatically pause clock when opening adjustment sheet
    if (snapshot.status === 'running') {
      actions.togglePause();
    }
    setAdjustVisible(true);
  };

  const handleSelectPreset = (config: TimeControlConfig) => {
    actions.setPreset(config);
  };

  const p1Stage = snapshot.config.player1.stages[snapshot.player1.currentStageIndex] ||
    snapshot.config.player1.stages[0];

  const p2Stage = snapshot.config.player2.stages[snapshot.player2.currentStageIndex] ||
    snapshot.config.player2.stages[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden={true} />
      <View
        style={[
          styles.container,
          isLandscape ? styles.landscapeContainer : styles.portraitContainer,
        ]}
      >
        {/* Player 2 (Top in portrait, rotated 180° for opponent across the table) */}
        <PlayerClock
          playerNumber={2}
          clockState={snapshot.player2}
          stage={p2Stage}
          formattedTime={formattedTimes.player2}
          delayFormatted={formattedTimes.p2Delay}
          isActive={snapshot.activePlayer === 2}
          isClockRunning={snapshot.status === 'running'}
          status={snapshot.status}
          isRotated={!isLandscape} // Rotated 180° in portrait so opponent reads it
          onPress={() => actions.pressClock(2)}
          orientation={orientation}
        />

        {/* Dead-Zone Center Control Bar */}
        <CenterControlBar
          status={snapshot.status}
          config={snapshot.config}
          onTogglePause={actions.togglePause}
          onReset={actions.reset}
          onOpenPresets={() => setPresetsVisible(true)}
          onOpenSettings={() => setSettingsVisible(true)}
          onOpenAdjust={handleOpenAdjust}
          orientation={orientation}
        />

        {/* Player 1 (Bottom in portrait, facing current user) */}
        <PlayerClock
          playerNumber={1}
          clockState={snapshot.player1}
          stage={p1Stage}
          formattedTime={formattedTimes.player1}
          delayFormatted={formattedTimes.p1Delay}
          isActive={snapshot.activePlayer === 1}
          isClockRunning={snapshot.status === 'running'}
          status={snapshot.status}
          isRotated={false}
          onPress={() => actions.pressClock(1)}
          orientation={orientation}
        />

        {/* Modals */}
        <PresetSelector
          visible={presetsVisible}
          currentConfigId={snapshot.config.id}
          onSelectPreset={handleSelectPreset}
          onOpenCustomBuilder={() => setCustomBuilderVisible(true)}
          onClose={() => setPresetsVisible(false)}
        />

        <CustomPresetModal
          visible={customBuilderVisible}
          onClose={() => setCustomBuilderVisible(false)}
          onApplyConfig={handleSelectPreset}
        />

        <TimeAdjustModal
          visible={adjustVisible}
          snapshot={snapshot}
          onClose={() => setAdjustVisible(false)}
          onAdjustTime={actions.adjustTime}
          onAdjustMoves={actions.adjustMoves}
        />

        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <MainScreen />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  portraitContainer: {
    flexDirection: 'column',
  },
  landscapeContainer: {
    flexDirection: 'row',
  },
});
