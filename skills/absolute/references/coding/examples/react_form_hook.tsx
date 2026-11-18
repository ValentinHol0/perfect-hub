import { useRef, useState, useTransition, useOptimistic } from 'react';

interface FormState {
  username: string;
  email: string;
  theme: 'light' | 'dark';
}

type Field = keyof FormState;

interface UseSyncFormResult {
  state: FormState;
  optimisticState: FormState;
  updateField: <K extends Field>(field: K, value: FormState[K]) => void;
  isPending: boolean;
  error: string | null;
}

/**
 * Reference standard: React 19 optimistic field sync.
 * - The optimistic value shows instantly; the committed value only changes when the server confirms.
 * - State updates that happen after `await` are wrapped in startTransition again — React 19 does not
 *   keep them inside the original transition, and without this the optimistic value can flash back.
 * - Only the latest request per field may commit, so slow out-of-order responses cannot overwrite newer input.
 * - Network calls time out with AbortSignal.timeout; failure reverts the optimistic value automatically.
 */
export function useSyncForm(initialState: FormState, syncEndpoint: string): UseSyncFormResult {
  const [state, setState] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const latest = useRef<Partial<Record<Field, number>>>({});

  const [optimisticState, applyOptimistic] = useOptimistic<FormState, Partial<FormState>>(
    state,
    (current, patch) => ({ ...current, ...patch })
  );

  const updateField = <K extends Field>(field: K, value: FormState[K]): void => {
    const requestId = (latest.current[field] ?? 0) + 1;
    latest.current[field] = requestId;
    setError(null);

    startTransition(async () => {
      applyOptimistic({ [field]: value } as Partial<FormState>);
      try {
        const response = await fetch(syncEndpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
          signal: AbortSignal.timeout(8000),
        });
        const data: Partial<FormState> & { message?: string } = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message ?? `Saving ${String(field)} failed (HTTP ${response.status})`);
        if (latest.current[field] !== requestId) return; // a newer edit of this field is in flight
        startTransition(() => {
          setState((prev) => ({ ...prev, [field]: (data[field] ?? value) as FormState[K] }));
        });
      } catch (err) {
        if (latest.current[field] !== requestId) return;
        const message = err instanceof DOMException && err.name === 'TimeoutError'
          ? `Saving ${String(field)} timed out. Check your connection and try again.`
          : err instanceof Error ? err.message : `Saving ${String(field)} failed`;
        startTransition(() => setError(message)); // optimistic value reverts when the transition ends
      }
    });
  };

  return { state, optimisticState, updateField, isPending, error };
}
