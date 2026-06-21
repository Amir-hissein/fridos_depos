import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { PressableScale } from './PressableScale';

interface ChipProps {
  label: string;
  onRemove?: () => void;
}

export function Chip({ label, onRemove }: ChipProps) {
  return (
    <PressableScale style={styles.chip} onPress={onRemove} scaleTo={0.95} haptic="light">
      <Text style={styles.chipText}>{label}</Text>
      {onRemove && (
        <Ionicons name="close" size={14} color="rgba(255,255,255,0.85)" />
      )}
    </PressableScale>
  );
}

interface FilterChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  locked?: boolean;
}

export function FilterChip({ label, active, onPress, icon, locked }: FilterChipProps) {
  return (
    <PressableScale
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      scaleTo={0.95}
      haptic="select"
    >
      {icon && (
        <Ionicons
          name={icon}
          size={14}
          color={active ? Colors.white : Colors.textSecondary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
      {locked && (
        <Ionicons
          name="lock-closed"
          size={12}
          color={active ? Colors.white : Colors.gold}
          style={{ marginLeft: 4 }}
        />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.green,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textWhite,
  },
  filterChip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  filterChipActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.textWhite,
  },
});
