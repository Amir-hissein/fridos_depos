import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useTheme, useThemedStyles } from '../../context/ThemeContext';
import { Recipe } from '../../constants/recipes';
import { PressableScale } from './PressableScale';
import { useFridge } from '../../context/FridgeContext';
import { recipeOwnership } from '../../services/shoppingList';
import { localizeRecipeName } from '../../services/localizeRecipe';
import { useTranslation } from 'react-i18next';


const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 44;

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onBookmark?: () => void;
  bookmarked?: boolean;
  locked?: boolean;
  warnAllergen?: boolean;
}

const mapDifficulty = (diff: string) => {
  if (diff === 'Kolay') return 'easy';
  if (diff === 'Orta') return 'medium';
  if (diff === 'Zor') return 'hard';
  return 'easy';
};

const mapMealTypeKey = (mealType: string) => {
  if (mealType === 'Kahvaltı') return 'breakfast';
  if (['Öğle Yemeği', 'Ana Yemek', 'Ana Öğün'].includes(mealType)) return 'lunch';
  if (['Akşam Yemeği'].includes(mealType)) return 'dinner';
  if (['Ara Öğün', 'Tatlı', 'İçecek'].includes(mealType)) return 'snack';
  return 'all';
};

export function RecipeCardA({ recipe, onPress, onBookmark, bookmarked, locked, warnAllergen }: RecipeCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!recipe.image && !imgFailed;
  const { ingredients } = useFridge();
  const { tag, missingCount } = recipeOwnership(recipe, ingredients);
  const { t } = useTranslation();

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      scaleTo={0.98}
      haptic="light"
    >
      {/* Visuel : photo culinaire, fallback emoji + couleur */}
      <View style={[styles.imgArea, { backgroundColor: recipe.bgColor }]}>
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

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.78)']}
        style={StyleSheet.absoluteFillObject}
        locations={[0.38, 1]}
      />

      {/* Status badge */}
      <View style={[styles.badge, tag === 'complete' ? styles.badgeGreen : styles.badgeOrange]}>
        <Ionicons
          name={tag === 'complete' ? 'checkmark-circle' : 'alert-circle-outline'}
          size={13}
          color={colors.white}
          style={{ marginRight: 4 }}
        />
        <Text style={styles.badgeText}>
          {tag === 'complete' ? t('recipes.card.allOwned') : t('recipes.card.missingCount', { count: missingCount })}
        </Text>
      </View>

      {/* Bookmark */}
      <TouchableOpacity style={styles.bookmark} onPress={onBookmark} activeOpacity={0.8}>
        <Ionicons
          name={bookmarked ? 'bookmark' : 'bookmark-outline'}
          size={20}
          color={colors.white}
        />
      </TouchableOpacity>

      {/* Bottom info */}
      <View style={styles.bottom}>
        {warnAllergen && (
          <View style={styles.allergenPill}>
            <Ionicons name="warning" size={11} color={colors.white} />
            <Text style={styles.allergenPillText}>{t('recipes.card.allergen')}</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={2}>{localizeRecipeName(recipe, t)}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.metaText}>{recipe.time} {t('plan.min')}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Ionicons name="flame-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.metaText}>{recipe.kcal} kcal</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={styles.metaText}>{t('setup.paces.' + mapDifficulty(recipe.difficulty))}</Text>
        </View>
      </View>

      {/* Premium lock */}
      {locked && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockPill}>
            <Ionicons name="lock-closed" size={14} color={colors.goldDark} />
            <Text style={styles.lockPillText}>PREMIUM</Text>
          </View>
        </View>
      )}
    </PressableScale>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    shadowColor: colors.shadowBlack,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  imgArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 72 },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  badgeGreen: { backgroundColor: colors.green },
  badgeOrange: { backgroundColor: colors.orange },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.white,
  },
  bookmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  name: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: colors.white,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  metaDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginHorizontal: 2,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  lockPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.goldDark,
    letterSpacing: 0.6,
  },
  allergenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.red,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  allergenPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.white,
    letterSpacing: 0.2,
  },
  allergenBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  cardB: {
    width: 150,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBImgArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  badgeB: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  badgeTextB: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.white,
  },
  bottomB: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  nameB: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.white,
    flex: 1,
    marginRight: 8,
  },
  kcalBadgeB: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  kcalTextB: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.white,
  },
  cardC: {
    width: width * 0.75,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  cardCImgArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomC: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  nameC: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.white,
    marginBottom: 6,
  },
  metaC: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItemC: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTextC: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardD: {
    width: width * 0.65,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surface,
  },
  cardDImgArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomD: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  nameD: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export function RecipeCardB({ recipe, onPress, warnAllergen }: RecipeCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!recipe.image && !imgFailed;
  const { t } = useTranslation();

  return (
    <PressableScale
      style={styles.cardB}
      onPress={onPress}
      scaleTo={0.95}
      haptic="light"
    >
      <View style={[styles.cardBImgArea, { backgroundColor: recipe.bgColor }]}>
        <Text style={{ fontSize: 50 }}>{recipe.emoji}</Text>
        {showImage && (
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFillObject}
        locations={[0.5, 1]}
      />

      <View style={styles.badgeB}>
        <Text style={styles.badgeTextB}>
          {recipe.mealType ? t('recipes.meals.' + mapMealTypeKey(recipe.mealType)) : t('recipes.card.recipeFallback')}
        </Text>
      </View>

      {warnAllergen && (
        <View style={styles.allergenBadge}>
          <Ionicons name="warning" size={13} color={colors.white} />
        </View>
      )}

      <View style={styles.bottomB}>
        <Text style={styles.nameB} numberOfLines={2}>{localizeRecipeName(recipe, t)}</Text>
        <View style={styles.kcalBadgeB}>
          <Ionicons name="flame" size={12} color={colors.white} />
          <Text style={styles.kcalTextB}>{recipe.kcal}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

export function RecipeCardC({ recipe, onPress, warnAllergen }: RecipeCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!recipe.image && !imgFailed;
  const { t } = useTranslation();

  return (
    <PressableScale
      style={styles.cardC}
      onPress={onPress}
      scaleTo={0.96}
      haptic="light"
    >
      <View style={[styles.cardCImgArea, { backgroundColor: recipe.bgColor }]}>
        <Text style={{ fontSize: 60 }}>{recipe.emoji}</Text>
        {showImage && (
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </View>

      <View style={styles.bottomC}>
        <Text style={styles.nameC} numberOfLines={1}>{localizeRecipeName(recipe, t)}</Text>
        <View style={styles.metaC}>
          <View style={styles.metaItemC}>
            <Ionicons name="flame" size={14} color={colors.textSecondary} />
            <Text style={styles.metaTextC}>{recipe.kcal} kcal</Text>
          </View>
          <View style={styles.metaItemC}>
            <Ionicons name="time" size={14} color={colors.textSecondary} />
            <Text style={styles.metaTextC}>{recipe.time} {t('plan.min')}</Text>
          </View>
        </View>
      </View>

      {warnAllergen && (
        <View style={styles.allergenBadge}>
          <Ionicons name="warning" size={13} color={colors.white} />
        </View>
      )}
    </PressableScale>
  );
}

export function RecipeCardD({ recipe, onPress, warnAllergen }: RecipeCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!recipe.image && !imgFailed;

  return (
    <PressableScale
      style={styles.cardD}
      onPress={onPress}
      scaleTo={0.96}
      haptic="light"
    >
      <View style={[styles.cardDImgArea, { backgroundColor: recipe.bgColor }]}>
        <Text style={{ fontSize: 70 }}>{recipe.emoji}</Text>
        {showImage && (
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={StyleSheet.absoluteFillObject}
        locations={[0.4, 1]}
      />

      <View style={styles.bottomD}>
        <Text style={styles.nameD} numberOfLines={2}>{localizeRecipeName(recipe, t)}</Text>
      </View>

      {warnAllergen && (
        <View style={styles.allergenBadge}>
          <Ionicons name="warning" size={13} color={colors.white} />
        </View>
      )}
    </PressableScale>
  );
}
