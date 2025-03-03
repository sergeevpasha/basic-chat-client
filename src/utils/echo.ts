import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

let echoInstance: Echo<'pusher'> | null = null;

const getEnvVar = (key: string): string | null => {
  const env = (import.meta as any).env;
  if (env && typeof env === 'object') {
    return env[key];
  }

  return null;
};

function getServerConfig() {
  const envApiUrl = getEnvVar('VITE_API_URL');
  const baseUrl = envApiUrl || 'http://localhost:80';

  const url = new URL(baseUrl);
  const wsHost = url.hostname;
  const wsPort = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);

  return { baseUrl, wsHost, wsPort };
}

/**
 * Initialize Laravel Echo instance
 */
export function initEcho(): Echo<'pusher'> {
  if (echoInstance) {
    return echoInstance;
  }

  const { wsHost, wsPort } = getServerConfig();

  echoInstance = new Echo<'pusher'>({
    broadcaster: 'pusher',
    key: 'basic-chat-key',
    cluster: 'mt1',
    wsHost,
    wsPort,
    forceTLS: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
  });

  return echoInstance;
}

/**
 * Get the Echo instance, initializing if needed
 */
export function getEcho(): Echo<'pusher'> {
  if (!echoInstance) {
    return initEcho();
  }
  return echoInstance;
}

/**
 * Close Echo connection
 */
export function closeEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}

/**
 * Get API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  const { baseUrl } = getServerConfig();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}
