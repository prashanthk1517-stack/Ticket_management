import { useCallback, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
}

const initialState = <T>(): AsyncState<T> => ({
  data: null,
  error: null,
  isLoading: false,
  isSuccess: false,
});

export function useAsync<T, Args extends unknown[]>(
  executor: (...args: Args) => Promise<T>,
) {
  const [state, setState] = useState<AsyncState<T>>(initialState);

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, error: null, isLoading: true, isSuccess: false });

      try {
        const result = await executor(...args);
        setState({ data: result, error: null, isLoading: false, isSuccess: true });
        return result;
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error('An unknown error occurred.');
        setState({ data: null, error: normalizedError, isLoading: false, isSuccess: false });
        return null;
      }
    },
    [executor],
  );

  const reset = useCallback(() => {
    setState(initialState<T>());
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export const useApi = useAsync;
