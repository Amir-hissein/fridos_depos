import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { haptic } from '../lib/haptics';
import { useFridge } from '../context/FridgeContext';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type TabKey = 'fridge' | 'recent' | 'history';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'fridge', label: 'Buzdolabım' },
  { key: 'recent', label: 'Son Eklenenler' },
  { key: 'history', label: 'Geçmiş Tarifler' },
];

// Simple category guessing based on keywords
const CATEGORY_RULES: { keywords: string[]; label: string; icon: IconName; color: string }[] = [
  { keywords: ['elma', 'portakal', 'muz', 'çilek', 'domates', 'salatalık', 'biber', 'soğan', 'sarımsak', 'ıspanak', 'brokoli', 'havuç', 'limon', 'mantar', 'meyve', 'sebze', 'salata'], label: 'Sebze & Meyve', icon: 'fruit-watermelon', color: '#27AE60' },
  { keywords: ['et', 'tavuk', 'balık', 'hindi', 'sosis', 'sucuk', 'biftek', 'kıyma', 'salmon', 'ton'], label: 'Et & Balık', icon: 'food-steak', color: '#E74C3C' },
  { keywords: ['süt', 'yoğurt', 'peynir', 'tereyağı', 'krema', 'kefir', 'labne', 'lor'], label: 'Süt Ürünleri', icon: 'cheese', color: '#F39C12' },
  { keywords: ['ekmek', 'un', 'pirinç', 'makarna', 'yulaf', 'kinoa', 'mısır', 'tahıl', 'bulgur'], label: 'Tahıllar', icon: 'grain', color: '#8E6B3E' },
  { keywords: ['su', 'meyve suyu', 'çay', 'kahve', 'süt', 'soda', 'kola', 'ayran'], label: 'İçecek', icon: 'bottle-soda', color: '#3498DB' },
];

function getCategoryForItem(item: string): { label: string; icon: IconName; color: string } {
  const lower = item.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return { label: rule.label, icon: rule.icon, color: rule.color };
    }
  }
  return { label: 'Diğer', icon: 'food-variant', color: Colors.textMuted };
}

const PAST_RECIPES = [
  { id: '1', name: 'Kinoa & Avokadolu Kahvaltı Salatası', date: 'Bugün', kcal: 320, icon: 'food-fork-drink' as IconName },
  { id: '2', name: 'Bademli Güç Pankeki', date: 'Dün', kcal: 280, icon: 'pancakes' as IconName },
  { id: '3', name: 'Yumuşak Tavuk & Patates Püresi', date: '3 gün önce', kcal: 480, icon: 'food-drumstick' as IconName },
];

export default function FridgeScreen() {
  const { ingredients, addIngredient, removeIngredient } = useFridge();
  const [activeTab, setActiveTab] = useState<TabKey>('fridge');
  const [inputText, setInputText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  // Group ingredients by auto-detected category
  const grouped = ingredients.reduce<Record<string, string[]>>((acc, item) => {
    const cat = getCategoryForItem(item);
    if (!acc[cat.label]) acc[cat.label] = [];
    acc[cat.label].push(item);
    return acc;
  }, {});

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

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Buzdolabım</Text>
        <TouchableOpacity
          style={s.scanBtn}
          onPress={() => router.push('/scan/choose' as never)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="barcode-scan" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={s.tabBtn}
            onPress={() => { haptic.light(); setActiveTab(tab.key); }}
            activeOpacity={0.75}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={s.tabUnderline} />}
          </TouchableOpacity>
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
                <MaterialCommunityIcons name="package-variant" size={20} color={Colors.textSecondary} />
                <Text style={s.statValue}>{ingredients.length}</Text>
                <Text style={s.statLabel}>Ürün</Text>
              </View>
              <View style={s.statCard}>
                <MaterialCommunityIcons name="shape-outline" size={20} color={Colors.textSecondary} />
                <Text style={s.statValue}>{Object.keys(grouped).length}</Text>
                <Text style={s.statLabel}>Kategori</Text>
              </View>
              <View style={s.statCard}>
                <MaterialCommunityIcons name="chef-hat" size={20} color={Colors.textSecondary} />
                <Text style={s.statValue}>{Math.min(ingredients.length * 2, 12)}</Text>
                <Text style={s.statLabel}>Tarif</Text>
              </View>
            </View>

            {/* Add item */}
            {showAddInput ? (
              <View style={s.inputCard}>
                <TextInput
                  style={s.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ürün adı..."
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  autoFocus
                />
                <View style={s.inputActions}>
                  <TouchableOpacity
                    style={s.cancelBtnSmall}
                    onPress={() => setShowAddInput(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.cancelBtnText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.addConfirmBtn} onPress={handleAdd} activeOpacity={0.8}>
                    <Text style={s.addConfirmText}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={s.addPlaceholder}
                onPress={() => setShowAddInput(true)}
                activeOpacity={0.8}
              >
                <View style={s.addIconWrap}>
                  <MaterialCommunityIcons name="plus" size={18} color={Colors.green} />
                </View>
                <Text style={s.addPlaceholderText}>Ürün ekle...</Text>
              </TouchableOpacity>
            )}

            {/* Items grouped by category */}
            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([catLabel, items]) => {
                const ci = getCategoryForItem(items[0]);
                return (
                  <View key={catLabel} style={s.categorySection}>
                    <View style={s.catHeader}>
                      <View style={s.catIconWrap}>
                        <MaterialCommunityIcons name={ci.icon} size={14} color={Colors.textSecondary} />
                      </View>
                      <Text style={s.catTitle}>{catLabel}</Text>
                      <Text style={s.catCount}>{items.length}</Text>
                    </View>
                    <View style={s.itemsCard}>
                      {items.map((item, idx) => (
                        <View key={item}>
                          {idx > 0 && <View style={s.itemDivider} />}
                          <View style={s.itemRow}>
                            <Text style={s.itemName}>{item}</Text>
                            <TouchableOpacity
                              onPress={() => { removeIngredient(item); haptic.light(); }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MaterialCommunityIcons name="close" size={16} color={Colors.textMuted} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="fridge-outline" size={56} color={Colors.textMuted} />
                <Text style={s.emptyTitle}>Buzdolabınız boş görünüyor</Text>
                <Text style={s.emptySub}>Ürün ekleyin veya barkod tarayarak doldurun.</Text>
                <TouchableOpacity
                  style={s.scanBtnLarge}
                  onPress={() => router.push('/scan/choose' as never)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="barcode-scan" size={20} color={Colors.white} />
                  <Text style={s.scanBtnText}>Buzdolabı Tara</Text>
                </TouchableOpacity>
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
                      <Text style={s.recentCat}>{ci.label}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => { removeIngredient(item); haptic.light(); }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="history" size={56} color={Colors.textMuted} />
                <Text style={s.emptyTitle}>Henüz ürün eklenmedi</Text>
                <Text style={s.emptySub}>Buzdolabınıza ürün ekledikçe burada görünecek.</Text>
              </View>
            )}
          </>
        )}

        {/* ── Tab: Geçmiş Tarifler ── */}
        {activeTab === 'history' && (
          <>
            {PAST_RECIPES.map(recipe => (
              <TouchableOpacity key={recipe.id} style={s.recipeCard} activeOpacity={0.8}>
                <View style={s.recipeIconWrap}>
                  <MaterialCommunityIcons name={recipe.icon} size={24} color={Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recipeName}>{recipe.name}</Text>
                  <Text style={s.recipeDate}>{recipe.date} · {recipe.kcal} kcal</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.borderLight,
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
    color: Colors.textMuted,
  },
  tabTextActive: {
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1.5,
    left: 0,
    right: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },

  addPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlaceholderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  inputCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
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
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addConfirmBtn: {
    flex: 2,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addConfirmText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.white,
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
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  catCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textMuted,
  },
  itemsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    color: Colors.textPrimary,
    flex: 1,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  scanBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  scanBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.white,
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.borderLight,
  },
  recentName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  recentCat: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },

  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  recipeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recipeDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
