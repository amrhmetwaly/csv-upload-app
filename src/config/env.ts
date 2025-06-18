// Auto-generated environment configuration
// Generated at: 2025-06-17T23:00:07.123Z

export interface EnvConfig {
  apiEndpoint: string;
  environment: string;
  region: string;
  useLocalApi: boolean;
}

const config: EnvConfig = {
  apiEndpoint: 'https://d25gvf0ekg.execute-api.us-west-2.amazonaws.com/Prod/energy/upload',
  environment: 'dev',
  region: 'us-west-2',
  useLocalApi: process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_API === 'true'
};

export default config;

// Helper function to get the correct API endpoint
export function getApiEndpoint(): string {
  if (config.useLocalApi) {
    return '/api/upload';
  }
  return config.apiEndpoint;
}
