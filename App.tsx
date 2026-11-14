import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { PlayerClock } from './src/components/PlayerClock';
import { CenterControlBar } from './src/components/CenterControlBar';
import { PresetSelector } from './src/components/PresetSelector';
import { CustomPresetModal } from './src/components/CustomPresetModal';
import { TimeAdjustModal } from './src/components/TimeAdjustModal';
import { SettingsModal } from './src/components/SettingsModal';
import { SettingsProvider, useSettings } from './src/state/SettingsContext';
import { useChessClock } from './src/state/useChessClock';
import { DEFAULT_TIME_CONTROL } from './src/engine/presets';
import { TimeControlConfig } from './src/engine/types';

const MainScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isDesktop = width >= 960;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  const { settings, theme } = useSettings();
  const { snapshot, formattedTimes, actions } = useChessClock(DEFAULT_TIME_CONTROL);

  // Modal states
  const [presetsVisible, setPresetsVisible] = useState(false);
  const [customBuilderVisible, setCustomBuilderVisible] = useState(false);
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleOpenAdjust = () => {
    if (snapshot.status === 'running') {
      actions.togglePause();
    }
    setAdjustVisible(true);
  };

  const handleSelectPreset = (config: TimeControlConfig) => {
    actions.setPreset(config);
  };

  // Screen wake lock during active match to prevent screen from dimming/sleeping
  useEffect(() => {
    if (snapshot.status === 'running') {
      activateKeepAwakeAsync('chess-clock-game').catch(() => {});
    } else {
      deactivateKeepAwake('chess-clock-game').catch(() => {});
    }
    return () => {
      deactivateKeepAwake('chess-clock-game').catch(() => {});
    };
  }, [snapshot.status]);

  // Android hardware back button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // 1. Close modals if any are open
      if (customBuilderVisible) {
        setCustomBuilderVisible(false);
        return true;
      }
      if (presetsVisible) {
        setPresetsVisible(false);
        return true;
      }
      if (adjustVisible) {
        setAdjustVisible(false);
        return true;
      }
      if (settingsVisible) {
        setSettingsVisible(false);
        return true;
      }

      // 2. Prevent accidental exit if game is actively running
      if (snapshot.status === 'running') {
        actions.togglePause();
        Alert.alert(
          'Exit Chess Clock Pro?',
          'A chess game is currently in progress. Would you like to exit or keep playing?',
          [
            { text: 'Keep Playing', style: 'cancel', onPress: () => actions.togglePause() },
            { text: 'Exit App', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true;
      }

      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [
    snapshot.status,
    presetsVisible,
    customBuilderVisible,
    adjustVisible,
    settingsVisible,
    actions,
  ]);

  const p1Stage =
    snapshot.config.player1.stages[snapshot.player1.currentStageIndex] ||
    snapshot.config.player1.stages[0];

  const p2Stage =
    snapshot.config.player2.stages[snapshot.player2.currentStageIndex] ||
    snapshot.config.player2.stages[0];

  // Configurable orientation: top player rotated 180° for face-to-face in portrait
  const shouldRotateTop = settings.clockOrientation === 'opposite' && !isLandscape;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgApp }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.bgApp}
        translucent={false}
        hidden={isLandscape}
      />
      <View style={styles.centerWrapper}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.bgApp },
            isLandscape ? styles.landscapeContainer : styles.portraitContainer,
            isDesktop && styles.desktopContainer,
          ]}
        >
          {/* Top Player (Player 2 / Black) */}
          <PlayerClock
            playerNumber={2}
            playerName={settings.player2Name}
            clockState={snapshot.player2}
            stage={p2Stage}
            formattedTime={formattedTimes.player2}
            delayFormatted={formattedTimes.p2Delay}
            isActive={snapshot.activePlayer === 2}
            isClockRunning={snapshot.status === 'running'}
            status={snapshot.status}
            isRotated={shouldRotateTop}
            onPress={() => actions.pressClock(2)}
            orientation={orientation}
          />

          {/* Central Dead-Zone Control Bar */}
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

          {/* Bottom Player (Player 1 / White) */}
          <PlayerClock
            playerNumber={1}
            playerName={settings.player1Name}
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
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopContainer: {
    maxWidth: 1100,
    maxHeight: 820,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#262f3d',
    margin: 'auto' as any,
  },
  portraitContainer: {
    flexDirection: 'column',
  },
  landscapeContainer: {
    flexDirection: 'row',
  },
});
