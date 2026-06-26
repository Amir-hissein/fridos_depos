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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii, Spacing } from '../../constants/layout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PressableScale } from '../../components/ui/PressableScale';
import { useFeedback } from '../../context/FeedbackContext';
import { resetPassword } from '../../lib/api/auth';
import { useTranslation } from 'react-i18next';
import { haptic } from '../../lib/haptics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { toast } = useFeedback();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      haptic.medium();
      return toast(t('auth.errEmail'), { variant: 'error' });
    }
    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);
    if (!res.ok) {
      haptic.medium();
      return toast(t(res.errorKey ?? 'auth.errGeneric'), { variant: 'error' });
    }
    haptic.success();
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name={sent ? 'email-check-outline' : 'lock-reset'}
              size={30}
              color={colors.green}
            />
          </View>

          {sent ? (
            <>
              <Text style={styles.title}>{t('auth.forgot.sentTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.forgot.sentSubtitle', { email: email.trim() })}</Text>
              <Button label={t('auth.forgot.backToLogin')} onPress={() => router.back()} style={{ marginTop: Spacing.xl }} />
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('auth.forgot.title')}</Text>
              <Text style={styles.subtitle}>{t('auth.forgot.subtitle')}</Text>
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
                <Button label={t('auth.forgot.button')} loading={loading} onPress={submit} style={{ marginTop: Spacing.sm }} />
              </View>
            </>
          )}
        </ScrollView>
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
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 },
  iconBadge: {
    width: 64, height: 64, borderRadius: Radii.full,
    backgroundColor: colors.greenLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 27,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  email: { fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  form: { gap: 14, marginTop: 24 },
});
