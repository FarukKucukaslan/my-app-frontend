import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { loadStats, type ArenaStats } from '@/lib/storage';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function StatsScreen() {
  const [stats, setStats] = useState<ArenaStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await loadStats();
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">İstatistikler</ThemedText>
      <ThemedText type="subtitle">Arena performansın</ThemedText>

      <ThemedView style={styles.cardsRow}>
        <ThemedView style={styles.statCard}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={32} color="#2563EB" />
          <ThemedText type="defaultSemiBold">Toplam Hasar</ThemedText>
          <ThemedText style={styles.value}>{loading ? '...' : stats?.totalDamage ?? 0}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.statCard}>
          <IconSymbol name="book.fill" size={32} color="#059669" />
          <ThemedText type="defaultSemiBold">Toplam XP</ThemedText>
          <ThemedText style={styles.value}>{loading ? '...' : stats?.totalXP ?? 0}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.largeCard}>
        <View style={styles.rowBetween}>
          <ThemedText type="defaultSemiBold">Başarılar</ThemedText>
          <ThemedText>{loading ? '...' : `${stats?.totalSuccesses ?? 0}/${stats?.totalAttempts ?? 0}`}</ThemedText>
        </View>

        <View style={styles.rowBetween}>
          <ThemedText type="defaultSemiBold">Kritik Vuruşlar</ThemedText>
          <ThemedText>{loading ? '...' : stats?.totalCriticals ?? 0}</ThemedText>
        </View>

        <View style={styles.rowBetween}>
          <ThemedText type="defaultSemiBold">Son Güncelleme</ThemedText>
          <ThemedText>{loading ? '...' : stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : '-'}</ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    gap: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  largeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
