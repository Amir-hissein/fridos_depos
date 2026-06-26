import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Spacing } from '../../constants/layout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTranslation } from 'react-i18next';
import { haptic } from '../../lib/haptics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { setUserName } = useApp();
  const { toast } = useFeedback();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (name.trim().length < 2) {
      haptic.medium();
      return toast(t('auth.signup.errName'), { variant: 'error' });
    }
    if (!EMAIL_RE.test(email.trim())) {
      haptic.medium();
      return toast(t('auth.errEmail'), { variant: 'error' });
    }
    if (password.length < 6) {
      haptic.medium();
      return toast(t('auth.errPassword'), { variant: 'error' });
    }
    if (password !== confirm) {
      haptic.medium();
      return toast(t('auth.signup.errMismatch'), { variant: 'error' });
    }
    // TODO(backend): brancher supabase.auth.signUp ici.
    setUserName(name.trim());
    haptic.success();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(onboarding)');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header retour */}
        <View style={styles.topBar}>
          <PressableScale haptic="light" style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </PressableScale>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{t('auth.signup.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>

          <View style={styles.form}>
            <Input
              icon="person-outline"
              placeholder={t('auth.signup.namePlaceholder')}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
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
            <Input
              icon="lock-closed-outline"
              placeholder={t('auth.signup.confirmPlaceholder')}
              secureTextEntry={!showPw}
              autoCapitalize="none"
              value={confirm}
              onChangeText={setConfirm}
            />

            <Button label={t('auth.signup.button')} loading={loading} onPress={submit} style={{ marginTop: Spacing.sm }} />
          </View>

          <Text style={styles.terms}>{t('auth.signup.terms')}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.signup.haveAccount')}</Text>
          <PressableScale haptic="light" onPress={() => router.back()}>
            <Text style={styles.footerLink}>{t('auth.signup.loginLink')}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingTop: 4 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 22,
  },
  form: { gap: 14 },
  terms: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 22,
    paddingHorizontal: 8,
  },
  termsLink: { color: colors.green, fontFamily: 'Inter_600SemiBold' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.textSecondary },
  footerLink: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.green },
});
