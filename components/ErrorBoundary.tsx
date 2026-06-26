// Root error boundary — catches render/runtime errors anywhere in the tree and
// shows a themed fallback instead of a white crash screen. Must be a class
// component (React error boundaries have no hook equivalent). The fallback is
// self-contained (no theme/i18n hooks) so it works even if those layers failed.

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors as c } from '../constants/colors';
import i18n from '../lib/i18n';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Last-resort logging — surfaces in Metro/console; later: report to backend.
    console.error('Uncaught error in tree:', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const t = (key: string, fallback: string) => {
      try {
        const v = i18n.t(key, { defaultValue: fallback });
        return typeof v === 'string' ? v : fallback;
      } catch {
        return fallback;
      }
    };

    return (
      <View style={styles.root}>
        <View style={styles.iconWrap}>
          <Ionicons name="alert-circle-outline" size={44} color={c.orange} />
        </View>
        <Text style={styles.title}>{t('common.error.title', 'Une erreur est survenue')}</Text>
        <Text style={styles.body}>
          {t('common.error.body', 'Quelque chose s’est mal passé. Réessaie pour continuer.')}
        </Text>
        <Pressable style={styles.btn} onPress={this.reset}>
          <Text style={styles.btnText}>{t('common.error.retry', 'Réessayer')}</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: c.orangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: c.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  btn: {
    backgroundColor: c.green,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: c.textWhite,
  },
});
