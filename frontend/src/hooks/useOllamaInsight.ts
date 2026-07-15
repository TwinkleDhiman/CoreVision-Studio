import { useState, useCallback, useRef } from 'react';

export interface OllamaInsightState {
  text: string;
  loading: boolean;
  streaming: boolean;
  error: string | null;
}

export type GenerateFn = (
  streamFn: (
    onToken: (t: string) => void,
    onDone: () => void,
    onError: (e: string) => void
  ) => void
) => void;

export function useOllamaInsight() {
  const [state, setState] = useState<OllamaInsightState>({
    text: '',
    loading: false,
    streaming: false,
    error: null,
  });

  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState({ text: '', loading: false, streaming: false, error: null });
  }, []);

  /**
   * `generate` accepts a partially-applied stream function so the hook stays generic.
   * The caller passes in e.g. (onToken, onDone, onError) => streamCopilotInsight(payload, onToken, onDone, onError)
   */
  const generate: GenerateFn = useCallback((streamFn) => {
    abortRef.current = false;
    setState({ text: '', loading: true, streaming: false, error: null });

    streamFn(
      (token: string) => {
        if (abortRef.current) return;
        setState(prev => ({ ...prev, loading: false, streaming: true, text: prev.text + token }));
      },
      () => {
        if (abortRef.current) return;
        setState(prev => ({ ...prev, streaming: false, loading: false }));
      },
      (err: string) => {
        if (abortRef.current) return;
        setState({ text: '', loading: false, streaming: false, error: err });
      }
    );
  }, []);

  return { ...state, generate, reset };
}
