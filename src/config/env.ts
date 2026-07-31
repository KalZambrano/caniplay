/**
 * Centralized, typed access to environment variables.
 * Nothing else in the app should read `import.meta.env` directly.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
} as const
