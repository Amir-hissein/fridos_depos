import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { RECIPES, isRecipeLockedForFree } from '../constants/recipes';
import { recommendRecipes } from '../services/recipeFilters';
import { recipeOwnership } from '../services/shoppingList';
import { recipeHasUserAllergen } from '../services/allergens';
import { RecipeCardA } from '../components/ui/RecipeCard';
import { PressableScale } from '../components/ui/PressableScale';
import { useFridge } from '../context/FridgeContext';
import { usePlan } from '../context/PlanContext';
import { useAllergens } from '../context/AllergenContext';
import { useApp, FREE_RECIPE_LIMIT } from '../context/AppContext';
import { useFavorites } from '../context/FavoritesContext';
import { haptic } from '../lib/haptics';
import { useTranslation } from 'react-i18next';

export default function FridgeRecipesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { ingredients } = useFridge();
  const { profile } = usePlan();
  const { userAllergens } = useAllergens();
  const { isPremium } = useApp();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();

  // Recipes makeable from the fridge: profile-aware, needing at most 1 extra
  // ingredient, best matches first. Same engine as the fridge "recipes" stat.
  const cookable = useMemo(() => {
    const safe = recommendRecipes(RECIPES, { diet: profile.diet, allergens: userAllergens });
    return safe
      .map(recipe => ({ recipe, missing: recipeOwnership(recipe, ingredients).missingCount }))
      .filter(x => x.missing <= 1)
      .sort((a, b) => a.missing - b.missing || a.recipe.time - b.recipe.time);
  }, [ingredients, profile.diet, userAllergens]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale haptic="light" style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </PressableScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('recipes.fridgeRecipes.title')}</Text>
            <Text style={styles.headerSub}>{t('recipes.fridgeRecipes.subtitle', { count: cookable.length })}</Text>
          </View>
        </View>

        {cookable.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="fridge-alert-outline" size={56} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{t('recipes.fridgeRecipes.emptyTitle')}</Text>
            <Text style={styles.emptySub}>{t('recipes.fridgeRecipes.emptySub')}</Text>
            <PressableScale
              haptic="light"
              style={styles.scanBtn}
              onPress={() => { haptic.light(); router.push('/scan/choose' as never); }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.white} />
              <Text style={styles.scanBtnText}>{t('profile.fridgePage.scanBtn')}</Text>
            </PressableScale>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
            showsVerticalScrollIndicator={false}
          >
            {cookable.map(({ recipe }) => (
              <RecipeCardA
                key={recipe.id}
                recipe={recipe}
                warnAllergen={userAllergens.length > 0 && recipeHasUserAllergen(recipe, userAllergens)}
                locked={!isPremium && isRecipeLockedForFree(recipe.id, FREE_RECIPE_LIMIT)}
                bookmarked={isFavorite(recipe.id)}
                onBookmark={() => toggleFavorite(recipe.id)}
                onPress={() => router.push(`/recipe/${recipe.id}`)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: colors.textPrimary },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 8 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 10,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  scanBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.white },
});
