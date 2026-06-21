import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { RECIPES, isRecipeLockedForFree } from '../../constants/recipes';
import { haptic } from '../../lib/haptics';
import { useApp, FREE_RECIPE_LIMIT } from '../../context/AppContext';
import { BlurView } from 'expo-blur';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = RECIPES.find(r => r.id === id) ?? RECIPES[0];
  
  const { isPremium } = useApp();
  const isLocked = !isPremium && isRecipeLockedForFree(recipe.id, FREE_RECIPE_LIMIT);
  
  const [bookmarked, setBookmarked] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');
  const showImage = !!recipe.image && !imgFailed;

  // Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('Kahvaltı');
  const [selectedServing, setSelectedServing] = useState(1);

  const MEALS = ['Kahvaltı', 'Öğle', 'Akşam', 'Atıştırmalık'];
  const SERVINGS = [0.5, 1, 1.5, 2];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero Image */}
      <View style={[styles.hero, { backgroundColor: recipe.bgColor }]}>
        <Text style={styles.heroEmoji}>{recipe.emoji}</Text>
        {showImage && (
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </View>

      {/* Nav Buttons (Absolute over image) */}
      <SafeAreaView style={styles.navOverlay}>
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => {
              haptic.light();
              setBookmarked(b => !b);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scrollable Content Sheet */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetPull} />

        <View style={styles.titleRow}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time" size={14} color="#D1D1D1" />
            <Text style={styles.timeText}>{recipe.time}dk</Text>
          </View>
        </View>

        {/* Macros Row */}
        <View style={styles.macrosRow}>
          <View style={styles.macroCard}>
            <Ionicons name="flame" size={24} color={Colors.orange} />
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.kcal} <Text style={styles.macroUnit}>kcal</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Kalori</Text>
          </View>

          <View style={styles.macroCard}>
            <MaterialCommunityIcons name="food-steak" size={24} color="#4AAEEA" />
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.protein} <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Protein</Text>
          </View>

          <View style={styles.macroCard}>
            <MaterialCommunityIcons name="bread-slice" size={24} color={Colors.gold} />
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.carbs} <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Karbonhidrat</Text>
          </View>

          <View style={styles.macroCard}>
            <Ionicons name="water" size={24} color="#8CD743" />
            <Text style={styles.macroValue} numberOfLines={1} adjustsFontSizeToFit>
              {recipe.fat} <Text style={styles.macroUnit}>g</Text>
            </Text>
            <Text style={styles.macroLabel} numberOfLines={1} adjustsFontSizeToFit>Yağ</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ingredients' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ingredients')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'ingredients' && styles.tabTextActive]}>
              Malzemeler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'steps' && styles.tabBtnActive]}
            onPress={() => setActiveTab('steps')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'steps' && styles.tabTextActive]}>
              Hazırlanışı
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentArea}>
          {activeTab === 'ingredients' && (
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingRow}>
                  <Text style={styles.ingName}>{ing.name}</Text>
                  <Text style={styles.ingQty}>{ing.quantity}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'steps' && (
            <View style={styles.stepsList}>
              {recipe.steps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumBadge}>
                    <Text style={styles.stepNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
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
                  <MaterialCommunityIcons name="crown" size={44} color="#F4B740" />
                  <Text style={styles.premiumText}>Premium'a Özel!</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.premiumBtn}
                  onPress={() => {
                    haptic.light();
                    router.push('/paywall');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.premiumBtnText}>
                    Premium'a katıl tüm hizmetlerden yararlan!
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          )}
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Fixed Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => {
            haptic.light();
            if (isLocked) {
              router.push('/paywall');
            } else {
              setAddModalVisible(true);
            }
          }}
        >
          <Ionicons name="add" size={22} color="#000" />
          <Text style={styles.actionBtnPrimaryText}>Öğünüme Ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => haptic.light()}>
          <Ionicons name="paper-plane" size={20} color="#000" />
          <Text style={styles.actionBtnPrimaryText}>Tarifi Paylaş</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Meal Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setAddModalVisible(false)} />
          <View style={styles.modalContent}>
            
            <View style={styles.sheetPull} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalRecipeTitle}>{recipe.name} <Text style={{ color: '#666' }}>| 🕒 {recipe.time}dk</Text></Text>
            </View>

            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Hangi öğüne eklensin?</Text>
              <TouchableOpacity style={{ position: 'absolute', right: 0 }} onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#444" />
              </TouchableOpacity>
            </View>

            {/* Mini Macros Row */}
            <View style={styles.modalMacros}>
              <View style={styles.modalMacroItem}>
                <Ionicons name="flame" size={16} color="#E8E8E8" />
                <Text style={styles.modalMacroText}>{recipe.kcal}</Text>
              </View>
              <View style={styles.modalMacroItem}>
                <MaterialCommunityIcons name="food-steak" size={16} color="#E8E8E8" />
                <Text style={styles.modalMacroText}>{recipe.protein}g</Text>
              </View>
              <View style={styles.modalMacroItem}>
                <Ionicons name="water" size={16} color="#E8E8E8" />
                <Text style={styles.modalMacroText}>{recipe.fat}g</Text>
              </View>
              <View style={styles.modalMacroItem}>
                <MaterialCommunityIcons name="bread-slice" size={16} color="#E8E8E8" />
                <Text style={styles.modalMacroText}>{recipe.carbs}g</Text>
              </View>
            </View>

            {/* Meals List */}
            <View style={styles.mealOptions}>
              {MEALS.map(meal => {
                const isActive = selectedMeal === meal;
                let iconName = 'restaurant-outline';
                if (meal === 'Kahvaltı') iconName = 'egg-outline'; // Changed to egg
                if (meal === 'Öğle') iconName = 'fast-food-outline';
                if (meal === 'Akşam') iconName = 'restaurant-outline';
                if (meal === 'Atıştırmalık') iconName = 'cafe-outline';

                if (isActive) {
                  return (
                    <View key={meal} style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.mealOptionBtn, styles.mealOptionBtnActive, { flex: 1 }]}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Ionicons name={iconName as any} size={20} color={Colors.green} />
                          <Text style={[styles.mealOptionText, styles.mealOptionTextActive]}>
                            {meal}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.mealDropdownBtn} activeOpacity={0.8}>
                        <Ionicons name="caret-up" size={18} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    key={meal}
                    style={styles.mealOptionBtn}
                    onPress={() => {
                      haptic.light();
                      setSelectedMeal(meal);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Ionicons name={iconName as any} size={20} color={Colors.textSecondary} />
                      <Text style={styles.mealOptionText}>
                        {meal}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Servings Selector */}
            <View style={styles.servingSelector}>
              {SERVINGS.map(s => {
                const isActive = selectedServing === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.servingBtn, isActive && styles.servingBtnActive]}
                    onPress={() => {
                      haptic.light();
                      setSelectedServing(s);
                    }}
                  >
                    <Text style={[styles.servingBtnText, isActive && styles.servingBtnTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                haptic.success();
                setAddModalVisible(false);
              }}
            >
              <Text style={styles.modalDoneBtnText}>Bitti</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Colors.background,
  },
  sheetContent: { paddingHorizontal: 20, paddingTop: 12 },
  sheetPull: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  recipeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginRight: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 30,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  macroUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  macroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.green,
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  tabContentArea: {
    minHeight: 320,
    position: 'relative',
  },
  ingredientsList: {
    gap: 16,
  },
  ingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
  },
  ingName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  ingQty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textMuted,
  },
  stepsList: {
    gap: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.green,
  },
  stepText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green,
    height: 54,
    borderRadius: 16,
    gap: 10,
  },
  actionBtnPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.backgroundAlt,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  modalHeader: {
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRecipeTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  modalMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
  },
  mealOptions: {
    gap: 10,
    marginBottom: 24,
  },
  mealOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  mealOptionBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.green,
  },
  mealOptionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  mealOptionTextActive: {
    color: Colors.green,
  },
  mealDropdownBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  servingBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  servingBtnActive: {
    backgroundColor: Colors.surfaceElevated,
  },
  servingBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  servingBtnTextActive: {
    color: Colors.textPrimary,
  },
  modalDoneBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFF',
  },
  premiumBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
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
    borderColor: '#F4B740',
    backgroundColor: '#1E1911',
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
    color: '#FFF',
    marginTop: 8,
  },
  premiumBtn: {
    borderWidth: 1.5,
    borderColor: '#F4B740',
    backgroundColor: '#15120E',
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
    color: '#FFF',
    textAlign: 'center',
  },
});
