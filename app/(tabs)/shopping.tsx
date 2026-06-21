import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ShopItem } from '../../components/ui/ShopItem';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PremiumGate } from '../../components/ui/PremiumGate';
import { useApp } from '../../context/AppContext';
import { haptic } from '../../lib/haptics';

type TabKey = 'myitems' | 'tobuy';

const CATEGORIES = [
  { key: '🥬 Sebze & Meyve', label: 'Sebze & Meyve', icon: 'fruit-watermelon' as const, color: '#27AE60' },
  { key: '🧀 Süt Ürünleri', label: 'Süt Ürünleri', icon: 'cheese' as const, color: '#F39C12' },
  { key: '🛒 Temel Gıda', label: 'Temel Gıda', icon: 'cart' as const, color: '#3498DB' },
  { key: '📦 Diğer', label: 'Diğer', icon: 'dots-horizontal' as const, color: Colors.textMuted },
];

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CAT_ICONS: Record<string, { icon: IconName; color: string }> = {
  '🥬 Sebze & Meyve': { icon: 'fruit-watermelon', color: '#27AE60' },
  '🥬 Fruits & vegetables': { icon: 'fruit-watermelon', color: '#27AE60' },
  '🧀 Süt Ürünleri': { icon: 'cheese', color: '#F39C12' },
  '🧀 Dairy': { icon: 'cheese', color: '#F39C12' },
  '🛒 Temel Gıda': { icon: 'cart', color: '#3498DB' },
  '🛒 Pantry': { icon: 'cart', color: '#3498DB' },
  '📦 Diğer': { icon: 'dots-horizontal', color: Colors.textMuted },
  '📦 Other': { icon: 'dots-horizontal', color: Colors.textMuted },
};

export default function ShoppingScreen() {
  const { shoppingList, addShoppingItem, clearCheckedItems, isPremium } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('myitems');

  const totalItems = shoppingList.length;
  const doneItems = shoppingList.filter(item => item.checked).length;
  const progress = totalItems > 0 ? doneItems / totalItems : 0;
  const progressPct = Math.round(progress * 100);

  const [inputText, setInputText] = useState('');
  const [activeCategory, setActiveCategory] = useState('🥬 Sebze & Meyve');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animated progress bar
  const barAnim = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.spring(barAnim, {
      toValue: progress,
      useNativeDriver: false,
      friction: 8,
      tension: 60,
    }).start();
  }, [progress]);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleAddItem = () => {
    if (inputText.trim()) {
      haptic.success();
      addShoppingItem(inputText.trim(), activeCategory);
      setInputText('');
    }
    setShowInput(false);
    Keyboard.dismiss();
  };

  if (!isPremium) {
    return (
      <PremiumGate
        icon="cart"
        title="Otomatik alışveriş listeleri"
        description="Öğün planınızı hazır alışveriş listesine dönüştürüyoruz, kategorilere göre düzenliyoruz."
        features={[
          'Plandan otomatik oluşturulur',
          'Kategorilere göre sıralanır',
          'Alışveriş sırasında işaret edin',
        ]}
      />
    );
  }

  // Unchecked = "to buy", checked = "my items / done"
  const pendingItems = shoppingList.filter(item => !item.checked);
  const doneItemsList = shoppingList.filter(item => item.checked);
  const displayItems = activeTab === 'tobuy' ? pendingItems : shoppingList;
  const categories = Array.from(new Set(displayItems.map(item => item.category)));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Market Listesi</Text>
          <Text style={styles.sub}>
            {activeTab === 'myitems'
              ? `${totalItems} ürün, ${doneItems} alındı`
              : `${pendingItems.length} ürün bekliyor`}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {doneItems > 0 && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: Colors.orangeLight, marginRight: 8 }]}
              onPress={() => { haptic.light(); clearCheckedItems(); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.orange} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerActionBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={Colors.green} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.desc}>
        Almanız gereken ürünleri ve mevcut ürünlerinize görebilir malzemelerinizle sağlıklı tarifler hazırlamaya devam edebilirsiniz.
      </Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => { haptic.light(); setActiveTab('myitems'); }}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'myitems' && styles.tabTextActive]}>
            Ürünlerim
          </Text>
          {activeTab === 'myitems' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => { haptic.light(); setActiveTab('tobuy'); }}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'tobuy' && styles.tabTextActive]}>
            Alınacaklar{pendingItems.length > 0 ? ` (${pendingItems.length})` : ''}
          </Text>
          {activeTab === 'tobuy' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress card - only show when has items */}
        {totalItems > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View style={styles.progressTextLeft}>
                <Text style={styles.progressTitle}>
                  {doneItems === totalItems && totalItems > 0
                    ? 'Tüm ürünler alındı! 🎉'
                    : `${totalItems - doneItems} ürün kaldı`}
                </Text>
                <Text style={styles.progressSub}>{doneItems} / {totalItems} alındı</Text>
              </View>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
            </View>
          </View>
        )}

        {/* Add item */}
        <View style={styles.addSection}>
          {showInput ? (
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ürün adı..."
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleAddItem}
                  returnKeyType="done"
                  autoFocus
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddItem} activeOpacity={0.8}>
                  <Text style={styles.addButtonText}>Ekle</Text>
                </TouchableOpacity>
              </View>
              {/* Category picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryPill,
                      activeCategory === cat.key && styles.categoryPillActive,
                    ]}
                    onPress={() => setActiveCategory(cat.key)}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        activeCategory === cat.key && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPlaceholder}
              onPress={() => {
                setShowInput(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              activeOpacity={0.88}
            >
              <View style={styles.addIconWrap}>
                <MaterialCommunityIcons name="plus" size={18} color={Colors.green} />
              </View>
              <Text style={styles.addPlaceholderText}>Ürün ekle...</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categories / items list */}
        {displayItems.length > 0 ? (
          categories.map((catLabel, ci) => {
            const catItems = displayItems.filter(item => item.category === catLabel);
            if (catItems.length === 0) return null;
            const ci_ = CAT_ICONS[catLabel] ?? { icon: 'dots-horizontal' as IconName, color: Colors.textMuted };
            return (
              <FadeInItem key={catLabel} index={ci + 1} style={styles.categoryBlock}>
                <View style={styles.catHeader}>
                  <View style={styles.catIconWrap}>
                    <MaterialCommunityIcons name={ci_.icon} size={14} color={Colors.textSecondary} />
                  </View>
                  <Text style={styles.catLabel}>{catLabel}</Text>
                  <Text style={styles.catCount}>{catItems.length}</Text>
                </View>
                <View style={styles.itemsList}>
                  {catItems.map((item, ii) => (
                    <React.Fragment key={item.id}>
                      {ii > 0 && <View style={styles.itemDivider} />}
                      <ShopItem id={item.id} name={item.name} />
                    </React.Fragment>
                  ))}
                </View>
              </FadeInItem>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name={activeTab === 'tobuy' ? 'check-circle-outline' : 'cart-outline'}
              size={52}
              color={Colors.textMuted}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'tobuy'
                ? 'Alınacak ürün yok'
                : 'Listeniz boş görünüyor'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'tobuy'
                ? 'Harika! Tüm ürünler alındı.'
                : 'Ürün ekleyin veya öğün planınızdan otomatik oluşturun.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 2,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 14,
    lineHeight: 19,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.borderLight,
    marginBottom: 4,
  },
  tabBtn: {
    paddingBottom: 10,
    paddingRight: 24,
    position: 'relative',
  },
  tabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
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
    right: 24,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
  },

  // Progress
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 14,
    shadowColor: Colors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressTextLeft: { flex: 1 },
  progressTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  progressSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressPct: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: Colors.green,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: Colors.separatorLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.green,
    borderRadius: 4,
  },

  // Add section
  addSection: {
    marginBottom: 20,
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
  inputContainer: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.green,
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  addButton: {
    backgroundColor: Colors.green,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.white,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginRight: 6,
  },
  categoryPillActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.greenLight,
  },
  categoryPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  categoryPillTextActive: {
    color: Colors.green,
    fontFamily: 'Inter_600SemiBold',
  },

  // List
  categoryBlock: {
    marginBottom: 18,
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
  catLabel: {
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
  itemsList: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 36,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: 8,
    gap: 6,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
