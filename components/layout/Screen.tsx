import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  dark?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function Screen({ children, scroll = false, dark = false, style, contentStyle }: ScreenProps) {
  const bg = dark ? Colors.scanBg : Colors.background;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]}>
      <StatusBar
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={bg}
      />
      {scroll
        ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, contentStyle]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        )
        : (
          <View style={[styles.fill, contentStyle]}>
            {children}
          </View>
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
