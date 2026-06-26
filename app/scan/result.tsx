import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { PressableScale } from '../../components/ui/PressableScale';
import { Button } from '../../components/ui/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { useFridge } from '../../context/FridgeContext';
import { usePlan } from '../../context/PlanContext';
import { useAllergens } from '../../context/AllergenContext';
import { DetectedItem } from '../../components/ui/DetectedItem';
import { haptic } from '../../lib/haptics';
import { detectIngredients, DetectedIngredient } from '../../services/vision';
import { RECIPES } from '../../constants/recipes';
import { recommendRecipes } from '../../services/recipeFilters';
import { recipeOwnership } from '../../services/shoppingList';
import { localizeRecipeName } from '../../services/localizeRecipe';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

const itemKey = (name: string) => name.toLowerCase().replace(/ /g, '_');

export default function ScanResultScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const insets = useSafeAreaInsets();
  const { ingredients: fridge, addBulkIngredients } = useFridge();
  const { profile } = usePlan();
  const { userAllergens } = useAllergens();
  const { t } = useTranslation();
  const [detected, setDetected] = useState<DetectedIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const items = await detectIngredients(uri);
      setDetected(items);
      setChecked(new Set(items.filter(d => d.default).map(d => d.id)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [uri]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const items = await detectIngredients(uri);
        if (!active) return;
        setDetected(items);
        setChecked(new Set(items.filter(d => d.default).map(d => d.id)));
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [uri]);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Localized names of the ingredients the user kept checked.
  const checkedNames = useMemo(
    () =>
      detected
        .filter(d => checked.has(d.id))
        .map(d => t(`scan.results.items.${itemKey(d.name)}`, d.name)),
    [detected, checked, t],
  );

  // What the fridge would hold once these are added — used to rank recipes.
  const prospectiveFridge = useMemo(() => [...fridge, ...checkedNames], [fridge, checkedNames]);

  // Profile-aware meal ideas: drop allergens, prefer the user's diet, then
  // surface the recipes that need the fewest extra ingredients.
  const suggestions = useMemo(() => {
    const safe = recommendRecipes(RECIPES, { diet: profile.diet, allergens: userAllergens });
    return safe
      .map(r => ({ recipe: r, own: recipeOwnership(r, prospectiveFridge) }))
      .sort((a, b) => a.own.missingCount - b.own.missingCount || a.recipe.time - b.recipe.time)
      .slice(0, 4);
  }, [prospectiveFridge, profile.diet, userAllergens]);

  // Land on "My fridge" so the freshly detected items are visible right away —
  // closes the loop between the scan and the fridge section in the profile.
  const goToFridge = () => {
    router.dismissTo('/fridge');
  };

  const handleAdd = () => {
    haptic.success();
    addBulkIngredients(checkedNames);
    goToFridge();
  };

  const checkedCount = checked.size;

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgPhoto}>
        <Text style={styles.bgEmoji1}>🥦</Text>
        <Text style={styles.bgEmoji2}>🍅</Text>
        <Text style={styles.bgEmoji3}>🥕</Text>
      </View>

      {/* Close */}
      <View style={[styles.headerBar, { top: insets.top + 6 }]}>
        <PressableScale haptic="light" style={styles.closeBtn} onPress={() => router.dismissAll()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.white} />
        </PressableScale>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {loading ? t('scan.results.loadingTitle') : t('scan.results.title', { count: detected.length })}
          </Text>
          <Text style={styles.sheetDesc}>
            {loading ? t('scan.results.loadingDesc') : t('scan.results.desc')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.stateText}>{t('scan.results.loadingText')}</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textLight} />
            <Text style={styles.stateText}>{t('scan.results.errorText')}</Text>
            <PressableScale haptic="light" style={styles.retryBtn} onPress={load}>
              <Ionicons name="refresh" size={16} color={colors.green} />
              <Text style={styles.retryText}>{t('scan.results.retry')}</Text>
            </PressableScale>
          </View>
        ) : detected.length === 0 ? (
          <View style={styles.stateWrap}>
            <Ionicons name="image-outline" size={40} color={colors.textLight} />
            <Text style={styles.stateText}>{t('scan.results.emptyText')}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {detected.map(d => (
              <DetectedItem
                key={d.id}
                emoji={d.emoji}
                name={t(`scan.results.items.${itemKey(d.name)}`, d.name)}
                confidence={d.confidence}
                bgColor={d.bg}
                checked={checked.has(d.id)}
                onToggle={() => toggle(d.id)}
              />
            ))}

            {/* AI meal ideas based on what's detected + the user's profile */}
            {suggestions.length > 0 && (
              <View style={styles.ideas}>
                <View style={styles.ideasHead}>
                  <Ionicons name="sparkles" size={16} color={colors.green} />
                  <Text style={styles.ideasTitle}>{t('scan.results.mealIdeas.title')}</Text>
                </View>
                <Text style={styles.ideasSub}>
                  {t('scan.results.mealIdeas.subtitle', {
                    diet: t(`setup.diets.${profile.diet}` as 'setup.diets.healthy', { defaultValue: profile.diet }),
                  })}
                </Text>

                {suggestions.map(({ recipe, own }) => (
                  <PressableScale
                    key={recipe.id}
                    style={styles.ideaCard}
                    scaleTo={0.98}
                    haptic="light"
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                  >
                    <View style={[styles.ideaThumb, { backgroundColor: recipe.bgColor }]}>
                      {recipe.image ? (
                        <Image source={{ uri: recipe.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                      ) : (
                        <Text style={styles.ideaEmoji}>{recipe.emoji}</Text>
                      )}
                    </View>

                    <View style={styles.ideaBody}>
                      <Text style={styles.ideaName} numberOfLines={1}>{localizeRecipeName(recipe, t)}</Text>
                      <View style={styles.ideaMeta}>
                        <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.ideaMetaText}>{recipe.time} {t('plan.min')}</Text>
                        <Text style={styles.ideaDot}>·</Text>
                        <Ionicons name="flame-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.ideaMetaText}>{recipe.kcal} kcal</Text>
                      </View>
                      <View style={[styles.matchBadge, own.tag === 'complete' ? styles.matchGreen : styles.matchOrange]}>
                        <Ionicons
                          name={own.tag === 'complete' ? 'checkmark-circle' : 'cart-outline'}
                          size={12}
                          color={own.tag === 'complete' ? colors.green : colors.orange}
                        />
                        <Text style={[styles.matchText, { color: own.tag === 'complete' ? colors.green : colors.orange }]}>
                          {own.tag === 'complete'
                            ? t('recipes.card.allOwned')
                            : t('recipes.card.missingCount', { count: own.missingCount })}
                        </Text>
                      </View>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                  </PressableScale>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button
            variant="primary"
            icon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
            label={t('scan.results.addBtn', { count: checkedCount })}
            disabled={loading || checkedCount === 0}
            onPress={handleAdd}
            style={styles.actionBtnSpacing}
          />

          <PressableScale haptic="light" style={styles.manualBtn} onPress={goToFridge} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={17} color={colors.green} />
            <Text style={styles.manualBtnText}>{t('scan.results.addManually')}</Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scanBg },
  bgPhoto: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgEmoji1: { position: 'absolute', fontSize: 100, opacity: 0.12, top: '20%', left: '10%', transform: [{ rotate: '15deg' }] },
  bgEmoji2: { position: 'absolute', fontSize: 90, opacity: 0.12, top: '40%', right: '8%', transform: [{ rotate: '-25deg' }] },
  bgEmoji3: { position: 'absolute', fontSize: 85, opacity: 0.12, bottom: '28%', left: '15%', transform: [{ rotate: '10deg' }] },
  headerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.82,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sheetDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 22,
    paddingVertical: 4,
    paddingBottom: 12,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
  },
  stateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenLight,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    marginTop: 4,
  },
  retryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.green,
  },

  /* ── Meal ideas ── */
  ideas: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ideasHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  ideasTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: colors.textPrimary },
  ideasSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  ideaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 10,
  },
  ideaThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ideaEmoji: { fontSize: 30 },
  ideaBody: { flex: 1, gap: 4 },
  ideaName: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.textPrimary },
  ideaMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ideaMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  ideaDot: { color: colors.textLight, marginHorizontal: 2 },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  matchGreen: { backgroundColor: colors.greenLight },
  matchOrange: { backgroundColor: colors.orangeLight },
  matchText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },

  actions: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  actionBtnSpacing: {
    marginBottom: 8,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  manualBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.green,
  },
});
