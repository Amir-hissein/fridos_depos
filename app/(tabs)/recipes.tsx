import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  TextInput,
  Keyboard,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii } from '../../constants/layout';
import { animateLayout } from '../../constants/animations';
import { RECIPES, isRecipeLockedForFree } from '../../constants/recipes';
import { RecipeCardA, RecipeCardB, RecipeCardC, RecipeCardD } from '../../components/ui/RecipeCard';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { useApp, FREE_RECIPE_LIMIT } from '../../context/AppContext';
import { usePlan } from '../../context/PlanContext';
import { useAllergens } from '../../context/AllergenContext';
import { useCustomRecipes } from '../../context/CustomRecipesContext';
import { parseCalorieRange, recipeInCalorieRange, recommendRecipes, DIET_CATEGORY } from '../../services/recipeFilters';
import { recipeHasUserAllergen } from '../../services/allergens';
import { haptic } from '../../lib/haptics';
import { PressableScale } from '../../components/ui/PressableScale';
import { useTranslation } from 'react-i18next';

/** Mapping label de filtre repas → valeurs `mealType` des recettes (généreux : un plat
 *  principal compte pour midi ET soir). */
const MEAL_MATCH: Record<string, string[]> = {
  breakfast: ['Kahvaltı'],
  lunch: ['Öğle Yemeği', 'Ana Yemek', 'Ana Öğün'],
  dinner: ['Akşam Yemeği', 'Ana Yemek', 'Ana Öğün'],
  snack: ['Ara Öğün', 'Tatlı', 'İçecek'],
};

/** Normalise pour une recherche insensible à la casse / aux accents. */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const CALORIE_RANGES = [
  { label: '50-100kcal', img: require('../../assets/images/calorie/50-100.png') },
  { label: '100-200kcal', img: require('../../assets/images/calorie/100-200.png') },
  { label: '200-300kcal', img: require('../../assets/images/calorie/200-300.png') },
  { label: '300-400kcal', img: require('../../assets/images/calorie/300-400.png') },
  { label: '400-500kcal', img: require('../../assets/images/calorie/400-500.png') },
  { label: '500-600kcal', img: require('../../assets/images/calorie/500-600.png') },
  { label: '600-800kcal', img: require('../../assets/images/calorie/600-800.png') },
  { label: '800-1000kcal', img: require('../../assets/images/calorie/800-1000.png') },
];

const CATEGORY_LISTS_BEFORE_CAL = [
  { title: 'Sana Uygun Tarifler', key: 'sana-uygun', type: 'C' },
  { title: '5 Yıldızlı Tarifler', key: 'bes-yildizli', type: 'D' },
];

const CATEGORY_LISTS_AFTER_CAL = [
  { title: 'Hafif Akşam Yemekleri', key: 'light-dinner' },
  { title: 'Kahvaltıda İyi Gider', key: 'breakfast-goodies' },
  { title: 'Protein Dolu Tarifler', key: 'high-protein' },
  { title: 'Fit Tatlılar', key: 'fit-desserts' },
  { title: 'Yüksek Kalorili Tarifler', key: 'high-calorie' },
  { title: 'Şefin Önerisi', key: 'chef-recommended' },
  { title: 'Düşük Kalorili Tarifler', key: 'low-calorie' },
  { title: 'Pratik Tarifler', key: 'practical' },
  { title: 'Kahvaltının Yıldızları', key: 'breakfast-stars' },
  { title: "Sevilen Bowl'lar", key: 'popular-bowls' },
  { title: 'Meyveyle Renk Kat', key: 'fruits' },
  { title: 'Ketojenik Lezzetler', key: 'keto' },
  { title: 'Bağırsak Dostu', key: 'gut-friendly' },
  { title: 'Renkli Vegan Dünyası', key: 'vegan' },
  { title: 'Glutensiz Tatlar', key: 'gluten-free' },
];


export default function RecipesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { isPremium } = useApp();
  const { profile } = usePlan();
  const { userAllergens, mode } = useAllergens();
  const { t, i18n } = useTranslation();
  const hideAllergens = mode === 'hide' && userAllergens.length > 0;
  const { customRecipes } = useCustomRecipes();
  // Recettes perso + cataloguées : base commune pour la recherche/les filtres.
  const allRecipes = React.useMemo(() => [...customRecipes, ...RECIPES], [customRecipes]);

  const [filterVisible, setFilterVisible] = React.useState(false);
  const [selectedMealFilter, setSelectedMealFilter] = React.useState('all');
  const [selectedCalorieFilter, setSelectedCalorieFilter] = React.useState<string | null>(null);
  // Filtre diète pré-sélectionné depuis le profil (« healthy » = aucun filtre).
  const [selectedDietFilter, setSelectedDietFilter] = React.useState<string | null>(
    profile.diet && profile.diet !== 'healthy' ? profile.diet : null,
  );
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchRef = React.useRef<TextInput>(null);

  const mealActive = selectedMealFilter !== 'all';
  const calorieActive = selectedCalorieFilter !== null;
  const dietActive = selectedDietFilter !== null;
  const anyFilterActive = mealActive || calorieActive || dietActive;
  const query = searchQuery.trim();
  const isResultsMode = query.length > 0 || anyFilterActive;

  /* Liste filtrée — repas + plage calorique + diète + recherche par nom. */
  const results = React.useMemo(() => {
    const q = norm(query);
    const range = selectedCalorieFilter ? parseCalorieRange(selectedCalorieFilter) : null;
    const mealTypes = mealActive ? MEAL_MATCH[selectedMealFilter] ?? [selectedMealFilter] : null;
    const dietCat = selectedDietFilter ? DIET_CATEGORY[selectedDietFilter] : null;
    return allRecipes.filter(r => {
      if (mealTypes && !mealTypes.includes(r.mealType)) return false;
      if (range && !recipeInCalorieRange(r, range)) return false;
      if (dietCat && !r.categories?.includes(dietCat as any)) return false;
      if (hideAllergens && recipeHasUserAllergen(r, userAllergens)) return false;
      if (q && !norm(r.name).includes(q)) return false;
      return true;
    });
  }, [query, selectedMealFilter, selectedCalorieFilter, selectedDietFilter, mealActive, allRecipes, hideAllergens, userAllergens]);

  // Window size for dynamic width calculations
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = windowWidth - 40; // 20px padding left & right

  // Animation values (only opacity uses Animated.Value natively)
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // React to searchOpen to manage focus
  React.useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        searchRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  const openSearch = () => {
    haptic.light();
    animateLayout();
    setSearchOpen(true);
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeSearch = () => {
    haptic.light();
    Keyboard.dismiss();
    animateLayout();
    setSearchOpen(false);
    setSearchQuery('');
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  // Interpolations (running natively)
  const titleOpacity = opacityAnim.interpolate({
    inputRange: [0, 0.45],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cancelOpacity = opacityAnim.interpolate({
    inputRange: [0.55, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const clearAllFilters = () => {
    haptic.light();
    animateLayout();
    setSelectedMealFilter('all');
    setSelectedCalorieFilter(null);
    setSelectedDietFilter(null);
  };



  const MEAL_FILTERS = [
    { key: 'all', iconName: 'room-service-outline', iconColor: colors.textPrimary },
    { key: 'breakfast', iconName: 'egg-fried', iconColor: colors.gold },
    { key: 'lunch', iconName: 'silverware-fork-knife', iconColor: colors.blue },
    { key: 'dinner', iconName: 'food-turkey', iconColor: colors.textMuted },
    { key: 'snack', iconName: 'peanut', iconColor: colors.orange },
  ] as const;

  const CALORIE_FILTERS = [
    { label: '50-100 kcal', iconName: 'leaf', iconColor: colors.green },
    { label: '100-200 kcal', iconName: 'food-apple', iconColor: colors.green },
    { label: '200-300 kcal', iconName: 'egg', iconColor: colors.gold },
    { label: '300-400 kcal', iconName: 'food-variant', iconColor: colors.orange },
    { label: '400-500 kcal', iconName: 'bowl-mix', iconColor: colors.blue },
    { label: '500-600 kcal', iconName: 'noodles', iconColor: colors.textPrimary },
    { label: '600-800 kcal', iconName: 'pasta', iconColor: colors.gold },
    { label: '800-1000 kcal', iconName: 'hamburger', iconColor: colors.orange },
  ];

  const DIET_FILTERS = [
    { key: 'keto',       iconName: 'food-drumstick', iconColor: colors.orange },
    { key: 'vegan',      iconName: 'sprout',         iconColor: colors.green },
    { key: 'vegetarian', iconName: 'leaf',           iconColor: colors.green },
    { key: 'glutenfree', iconName: 'barley-off',     iconColor: colors.gold },
  ] as const;

  const openRecipe = (id: string) => {
    if (!isPremium && isRecipeLockedForFree(id, FREE_RECIPE_LIMIT)) {
      router.push('/paywall');
    } else {
      router.push(`/recipe/${id}`);
    }
  };

  // Recette à risque selon les allergènes du profil (badge d'avertissement).
  const warnFor = (recipe: typeof RECIPES[number]) =>
    userAllergens.length > 0 && recipeHasUserAllergen(recipe, userAllergens);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {/* Title & Filter Container */}
          <View style={[
            styles.titleFilterContainer, 
            searchOpen ? { width: 0, marginRight: 0 } : { width: contentWidth - 44 - 12, marginRight: 12 }
          ]}>
            <Animated.View style={{ opacity: titleOpacity, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{t('recipes.title')}</Text>
              
              <PressableScale haptic="light"
                style={styles.headerIconBtn}
                onPress={() => { haptic.light(); setFilterVisible(true); }}
              >
                <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
                {anyFilterActive && <View style={styles.iconBadge} />}
              </PressableScale>
            </Animated.View>
          </View>

          {/* Search Bar Container */}
          <View style={[
            styles.searchBarContainer,
            searchOpen ? { width: contentWidth - 75 - 12, marginRight: 12 } : { width: 44, marginRight: 0 }
          ]}>
            <TouchableOpacity 
              activeOpacity={0.85}
              style={styles.searchBarPressable}
              onPress={openSearch}
              disabled={searchOpen}
            >
              <View style={[
                styles.searchBarInner,
                searchOpen ? { paddingLeft: 14, paddingRight: 14 } : { paddingLeft: 11, paddingRight: 11 }
              ]}>
                <Ionicons 
                  name={searchOpen ? "search" : "search-outline"} 
                  size={searchOpen ? 19 : 22} 
                  color={searchOpen ? colors.textMuted : colors.textPrimary} 
                  style={styles.searchIcon} 
                />
                <TextInput
                  ref={searchRef}
                  style={[
                    styles.searchInput,
                    !searchOpen && { width: 0, opacity: 0 }
                  ]}
                  placeholder={t('recipes.searchPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  selectionColor={colors.green}
                  pointerEvents={searchOpen ? 'auto' : 'none'}
                />
                {searchOpen && searchQuery.length > 0 && (
                  <PressableScale haptic="light" hitSlop={8} onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} style={styles.clearIcon} />
                  </PressableScale>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <View style={[
            styles.cancelBtnContainer,
            searchOpen ? { width: 75 } : { width: 0 }
          ]}>
            <Animated.View style={{ opacity: cancelOpacity }}>
              <PressableScale haptic="light" style={styles.cancelBtn} onPress={closeSearch}>
                <Text style={styles.cancelText} numberOfLines={1}>{t('recipes.cancel')}</Text>
              </PressableScale>
            </Animated.View>
          </View>
        </View>

        {/* Chips de filtres actifs */}
        {anyFilterActive && (
          <View style={styles.activeFiltersRow}>
            {mealActive && (
              <PressableScale haptic="light" style={styles.activeChip} onPress={() => { haptic.light(); animateLayout(); setSelectedMealFilter('all'); }}>
                <Text style={styles.activeChipText}>{t('recipes.meals.' + selectedMealFilter)}</Text>
                <Ionicons name="close" size={14} color={colors.textSecondary} />
              </PressableScale>
            )}
            {calorieActive && (
              <PressableScale haptic="light" style={styles.activeChip} onPress={() => { haptic.light(); animateLayout(); setSelectedCalorieFilter(null); }}>
                <Text style={styles.activeChipText}>{selectedCalorieFilter}</Text>
                <Ionicons name="close" size={14} color={colors.textSecondary} />
              </PressableScale>
            )}
            {dietActive && (
              <PressableScale haptic="light" style={styles.activeChip} onPress={() => { haptic.light(); animateLayout(); setSelectedDietFilter(null); }}>
                <Text style={styles.activeChipText}>{t('recipes.diets.' + selectedDietFilter)}</Text>
                <Ionicons name="close" size={14} color={colors.textSecondary} />
              </PressableScale>
            )}
            <PressableScale haptic="light" style={styles.clearAllBtn} onPress={clearAllFilters}>
              <Text style={styles.clearAllText}>{t('recipes.clear')}</Text>
            </PressableScale>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isResultsMode ? (
            <View style={styles.resultsWrap}>
              <Text style={styles.resultsCount}>
                {results.length > 0 ? t('recipes.foundCount', { count: results.length }) : t('recipes.notFound')}
              </Text>
              {results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={44} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>{t('recipes.emptyTitle')}</Text>
                  <Text style={styles.emptyText}>{t('recipes.emptyText')}</Text>
                </View>
              ) : (
                results.map((recipe, i) => (
                  <FadeInItem key={recipe.id} index={i} style={styles.resultCardWrap}>
                    <RecipeCardA
                      recipe={recipe}
                      warnAllergen={warnFor(recipe)}
                      locked={!isPremium && isRecipeLockedForFree(recipe.id, FREE_RECIPE_LIMIT)}
                      onPress={() => openRecipe(recipe.id)}
                    />
                  </FadeInItem>
                ))
              )}
            </View>
          ) : (
          <>
          {/* Banner */}
          <PressableScale 
            style={styles.bannerContainer} 
            onPress={() => {
              haptic.light();
              router.push('/scan/camera');
            }}
          >
            <Image 
              source={
                i18n.language === 'fr'
                  ? require('../../assets/images/recipes/banner_fr.png')
                  : i18n.language === 'tr'
                  ? require('../../assets/images/recipes/banner_tr.png')
                  : require('../../assets/images/recipes/banner_en.png')
              } 
              style={styles.bannerImage} 
              resizeMode="cover"
            />
          </PressableScale>

          {/* Recettes perso de l'utilisateur */}
          {customRecipes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('recipes.myRecipes')}</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recipeScrollContent}
                data={customRecipes}
                keyExtractor={item => item.id}
                renderItem={({ item: recipe }) => (
                  <RecipeCardB recipe={recipe} onPress={() => openRecipe(recipe.id)} />
                )}
              />
            </View>
          )}

          {/* Categories Before Calorie Section */}
          {CATEGORY_LISTS_BEFORE_CAL.map((cat, idx) => {
            // « Sana Uygun » (« Pour toi ») → personnalisé selon diète + allergènes du profil.
            const recipesForCat = cat.key === 'sana-uygun'
              ? recommendRecipes(RECIPES, { diet: profile.diet, allergens: userAllergens, limit: 10 })
              : RECIPES.filter(r => r.categories?.includes(cat.key as any) && (!hideAllergens || !recipeHasUserAllergen(r, userAllergens)));
            if (recipesForCat.length === 0) return null;

            return (
              <FadeInItem key={`before-${idx}`} index={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{t('recipes.categories.' + cat.key)}</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recipeScrollContent}
                  data={recipesForCat}
                  keyExtractor={item => item.id}
                  initialNumToRender={2}
                  maxToRenderPerBatch={3}
                  windowSize={3}
                  removeClippedSubviews={true}
                  renderItem={({ item: recipe }) => (
                    cat.type === 'C' ? (
                      <RecipeCardC
                        recipe={recipe}
                        warnAllergen={warnFor(recipe)}
                        onPress={() => openRecipe(recipe.id)}
                      />
                    ) : (
                      <RecipeCardD
                        recipe={recipe}
                        warnAllergen={warnFor(recipe)}
                        onPress={() => openRecipe(recipe.id)}
                      />
                    )
                  )}
                />
              </FadeInItem>
            );
          })}

          {/* Calorie Ranges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('recipes.calorieRangeSection')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calScrollContent}
            >
              <View style={styles.calGrid}>
                {/* Row 1 */}
                <View style={styles.calRow}>
                  {CALORIE_RANGES.slice(0, 4).map((item, idx) => (
                    <PressableScale
                      key={idx}
                      style={styles.calCard}
                      onPress={() => {
                        haptic.light();
                        router.push({
                          pathname: '/calorie-recipes',
                          params: { range: item.label }
                        });
                      }}
                    >
                      <Image source={item.img} style={styles.calImage} resizeMode="contain" />
                      <Text style={styles.calLabel}>{item.label}</Text>
                    </PressableScale>
                  ))}
                </View>
                {/* Row 2 */}
                <View style={styles.calRow}>
                  {CALORIE_RANGES.slice(4, 8).map((item, idx) => (
                    <PressableScale
                      key={idx}
                      style={styles.calCard}
                      onPress={() => {
                        haptic.light();
                        router.push({
                          pathname: '/calorie-recipes',
                          params: { range: item.label }
                        });
                      }}
                    >
                      <Image source={item.img} style={styles.calImage} resizeMode="contain" />
                      <Text style={styles.calLabel}>{item.label}</Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Dynamic Category Sections After Calorie */}
          {CATEGORY_LISTS_AFTER_CAL.map((cat, idx) => {
            const recipesForCat = RECIPES.filter(r => r.categories?.includes(cat.key as any) && (!hideAllergens || !recipeHasUserAllergen(r, userAllergens)));
            if (recipesForCat.length === 0) return null;

            return (
              <FadeInItem key={`after-${idx}`} index={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{t('recipes.categories.' + cat.key)}</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recipeScrollContent}
                  data={recipesForCat}
                  keyExtractor={item => item.id}
                  initialNumToRender={2}
                  maxToRenderPerBatch={3}
                  windowSize={3}
                  removeClippedSubviews={true}
                  renderItem={({ item: recipe }) => (
                    <RecipeCardB
                      recipe={recipe}
                      warnAllergen={warnFor(recipe)}
                      onPress={() => openRecipe(recipe.id)}
                    />
                  )}
                />
              </FadeInItem>
            );
          })}
          </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setFilterVisible(false)} />
          <View style={styles.modalContent}>
            
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>{t('recipes.filterModal.title')}</Text>
              <PressableScale haptic="light" style={styles.modalCloseBtn} onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </PressableScale>
            </View>

            <View style={styles.modalSeparator} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              
              {/* Meal Selection */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('recipes.filterModal.mealSelection')}</Text>
                <View style={styles.filterPillsContainer}>
                  {MEAL_FILTERS.map((item, idx) => {
                    const isActive = selectedMealFilter === item.key;
                    return (
                      <PressableScale haptic="light"
                        key={idx}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => {
                          haptic.light();
                          setSelectedMealFilter(item.key);
                        }}
                      >
                        <MaterialCommunityIcons name={item.iconName as any} size={18} color={item.iconColor} style={styles.filterPillIcon} />
                        <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{t('recipes.meals.' + item.key)}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={colors.textPrimary} style={{ marginLeft: 6 }} />}
                      </PressableScale>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSeparator} />

              {/* Calorie Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('recipes.filterModal.calorieRange')}</Text>
                <View style={styles.filterPillsContainer}>
                  {CALORIE_FILTERS.map((item, idx) => {
                    const isActive = selectedCalorieFilter === item.label;
                    return (
                      <PressableScale haptic="light"
                        key={idx}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => {
                          haptic.light();
                          setSelectedCalorieFilter(item.label);
                        }}
                      >
                        <MaterialCommunityIcons name={item.iconName as any} size={18} color={item.iconColor} style={styles.filterPillIcon} />
                        <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{item.label}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={colors.textPrimary} style={{ marginLeft: 6 }} />}
                      </PressableScale>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSeparator} />

              {/* Diyet */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('recipes.filterModal.diet')}</Text>
                <View style={styles.filterPillsContainer}>
                  {DIET_FILTERS.map((item) => {
                    const isActive = selectedDietFilter === item.key;
                    return (
                      <PressableScale haptic="light"
                        key={item.key}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => {
                          haptic.light();
                          setSelectedDietFilter(isActive ? null : item.key);
                        }}
                      >
                        <MaterialCommunityIcons name={item.iconName as any} size={18} color={item.iconColor} style={styles.filterPillIcon} />
                        <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{t('recipes.diets.' + item.key)}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={colors.textPrimary} style={{ marginLeft: 6 }} />}
                      </PressableScale>
                    );
                  })}
                </View>
              </View>

            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <PressableScale haptic="light" 
                style={styles.modalApplyBtn} 
                onPress={() => {
                  haptic.success();
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.modalApplyBtnText}>
                  {anyFilterActive ? t('recipes.filterModal.showRecipesCount', { count: results.length }) : t('recipes.filterModal.showRecipes')}
                </Text>
              </PressableScale>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 68,
  },
  titleFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    overflow: 'hidden',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.green,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  searchBarContainer: {
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchBarPressable: {
    width: '100%',
    height: '100%',
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  searchIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
    marginLeft: 8,
  },
  clearIcon: {
    padding: 4,
  },
  cancelBtnContainer: {
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cancelBtn: {
    width: 75,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.green,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    borderRadius: 100,
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 7,
  },
  activeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  clearAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
  },
  resultsWrap: {
    paddingTop: 6,
    alignItems: 'center',
  },
  resultsCount: {
    alignSelf: 'flex-start',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 22,
    marginBottom: 16,
  },
  resultCardWrap: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerContainer: {
    marginHorizontal: 20,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: colors.surfaceGreen,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separatorLight,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGlowLeft: {
    position: 'absolute',
    left: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(59, 165, 105, 0.22)',
  },
  bannerGlowRight: {
    position: 'absolute',
    right: -45,
    bottom: -45,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(244, 183, 64, 0.12)',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bannerPlateContainer: {
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 10,
  },
  bannerPlateImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  scanBracket: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  bracketTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bracketTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  bracketBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  bracketBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  bannerScanLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 1.5,
    backgroundColor: colors.green,
    top: '50%',
  },
  bannerTag: {
    position: 'absolute',
    backgroundColor: 'rgba(38, 43, 40, 0.92)',
    borderWidth: 0.5,
    borderColor: colors.separator,
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
    zIndex: 5,
  },
  tagTopLeft: {
    top: 2,
    left: -18,
  },
  tagTopRight: {
    top: 2,
    right: -18,
  },
  tagBottomLeft: {
    bottom: 2,
    left: -18,
  },
  tagBottomRight: {
    bottom: 2,
    right: -18,
  },
  bannerTagText: {
    fontSize: 8,
    color: colors.textWhite,
    fontFamily: 'Inter_600SemiBold',
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  bannerSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  bannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.gold,
  },
  bannerLogoContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  bannerLogoImage: {
    width: 40,
    height: 40,
  },
  scroll: { flex: 1 },
  content: { paddingBottom: 120, paddingTop: 10 },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: colors.textPrimary,
    marginLeft: 20,
    marginBottom: 16,
  },
  calScrollContent: {
    paddingHorizontal: 20,
  },
  calGrid: {
    gap: 12,
  },
  calRow: {
    flexDirection: 'row',
    gap: 12,
  },
  calCard: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 16,
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  calImage: {
    width: 54,
    height: 54,
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
  },
  calLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  recipeScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayStrong,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: Radii.cardLarge,
    borderTopRightRadius: Radii.cardLarge,
    height: '90%',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.textSecondary,
  },
  filterPillIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterPillTextActive: {
    fontFamily: 'Inter_600SemiBold',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalApplyBtn: {
    backgroundColor: colors.green,
    height: 50,
    borderRadius: Radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textWhite,
  },
  premiumOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 21, 37, 0.45)',
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCrownIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  planOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 34, 21, 0.45)',
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCalendarIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
});
