import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ThemeColors } from '../constants/colors';
import { useTheme, useThemedStyles } from '../context/ThemeContext';
import { Radii, Shadows, elevation } from '../constants/layout';
import { animateLayout } from '../constants/animations';
import { FadeInItem } from '../components/ui/FadeInItem';
import { Input } from '../components/ui/Input';
import { PressableScale } from '../components/ui/PressableScale';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { haptic } from '../lib/haptics';
import { useCustomRecipes } from '../context/CustomRecipesContext';
import { useFeedback } from '../context/FeedbackContext';
import { useTranslation } from 'react-i18next';

interface DraftIngredient {
  name: string;
  quantity: string;
}

export default function CreateRecipeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { addCustomRecipe } = useCustomRecipes();
  const { alert, toast } = useFeedback();
  const { t } = useTranslation();

  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeKcal, setNewRecipeKcal] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [activeCreateTab, setActiveCreateTab] = useState<'ingredients' | 'steps'>('ingredients');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQty, setIngredientQty] = useState('');
  const [prepSteps, setPrepSteps] = useState<string[]>(['']);

  /* ── Photo : caméra / galerie + autorisations ──────────────────── */
  const permissionAlert = (source: 'camera' | 'gallery') => {
    alert({
      variant: 'warning',
      title:
        source === 'camera'
          ? t('recipes.create.cameraPermTitle')
          : t('recipes.create.galleryPermTitle'),
      message:
        source === 'camera'
          ? t('recipes.create.cameraPermMsg')
          : t('recipes.create.galleryPermMsg'),
      buttons: [
        { label: t('recipes.cancel'), style: 'cancel' },
        { label: t('recipes.create.openSettings'), onPress: () => Linking.openSettings() },
      ],
    });
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return permissionAlert('camera');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) {
      haptic.success();
      setPhotoUri(res.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return permissionAlert('gallery');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) {
      haptic.success();
      setPhotoUri(res.assets[0].uri);
    }
  };

  const choosePhoto = () => {
    alert({
      variant: 'info',
      icon: 'camera',
      title: t('recipes.create.photoTitle'),
      message: t('recipes.create.photoMsg'),
      buttons: [
        { label: t('recipes.create.takePhoto'), onPress: pickFromCamera },
        { label: t('recipes.create.chooseGallery'), onPress: pickFromGallery },
        ...(photoUri
          ? [
              {
                label: t('recipes.create.removePhoto'),
                style: 'destructive' as const,
                onPress: () => setPhotoUri(null),
              },
            ]
          : []),
        { label: t('recipes.cancel'), style: 'cancel' as const },
      ],
    });
  };

  /* ── Ingrédients ───────────────────────────────────────────────── */
  const addIngredient = () => {
    const name = ingredientName.trim();
    if (!name) {
      haptic.light();
      return;
    }
    haptic.light();
    animateLayout();
    setIngredients((prev) => [...prev, { name, quantity: ingredientQty.trim() }]);
    setIngredientName('');
    setIngredientQty('');
  };
  const removeIngredient = (index: number) => {
    haptic.light();
    animateLayout();
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Étapes ────────────────────────────────────────────────────── */
  const addStep = () => {
    haptic.light();
    animateLayout();
    setPrepSteps((prev) => [...prev, '']);
  };
  const updateStep = (index: number, val: string) => {
    setPrepSteps((prev) => prev.map((s, i) => (i === index ? val : s)));
  };
  const removeStep = (index: number) => {
    haptic.light();
    animateLayout();
    setPrepSteps((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Enregistrement ────────────────────────────────────────────── */
  const handleSaveRecipe = () => {
    if (!newRecipeName.trim()) {
      alert({
        variant: 'warning',
        title: t('recipes.create.missingInfoTitle'),
        message: t('recipes.create.missingNameMsg'),
      });
      return;
    }
    addCustomRecipe({
      name: newRecipeName,
      kcal: parseInt(newRecipeKcal, 10) || 0,
      image: photoUri ?? undefined,
      ingredients,
      steps: prepSteps,
    });
    toast(t('recipes.create.recipeSavedToast'));
    router.back();
  };

  return (
    <SafeAreaView style={styles.createRecipeSafe} edges={['top']}>
      <ScreenHeader title={t('recipes.create.title')} />

      <ScrollView
        style={styles.createRecipeScroll}
        contentContainerStyle={styles.createRecipeContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nom */}
        <FadeInItem index={0}>
          <Input
            containerStyle={{ marginBottom: 24 }}
            placeholder={t('recipes.create.namePlaceholder')}
            value={newRecipeName}
            onChangeText={setNewRecipeName}
          />
        </FadeInItem>

        {/* Photo */}
        <FadeInItem index={1} style={styles.photoPickerSection}>
          <View style={styles.photoPickerLabelRow}>
            <Text style={styles.photoPickerTitle}>{t('recipes.create.addPhotoLabel')}</Text>
            <Text style={styles.photoPickerSubtitle}>{t('recipes.create.optional')}</Text>
          </View>

          {photoUri ? (
            <PressableScale haptic="light" style={styles.photoPreviewWrap} onPress={choosePhoto}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              <View style={styles.photoChangeBadge}>
                <Ionicons name="camera-reverse-outline" size={16} color={colors.textWhite} />
                <Text style={styles.photoChangeText}>{t('recipes.create.changePhoto')}</Text>
              </View>
            </PressableScale>
          ) : (
            <PressableScale haptic="light" style={styles.photoPickerBox} onPress={choosePhoto}>
              <View style={styles.photoPickerCircle}>
                <Ionicons name="camera" size={22} color={colors.textSecondary} />
              </View>
              <Text style={styles.photoPickerText}>{t('recipes.create.addPhotoBtn')}</Text>
              <Text style={styles.photoPickerSubtext}>{t('recipes.create.addPhotoSub')}</Text>
              <View style={styles.photoCropCapsule}>
                <Text style={styles.photoCropText}>{t('recipes.create.aspectRatioNote')}</Text>
              </View>
            </PressableScale>
          )}
        </FadeInItem>

        {/* Calorie */}
        <Input
          containerStyle={{ marginBottom: 24 }}
          placeholder={t('recipes.create.kcalPlaceholder')}
          keyboardType="numeric"
          value={newRecipeKcal}
          onChangeText={setNewRecipeKcal}
        />

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <PressableScale
            haptic="light"
            style={[
              styles.tabButton,
              activeCreateTab === 'ingredients' && styles.tabActiveButtonBorder,
            ]}
            onPress={() => {
              haptic.light();
              setActiveCreateTab('ingredients');
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeCreateTab === 'ingredients' && styles.tabButtonTextActive,
              ]}
            >
              {t('recipes.create.ingredientsTab')}
              {ingredients.length > 0 ? ` (${ingredients.length})` : ''}
            </Text>
          </PressableScale>
          <PressableScale
            haptic="light"
            style={[styles.tabButton, activeCreateTab === 'steps' && styles.tabActiveButtonBorder]}
            onPress={() => {
              haptic.light();
              setActiveCreateTab('steps');
            }}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeCreateTab === 'steps' && styles.tabButtonTextActive,
              ]}
            >
              {t('recipes.create.stepsTab')}
            </Text>
          </PressableScale>
        </View>

        {/* Malzemeler */}
        {activeCreateTab === 'ingredients' ? (
          <View style={styles.tabContentArea}>
            {ingredients.map((ing, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.numberCircle}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <Text style={styles.ingredientItemName} numberOfLines={1}>
                  {ing.name}
                </Text>
                {!!ing.quantity && <Text style={styles.ingredientItemQty}>{ing.quantity}</Text>}
                <PressableScale
                  haptic="light"
                  style={styles.removeBtn}
                  onPress={() => removeIngredient(index)}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </PressableScale>
              </View>
            ))}

            <View style={styles.ingredientInputRow}>
              <TextInput
                style={styles.ingredientInput}
                placeholder={t('recipes.create.ingNamePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={ingredientName}
                onChangeText={setIngredientName}
                onSubmitEditing={addIngredient}
                returnKeyType="done"
              />
              <TextInput
                style={styles.qtyInput}
                placeholder={t('recipes.create.ingQtyPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={ingredientQty}
                onChangeText={setIngredientQty}
                onSubmitEditing={addIngredient}
                returnKeyType="done"
              />
              <PressableScale
                haptic="light"
                style={styles.addIngredientBtn}
                onPress={addIngredient}
              >
                <Ionicons name="add" size={22} color={colors.textWhite} />
              </PressableScale>
            </View>
          </View>
        ) : (
          <View style={styles.tabContentArea}>
            <View style={styles.stepsContainer}>
              {prepSteps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.numberCircle}>
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </View>
                  <TextInput
                    style={[styles.ingredientInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    placeholder={t('recipes.create.stepPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    value={step}
                    onChangeText={(val) => updateStep(index, val)}
                  />
                  {prepSteps.length > 1 && (
                    <PressableScale
                      haptic="light"
                      style={styles.removeBtn}
                      onPress={() => removeStep(index)}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </PressableScale>
                  )}
                </View>
              ))}

              <PressableScale haptic="light" style={styles.addStepBtn} onPress={addStep}>
                <Ionicons name="add" size={20} color={colors.green} />
                <Text style={styles.addStepBtnText}>{t('recipes.create.addStepBtn')}</Text>
              </PressableScale>
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.saveButtonContainer}>
          <PressableScale haptic="light" style={styles.saveRecipeBtn} onPress={handleSaveRecipe}>
            <Ionicons name="checkmark-circle" size={22} color={colors.textWhite} />
            <Text style={styles.saveRecipeBtnText}>{t('recipes.create.saveRecipeBtn')}</Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    createRecipeSafe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    createRecipeScroll: {
      flex: 1,
    },
    createRecipeContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 100,
    },
    photoPickerSection: {
      marginBottom: 24,
    },
    photoPickerLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 10,
    },
    photoPickerTitle: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 16,
      color: colors.textPrimary,
    },
    photoPickerSubtitle: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: colors.textMuted,
    },
    photoPickerBox: {
      ...elevation(colors, 1),
      backgroundColor: colors.surface,
      borderRadius: Radii.card,
      paddingVertical: 28,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    photoPickerCircle: {
      ...elevation(colors, 1),
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoPickerText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 15,
      color: colors.textPrimary,
    },
    photoPickerSubtext: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: colors.textMuted,
    },
    photoCropCapsule: {
      backgroundColor: colors.borderLight,
      borderRadius: Radii.box,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginTop: 4,
    },
    photoCropText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
      color: colors.textMuted,
    },
    photoPreviewWrap: {
      height: 200,
      borderRadius: Radii.card,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    photoPreview: {
      width: '100%',
      height: '100%',
    },
    photoChangeBadge: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.overlayStrong,
      borderRadius: Radii.pill,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    photoChangeText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: colors.textWhite,
    },
    tabsRow: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      marginBottom: 16,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    tabActiveButtonBorder: {
      borderBottomWidth: 2,
      borderBottomColor: colors.green,
    },
    tabButtonText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      color: colors.textMuted,
    },
    tabButtonTextActive: {
      fontFamily: 'Inter_600SemiBold',
      color: colors.textPrimary,
    },
    tabContentArea: {
      minHeight: 80,
    },
    ingredientItem: {
      ...elevation(colors, 1),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: Radii.input,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 10,
    },
    ingredientItemName: {
      flex: 1,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: colors.textPrimary,
    },
    ingredientItemQty: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: colors.textMuted,
    },
    removeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ingredientInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 4,
    },
    ingredientInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: Radii.input,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textPrimary,
    },
    qtyInput: {
      width: 90,
      backgroundColor: colors.surface,
      borderRadius: Radii.input,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.textPrimary,
    },
    addIngredientBtn: {
      width: 48,
      height: 48,
      borderRadius: Radii.input,
      backgroundColor: colors.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepsContainer: {
      gap: 12,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    addStepBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignSelf: 'flex-start',
    },
    addStepBtnText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: colors.green,
    },
    numberCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.backgroundAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: colors.textMuted,
    },
    saveButtonContainer: {
      position: 'absolute',
      bottom: 24,
      left: 20,
      right: 20,
    },
    saveRecipeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.green,
      borderRadius: Radii.button,
      height: 50,
      ...Shadows.green,
    },
    saveRecipeBtnText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 16,
      color: colors.textWhite,
    },
  });
