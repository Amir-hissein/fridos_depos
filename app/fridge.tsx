import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { PressableScale } from '../components/ui/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { haptic } from '../lib/haptics';
import { useFridge } from '../context/FridgeContext';
import { usePlan } from '../context/PlanContext';
import { useAllergens } from '../context/AllergenContext';
import { useCustomRecipes } from '../context/CustomRecipesContext';
import { RECIPES, Recipe } from '../constants/recipes';
import { recommendRecipes } from '../services/recipeFilters';
import { recipeOwnership } from '../services/shoppingList';
import { localizeRecipeName } from '../services/localizeRecipe';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { useTranslation } from 'react-i18next';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type TabKey = 'fridge' | 'recent' | 'history';

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'fridge', labelKey: 'profile.fridgePage.tabs.fridge' },
  { key: 'recent', labelKey: 'profile.fridgePage.tabs.recent' },
  { key: 'history', labelKey: 'profile.fridgePage.tabs.history' },
];

// Simple category guessing based on keywords (supporting TR, EN, FR)
const CATEGORY_RULES: { keywords: string[]; key: string; icon: IconName; color: string }[] = [
  {
    keywords: [
      'elma', 'portakal', 'muz', 'çilek', 'domates', 'salatalık', 'biber', 'soğan', 'sarımsak', 'ıspanak', 'brokoli', 'havuç', 'limon', 'mantar', 'meyve', 'sebze', 'salata',
      'apple', 'orange', 'banana', 'strawberry', 'tomato', 'cucumber', 'pepper', 'onion', 'garlic', 'spinach', 'broccoli', 'carrot', 'lemon', 'mushroom', 'fruit', 'vegetable', 'salad',
      'pomme', 'fraise', 'tomate', 'oignon', 'ail', 'carotte', 'citron', 'champignon', 'légume'
    ],
    key: 'fruitsVeg',
    icon: 'fruit-watermelon',
    color: Colors.green
  },
  {
    keywords: [
      'et', 'tavuk', 'balık', 'hindi', 'sosis', 'sucuk', 'biftek', 'kıyma', 'salmon', 'ton',
      'meat', 'chicken', 'fish', 'turkey', 'sausage', 'steak', 'beef',
      'poulet', 'viande', 'poisson', 'dinde'
    ],
    key: 'meatFish',
    icon: 'food-steak',
    color: Colors.red
  },
  {
    keywords: [
      'süt', 'yoğurt', 'peynir', 'tereyağı', 'krema', 'kefir', 'labne', 'lor',
      'milk', 'yogurt', 'cheese', 'butter', 'cream', 'mozzarella',
      'lait', 'yaourt', 'fromage', 'beurre', 'crème'
    ],
    key: 'dairy',
    icon: 'cheese',
    color: Colors.yellow
  },
  {
    keywords: [
      'ekmek', 'un', 'pirinç', 'makarna', 'yulaf', 'kinoa', 'mısır', 'tahıl', 'bulgur',
      'bread', 'flour', 'rice', 'pasta', 'oat', 'quinoa', 'corn', 'grain',
      'pain', 'farine', 'riz', 'pâte', 'avoine'
    ],
    key: 'grains',
    icon: 'grain',
    color: Colors.brown
  },
  {
    keywords: [
      'su', 'meyve suyu', 'çay', 'kahve', 'soda', 'kola', 'ayran',
      'water', 'juice', 'tea', 'coffee',
      'eau', 'jus', 'café'
    ],
    key: 'beverage',
    icon: 'bottle-soda',
    color: Colors.blue
  },
];

function getCategoryForItem(item: string): { key: string; icon: IconName; color: string } {
  const lower = item.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { key: rule.key, icon: rule.icon, color: rule.color };
    }
  }
  return { key: 'other', icon: 'food-variant', color: Colors.textMuted };
}

export default function FridgeScreen() {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const { ingredients, addIngredient, removeIngredient } = useFridge();
  const { profile, loggedRecipeIds } = usePlan();
  const { userAllergens } = useAllergens();
  const { getCustomRecipe } = useCustomRecipes();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('fridge');
  const [inputText, setInputText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  // Group ingredients by auto-detected category key
  const grouped = ingredients.reduce<Record<string, string[]>>((acc, item) => {
    const cat = getCategoryForItem(item);
    if (!acc[cat.key]) acc[cat.key] = [];
    acc[cat.key].push(item);
    return acc;
  }, {});

  // Recipes you can (almost) make from the fridge — same engine that powers the
  // scan suggestions: profile-aware (diet + allergens), needing at most 1 extra.
  const cookableCount = useMemo(() => {
    const safe = recommendRecipes(RECIPES, { diet: profile.diet, allergens: userAllergens });
    return safe.filter(r => recipeOwnership(r, ingredients).missingCount <= 1).length;
  }, [ingredients, profile.diet, userAllergens]);

  const handleAdd = () => {
    if (inputText.trim()) {
      addIngredient(inputText.trim());
      setInputText('');
      haptic.success();
    }
    setShowAddInput(false);
  };

  // Recent = last 10 added (reversed)
  const recentItems = [...ingredients].reverse().slice(0, 10);

  // Past recipes = recipes the user actually added to their meal plan.
  const pastRecipes = useMemo(
    () =>
      loggedRecipeIds
        .map(id => RECIPES.find(r => r.id === id) ?? getCustomRecipe(id))
        .filter((r): r is Recipe => !!r),
    [loggedRecipeIds, getCustomRecipe],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScreenHeader
        title={t('profile.fridge')}
        right={
          <PressableScale haptic="light" style={s.scanBtn} onPress={() => router.push('/scan/choose' as never)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.white} />
          </PressableScale>
        }
      />

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <PressableScale haptic="light"
            key={tab.key}
            style={s.tabBtn}
            onPress={() => { haptic.light(); setActiveTab(tab.key); }}
            activeOpacity={0.75}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {t(tab.labelKey)}
            </Text>
            {activeTab === tab.key && <View style={s.tabUnderline} />}
          </PressableScale>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Tab: Buzdolabım ── */}
        {activeTab === 'fridge' && (
          <>
            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <MaterialCommunityIcons name="package-variant" size={20} color={colors.textSecondary} />
                <Text style={s.statValue}>{ingredients.length}</Text>
                <Text style={s.statLabel}>{t('profile.fridgePage.stats.items')}</Text>
              </View>
              <View style={s.statCard}>
                <MaterialCommunityIcons name="shape-outline" size={20} color={colors.textSecondary} />
                <Text style={s.statValue}>{Object.keys(grouped).length}</Text>
                <Text style={s.statLabel}>{t('profile.fridgePage.stats.categories')}</Text>
              </View>
              <PressableScale
                haptic="light"
                style={[s.statCard, s.statCardTappable]}
                onPress={() => router.push('/fridge-recipes')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="chef-hat" size={20} color={colors.green} />
                <Text style={s.statValue}>{cookableCount}</Text>
                <Text style={s.statLabel}>{t('profile.fridgePage.stats.recipes')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} style={s.statChevron} />
              </PressableScale>
            </View>

            {/* Add item */}
            {showAddInput ? (
              <View style={s.inputCard}>
                <TextInput
                  style={s.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={t('profile.fridgePage.addPlaceholderInput')}
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  autoFocus
                />
                <View style={s.inputActions}>
                  <PressableScale haptic="light"
                    style={s.cancelBtnSmall}
                    onPress={() => setShowAddInput(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.cancelBtnText}>{t('common.cancel')}</Text>
                  </PressableScale>
                  <PressableScale haptic="light" style={s.addConfirmBtn} onPress={handleAdd} activeOpacity={0.8}>
                    <Text style={s.addConfirmText}>{t('shopping.addBtn')}</Text>
                  </PressableScale>
                </View>
              </View>
            ) : (
              <PressableScale haptic="light"
                style={s.addPlaceholder}
                onPress={() => setShowAddInput(true)}
                activeOpacity={0.8}
              >
                <View style={s.addIconWrap}>
                  <MaterialCommunityIcons name="plus" size={18} color={colors.green} />
                </View>
                <Text style={s.addPlaceholderText}>{t('profile.fridgePage.addPlaceholder')}</Text>
              </PressableScale>
            )}

            {/* Items grouped by category */}
            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([catKey, items]) => {
                const ci = getCategoryForItem(items[0]);
                return (
                  <View key={catKey} style={s.categorySection}>
                    <View style={s.catHeader}>
                      <View style={s.catIconWrap}>
                        <MaterialCommunityIcons name={ci.icon} size={14} color={colors.textSecondary} />
                      </View>
                      <Text style={s.catTitle}>{t(`profile.fridgePage.categories.${catKey}`)}</Text>
                      <Text style={s.catCount}>{items.length}</Text>
                    </View>
                    <View style={s.itemsCard}>
                      {items.map((item, idx) => (
                        <View key={item}>
                          {idx > 0 && <View style={s.itemDivider} />}
                          <View style={s.itemRow}>
                            <Text style={s.itemName}>{item}</Text>
                            <PressableScale haptic="light"
                              onPress={() => { removeIngredient(item); haptic.light(); }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
                            </PressableScale>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="fridge-outline" size={56} color={colors.textMuted} />
                <Text style={s.emptyTitle}>{t('profile.fridgePage.emptyFridgeTitle')}</Text>
                <Text style={s.emptySub}>{t('profile.fridgePage.emptyFridgeSub')}</Text>
                <PressableScale haptic="light"
                  style={s.scanBtnLarge}
                  onPress={() => router.push('/scan/choose' as never)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="barcode-scan" size={20} color={colors.white} />
                  <Text style={s.scanBtnText}>{t('profile.fridgePage.scanBtn')}</Text>
                </PressableScale>
              </View>
            )}
          </>
        )}

        {/* ── Tab: Son Eklenenler ── */}
        {activeTab === 'recent' && (
          <>
            {recentItems.length > 0 ? (
              recentItems.map((item, idx) => {
                const ci = getCategoryForItem(item);
                return (
                  <View key={`${item}-${idx}`} style={s.recentItem}>
                    <View style={s.recentDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.recentName}>{item}</Text>
                      <Text style={s.recentCat}>{t(`profile.fridgePage.categories.${ci.key}`)}</Text>
                    </View>
                    <PressableScale haptic="light"
                      onPress={() => { removeIngredient(item); haptic.light(); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.textMuted} />
                    </PressableScale>
                  </View>
                );
              })
            ) : (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="history" size={56} color={colors.textMuted} />
                <Text style={s.emptyTitle}>{t('profile.fridgePage.emptyRecentTitle')}</Text>
                <Text style={s.emptySub}>{t('profile.fridgePage.emptyRecentSub')}</Text>
              </View>
            )}
          </>
        )}

        {/* ── Tab: Geçmiş Tarifler ── */}
        {activeTab === 'history' && (
          <>
            {pastRecipes.length > 0 ? (
              pastRecipes.map(recipe => (
                <PressableScale
                  haptic="light"
                  key={recipe.id}
                  style={s.recipeCard}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                >
                  <View style={[s.recipeIconWrap, { backgroundColor: recipe.bgColor }]}>
                    <Text style={s.recipeEmoji}>{recipe.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.recipeName} numberOfLines={1}>{localizeRecipeName(recipe, t)}</Text>
                    <Text style={s.recipeDate}>{recipe.time} {t('plan.min')} · {recipe.kcal} kcal</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                </PressableScale>
              ))
            ) : (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={56} color={colors.textMuted} />
                <Text style={s.emptyTitle}>{t('profile.fridgePage.emptyHistoryTitle')}</Text>
                <Text style={s.emptySub}>{t('profile.fridgePage.emptyHistorySub')}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },

  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderLight,
    marginBottom: 4,
  },
  tabBtn: {
    paddingBottom: 10,
    paddingRight: 20,
    position: 'relative',
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Inter_700Bold',
    color: colors.textPrimary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1.5,
    left: 0,
    right: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statCardTappable: {
    borderColor: colors.green,
  },
  statChevron: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },

  addPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.backgroundAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlaceholderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.green,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtnSmall: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  addConfirmBtn: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConfirmText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.white,
  },

  categorySection: {
    marginBottom: 16,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  catIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: colors.backgroundAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  catCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  itemsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  itemName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  scanBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  scanBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.white,
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderLight,
  },
  recentName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  recentCat: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  recipeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.backgroundAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  recipeEmoji: { fontSize: 26 },
  recipeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  recipeDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
