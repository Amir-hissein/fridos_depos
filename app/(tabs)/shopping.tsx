import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { PressableScale } from '../../components/ui/PressableScale';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Radii } from '../../constants/layout';
import { ShopItem } from '../../components/ui/ShopItem';
import { FadeInItem } from '../../components/ui/FadeInItem';
import { PremiumGate } from '../../components/ui/PremiumGate';
import { useApp } from '../../context/AppContext';
import { useFeedback } from '../../context/FeedbackContext';
import { usePlan } from '../../context/PlanContext';
import { useFridge } from '../../context/FridgeContext';
import { RECIPES } from '../../constants/recipes';
import { generateFromRecipes } from '../../services/shoppingList';
import { haptic } from '../../lib/haptics';
import { useTranslation } from 'react-i18next';

const getCategoryLabel = (catLabel: string, t: any) => {
  const clean = catLabel.replace(/[🥬🧀🛒📦]/g, '').trim().toLowerCase();
  if (clean.includes('sebze') || clean.includes('fruit') || clean.includes('produce')) return t('shopping.categories.fruitsVeg');
  if (clean.includes('süt') || clean.includes('dairy')) return t('shopping.categories.dairy');
  if (clean.includes('temel') || clean.includes('pantry') || clean.includes('kiler') || clean.includes('gıda')) return t('shopping.categories.pantry');
  return t('shopping.categories.other');
};

type TabKey = 'myitems' | 'tobuy';

const CATEGORIES = [
  { key: '🥬 Fruits & vegetables', label: 'Produce', icon: 'fruit-watermelon' as const, color: Colors.green },
  { key: '🧀 Dairy', label: 'Dairy', icon: 'cheese' as const, color: Colors.yellow },
  { key: '🛒 Pantry', label: 'Pantry', icon: 'cart' as const, color: Colors.blue },
  { key: '📦 Other', label: 'Other', icon: 'dots-horizontal' as const, color: Colors.textMuted },
];

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CAT_ICONS: Record<string, { icon: IconName; color: string }> = {
  '🥬 Fruits & vegetables': { icon: 'fruit-watermelon', color: Colors.green },
  '🧀 Dairy': { icon: 'cheese', color: Colors.yellow },
  '🛒 Pantry': { icon: 'cart', color: Colors.blue },
  '📦 Other': { icon: 'dots-horizontal', color: Colors.textMuted },
};

export default function ShoppingScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { shoppingList, addShoppingItem, clearCheckedItems, isPremium } = useApp();
  const { confirm, toast } = useFeedback();
  const { loggedRecipeIds } = usePlan();
  const { ingredients: fridge } = useFridge();
  const [activeTab, setActiveTab] = useState<TabKey>('myitems');
  const { t } = useTranslation();

  // « Alınacaklar » = ingrédients manquants (vs frigo) des recettes ajoutées aux repas,
  // en excluant ce qui est déjà dans la liste manuelle.
  const derivedMissing = useMemo(() => {
    const planned = RECIPES.filter(r => loggedRecipeIds.includes(r.id));
    return generateFromRecipes(planned, fridge).filter(
      m => !shoppingList.some(s => s.name.trim().toLowerCase() === m.name.trim().toLowerCase()),
    );
  }, [loggedRecipeIds, fridge, shoppingList]);

  const addMissingToList = (name: string, category: string) => {
    haptic.success();
    addShoppingItem(name, category);
    toast(t('shopping.toastAdded'));
  };

  const handleClearChecked = async () => {
    const ok = await confirm({
      title: t('shopping.clearConfirmTitle'),
      message: t('shopping.clearConfirmMsg'),
      destructive: true,
      confirmLabel: t('shopping.clearConfirmDone'),
      cancelLabel: t('common.cancel'),
    });
    if (ok) {
      clearCheckedItems();
      toast(t('shopping.toastUpdated'));
    }
  };

  const totalItems = shoppingList.length;
  const doneItems = shoppingList.filter(item => item.checked).length;
  const progress = totalItems > 0 ? doneItems / totalItems : 0;
  const progressPct = Math.round(progress * 100);

  const [inputText, setInputText] = useState('');
  const [activeCategory, setActiveCategory] = useState('🥬 Fruits & vegetables');
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
        title={t('shopping.gate.title')}
        description={t('shopping.gate.description')}
        features={t('shopping.gate.features', { returnObjects: true }) as string[]}
      />
    );
  }

  // « Ürünlerim » = liste manuelle ; « Alınacaklar » = dérivée du plan (derivedMissing).
  const displayItems = shoppingList;
  const categories = Array.from(new Set(displayItems.map(item => item.category)));
  const derivedCategories = Array.from(new Set(derivedMissing.map(m => m.category)));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <PressableScale
            haptic="light"
            style={styles.backBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)/profile'))}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
          </PressableScale>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.title}>{t('shopping.title')}</Text>
            <Text style={styles.sub}>
              {activeTab === 'myitems'
                ? t('shopping.itemsStatus', { total: totalItems, done: doneItems })
                : t('shopping.missingCount', { count: derivedMissing.length })}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {doneItems > 0 && (
            <PressableScale haptic="light"
              style={[styles.headerActionBtn, { backgroundColor: colors.orangeLight, marginRight: 8 }]}
              onPress={handleClearChecked}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.orange} />
            </PressableScale>
          )}
          <PressableScale haptic="light" style={styles.headerActionBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.green} />
          </PressableScale>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.desc}>
        {t('shopping.desc')}
      </Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <PressableScale haptic="light"
          style={styles.tabBtn}
          onPress={() => { haptic.light(); setActiveTab('myitems'); }}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'myitems' && styles.tabTextActive]}>
            {t('shopping.tabs.myItems')}
          </Text>
          {activeTab === 'myitems' && <View style={styles.tabUnderline} />}
        </PressableScale>
        <PressableScale haptic="light"
          style={styles.tabBtn}
          onPress={() => { haptic.light(); setActiveTab('tobuy'); }}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabText, activeTab === 'tobuy' && styles.tabTextActive]}>
            {t('shopping.tabs.toBuy')}{derivedMissing.length > 0 ? ` (${derivedMissing.length})` : ''}
          </Text>
          {activeTab === 'tobuy' && <View style={styles.tabUnderline} />}
        </PressableScale>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress card - liste manuelle uniquement */}
        {activeTab === 'myitems' && totalItems > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View style={styles.progressTextLeft}>
                <Text style={styles.progressTitle}>
                  {doneItems === totalItems && totalItems > 0
                    ? t('shopping.progress.allDone')
                    : t('shopping.progress.remaining', { count: totalItems - doneItems })}
                </Text>
                <Text style={styles.progressSub}>{doneItems} / {totalItems}</Text>
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
                  placeholder={t('shopping.addPlaceholderInput')}
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleAddItem}
                  returnKeyType="done"
                  autoFocus
                />
                <PressableScale haptic="light" style={styles.addButton} onPress={handleAddItem} activeOpacity={0.8}>
                  <Text style={styles.addButtonText}>{t('shopping.addBtn')}</Text>
                </PressableScale>
              </View>
              {/* Category picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.map(cat => (
                  <PressableScale haptic="light"
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
                      {getCategoryLabel(cat.key, t)}
                    </Text>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          ) : (
            <PressableScale haptic="light"
              style={styles.addPlaceholder}
              onPress={() => {
                setShowInput(true);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              activeOpacity={0.88}
            >
              <View style={styles.addIconWrap}>
                <MaterialCommunityIcons name="plus" size={18} color={colors.green} />
              </View>
              <Text style={styles.addPlaceholderText}>{t('shopping.addPlaceholder')}</Text>
            </PressableScale>
          )}
        </View>

        {/* ── Onglet "Alınacaklar" : dérivé des recettes du plan − frigo ── */}
        {activeTab === 'tobuy' ? (
          derivedMissing.length > 0 ? (
            derivedCategories.map((catLabel, ci) => {
              const catItems = derivedMissing.filter(m => m.category === catLabel);
              const ci_ = CAT_ICONS[catLabel] ?? { icon: 'dots-horizontal' as IconName, color: colors.textMuted };
              return (
                <FadeInItem key={catLabel} index={ci + 1} style={styles.categoryBlock}>
                  <View style={styles.catHeader}>
                    <View style={styles.catIconWrap}>
                      <MaterialCommunityIcons name={ci_.icon} size={14} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.catLabel}>{getCategoryLabel(catLabel, t)}</Text>
                    <Text style={styles.catCount}>{catItems.length}</Text>
                  </View>
                  <View style={styles.itemsList}>
                    {catItems.map((m, ii) => (
                      <React.Fragment key={`${m.name}-${ii}`}>
                        {ii > 0 && <View style={styles.itemDivider} />}
                        <View style={styles.buyRow}>
                          <Text style={styles.buyName} numberOfLines={1}>{m.name}</Text>
                          {!!m.quantity && <Text style={styles.buyQty}>{m.quantity}</Text>}
                          <PressableScale haptic="light" style={styles.buyAddBtn} onPress={() => addMissingToList(m.name, m.category)}>
                            <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
                          </PressableScale>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </FadeInItem>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={52} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t('shopping.emptyTobuyTitle')}</Text>
              <Text style={styles.emptySub}>
                {t('shopping.emptyTobuySub')}
              </Text>
            </View>
          )
        ) : displayItems.length > 0 ? (
          categories.map((catLabel, ci) => {
            const catItems = displayItems.filter(item => item.category === catLabel);
            if (catItems.length === 0) return null;
            const ci_ = CAT_ICONS[catLabel] ?? { icon: 'dots-horizontal' as IconName, color: colors.textMuted };
            return (
              <FadeInItem key={catLabel} index={ci + 1} style={styles.categoryBlock}>
                <View style={styles.catHeader}>
                  <View style={styles.catIconWrap}>
                    <MaterialCommunityIcons name={ci_.icon} size={14} color={colors.textSecondary} />
                  </View>
                  <Text style={styles.catLabel}>{getCategoryLabel(catLabel, t)}</Text>
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
            <MaterialCommunityIcons name="cart-outline" size={52} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('shopping.emptyMyitemsTitle')}</Text>
            <Text style={styles.emptySub}>{t('shopping.emptyMyitemsSub')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: 2,
  },
  sub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  desc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
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
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitleBlock: {
    flex: 1,
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

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.borderLight,
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
    right: 24,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },

  // Progress
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: 14,
    shadowColor: colors.shadowBlack,
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
    color: colors.textPrimary,
    marginBottom: 2,
  },
  progressSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressPct: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.green,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.separatorLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.green,
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
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
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
  inputContainer: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.green,
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
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
  },
  addButton: {
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.white,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginRight: 6,
  },
  categoryPillActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  categoryPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: colors.green,
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
    backgroundColor: colors.backgroundAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
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
  itemsList: {
    backgroundColor: colors.surface,
    borderRadius: Radii.card,
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 36,
  },
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  buyName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  buyQty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  buyAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginTop: 8,
    gap: 6,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
