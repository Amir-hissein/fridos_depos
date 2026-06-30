import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { PressableScale } from '../components/ui/PressableScale';
import { ProgressBar } from '../components/ui/ProgressBar';
import { haptic } from '../lib/haptics';
import { usePlan, MealSlot } from '../context/PlanContext';
import { useFeedback } from '../context/FeedbackContext';
import { useFavorites } from '../context/FavoritesContext';
import { useCustomRecipes } from '../context/CustomRecipesContext';
import { useAllergens } from '../context/AllergenContext';
import { RECIPES, recipeImageSource } from '../constants/recipes';
import { filterRecipes, MealType } from '../services/recipeFilters';
import { localizeRecipeName } from '../services/localizeRecipe';
import { useTranslation } from 'react-i18next';

interface MealRecipe {
  id: string;
  name: string;
  kcal: number;
  time: number;
  image?: string;
  emoji?: string;
  bgColor?: string;
}

/** Thumbnail that shows the food photo, or an emoji-on-color fallback. */
function RecipeThumb({
  image, emoji, bgColor, style, emojiSize = 24,
}: { image?: string; emoji?: string; bgColor?: string; style: any; emojiSize?: number }) {
  const { colors } = useTheme();
  if (image) return <Image source={{ uri: image }} style={style} resizeMode="cover" />;
  return (
    <View style={[style, { backgroundColor: bgColor ?? colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: emojiSize }}>{emoji ?? '🍽️'}</Text>
    </View>
  );
}

const TABS = [
  { key: 'favorites', labelKey: 'mealDetail.tabs.favorites' },
  { key: 'myRecipes', labelKey: 'mealDetail.tabs.myRecipes' },
];

export default function MealDetailScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { meal } = useLocalSearchParams<{ meal: string }>();
  const mealSlot = (meal as MealSlot) || 'breakfast';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { intake, mealTargets, mealMacrosFor, addCustomKcal, toggleMealRecipe, isRecipeLogged } = usePlan();
  const { toast } = useFeedback();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { userAllergens } = useAllergens();
  const [showRecipes, setShowRecipes] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'myRecipes'>('favorites');

  // FAB overlay & Add custom food states
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodCal, setCustomFoodCal] = useState('');

  const handleAddFood = () => {
    const kcalVal = parseInt(customFoodCal, 10);
    if (isNaN(kcalVal) || kcalVal <= 0) {
      haptic.light();
      return;
    }
    haptic.success();
    addCustomKcal(mealSlot, kcalVal);
    toast(t('feedback.meal.added', { meal: mealName, kcal: kcalVal }));
    setCustomFoodName('');
    setCustomFoodCal('');
    setIsAddFoodOpen(false);
  };

  // Toggle a recipe on/off this meal + confirm with a contextual toast.
  const handleToggleRecipe = (id: string, kcal: number) => {
    const wasLogged = isRecipeLogged(mealSlot, id);
    haptic.success();
    toggleMealRecipe(mealSlot, id, kcal);
    toast(t(wasLogged ? 'feedback.meal.removed' : 'feedback.meal.added', { meal: mealName, kcal }));
  };

  // Kendi Tariflerim — custom recipes come from the shared store.
  const { customRecipes } = useCustomRecipes();

  const mealName = t(`plan.meals.${mealSlot}`);
  // Per-meal targets derived from the user's personalised daily plan.
  const mt = mealTargets[mealSlot];
  const targetKcal = mt.kcal;
  const consumedKcal = intake[mealSlot] ?? 0;

  // Macros targets (this meal's share of the daily macro goals)
  const targetProtein = mt.protein;
  const targetFat = mt.fat;
  const targetCarbs = mt.carbs;

  // Macros consumed for this meal — real tracked macros + target-split estimate,
  // straight from PlanContext (same model as the daily totals).
  const consumedMealMacros = mealMacrosFor(mealSlot);
  const consumedProtein = Math.round(consumedMealMacros.protein);
  const consumedFat = Math.round(consumedMealMacros.fat);
  const consumedCarbs = Math.round(consumedMealMacros.carbs);

  const remainingKcal = Math.max(0, targetKcal - consumedKcal);
  const macros = [
    { key: 'protein', label: t('mealDetail.protein'), consumed: consumedProtein, target: targetProtein, color: colors.protein },
    { key: 'carbs',   label: t('mealDetail.carbs'),   consumed: consumedCarbs,   target: targetCarbs,   color: colors.carbs },
    { key: 'fat',     label: t('mealDetail.fat'),     consumed: consumedFat,     target: targetFat,     color: colors.fat },
  ];

  // Recommended = real recipes matching this meal, closest to its kcal target,
  // with the user's allergens filtered out.
  const recommended = useMemo(() => {
    const byMeal = filterRecipes(RECIPES, { meal: mealSlot as MealType, excludeAllergens: userAllergens });
    const pool = byMeal.length >= 3 ? byMeal : filterRecipes(RECIPES, { excludeAllergens: userAllergens });
    return [...pool]
      .sort((a, b) => Math.abs(a.kcal - targetKcal) - Math.abs(b.kcal - targetKcal))
      .slice(0, 8);
  }, [mealSlot, targetKcal, userAllergens]);

  // Pool of every recipe (real + custom), for the favourites tab.
  const allKnownRecipes = useMemo(() => {
    const map = new Map<string, MealRecipe>();
    RECIPES.forEach(r =>
      map.set(r.id, { id: r.id, name: r.name, kcal: r.kcal, time: r.time, image: r.image, emoji: r.emoji, bgColor: r.bgColor }),
    );
    customRecipes.forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  }, [customRecipes]);
  const favoriteRecipes = allKnownRecipes.filter(r => isFavorite(r.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ══ HEADER ══════════════════════════════════════════ */}
      <ScreenHeader title={mealName} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ AKTİF DEĞERLER (ACTIVE VALUES) CARD ═════════════════ */}
        <Text style={styles.sectionLabel}>{t('mealDetail.activeValues')}</Text>
        <View style={styles.card}>
          {/* Calorie hero */}
          <View style={styles.kcalHeader}>
            <View style={styles.kcalIconWrap}>
              <Ionicons name="flame" size={22} color={colors.calorie} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kcalLabel}>{t('plan.calorie')}</Text>
              <Text style={styles.kcalValue}>
                {consumedKcal}
                <Text style={styles.kcalTarget}> / {targetKcal} kcal</Text>
              </Text>
            </View>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingNum}>{remainingKcal}</Text>
              <Text style={styles.remainingLabel}>{t('mealDetail.remaining')}</Text>
            </View>
          </View>

          <ProgressBar
            progress={consumedKcal / targetKcal}
            color={colors.calorie}
            height={10}
            style={{ marginTop: 16 }}
          />

          <View style={styles.macroDivider} />

          {/* Macros — one colour-coded column each */}
          <View style={styles.macrosRow}>
            {macros.map(m => (
              <View key={m.key} style={styles.macroCol}>
                <View style={styles.macroHead}>
                  <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                  <Text style={styles.macroLabel}>{m.label}</Text>
                </View>
                <Text style={styles.macroVal}>
                  {m.consumed}<Text style={styles.macroTarget}>/{m.target}g</Text>
                </Text>
                <ProgressBar
                  progress={m.target ? m.consumed / m.target : 0}
                  color={m.color}
                  height={5}
                  style={{ marginTop: 7, width: '100%' }}
                />
              </View>
            ))}
          </View>
        </View>

        {/* ══ INFO BOX — curated selection ═══════════════════════ */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconBox}>
            <Ionicons name="sparkles" size={18} color={colors.white} />
          </View>
          <Text style={styles.infoText}>
            {t('mealDetail.infoText')}
          </Text>
        </View>

        {/* ══ ÖNERİLEN TARİFLER ══════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('mealDetail.recommendedRecipesTitle')}</Text>
          <PressableScale haptic="light" onPress={() => setShowRecipes(!showRecipes)} activeOpacity={0.7}>
            <Text style={styles.hideText}>{showRecipes ? t('mealDetail.hideRecipes') : t('mealDetail.showRecipes')}</Text>
          </PressableScale>
        </View>

        {showRecipes && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesRow}
          >
            {recommended.map(r => {
              const isLogged = isRecipeLogged(mealSlot, r.id);
              return (
                <PressableScale
                  key={r.id}
                  style={styles.recipeCard}
                  scaleTo={0.96}
                  haptic="light"
                  onPress={() => router.push(`/recipe/${r.id}`)}
                >
                  {/* Photo */}
                  <RecipeThumb image={r.image} emoji={r.emoji} bgColor={r.bgColor} style={styles.recipeImg} emojiSize={48} />

                  {/* Add Button Overlay */}
                  <PressableScale haptic="light"
                    style={[styles.addBtnOverlay, isLogged && styles.addBtnOverlayActive]}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation(); // prevent navigating to recipe detail
                      handleToggleRecipe(r.id, r.kcal);
                    }}
                  >
                    <Ionicons name={isLogged ? "checkmark-circle" : "add-circle-outline"} size={16} color={colors.white} />
                    <Text style={styles.addBtnText}>
                      {isLogged ? t('mealDetail.added') : t('mealDetail.addToMeal')}
                    </Text>
                  </PressableScale>

                  {/* Favourite toggle */}
                  <PressableScale haptic="light"
                    style={styles.bookmarkBtn}
                    onPress={(e) => { e.stopPropagation(); toggleFavorite(r.id); }}
                    accessibilityLabel={t('a11y.bookmark')}
                  >
                    <Ionicons
                      name={isFavorite(r.id) ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={isFavorite(r.id) ? colors.gold : colors.white}
                    />
                  </PressableScale>

                  {/* Info */}
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName} numberOfLines={1}>{localizeRecipeName(r, t)}</Text>
                    <View style={styles.recipeMeta}>
                      <Ionicons name="flame" size={12} color={colors.calorie} />
                      <Text style={styles.recipeMetaTxt}>{r.kcal} kcal</Text>
                      <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                      <Text style={styles.recipeMetaTxt}>{r.time} {t('plan.min')}</Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </ScrollView>
        )}

        {/* ══ BOTTOM PILLS TABS ══════════════════════════════ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomPillsRow}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <PressableScale haptic="light"
                key={tab.key}
                style={[styles.bottomPill, isActive && styles.bottomPillActive]}
                activeOpacity={0.8}
                onPress={() => {
                  haptic.light();
                  setActiveTab(tab.key as any);
                }}
              >
                <Text style={[styles.bottomPillText, isActive && styles.bottomPillTextActive]}>
                  {t(tab.labelKey)}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        {activeTab === 'favorites' && (
          favoriteRecipes.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="bookmark-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>{t('mealDetail.emptyFavorites.title')}</Text>
              <Text style={styles.emptyStateSub}>{t('mealDetail.emptyFavorites.subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.customRecipesContainer}>
              {favoriteRecipes.map(r => {
                const isLogged = isRecipeLogged(mealSlot, r.id);
                return (
                  <PressableScale
                    key={r.id}
                    style={styles.customRecipeItemCard}
                    scaleTo={0.97}
                    haptic="light"
                    onPress={() => router.push(`/recipe/${r.id}`)}
                  >
                    <RecipeThumb image={r.image} emoji={r.emoji} bgColor={r.bgColor} style={styles.customRecipeImg} emojiSize={24} />
                    <View style={styles.customRecipeInfo}>
                      <Text style={styles.customRecipeName}>{r.name}</Text>
                      <Text style={styles.customRecipeKcal}>{r.kcal} kcal</Text>
                    </View>
                    <PressableScale haptic="light"
                      style={styles.favRemoveBtn}
                      onPress={(e) => { e.stopPropagation(); toggleFavorite(r.id); }}
                      accessibilityLabel={t('a11y.bookmark')}
                    >
                      <Ionicons name="bookmark" size={20} color={colors.gold} />
                    </PressableScale>
                    <PressableScale haptic="light"
                      style={[styles.customAddBtn, isLogged && styles.customAddBtnActive]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleRecipe(r.id, r.kcal);
                      }}
                      accessibilityLabel={t('a11y.addMeal')}
                    >
                      <Ionicons name={isLogged ? 'checkmark' : 'add'} size={18} color={colors.white} />
                    </PressableScale>
                  </PressableScale>
                );
              })}
            </View>
          )
        )}

        {activeTab === 'myRecipes' && (
          customRecipes.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="restaurant-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>{t('mealDetail.emptyMyRecipes.title')}</Text>
              <Text style={styles.emptyStateSub}>{t('mealDetail.emptyMyRecipes.subtitle')}</Text>
            </View>
          ) : (
            <View style={styles.customRecipesContainer}>
              {/* Only the recipes the user created manually. */}
              {customRecipes.map(r => {
                const isLogged = isRecipeLogged(mealSlot, r.id);
                return (
                  <PressableScale
                    key={r.id}
                    style={styles.customRecipeItemCard}
                    scaleTo={0.97}
                    haptic="light"
                    onPress={() => router.push(`/recipe/${r.id}`)}
                  >
                    <Image source={recipeImageSource(r.image)} style={styles.customRecipeImg} />
                    <View style={styles.customRecipeInfo}>
                      <Text style={styles.customRecipeName}>{r.name}</Text>
                      <Text style={styles.customRecipeKcal}>{r.kcal} kcal</Text>
                    </View>
                    <PressableScale haptic="light"
                      style={[styles.customAddBtn, isLogged && styles.customAddBtnActive]}
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleRecipe(r.id, r.kcal);
                      }}
                      accessibilityLabel={t('a11y.addMeal')}
                    >
                      <Ionicons name={isLogged ? "checkmark" : "add"} size={18} color={colors.white} />
                    </PressableScale>
                  </PressableScale>
                );
              })}
            </View>
          )
        )}

      </ScrollView>

      {/* FAB Overlay Background */}
      {isFabOpen && (
        <TouchableOpacity
          style={styles.fabOverlay}
          activeOpacity={1}
          onPress={() => setIsFabOpen(false)}
        />
      )}

      {/* FAB Menu Stack */}
      {isFabOpen && (
        <View style={[styles.fabMenuStack, { bottom: insets.bottom + 96 }]}>
          {/* Tarif Ekle */}
          <PressableScale haptic="light"
            style={styles.fabMenuItemRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsFabOpen(false);
              haptic.light();
              router.push('/create-recipe');
            }}
          >
            <Text style={styles.fabMenuLabel}>{t('mealDetail.fab.addRecipe')}</Text>
            <View style={styles.fabMenuCircle}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.green} />
            </View>
          </PressableScale>

          {/* Besin Ekle */}
          <PressableScale haptic="light"
            style={styles.fabMenuItemRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsFabOpen(false);
              haptic.light();
              setIsAddFoodOpen(true);
            }}
          >
            <Text style={styles.fabMenuLabel}>{t('mealDetail.fab.addFood')}</Text>
            <View style={styles.fabMenuCircle}>
              <MaterialCommunityIcons name="food-apple-outline" size={20} color={colors.green} />
            </View>
          </PressableScale>

          {/* Tabağı Tara */}
          <PressableScale haptic="light"
            style={styles.fabMenuItemRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsFabOpen(false);
              haptic.light();
              // We're already adding to this meal → go straight to the meal
              // camera and carry the slot so the result logs to the right meal.
              router.push({ pathname: '/scan/camera', params: { mode: 'meal', slot: mealSlot } });
            }}
          >
            <Text style={styles.fabMenuLabel}>{t('mealDetail.fab.scanPlate')}</Text>
            <View style={styles.fabMenuCircle}>
              <MaterialCommunityIcons name="camera-outline" size={20} color={colors.green} />
            </View>
          </PressableScale>
        </View>
      )}

      {/* Main FAB — clean circular button, bottom-right */}
      <PressableScale
        haptic="medium"
        style={[styles.fab, { bottom: insets.bottom + 20 }, isFabOpen && styles.fabActive]}
        activeOpacity={0.85}
        onPress={() => { haptic.medium(); setIsFabOpen(!isFabOpen); }}
        accessibilityLabel={isFabOpen ? t('a11y.close') : t('mealDetail.fab.main')}
      >
        <Ionicons name={isFabOpen ? 'close' : 'add'} size={28} color={colors.white} />
      </PressableScale>

      {/* ── Add Food Modal ── */}
      <Modal visible={isAddFoodOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsAddFoodOpen(false)}
          />
          <View style={[styles.modalSheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalSheetTitle}>{t('mealDetail.addFoodModal.title')}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t('mealDetail.addFoodModal.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={customFoodName}
              onChangeText={setCustomFoodName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder={t('mealDetail.addFoodModal.kcalPlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={customFoodCal}
              onChangeText={setCustomFoodCal}
            />

            <Text style={styles.quickLogTitle}>{t('mealDetail.addFoodModal.quickAdd')}</Text>
            <View style={styles.quickGrid}>
              {[
                { key: 'banana', fallback: 'Muz', kcal: 90 },
                { key: 'egg', fallback: 'Yumurta', kcal: 75 },
                { key: 'oatmeal', fallback: 'Yulaf Ezmesi', kcal: 150 },
                { key: 'milk', fallback: 'Süt', kcal: 120 },
              ].map(item => {
                const localizedName = t(`mealDetail.addFoodModal.quickItems.${item.key}`, item.fallback);
                return (
                  <PressableScale haptic="light"
                    key={item.key}
                    style={styles.quickItem}
                    onPress={() => {
                      setCustomFoodName(localizedName);
                      setCustomFoodCal(item.kcal.toString());
                      haptic.light();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.quickItemText}>{localizedName}</Text>
                    <Text style={styles.quickItemKcal}>{item.kcal} kcal</Text>
                  </PressableScale>
                );
              })}
            </View>

            <PressableScale haptic="light"
              style={styles.modalSaveBtn}
              onPress={handleAddFood}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSaveBtnText}>{t('common.add')}</Text>
            </PressableScale>

            <PressableScale haptic="light"
              style={styles.modalCloseBtn}
              onPress={() => setIsAddFoodOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>{t('common.cancel')}</Text>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </Modal>


    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130, // Clear the floating bottom bar
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 24,
  },
  kcalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kcalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.calorieLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  kcalValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 21,
    color: colors.textPrimary,
  },
  kcalTarget: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  remainingPill: {
    alignItems: 'center',
    backgroundColor: colors.calorieLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  remainingNum: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.calorie,
  },
  remainingLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  macroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 16,
  },
  macroCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  macroHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  macroVal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  macroTarget: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.blueLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.blueBorder,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  hideText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  recipesRow: {
    gap: 14,
    paddingBottom: 24,
  },
  recipeCard: {
    width: 220,
    height: 220,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  recipeImg: {
    width: '100%',
    height: 140,
  },
  addBtnOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlayStrong,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnOverlayActive: {
    backgroundColor: colors.green,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textWhite,
  },
  recipeInfo: {
    padding: 12,
    gap: 4,
  },
  recipeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaTxt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginRight: 6,
  },
  bottomPillsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  bottomPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  bottomPillActive: {
    borderColor: colors.textPrimary,
  },
  bottomPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
  },
  bottomPillTextActive: {
    color: colors.textPrimary,
  },
  emptyStateCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyStateSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.overlayStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favRemoveBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  // Floating Actions
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
    zIndex: 90,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  fabActive: {
    backgroundColor: colors.greenDark,
  },
  fabMenuStack: {
    position: 'absolute',
    right: 28,
    alignItems: 'flex-end',
    gap: 16,
    zIndex: 100,
  },
  fabMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fabMenuLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fabMenuCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayMedium,
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalSheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },
  modalSaveBtn: {
    backgroundColor: colors.green,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  modalSaveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.white,
  },
  modalCloseBtn: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  modalCloseBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  quickLogTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 4,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickItem: {
    flexGrow: 1,
    width: '45%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  quickItemText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  quickItemKcal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  // Kendi Tariflerim styling
  customRecipesContainer: {
    gap: 12,
    marginTop: 12,
  },
  customRecipeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  customRecipeImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: colors.backgroundAlt,
  },
  customRecipeInfo: {
    flex: 1,
    gap: 2,
  },
  customRecipeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  customRecipeKcal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  customAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddBtnActive: {
    backgroundColor: colors.greenDark,
  },
});
