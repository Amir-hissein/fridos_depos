import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useApp } from '../../context/AppContext';
import { haptic } from '../../lib/haptics';

interface ShopItemProps {
  id: string;
  name: string;
}

export function ShopItem({ id, name }: ShopItemProps) {
  const { shoppingList, toggleShoppingItem, removeShoppingItem } = useApp();
  const item = shoppingList.find(i => i.id === id);
  const done = item ? item.checked : false;

  // Pop spring sur la coche
  const pop = useRef(new Animated.Value(done ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: done ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 140,
    }).start();
  }, [done]);

  const handlePress = () => {
    if (done) haptic.light();
    else haptic.success();
    toggleShoppingItem(id);
  };

  const checkScale = pop.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1.15, 1],
  });

  return (
    <View style={styles.row}>
      <Pressable style={styles.itemPressable} onPress={handlePress}>
        <View style={[styles.check, done && styles.checkDone]}>
          <Animated.View style={{ transform: [{ scale: checkScale }], opacity: pop }}>
            <Ionicons name="checkmark" size={14} color={Colors.white} />
          </Animated.View>
        </View>
        <Text style={[styles.name, done && styles.nameDone]} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => {
          haptic.light();
          removeShoppingItem(id);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.separator,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  name: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  nameDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
