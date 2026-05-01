import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getChallenges,
  submitSqlAttempt,
  validateSqlForArena,
  type Challenge,
  type SubmitSqlAttemptResult,
} from '@/lib/sql-rpg';
import { recordAttempt } from '@/lib/storage';

export default function ArenaScreen() {
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [sqlText, setSqlText] = useState('SELECT * FROM goblins ORDER BY hp ASC LIMIT 1');
  const [result, setResult] = useState<SubmitSqlAttemptResult | null>(null);
  const [errorText, setErrorText] = useState('');

  const activeChallenge = useMemo(() => challenges[challengeIndex] ?? null, [challenges, challengeIndex]);

  const loadChallenges = useCallback(async () => {
    setIsLoadingChallenges(true);
    setErrorText('');

    try {
      const items = await getChallenges(10);

      if (items.length === 0) {
        setChallenges([]);
        setErrorText('Challenge bulunamadi. Supabase tablosunu kontrol et.');
        return;
      }

      setChallenges(items);
      setChallengeIndex(0);
      setResult(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Challenge yuklenemedi.';
      setErrorText(message);
    } finally {
      setIsLoadingChallenges(false);
    }
  }, []);

  const goToPrevious = useCallback(() => {
    if (challengeIndex <= 0) {
      return;
    }

    setChallengeIndex((value) => value - 1);
    setResult(null);
  }, [challengeIndex]);

  const goToNext = useCallback(() => {
    if (challengeIndex >= challenges.length - 1) {
      return;
    }

    setChallengeIndex((value) => value + 1);
    setResult(null);
  }, [challengeIndex, challenges.length]);

  const handleSubmit = useCallback(async () => {
    if (!activeChallenge) {
      Alert.alert('Uyari', 'Gecerli bir challenge secili degil.');
      return;
    }

    const validation = validateSqlForArena(sqlText);

    if (!validation.ok) {
      Alert.alert('Gecersiz sorgu', validation.reason ?? 'Sorgu gecersiz.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    setErrorText('');

    try {
      const response = await submitSqlAttempt({
        challengeId: activeChallenge.id,
        sqlText,
      });

      setResult(response);

      try {
        // record locally for stats
        void recordAttempt(response);
      } catch (e) {
        console.warn('Failed to record attempt', e);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sorgu gonderilemedi.';
      setErrorText(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [activeChallenge, sqlText]);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">SQL Arena</ThemedText>
      <ThemedText type="subtitle">Sorgu yazarak saldiri yap</ThemedText>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Durum</ThemedText>
        {isLoadingChallenges ? <ActivityIndicator style={styles.loader} /> : null}
        {activeChallenge ? (
          <>
            <ThemedText>Challenge #{activeChallenge.id}</ThemedText>
            <ThemedText>Zorluk: {activeChallenge.difficulty}</ThemedText>
            <ThemedText>{activeChallenge.prompt}</ThemedText>
            {activeChallenge.hint ? <ThemedText>Ipucu: {activeChallenge.hint}</ThemedText> : null}
          </>
        ) : (
          <ThemedText>Challenge yuklenmedi.</ThemedText>
        )}
        {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}
      </ThemedView>

      <ThemedView style={styles.row}>
        <Pressable style={styles.button} onPress={goToPrevious} disabled={challengeIndex <= 0 || isLoadingChallenges}>
          <ThemedText type="defaultSemiBold">Onceki</ThemedText>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={goToNext}
          disabled={challengeIndex >= challenges.length - 1 || isLoadingChallenges}>
          <ThemedText type="defaultSemiBold">Sonraki</ThemedText>
        </Pressable>
        <Pressable style={styles.button} onPress={loadChallenges} disabled={isLoadingChallenges || isSubmitting}>
          <ThemedText type="defaultSemiBold">Yenile</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedText type="defaultSemiBold">Sorgun</ThemedText>
      <TextInput
        value={sqlText}
        onChangeText={setSqlText}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="SELECT ..."
        style={styles.input}
      />

      <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting || isLoadingChallenges}>
        <ThemedText type="defaultSemiBold">{isSubmitting ? 'Gonderiliyor...' : 'Sorguyu gonder'}</ThemedText>
      </Pressable>

      {result ? (
        <ThemedView style={styles.resultCard}>
          <ThemedText type="defaultSemiBold">{result.success ? 'Isabetli saldiri!' : 'Sorgu basarisiz.'}</ThemedText>
          <ThemedText>Geri bildirim: {result.feedback}</ThemedText>
          <ThemedText>Hasar: {result.damage}</ThemedText>
          <ThemedText>Kritik: {result.critical ? 'Evet' : 'Hayir'}</ThemedText>
          <ThemedText>XP: {result.xpAwarded}</ThemedText>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    gap: 12,
  },
  card: {
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9C0CA',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  submitButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resultCard: {
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  loader: {
    alignSelf: 'flex-start',
  },
  errorText: {
    color: '#B91C1C',
  },
});
