import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../../components/ui/PressableScale';
import { Button } from '../../components/ui/Button';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii } from '../../constants/layout';
import { RECIPES, isRecipeLockedForFree, recipeImageSource } from '../../constants/recipes';
import { getRecipeMacrosForPortions } from '../../services/nutrition';
import { haptic } from '../../lib/haptics';
import { useApp, FREE_RECIPE_LIMIT } from '../../context/AppContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useCustomRecipes } from '../../context/CustomRecipesContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useFridge } from '../../context/FridgeContext';
import { recipeOwnership } from '../../services/shoppingList';
import { localizeRecipe } from '../../services/localizeRecipe';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

export default function RecipeDetailScreen() {
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getCustomRecipe, removeCustomRecipe } = useCustomRecipes();
  const { confirm, toast } = useFeedback();
  const recipe = RECIPES.find(r => r.id === id) ?? getCustomRecipe(id ?? '') ?? RECIPES[0];
  const isCustom = recipe.id.startsWith('custom_');

  const handleDelete = async () => {
    haptic.light();
    const ok = await confirm({
      title: t('recipes.delete.title'),
      message: t('recipes.delete.message'),
      destructive: true,
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (!ok) return;
    haptic.success();
    removeCustomRecipe(recipe.id);
    toast(t('recipes.delete.done'));
    router.back();
  };
  
  const { isPremium } = useApp();
  const isLocked = !isPremium && isRecipeLockedForFree(recipe.id, FREE_RECIPE_LIMIT);
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const bookmarked = isFavorite(recipe.id);
  const { ingredients: fridge } = useFridge();
  const ownership = recipeOwnership(recipe, fridge);
  const [imgFailed, setImgFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const showImage = !!recipe.image && !imgFailed;
  const { t } = useTranslation();
  // Contenu localisé (nom/ingrédients/étapes) ; `recipe` reste brut pour la logique.
  const loc = localizeRecipe(recipe, t);

  // Partage natif réel : compose la recette (macros + ingrédients + étapes) et
  // ouvre la feuille de partage du système.
  const handleShare = async () => {
    haptic.light();
    const macroLine = `⏱ ${recipe.time} ${t('plan.min')} · ${recipe.kcal} kcal · P ${recipe.protein}g · C ${recipe.carbs}g · F ${recipe.fat}g`;
    const ingredients = loc.ingredients
      .map(ing => `• ${ing.name}${ing.quantity ? ` — ${ing.quantity}` : ''}`)
      .join('\n');
    const steps = loc.steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n');
    const message =
      `🍳 ${loc.name}\n${macroLine}\n\n` +
      `🧂 ${t('recipes.details.ingredients')}\n${ingredients}\n\n` +
      `👨‍🍳 ${t('recipes.details.preparation')}\n${steps}`;
    try {
      await Share.share({ message, title: loc.name });
    } catch {
      // partage annulé / indisponible — sans effet
    }
  };

  // Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [selectedServing, setSelectedServing] = useState(1);

  const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
  const portionMacros = getRecipeMacrosForPortions(recipe, selectedServing);

  // Smooth entrance: the hero gently settles while the content rises into place.
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const heroScale = entrance.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] });
  const contentTranslate = entrance.interpolate({ inputRange: [0, 1], outputRange: [28, 0] });

  return (
    <View style={styles.container}>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} translucent />

      {/* Single scroll: hero image + all content scroll together */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image — fades smoothly into the content (no hard sheet edge) */}
        <View style={[styles.hero, { backgroundColor: recipe.bgColor }]}>
          <Animated.Text style={[styles.heroEmoji, { transform: [{ scale: heroScale }] }]}>{recipe.emoji}</Animated.Text>
          {showImage && (
            <Animated.Image
              source={recipeImageSource(recipe.image)}
              style={[StyleSheet.absoluteFill, { transform: [{ scale: heroScale }] }]}
              resizeMode="cover"
              onError={() => setImgFailed(true)}
            />
          )}
          <LinearGradient
            colors={['transparent', colors.background]}
            style={styles.heroFade}
            pointerEvents="none"
          />
        </View>

        {/* Content flows seamlessly from the faded image */}
        <Animated.View style={[styles.sheetBody, { opacity: entrance, transform: [{ translateY: contentTranslate }] }]}>

        <View style={styles.titleHeader}>
          <Text style={styles.recipeName}>{loc.name}</Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.timeText}>{recipe.time} {t('plan.min')}</Text>
          </View>
        </View>

        {/* Macros Row */}
        <View style={styles.macrosRow}>
          <View style={styles.macroCard}>
            <View style={[styles.macroIconWrap, { backgroundColor: colors.calorie + '16' }]}>
              <MaterialCommunityIcons name="fire" size={20} color={colors.calorie} />
            </View>
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.kcal} <Text style={styles.macroUnit}>kcal</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>{t('plan.calorie')}</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIconWrap, { backgroundColor: colors.protein + '16' }]}>
              <MaterialCommunityIcons name="food-steak" size={20} color={colors.protein} />
            </View>
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.protein} <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>{t('plan.protein')}</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIconWrap, { backgroundColor: colors.carbs + '16' }]}>
              <MaterialCommunityIcons name="bread-slice" size={20} color={colors.carbs} />
            </View>
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.carbs} <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>{t('plan.carbs')}</Text>
          </View>

          <View style={styles.macroCard}>
            <View style={[styles.macroIconWrap, { backgroundColor: colors.fat + '16' }]}>
              <MaterialCommunityIcons name="water" size={20} color={colors.fat} />
            </View>
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.fat} <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>{t('plan.fat')}</Text>
          </View>
        </View>

        {/* Tabs Segmented Control */}
        <View style={styles.segmentedControl}>
          <PressableScale haptic="light"
            style={[styles.segmentBtn, activeTab === 'ingredients' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('ingredients')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'ingredients' && styles.segmentTextActive]}>
              {t('recipes.details.ingredients')}
            </Text>
          </PressableScale>
          <PressableScale haptic="light"
            style={[styles.segmentBtn, activeTab === 'steps' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('steps')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'steps' && styles.segmentTextActive]}>
              {t('recipes.details.preparation')}
            </Text>
          </PressableScale>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentArea}>
          {activeTab === 'ingredients' && (
            <View style={styles.ingredientsCard}>
              {loc.ingredients.map((ing, idx) => {
                const owned = ownership.ingredients[idx]?.owned ?? false;
                const isLast = idx === loc.ingredients.length - 1;
                return (
                  <View key={idx}>
                    <View style={styles.ingRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 }}>
                        <Ionicons
                          name={owned ? 'checkmark-circle' : 'add-circle-outline'}
                          size={18}
                          color={owned ? colors.green : colors.textMuted}
                          style={{ marginRight: 10 }}
                        />
                        <Text style={[styles.ingName, !owned && { color: colors.textSecondary }]}>{ing.name}</Text>
                      </View>
                      <Text style={styles.ingQty}>{ing.quantity}</Text>
                    </View>
                    {!isLast && <View style={styles.ingRowDivider} />}
                  </View>
                );
              })}
            </View>
          )}

          {activeTab === 'steps' && (
            <View style={styles.stepsCard}>
              {loc.steps.map((step, idx) => {
                const isLast = idx === loc.steps.length - 1;
                return (
                  <View key={idx}>
                    <View style={styles.stepRow}>
                      <View style={styles.stepNumBadge}>
                        <Text style={styles.stepNumText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{step.text}</Text>
                    </View>
                    {!isLast && <View style={styles.stepRowDivider} />}
                  </View>
                );
              })}
            </View>
          )}

          {isLocked && (
            <BlurView
              intensity={45}
              tint="dark"
              style={styles.premiumBlur}
            >
              <View style={styles.premiumOverlayContainer}>
                <View style={styles.premiumBox}>
                  <MaterialCommunityIcons name="crown" size={44} color={colors.gold} />
                  <Text style={styles.premiumText}>{t('recipes.details.premiumOnly')}</Text>
                </View>
                
                <PressableScale haptic="light"
                  style={styles.premiumBtn}
                  onPress={() => {
                    haptic.light();
                    router.push('/paywall');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.premiumBtnText}>
                    {t('recipes.details.premiumJoin')}
                  </Text>
                </PressableScale>
              </View>
            </BlurView>
          )}
        </View>

        </Animated.View>
        {/* Spacer for bottom buttons */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Nav Buttons (absolute over the hero) */}
      <SafeAreaView style={styles.navOverlay}>
        <View style={styles.navBar}>
          <PressableScale haptic="light" style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.white} />
          </PressableScale>
          <View style={styles.navRight}>
            {isCustom && (
              <PressableScale haptic="light" style={styles.navBtn} onPress={handleDelete} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.white} />
              </PressableScale>
            )}
            <PressableScale haptic="light"
              style={styles.navBtn}
              onPress={() => { haptic.light(); toggleFavorite(recipe.id); }}
              activeOpacity={0.8}
            >
              <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.white} />
            </PressableScale>
          </View>
        </View>
      </SafeAreaView>

      {/* Fixed Bottom Action Buttons */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          variant="primary"
          icon={<Ionicons name="add" size={22} color={colors.textWhite} />}
          label={t('recipes.details.addToMeal')}
          style={{ flex: 1 }}
          onPress={() => {
            haptic.light();
            if (isLocked) {
              router.push('/paywall');
            } else {
              setAddModalVisible(true);
            }
          }}
        />

        <PressableScale
          haptic="light"
          style={styles.shareButton}
          onPress={handleShare}
          accessibilityLabel={t('recipes.details.shareRecipe')}
        >
          <Ionicons name="paper-plane-outline" size={20} color={colors.textPrimary} />
        </PressableScale>
      </View>

      {/* Add to Meal BottomSheet */}
      <BottomSheet visible={addModalVisible} onClose={() => setAddModalVisible(false)} handle={true}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetHeaderText}>
            <Text style={styles.sheetTitle}>{t('recipes.details.addToMeal')}</Text>
            <Text style={styles.sheetSubtitle}>{loc.name} · 🕒 {recipe.time} {t('plan.min')}</Text>
          </View>
          <PressableScale haptic="light" style={styles.sheetCloseBtn} onPress={() => setAddModalVisible(false)}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </PressableScale>
        </View>

        {/* Mini Macros Row */}
        <View style={styles.modalMacros}>
          <View style={styles.modalMacroItem}>
            <MaterialCommunityIcons name="fire" size={16} color={colors.calorie} />
            <Text style={styles.modalMacroText}>{portionMacros.kcal}</Text>
          </View>
          <View style={styles.modalMacroItem}>
            <MaterialCommunityIcons name="food-steak" size={16} color={colors.protein} />
            <Text style={styles.modalMacroText}>{portionMacros.protein}g</Text>
          </View>
          <View style={styles.modalMacroItem}>
            <MaterialCommunityIcons name="bread-slice" size={16} color={colors.carbs} />
            <Text style={styles.modalMacroText}>{portionMacros.carbs}g</Text>
          </View>
          <View style={styles.modalMacroItem}>
            <MaterialCommunityIcons name="water" size={16} color={colors.fat} />
            <Text style={styles.modalMacroText}>{portionMacros.fat}g</Text>
          </View>
        </View>

        {/* Meal section */}
        <Text style={styles.sheetSectionLabel}>{t('recipes.details.whichMeal')}</Text>
        <View style={styles.mealOptions}>
          {MEALS.map(meal => {
            const isActive = selectedMeal === meal;
            let iconName = 'restaurant-outline';
            if (meal === 'breakfast') iconName = 'egg-outline';
            if (meal === 'lunch') iconName = 'fast-food-outline';
            if (meal === 'dinner') iconName = 'restaurant-outline';
            if (meal === 'snack') iconName = 'cafe-outline';

            return (
              <PressableScale haptic="light"
                key={meal}
                style={[styles.mealOptionBtn, isActive && styles.mealOptionBtnActive]}
                onPress={() => {
                  haptic.light();
                  setSelectedMeal(meal);
                }}
              >
                <View style={styles.mealOptionLeft}>
                  <Ionicons name={iconName as any} size={20} color={isActive ? colors.green : colors.textSecondary} />
                  <Text style={[styles.mealOptionText, isActive && styles.mealOptionTextActive]}>{t('recipes.meals.' + meal)}</Text>
                </View>
                {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.green} />}
              </PressableScale>
            );
          })}
        </View>

        {/* Servings section */}
        <Text style={styles.sheetSectionLabel}>{t('recipes.details.portion')}</Text>
        <View style={styles.servingStepper}>
          <PressableScale haptic="light"
            style={[styles.stepBtn, selectedServing <= 0.5 && styles.stepBtnDisabled]}
            disabled={selectedServing <= 0.5}
            onPress={() => setSelectedServing(v => Math.max(0.5, +(v - 0.5).toFixed(1)))}
          >
            <Ionicons name="remove" size={22} color={colors.textPrimary} />
          </PressableScale>

          <View style={styles.stepValueWrap}>
            <Text style={styles.stepValue}>{selectedServing}</Text>
            <Text style={styles.stepUnit}>{t('recipes.details.portionUnit')}</Text>
          </View>

          <PressableScale haptic="light"
            style={[styles.stepBtn, selectedServing >= 8 && styles.stepBtnDisabled]}
            disabled={selectedServing >= 8}
            onPress={() => setSelectedServing(v => Math.min(8, +(v + 0.5).toFixed(1)))}
          >
            <Ionicons name="add" size={22} color={colors.textPrimary} />
          </PressableScale>
        </View>

        {/* Done Button */}
        <PressableScale haptic="light"
          style={styles.modalDoneBtn}
          onPress={() => {
            haptic.success();
            setAddModalVisible(false);
          }}
        >
          <Text style={styles.modalDoneBtnText}>{t('common.done')}</Text>
        </PressableScale>
      </BottomSheet>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    width: '100%',
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 90 },
  navOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  navRight: { flexDirection: 'row', gap: 10 },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.box,
    backgroundColor: colors.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { flexGrow: 1 },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
  },
  sheetBody: {
    marginTop: -44,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  titleHeader: {
    marginBottom: 20,
    gap: 8,
  },
  recipeName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.backgroundAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  timeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 30,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  macroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  macroUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
  },
  macroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  tabContentArea: {
    minHeight: 320,
    position: 'relative',
  },
  ingredientsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  ingName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  ingQty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textMuted,
  },
  ingRowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
  },
  stepRowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.green,
  },
  stepText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    width: 52,
    height: 52,
    borderRadius: Radii.button,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  sheetHeaderText: {
    flex: 1,
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  mealOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalMacroText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  mealOptions: {
    gap: 10,
    marginBottom: 24,
  },
  mealOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  mealOptionBtnActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.green,
  },
  mealOptionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textSecondary,
  },
  mealOptionTextActive: {
    color: colors.green,
  },
  mealDropdownBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 8,
    marginBottom: 22,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValueWrap: {
    alignItems: 'center',
  },
  stepValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  stepUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  modalDoneBtn: {
    backgroundColor: colors.green,
    borderRadius: Radii.button,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textWhite,
  },
  premiumBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15,18,17,0.4)',
  },
  premiumBox: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  premiumText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textWhite,
    marginTop: 8,
  },
  premiumBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceDark,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textWhite,
    textAlign: 'center',
  },
});
