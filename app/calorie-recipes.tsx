import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { RECIPES } from '../constants/recipes';
import { RecipeCardB } from '../components/ui/RecipeCard';
import { haptic } from '../lib/haptics';
import { PressableScale } from '../components/ui/PressableScale';

const { width } = Dimensions.get('window');

const CALORIE_RANGES = [
  { label: '50-100kcal', img: require('../assets/images/calorie/50-100.png') },
  { label: '100-200kcal', img: require('../assets/images/calorie/100-200.png') },
  { label: '200-300kcal', img: require('../assets/images/calorie/200-300.png') },
  { label: '300-400kcal', img: require('../assets/images/calorie/300-400.png') },
  { label: '400-500kcal', img: require('../assets/images/calorie/400-500.png') },
  { label: '500-600kcal', img: require('../assets/images/calorie/500-600.png') },
  { label: '600-800kcal', img: require('../assets/images/calorie/600-800.png') },
  { label: '800-1000kcal', img: require('../assets/images/calorie/800-1000.png') },
];

const getRangeMinMax = (rangeStr: string) => {
  const match = rangeStr.replace('kcal', '').split('-');
  if (match.length === 2) {
    return { min: parseInt(match[0], 10), max: parseInt(match[1], 10) };
  }
  return { min: 0, max: 9999 };
};

export default function CalorieRecipesScreen() {
  const { range: initialRange } = useLocalSearchParams<{ range: string }>();
  const [activeRange, setActiveRange] = useState(initialRange || '100-200kcal');

  // Filter recipes based on range
  const filteredRecipes = useMemo(() => {
    const { min, max } = getRangeMinMax(activeRange);
    return RECIPES.filter(r => r.kcal >= min && r.kcal <= max);
  }, [activeRange]);

  // Featured Recipe of the day (Günün Tarifi)
  const featuredRecipe = useMemo(() => {
    if (filteredRecipes.length === 0) return null;
    // Find a recipe with an image if possible
    const withImg = filteredRecipes.filter(r => !!r.image);
    return withImg.length > 0 ? withImg[0] : filteredRecipes[0];
  }, [filteredRecipes]);

  // Categorized groups
  const sections = useMemo(() => {
    if (filteredRecipes.length === 0) return [];
    
    // Group all recipes
    const breakfast = filteredRecipes.filter(
      r => r.mealType === 'Kahvaltı' || r.categories?.includes('breakfast-goodies')
    );
    const snack = filteredRecipes.filter(
      r => r.mealType === 'Ara Öğün' || r.categories?.includes('fit-desserts') || r.categories?.includes('fruits')
    );
    const main = filteredRecipes.filter(
      r => ['Ana Öğün', 'Öğle Yemeği', 'Akşam Yemeği', 'Ana Yemek'].includes(r.mealType) || r.categories?.includes('light-dinner')
    );

    const list = [];
    if (breakfast.length > 0) list.push({ title: 'Kahvaltı', data: breakfast });
    if (snack.length > 0) list.push({ title: 'Ara Öğünler', data: snack });
    if (main.length > 0) list.push({ title: 'Ana Yemekler', data: main });
    return list;
  }, [filteredRecipes]);

  const handleSelectRange = (rangeLabel: string) => {
    haptic.light();
    setActiveRange(rangeLabel);
  };

  const openRecipe = (id: string) => {
    router.push(`/recipe/${id}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              haptic.light();
              router.back();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kalori aralığına göre tarifler</Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Calorie Range Selector Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            style={styles.tabsContainer}
          >
            {CALORIE_RANGES.map((item, idx) => {
              const isActive = activeRange === item.label;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.tabCard,
                    isActive && styles.tabCardActive,
                  ]}
                  onPress={() => handleSelectRange(item.label)}
                  activeOpacity={0.8}
                >
                  <Image source={item.img} style={styles.tabImage} resizeMode="contain" />
                  <Text style={styles.tabLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="nutrition" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Bu kalori aralığında henüz tarif bulunmuyor.</Text>
            </View>
          ) : (
            <>
              {/* Featured Recipe (Günün Tarifi) */}
              {featuredRecipe && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Günün Tarifi</Text>
                  <PressableScale
                    style={styles.featuredCard}
                    onPress={() => openRecipe(featuredRecipe.id)}
                  >
                    <View style={styles.featuredImgArea}>
                      <Text style={styles.featuredEmoji}>{featuredRecipe.emoji}</Text>
                      {featuredRecipe.image && (
                        <Image
                          source={{ uri: featuredRecipe.image }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                        />
                      )}
                      <View style={styles.featuredBadges}>
                        <View style={styles.featuredBadge}>
                          <Ionicons name="flame" size={14} color={Colors.white} />
                          <Text style={styles.featuredBadgeText}>{featuredRecipe.kcal}</Text>
                        </View>
                        <View style={styles.featuredBadge}>
                          <Ionicons name="time" size={14} color={Colors.white} />
                          <Text style={styles.featuredBadgeText}>{featuredRecipe.time} dk</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.featuredInfo}>
                      <Text style={styles.featuredTitle}>{featuredRecipe.name}</Text>
                      <Text style={styles.featuredSubtitle}>Hedefiniz için uygun</Text>
                    </View>
                  </PressableScale>
                </View>
              )}

              {/* Categorized Rows */}
              {sections.map((sect, sIdx) => (
                <View key={sIdx} style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>{sect.title}</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={{ marginRight: 20 }} />
                  </View>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recipeListContent}
                    data={sect.data}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <RecipeCardB
                        recipe={item}
                        onPress={() => openRecipe(item.id)}
                      />
                    )}
                  />
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 60,
  },
  tabsContainer: {
    marginVertical: 16,
    maxHeight: 110,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tabCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  tabCardActive: {
    borderColor: Colors.goldDark,
    borderWidth: 2,
    backgroundColor: Colors.surface,
  },
  tabImage: {
    width: 54,
    height: 54,
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textWhite,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginLeft: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  featuredCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredImgArea: {
    height: 180,
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredEmoji: {
    fontSize: 60,
  },
  featuredBadges: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  featuredBadgeText: {
    color: '#FFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  featuredInfo: {
    padding: 16,
  },
  featuredTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  recipeListContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
});
