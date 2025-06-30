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

  static async generateTTSAudio(text: string, voiceId?: string): Promise<Blob> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    // Use default voice if none provided
    const defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
    const finalVoiceId = voiceId || defaultVoiceId;

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`ElevenLabs TTS error: ${errorData.detail?.message || response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating TTS audio:', error);
      throw error;
    }
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