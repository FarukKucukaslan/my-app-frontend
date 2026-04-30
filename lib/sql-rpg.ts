import { supabase } from '@/lib/supabase';

export type Challenge = {
  id: number;
  prompt: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  hint: string | null;
};

export type SubmitSqlAttemptResult = {
  success: boolean;
  feedback: string;
  damage: number;
  critical: boolean;
  xpAwarded: number;
};

type SubmitSqlAttemptParams = {
  challengeId: number;
  sqlText: string;
};

export function validateSqlForArena(sqlText: string): { ok: boolean; reason?: string } {
  const trimmed = sqlText.trim();

  if (!trimmed) {
    return { ok: false, reason: 'Sorgu bos olamaz.' };
  }

  if (trimmed.includes(';')) {
    return { ok: false, reason: 'Guvenlik icin noktali virgul kullanma.' };
  }

  if (!/^select\b/i.test(trimmed)) {
    return { ok: false, reason: 'Sadece SELECT sorgularina izin verilir.' };
  }

  if (/\b(insert|update|delete|drop|alter|create|grant|revoke|truncate)\b/i.test(trimmed)) {
    return { ok: false, reason: 'Yazma veya DDL komutlari yasak.' };
  }

  return { ok: true };
}

export async function getChallenges(limit = 10): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, prompt, difficulty, hint')
    .order('id', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: Number(item.id),
    prompt: item.prompt,
    difficulty: item.difficulty,
    hint: item.hint,
  }));
}

export async function submitSqlAttempt({
  challengeId,
  sqlText,
}: SubmitSqlAttemptParams): Promise<SubmitSqlAttemptResult> {
  const { data, error } = await supabase.functions.invoke<SubmitSqlAttemptResult>('submit-sql', {
    body: {
      challengeId,
      sql: sqlText,
    },
  });

  if (error) {
    const maybeContext = (
      typeof error === 'object' && error !== null && 'context' in error ? error.context : null
    ) as { json?: () => Promise<unknown>; text?: () => Promise<string>; status?: number } | null;

    if (maybeContext?.json) {
      try {
        const context = await maybeContext.json();
        if (
          context &&
          typeof context === 'object' &&
          'error' in context &&
          typeof context.error === 'string'
        ) {
          throw new Error(context.error);
        }
      } catch {
        // try plain text fallback below
      }
    }

    if (maybeContext?.text) {
      try {
        const text = await maybeContext.text();
        if (text.trim()) {
          throw new Error(text);
        }
      } catch {
        // use default message below
      }
    }

    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Fonksiyon bos cevap dondurdu.');
  }

  return data;
}
