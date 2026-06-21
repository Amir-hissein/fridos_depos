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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { PressableScale } from '../components/ui/PressableScale';
import { haptic } from '../lib/haptics';
import { usePlan, MealSlot } from '../context/PlanContext';

interface MealRecipe {
  id: string;
  name: string;
  kcal: number;
  time: number;
  image: string;
}

const MOCK_RECIPES: Record<string, MealRecipe[]> = {
  breakfast: [
    {
      id: 'r_bf_1',
      name: 'Güzelleştiren Shake',
      kcal: 503,
      time: 10,
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: '3', // maps to Tomato & basil omelette from RECIPES
      name: 'Beyaz Peynirli Omlet',
      kcal: 500,
      time: 10,
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'r_bf_3',
      name: 'Orman Meyveli Chia Lapa',
      kcal: 500,
      time: 2,
      image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=400&q=80',
    },
  ],
  lunch: [
    {
      id: '2', // maps to Curried veggie skillet
      name: 'Köri Soslu Sebze Tava',
      kcal: 500,
      time: 20,
      image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: '1', // maps to Zucchini & goat cheese gratin
      name: 'Keçi Peynirli Kabak Graten',
      kcal: 500,
      time: 35,
      image: 'https://images.unsplash.com/photo-1568600891621-50f697b9a1c7?auto=format&fit=crop&w=400&q=80',
    },
  ],
  dinner: [
    {
      id: '4', // maps to Express Caprese salad
      name: 'Akdeniz Caprese Salatası',
      kcal: 500,
      time: 10,
      image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: '1',
      name: 'Keçi Peynirli Kabak Graten',
      kcal: 500,
      time: 35,
      image: 'https://images.unsplash.com/photo-1568600891621-50f697b9a1c7?auto=format&fit=crop&w=400&q=80',
    },
  ],
  snack: [
    {
      id: 'r_sn_1',
      name: 'Orman Meyveli Yoğurt Kasesi',
      kcal: 193,
      time: 5,
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'r_sn_2',
      name: 'Sağlıklı Karışık Kuruyemiş',
      kcal: 150,
      time: 2,
      image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=400&q=80',
    },
  ],
};

const MEAL_NAMES: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
};

export default function MealDetailScreen() {
  const { meal } = useLocalSearchParams<{ meal: string }>();
  const mealSlot = (meal as MealSlot) || 'breakfast';

  const { intake, logMeal } = usePlan();
  const [showRecipes, setShowRecipes] = useState(true);
  const [activeTab, setActiveTab] = useState('Önerilen Tarifler');

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
    logMeal(mealSlot, consumedKcal + kcalVal);
    setCustomFoodName('');
    setCustomFoodCal('');
    setIsAddFoodOpen(false);
  };

  // Kendi Tariflerim / Custom Recipes states
  const [customRecipes, setCustomRecipes] = useState<MealRecipe[]>([
    {
      id: 'custom_1',
      name: 'Ev Yapımı Granola',
      kcal: 320,
      time: 15,
      image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=400&q=80',
    }
  ]);

  const handleSaveRecipe = () => {
    // This is now handled in /create-recipe
  };

  const mealName = MEAL_NAMES[mealSlot] || 'Kahvaltı';
  const targetKcal = mealSlot === 'snack' ? 193 : 500;
  const consumedKcal = intake[mealSlot] ?? 0;

  // Macros targets
  const targetProtein = Math.round((targetKcal * 0.25) / 4);
  const targetFat = Math.round((targetKcal * 0.25) / 9);
  const targetCarbs = Math.round((targetKcal * 0.50) / 4);

  // Macros consumed (approximate based on intake calories)
  const consumedProtein = Math.round((consumedKcal * 0.25) / 4);
  const consumedFat = Math.round((consumedKcal * 0.25) / 9);
  const consumedCarbs = Math.round((consumedKcal * 0.50) / 4);

  const mealRecipes = MOCK_RECIPES[mealSlot] || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ══ HEADER ══════════════════════════════════════════ */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{mealName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ══ AKTİF DEĞERLER (ACTIVE VALUES) CARD ═════════════════ */}
        <Text style={styles.sectionLabel}>Aktif Değerler</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Kalori</Text>
            <Text style={styles.cardValue}>{consumedKcal} / {targetKcal} kcal</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((consumedKcal / targetKcal) * 100, 100)}%` as `${number}%` },
              ]}
            />
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroVal}>{consumedProtein}/{targetProtein}g</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Yağ</Text>
              <Text style={styles.macroVal}>{consumedFat}/{targetFat}g</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroLabel}>Karb.</Text>
              <Text style={styles.macroVal}>{consumedCarbs}/{targetCarbs}g</Text>
            </View>
          </View>
        </View>

        {/* ══ INFO BOX ════════════════════════════════════════ */}
        <View style={styles.infoBox}>
          <View style={styles.infoIconBox}>
            <Ionicons name="information-circle-outline" size={24} color="#5BB5FF" />
          </View>
          <Text style={styles.infoText}>
            Senin için, senin hedeflerine ve damak tadına en uygun tarifleri seçtik. Listeyi kaydırıp tümünü görebilirsin.
          </Text>
        </View>

        {/* ══ ÖNERİLEN TARİFLER ══════════════════════════════ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Önerilen Tarifler</Text>
          <TouchableOpacity onPress={() => setShowRecipes(!showRecipes)} activeOpacity={0.7}>
            <Text style={styles.hideText}>{showRecipes ? "Tarifleri Gizle" : "Tarifleri Göster"}</Text>
          </TouchableOpacity>
        </View>

        {showRecipes && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipesRow}
          >
            {mealRecipes.map(r => {
              const isLogged = consumedKcal === r.kcal;
              return (
                <PressableScale
                  key={r.id}
                  style={styles.recipeCard}
                  scaleTo={0.96}
                  haptic="light"
                  onPress={() => router.push(`/recipe/${r.id}`)}
                >
                  {/* Photo */}
                  <Image source={{ uri: r.image }} style={styles.recipeImg} resizeMode="cover" />

                  {/* Add Button Overlay */}
                  <TouchableOpacity
                    style={[styles.addBtnOverlay, isLogged && styles.addBtnOverlayActive]}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation(); // prevent navigating to recipe detail
                      haptic.success();
                      logMeal(mealSlot, isLogged ? 0 : r.kcal);
                    }}
                  >
                    <Ionicons name={isLogged ? "checkmark-circle" : "add-circle-outline"} size={16} color="#fff" />
                    <Text style={styles.addBtnText}>
                      {isLogged ? "Eklendi" : "+ Öğünüme Ekle"}
                    </Text>
                  </TouchableOpacity>

                  {/* Info */}
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName} numberOfLines={1}>{r.name}</Text>
                    <View style={styles.recipeMeta}>
                      <Ionicons name="flame" size={12} color={Colors.orange} />
                      <Text style={styles.recipeMetaTxt}>{r.kcal} kcal</Text>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.recipeMetaTxt}>{r.time} dk</Text>
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
          {['Önerilen Tarifler', 'Favorilerim', 'Kendi Tariflerim'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.bottomPill, isActive && styles.bottomPillActive]}
                activeOpacity={0.8}
                onPress={() => {
                  haptic.light();
                  setActiveTab(tab);
                }}
              >
                <Text style={[styles.bottomPillText, isActive && styles.bottomPillTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {activeTab === 'Favorilerim' && (
          <View style={styles.emptyStateCard}>
            <Ionicons name="bookmark-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyStateText}>Burada henüz bir tarif bulunmuyor.</Text>
          </View>
        )}

        {activeTab === 'Kendi Tariflerim' && (
          <View style={styles.customRecipesContainer}>
            {/* Custom Recipes List */}
            {customRecipes.map(r => {
              const isLogged = consumedKcal === r.kcal;
              return (
                <PressableScale
                  key={r.id}
                  style={styles.customRecipeItemCard}
                  scaleTo={0.97}
                  haptic="light"
                  onPress={() => router.push(`/recipe/${r.id}`)}
                >
                  <Image source={{ uri: r.image }} style={styles.customRecipeImg} />
                  <View style={styles.customRecipeInfo}>
                    <Text style={styles.customRecipeName}>{r.name}</Text>
                    <Text style={styles.customRecipeKcal}>{r.kcal} kcal</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.customAddBtn, isLogged && styles.customAddBtnActive]}
                    activeOpacity={0.8}
                    onPress={(e) => {
                      e.stopPropagation();
                      haptic.success();
                      logMeal(mealSlot, isLogged ? 0 : r.kcal);
                    }}
                  >
                    <Ionicons name={isLogged ? "checkmark" : "add"} size={18} color="#fff" />
                  </TouchableOpacity>
                </PressableScale>
              );
            })}

            {/* Dotted border card to add custom recipe */}
            <TouchableOpacity
              style={styles.addOwnRecipeCard}
              activeOpacity={0.8}
              onPress={() => router.push('/create-recipe')}
            >
              <Ionicons name="add" size={32} color={Colors.textSecondary} />
              <Text style={styles.addOwnRecipeText}>Kendi Tarifini Ekle</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.fabMenuStack}>
          {/* Tarif Ekle */}
          <TouchableOpacity
            style={styles.fabMenuItemRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsFabOpen(false);
              haptic.light();
              router.push('/create-recipe');
            }}
          >
            <Text style={styles.fabMenuLabel}>Tarif Ekle</Text>
            <View style={styles.fabMenuCircle}>
              <MaterialCommunityIcons name={"room-service-outline" as any} size={20} color={Colors.green} />
            </View>
          </TouchableOpacity>

          {/* Besin Ekle */}
          <TouchableOpacity
            style={styles.fabMenuItemRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsFabOpen(false);
              haptic.light();
              setIsAddFoodOpen(true);
            }}
          >
            <Text style={styles.fabMenuLabel}>Besin Ekle</Text>
            <View style={styles.fabMenuCircle}>
              <MaterialCommunityIcons name={"banana" as any} size={20} color={Colors.green} />
            </View>
          </TouchableOpacity>

          {/* Tabağı Tara */}
          <TouchableOpacity
            style={styles.fabMenuItemRow}
            activeOpacity={0.8}
            onPress={() => {
              setIsFabOpen(false);
              haptic.light();
              router.push('/scan/choose');
            }}
          >
            <Text style={styles.fabMenuLabel}>Tabağı Tara</Text>
            <View style={styles.fabMenuCircle}>
              <MaterialCommunityIcons name={"qrcode-scan" as any} size={20} color={Colors.green} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom bar with cloche and main FAB */}
      <View style={styles.bottomRow} pointerEvents="box-none">
        <View style={{ flex: 1 }} />
        {/* Center Cloche Button */}
        <TouchableOpacity
          style={[styles.clocheBtn, isFabOpen && { opacity: 0.4 }]}
          activeOpacity={0.8}
          onPress={() => {
            haptic.light();
            router.push('/(tabs)/plan');
          }}
        >
          <MaterialCommunityIcons name={"room-service" as any} size={24} color={Colors.gold} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />

        {/* Floating Action Button (FAB) */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={[styles.fabButton, isFabOpen && styles.fabActiveButton]}
            activeOpacity={0.8}
            onPress={() => {
              haptic.medium();
              setIsFabOpen(!isFabOpen);
            }}
          >
            <Ionicons
              name={isFabOpen ? 'close' : 'add'}
              size={28}
              color={Colors.white}
            />
          </TouchableOpacity>
          {!isFabOpen && <Text style={styles.fabLabel}>Ekle</Text>}
        </View>
      </View>

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
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalSheetTitle}>Besin Ekle</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Besin Adı (örn: Muz, Yumurta)"
              placeholderTextColor={Colors.textMuted}
              value={customFoodName}
              onChangeText={setCustomFoodName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Kalori (kcal)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={customFoodCal}
              onChangeText={setCustomFoodCal}
            />

            <Text style={styles.quickLogTitle}>Hızlı Ekle</Text>
            <View style={styles.quickGrid}>
              {[
                { name: 'Muz', kcal: 90 },
                { name: 'Yumurta', kcal: 75 },
                { name: 'Yulaf Ezmesi', kcal: 150 },
                { name: 'Süt', kcal: 120 },
              ].map(item => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.quickItem}
                  onPress={() => {
                    setCustomFoodName(item.name);
                    setCustomFoodCal(item.kcal.toString());
                    haptic.light();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickItemText}>{item.name}</Text>
                  <Text style={styles.quickItemKcal}>{item.kcal} kcal</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleAddFood}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSaveBtnText}>Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsAddFoodOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  cardValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: Colors.gold,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  macroVal: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: Colors.gold,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(91,181,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(91,181,255,0.18)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(91,181,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
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
    color: Colors.textPrimary,
  },
  hideText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  recipesRow: {
    gap: 14,
    paddingBottom: 24,
  },
  recipeCard: {
    width: 220,
    height: 220,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addBtnOverlayActive: {
    backgroundColor: Colors.green,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  recipeInfo: {
    padding: 12,
    gap: 4,
  },
  recipeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaTxt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
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
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  bottomPillActive: {
    borderColor: Colors.white,
  },
  bottomPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  bottomPillTextActive: {
    color: Colors.white,
  },
  emptyStateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  emptyStateText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },

  // Floating Actions
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 90,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    paddingHorizontal: 24,
  },
  clocheBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26,30,28,0.85)',
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  fabWrapper: {
    position: 'absolute',
    right: 24,
    alignItems: 'center',
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  fabActiveButton: {
    backgroundColor: Colors.greenDark,
  },
  fabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  fabMenuStack: {
    position: 'absolute',
    bottom: 96,
    right: 32,
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
    color: Colors.textPrimary,
    backgroundColor: 'rgba(26,30,28,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  fabMenuCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalSheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  modalSaveBtn: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  modalSaveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.white,
  },
  modalCloseBtn: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalCloseBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  quickLogTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  quickItemText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  quickItemKcal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Kendi Tariflerim styling
  customRecipesContainer: {
    gap: 12,
    marginTop: 12,
  },
  customRecipeItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 12,
    gap: 12,
  },
  customRecipeImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.backgroundAlt,
  },
  customRecipeInfo: {
    flex: 1,
    gap: 2,
  },
  customRecipeName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  customRecipeKcal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
  customAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddBtnActive: {
    backgroundColor: Colors.greenDark,
  },
  addOwnRecipeCard: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  addOwnRecipeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
