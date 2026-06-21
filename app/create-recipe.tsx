import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { haptic } from '../lib/haptics';

export default function CreateRecipeScreen() {
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeKcal, setNewRecipeKcal] = useState('');
  const [activeCreateTab, setActiveCreateTab] = useState<'Malzemeler' | 'Hazırlanışı'>('Malzemeler');
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [prepSteps, setPrepSteps] = useState<string[]>(['']);

  const handleSaveRecipe = () => {
    if (!newRecipeName.trim()) {
      alert('Lütfen tarifin adını girin.');
      return;
    }
    haptic.success();
    // Simulate saving and go back
    router.back();
  };

  return (
    <SafeAreaView style={styles.createRecipeSafe} edges={['top']}>
      {/* Header */}
      <View style={styles.createRecipeHeader}>
        <TouchableOpacity
          style={styles.createRecipeBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.createRecipeTitle}>Yeni Tarif Oluştur</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.createRecipeScroll}
        contentContainerStyle={styles.createRecipeContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recipe Name Input */}
        <TextInput
          style={styles.recipeNameInput}
          placeholder="Tarif adını girin."
          placeholderTextColor={Colors.textMuted}
          value={newRecipeName}
          onChangeText={setNewRecipeName}
        />

        {/* Photo Picker Box */}
        <View style={styles.photoPickerSection}>
          <View style={styles.photoPickerLabelRow}>
            <Text style={styles.photoPickerTitle}>Tarifinizin fotoğrafını ekleyin</Text>
            <Text style={styles.photoPickerSubtitle}>İsteğe bağlı</Text>
          </View>
          <TouchableOpacity style={styles.photoPickerBox} activeOpacity={0.8} onPress={haptic.light}>
            <View style={styles.photoPickerCircle}>
              <Ionicons name="camera" size={24} color={Colors.textSecondary} />
            </View>
            <Text style={styles.photoPickerText}>Fotoğraf Ekle</Text>
            <Text style={styles.photoPickerSubtext}>Veya galeriden seçin</Text>
            <View style={styles.photoCropCapsule}>
              <Text style={styles.photoCropText}>1:1 kesilecektir</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Macros / Kalori Info */}
        <TextInput
          style={styles.recipeNameInput}
          placeholder="Toplam Kalori (kcal) - İsteğe Bağlı"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={newRecipeKcal}
          onChangeText={setNewRecipeKcal}
        />

        {/* Tabs: Malzemeler vs Hazırlanışı */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeCreateTab === 'Malzemeler' && styles.tabActiveButtonBorder]}
            onPress={() => { haptic.light(); setActiveCreateTab('Malzemeler'); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeCreateTab === 'Malzemeler' && styles.tabButtonTextActive]}>
              Malzemeler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeCreateTab === 'Hazırlanışı' && styles.tabActiveButtonBorder]}
            onPress={() => { haptic.light(); setActiveCreateTab('Hazırlanışı'); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeCreateTab === 'Hazırlanışı' && styles.tabButtonTextActive]}>
              Hazırlanışı
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeCreateTab === 'Malzemeler' ? (
          <View style={styles.tabContentArea}>
            <View style={styles.ingredientInputRow}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>1</Text>
              </View>
              <TextInput
                style={styles.ingredientInput}
                placeholder="Malzeme ara..."
                placeholderTextColor={Colors.textMuted}
                value={ingredientQuery}
                onChangeText={setIngredientQuery}
              />
              <TouchableOpacity style={styles.amountButton} activeOpacity={0.8}>
                <Text style={styles.amountButtonText}>Miktar</Text>
              </TouchableOpacity>
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
                    placeholder="Adım açıklaması..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    value={step}
                    onChangeText={(val) => {
                      const newSteps = [...prepSteps];
                      newSteps[index] = val;
                      setPrepSteps(newSteps);
                    }}
                  />
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addStepBtn}
                onPress={() => {
                  haptic.light();
                  setPrepSteps([...prepSteps, '']);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color={Colors.green} />
                <Text style={styles.addStepBtnText}>Adım Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveRecipeBtn} onPress={handleSaveRecipe} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={22} color="#1A1E1C" />
            <Text style={styles.saveRecipeBtnText}>Tarifi Kaydet</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  createRecipeSafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  createRecipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  createRecipeBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  createRecipeTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  createRecipeScroll: {
    flex: 1,
  },
  createRecipeContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  recipeNameInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 24,
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
    color: Colors.textPrimary,
  },
  photoPickerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  photoPickerBox: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPickerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  photoPickerSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },
  photoCropCapsule: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  photoCropText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActiveButtonBorder: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.gold,
  },
  tabButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
  tabButtonTextActive: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  tabContentArea: {
    minHeight: 80,
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
    color: Colors.green,
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  numberText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  ingredientInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  amountButton: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  amountButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textMuted,
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
    backgroundColor: '#F3E1C7',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  saveRecipeBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1A1E1C',
  },
});
