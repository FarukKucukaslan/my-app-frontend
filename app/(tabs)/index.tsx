import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { pingSupabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Henüz test edilmedi');
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const runConnectionTest = useCallback(async () => {
    setIsLoading(true);
    setStatusText('Supabase baglantisi kontrol ediliyor...');
    setStatusCode(null);

    try {
      const result = await pingSupabase();

      if (result.ok) {
        setStatusText('Supabase baglantisi basarili.');
      } else {
        setStatusText('Supabase baglantisi kuruldu ama API beklenen yaniti vermedi.');
      }

      setStatusCode(result.status);
    } catch {
      setStatusText('Supabase baglantisi basarisiz. URL veya publishable key bilgisini kontrol et.');
      setStatusCode(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void runConnectionTest();
  }, [runConnectionTest]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Sorgu Savaslari</ThemedText>
      <ThemedText type="subtitle">Supabase Entegrasyon Durumu</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText>{statusText}</ThemedText>
        {statusCode !== null ? <ThemedText>HTTP durum kodu: {statusCode}</ThemedText> : null}
        {isLoading ? <ActivityIndicator style={styles.loader} /> : null}
      </ThemedView>

      <Pressable onPress={runConnectionTest} style={styles.button} disabled={isLoading}>
        <ThemedText type="defaultSemiBold">Baglantiyi tekrar test et</ThemedText>
      </Pressable>

      <Pressable
        onPress={() => Alert.alert('Test', 'Test butonu calisti.')}
        style={styles.button}
        disabled={isLoading}>
        <ThemedText type="defaultSemiBold">Test Butonu</ThemedText>
      </Pressable>

      <ThemedView style={styles.infoBox}>
        <ThemedText type="defaultSemiBold">Gerekli ortam degiskenleri</ThemedText>
        <ThemedText>EXPO_PUBLIC_SUPABASE_URL</ThemedText>
        <ThemedText>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY</ThemedText>
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
  card: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9C0CA',
  },
  loader: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignSelf: 'flex-start',
  },
  infoBox: {
    gap: 6,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
});
