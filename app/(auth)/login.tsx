import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Spacing } from '../../constants/layout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { useFeedback } from '../../context/FeedbackContext';
import { signIn } from '../../lib/api/auth';
import { getMyProfile } from '../../lib/api/profile';
import { useTranslation } from 'react-i18next';
import { haptic } from '../../lib/haptics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { toast } = useFeedback();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      haptic.medium();
      return toast(t('auth.errEmail'), { variant: 'error' });
    }
    if (password.length < 6) {
      haptic.medium();
      return toast(t('auth.errPassword'), { variant: 'error' });
    }
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (!res.ok) {
      haptic.medium();
      return toast(t(res.errorKey ?? 'auth.errGeneric'), { variant: 'error' });
    }
    haptic.success();
    // First login → onboarding; returning/onboarded user → app.
    const profile = await getMyProfile();
    router.replace(profile?.onboarding_done ? '/(tabs)/plan' : '/(onboarding)');
  };

  const soon = () => toast(t('common.soon'), { variant: 'info' });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Marque */}
          <Image source={require('../../assets/fridos.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

          {/* Formulaire */}
          <View style={styles.form}>
            <Input
              icon="mail-outline"
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              icon="lock-closed-outline"
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              right={
                <PressableScale haptic="light" hitSlop={8} onPress={() => setShowPw(s => !s)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </PressableScale>
              }
            />

            <PressableScale haptic="light" style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>{t('auth.login.forgot')}</Text>
            </PressableScale>

            <Button label={t('auth.login.button')} loading={loading} onPress={submit} style={{ marginTop: Spacing.sm }} />
          </View>

          {/* Séparateur */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('auth.login.or')}</Text>
            <View style={styles.divider} />
          </View>

          {/* Connexions sociales (UI — à brancher) */}
          <View style={styles.socialRow}>
            <PressableScale haptic="light" style={styles.socialBtn} onPress={soon}>
              <Ionicons name="logo-google" size={20} color={colors.textPrimary} />
              <Text style={styles.socialText}>Google</Text>
            </PressableScale>
            <PressableScale haptic="light" style={styles.socialBtn} onPress={soon}>
              <Ionicons name="logo-apple" size={22} color={colors.textPrimary} />
              <Text style={styles.socialText}>Apple</Text>
            </PressableScale>
          </View>
        </ScrollView>

        {/* Bas — vers inscription */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.login.noAccount')}</Text>
          <PressableScale haptic="light" onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>{t('auth.login.signupLink')}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: 20, tintColor: colors.white },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  form: { gap: 14 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 2 },
  forgotText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.green,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 26 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  dividerText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.textMuted },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  socialText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textPrimary },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
  footerLink: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.green },
});
