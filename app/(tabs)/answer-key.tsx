import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ANSWER_BY_SIGNATURE } from '@/constants/arena-answer-key';
import { getChallenges, type Challenge } from '@/lib/sql-rpg';

export default function AnswerKeyScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [errorText, setErrorText] = useState('');

  const loadChallenges = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');

    try {
      const items = await getChallenges(50);
      setChallenges(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cevap anahtari yuklenemedi.';
      setErrorText(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="title">Cevap Anahtari</ThemedText>
      <ThemedText type="subtitle">Sorguyu secip kopyalayabilirsin</ThemedText>

      {isLoading ? <ActivityIndicator style={styles.loader} /> : null}
      {errorText ? <ThemedText style={styles.errorText}>{errorText}</ThemedText> : null}

      {challenges.map((challenge) => {
        const answer =
          (challenge.expectedSignature ? ANSWER_BY_SIGNATURE[challenge.expectedSignature] : undefined) ??
          'Bu challenge icin sabit cevap tanimli degil.';

        return (
          <ThemedView key={challenge.id} style={styles.card}>
            <ThemedText type="defaultSemiBold">
              #{challenge.id} - {challenge.difficulty}
            </ThemedText>
            <ThemedText>{challenge.prompt}</ThemedText>
            <ThemedText selectable style={styles.answerText}>
              {answer}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 12,
  },
  loader: {
    alignSelf: 'flex-start',
  },
  card: {
    borderWidth: 1,
    borderColor: '#B9C0CA',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  answerText: {
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 10,
    padding: 10,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#B91C1C',
  },
});
