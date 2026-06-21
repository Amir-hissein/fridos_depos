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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { RECIPES, isRecipeLockedForFree } from '../../constants/recipes';
import { RecipeCardB, RecipeCardC, RecipeCardD } from '../../components/ui/RecipeCard';
import { useApp, FREE_RECIPE_LIMIT } from '../../context/AppContext';
import { haptic } from '../../lib/haptics';
import { PressableScale } from '../../components/ui/PressableScale';

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
  const { isPremium } = useApp();
  
  const [filterVisible, setFilterVisible] = React.useState(false);
  const [selectedMealFilter, setSelectedMealFilter] = React.useState('Tüm Tarifler');
  const [selectedCalorieFilter, setSelectedCalorieFilter] = React.useState<string | null>(null);



  const MEAL_FILTERS = [
    { label: 'Tüm Tarifler', iconName: 'room-service-outline', iconColor: '#E8E8E8' },
    { label: 'Kahvaltı', iconName: 'egg-fried', iconColor: '#F4B740' },
    { label: 'Öğle Yemeği', iconName: 'silverware-fork-knife', iconColor: '#5C9DFF' },
    { label: 'Akşam Yemeği', iconName: 'food-turkey', iconColor: '#A0A0A0' },
    { label: 'Ara Öğün', iconName: 'peanut', iconColor: '#FF8A5C' },
  ];

  const CALORIE_FILTERS = [
    { label: '50-100 kcal', iconName: 'leaf', iconColor: '#3BA569' },
    { label: '100-200 kcal', iconName: 'food-apple', iconColor: '#3BA569' },
    { label: '200-300 kcal', iconName: 'egg', iconColor: '#F4B740' },
    { label: '300-400 kcal', iconName: 'food-variant', iconColor: '#FF8A5C' },
    { label: '400-500 kcal', iconName: 'bowl-mix', iconColor: '#5C9DFF' },
    { label: '500-600 kcal', iconName: 'noodles', iconColor: '#E8E8E8' },
    { label: '600-800 kcal', iconName: 'pasta', iconColor: '#F4B740' },
    { label: '800-1000 kcal', iconName: 'hamburger', iconColor: '#FF8A5C' },
  ];

  const openRecipe = (id: string) => {
    if (!isPremium && isRecipeLockedForFree(id, FREE_RECIPE_LIMIT)) {
      router.push('/paywall');
    } else {
      router.push(`/recipe/${id}`);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tarifler</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.headerIconBtn}
              onPress={() => {
                haptic.light();
                setFilterVisible(true);
              }}
            >
              <Ionicons name="options-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Ionicons name="search-outline" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner */}
          <PressableScale 
            style={styles.bannerContainer} 
            onPress={() => {
              haptic.light();
              router.push('/scan/camera');
            }}
          >
            {/* Ambient glows */}
            <View style={styles.bannerGlowLeft} />
            <View style={styles.bannerGlowRight} />
            
            <View style={styles.bannerContent}>
              {/* Left: Plate & Scanner */}
              <View style={styles.bannerPlateContainer}>
                <Image 
                  source={require('../../assets/images/calorie/500-600.png')} 
                  style={styles.bannerPlateImage} 
                  resizeMode="contain"
                />
                
                {/* Corner Scan Brackets */}
                <View style={[styles.scanBracket, styles.bracketTopLeft]} />
                <View style={[styles.scanBracket, styles.bracketTopRight]} />
                <View style={[styles.scanBracket, styles.bracketBottomLeft]} />
                <View style={[styles.scanBracket, styles.bracketBottomRight]} />
                
                {/* Laser scan line */}
                <View style={styles.bannerScanLine} />
                
                {/* Floating calorie tags */}
                <View style={[styles.bannerTag, styles.tagTopLeft]}>
                  <Text style={styles.bannerTagText}>🍖 18g</Text>
                </View>
                <View style={[styles.bannerTag, styles.tagTopRight]}>
                  <Text style={styles.bannerTagText}>🔥 610</Text>
                </View>
                <View style={[styles.bannerTag, styles.tagBottomLeft]}>
                  <Text style={styles.bannerTagText}>🍞 75g</Text>
                </View>
                <View style={[styles.bannerTag, styles.tagBottomRight]}>
                  <Text style={styles.bannerTagText}>💧 25g</Text>
                </View>
              </View>

              {/* Middle: Info Text */}
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerSubtitle}>Tabağını şimdi çek</Text>
                <Text style={styles.bannerTitle}>anında kalorisini gör!</Text>
              </View>

              {/* Right: App Logo */}
              <View style={styles.bannerLogoContainer}>
                <Image 
                  source={require('../../assets/fridos.png')} 
                  style={styles.bannerLogoImage} 
                  resizeMode="contain"
                />
              </View>
            </View>
          </PressableScale>

          {/* Categories Before Calorie Section */}
          {CATEGORY_LISTS_BEFORE_CAL.map((cat, idx) => {
            const recipesForCat = RECIPES.filter(r => r.categories?.includes(cat.key as any));
            if (recipesForCat.length === 0) return null;

            return (
              <View key={`before-${idx}`} style={styles.section}>
                <Text style={styles.sectionTitle}>{cat.title}</Text>
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
                        onPress={() => openRecipe(recipe.id)}
                      />
                    ) : (
                      <RecipeCardD
                        recipe={recipe}
                        onPress={() => openRecipe(recipe.id)}
                      />
                    )
                  )}
                />
              </View>
            );
          })}

          {/* Calorie Ranges Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kalori aralığına göre tarifler</Text>
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
            const recipesForCat = RECIPES.filter(r => r.categories?.includes(cat.key as any));
            if (recipesForCat.length === 0) return null;

            return (
              <View key={`after-${idx}`} style={styles.section}>
                <Text style={styles.sectionTitle}>{cat.title}</Text>
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
                      onPress={() => openRecipe(recipe.id)}
                    />
                  )}
                />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setFilterVisible(false)} />
          <View style={styles.modalContent}>
            
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Filtrele</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSeparator} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              
              {/* Meal Selection */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Öğün Seçimi</Text>
                <View style={styles.filterPillsContainer}>
                  {MEAL_FILTERS.map((item, idx) => {
                    const isActive = selectedMealFilter === item.label;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => {
                          haptic.light();
                          setSelectedMealFilter(item.label);
                        }}
                      >
                        <MaterialCommunityIcons name={item.iconName as any} size={18} color={item.iconColor} style={styles.filterPillIcon} />
                        <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{item.label}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={Colors.textPrimary} style={{ marginLeft: 6 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalSeparator} />

              {/* Calorie Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kalori Aralığı</Text>
                <View style={styles.filterPillsContainer}>
                  {CALORIE_FILTERS.map((item, idx) => {
                    const isActive = selectedCalorieFilter === item.label;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.filterPill, isActive && styles.filterPillActive]}
                        onPress={() => {
                          haptic.light();
                          setSelectedCalorieFilter(item.label);
                        }}
                      >
                        <MaterialCommunityIcons name={item.iconName as any} size={18} color={item.iconColor} style={styles.filterPillIcon} />
                        <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{item.label}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={18} color={Colors.textPrimary} style={{ marginLeft: 6 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalApplyBtn} 
                onPress={() => {
                  haptic.success();
                  setFilterVisible(false);
                }}
              >
                <Text style={styles.modalApplyBtnText}>Tarifleri Göster</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerContainer: {
    marginHorizontal: 20,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    backgroundColor: '#112217',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: '#3BA569',
    top: '50%',
  },
  bannerTag: {
    position: 'absolute',
    backgroundColor: 'rgba(38, 43, 40, 0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
    color: '#FFF',
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
    color: '#AEB4AE',
    marginBottom: 3,
  },
  bannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#F4B740',
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
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textWhite,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 10,
  },
  recipeScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundAlt,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: Colors.border,
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
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.textSecondary,
  },
  filterPillIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  filterPillTextActive: {
    fontFamily: 'Inter_600SemiBold',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalApplyBtn: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFF',
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
