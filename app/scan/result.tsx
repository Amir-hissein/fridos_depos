import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useFridge } from '../../context/FridgeContext';
import { DetectedItem } from '../../components/ui/DetectedItem';
import { haptic } from '../../lib/haptics';
import { detectIngredients, DetectedIngredient } from '../../services/vision';

const { height } = Dimensions.get('window');

export default function ScanResultScreen() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const { addBulkIngredients } = useFridge();
  const [detected, setDetected] = useState<DetectedIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    detectIngredients(uri)
      .then(items => {
        if (!active) return;
        setDetected(items);
        setChecked(new Set(items.filter(d => d.default).map(d => d.id)));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uri]);

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    haptic.success();
    const toAdd = detected.filter(d => checked.has(d.id)).map(d => d.name);
    addBulkIngredients(toAdd);
    router.replace('/(tabs)/plan');
  };

  const checkedCount = checked.size;

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgPhoto}>
        <Text style={styles.bgEmoji1}>🥦</Text>
        <Text style={styles.bgEmoji2}>🍅</Text>
        <Text style={styles.bgEmoji3}>🥕</Text>
      </View>

      {/* Close */}
      <SafeAreaView style={styles.headerBar} edges={['top']}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/plan')} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={Colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {loading ? 'Detecting…' : `${detected.length} items detected 🎉`}
          </Text>
          <Text style={styles.sheetDesc}>
            {loading ? 'Reading your photo' : "Uncheck anything you don't have, then confirm."}
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color={Colors.green} />
            <Text style={styles.stateText}>Analyzing ingredients…</Text>
          </View>
        ) : detected.length === 0 ? (
          <View style={styles.stateWrap}>
            <Ionicons name="image-outline" size={40} color={Colors.textLight} />
            <Text style={styles.stateText}>No ingredients detected. Try another photo.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {detected.map(d => (
              <DetectedItem
                key={d.id}
                emoji={d.emoji}
                name={d.name}
                confidence={d.confidence}
                bgColor={d.bg}
                checked={checked.has(d.id)}
                onToggle={() => toggle(d.id)}
              />
            ))}
          </ScrollView>
        )}

        <SafeAreaView edges={['bottom']} style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, (loading || checkedCount === 0) && styles.actionBtnDisabled]}
            onPress={handleAdd}
            activeOpacity={0.85}
            disabled={loading || checkedCount === 0}
          >
            <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
            <Text style={styles.actionBtnText}>
              Add {checkedCount} ingredient{checkedCount > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.manualBtn} onPress={() => router.replace('/(tabs)/plan')} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={17} color={Colors.green} />
            <Text style={styles.manualBtnText}>Add manually</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.scanBg },
  bgPhoto: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#262920',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgEmoji1: { position: 'absolute', fontSize: 100, opacity: 0.12, top: '20%', left: '10%', transform: [{ rotate: '15deg' }] },
  bgEmoji2: { position: 'absolute', fontSize: 90, opacity: 0.12, top: '40%', right: '8%', transform: [{ rotate: '-25deg' }] },
  bgEmoji3: { position: 'absolute', fontSize: 85, opacity: 0.12, bottom: '28%', left: '15%', transform: [{ rotate: '10deg' }] },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.74,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.separator,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sheetDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 22,
    paddingVertical: 4,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 40,
  },
  stateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtn: {
    backgroundColor: Colors.green,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.shadowGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
    marginBottom: 8,
  },
  actionBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  manualBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.green,
  },
});
