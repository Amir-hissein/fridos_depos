// Fridos Typography System

import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  // Poppins (titres, headings)
  h1: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 34,
  } as TextStyle,

  h2: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 25,
    color: Colors.textPrimary,
    lineHeight: 30,
  } as TextStyle,

  h3: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 27,
  } as TextStyle,

  h4: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    lineHeight: 24,
  } as TextStyle,

  h5: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 22,
  } as TextStyle,

  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  } as TextStyle,

  // Inter (body, UI)
  bodyLarge: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  } as TextStyle,

  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  } as TextStyle,

  bodySmall: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  } as TextStyle,

  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  } as TextStyle,

  labelSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,

  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  } as TextStyle,

  button: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: Colors.textWhite,
  } as TextStyle,

  buttonSmall: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textWhite,
  } as TextStyle,
};