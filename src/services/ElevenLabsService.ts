export class ElevenLabsService {
  static getAgentId(): string {
    return import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';
  }

  static getApiKey(): string {
    return import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  }

  static useSignedUrl(): boolean {
    return import.meta.env.VITE_ELEVENLABS_USE_SIGNED_URL === 'true';
  }

  static getSignedUrlEndpoint(): string {
    return import.meta.env.VITE_ELEVENLABS_SIGNED_URL_ENDPOINT || '/api/signed-url';
  }

  static isConfigured(): boolean {
    if (this.useSignedUrl()) {
      return !!this.getSignedUrlEndpoint();
    }
    return !!this.getAgentId();
  }

  static getConnectionOptions(context?: string, onMessage?: (message: any) => void) {
    const options: any = {};

    if (this.useSignedUrl()) {
      options.signedUrlEndpoint = this.getSignedUrlEndpoint();
    } else {
      options.agentId = this.getAgentId();
      const apiKey = this.getApiKey();
      if (apiKey) {
        options.apiKey = apiKey;
      }
    }

    if (context) {
      options.context = context;
    }

    if (onMessage) {
      options.onMessage = onMessage;
    }

    return options;
  }
}