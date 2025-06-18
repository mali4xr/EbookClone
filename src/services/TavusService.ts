export interface TavusConversation {
  conversation_id: string;
  conversation_name: string;
  status: 'active' | 'ended';
  conversation_url: string;
  replica_id: string;
  persona_id?: string;
  created_at: string;
}

export interface CreateConversationRequest {
  replica_id: string;
  persona_id?: string;
  callback_url?: string;
  conversation_name: string;
  conversational_context?: string;
  custom_greeting?: string;
  properties?: {
    max_call_duration?: number;
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
    enable_recording?: boolean;
    enable_closed_captions?: boolean;
    apply_greenscreen?: boolean;
    language?: string;
    recording_s3_bucket_name?: string;
    recording_s3_bucket_region?: string;
    aws_assume_role_arn?: string;
  };
}

export class TavusService {
  private static readonly BASE_URL = 'https://tavusapi.com/v2';
  
  static getApiKey(): string {
    return import.meta.env.VITE_TAVUS_API_KEY || '';
  }

  static getReplicaId(): string {
    return import.meta.env.VITE_TAVUS_REPLICA_ID || '';
  }

  static getPersonaId(): string {
    return import.meta.env.VITE_TAVUS_PERSONA_ID || '';
  }

  static isConfigured(): boolean {
    return !!(this.getApiKey() && this.getReplicaId());
  }

  static async createConversation(request: CreateConversationRequest): Promise<TavusConversation> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating Tavus conversation:', error);
      throw error;
    }
  }

  static async getConversation(conversationId: string): Promise<TavusConversation> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/conversations/${conversationId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Tavus conversation:', error);
      throw error;
    }
  }

  static async endConversation(conversationId: string): Promise<void> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus API error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error ending Tavus conversation:', error);
      throw error;
    }
  }

  static async deleteConversation(conversationId: string): Promise<void> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.BASE_URL}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus API error: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting Tavus conversation:', error);
      throw error;
    }
  }

  static createStoryContext(pageContent: any, currentPage: number, totalPages: number): string {
    return `You are a friendly storyteller helping a child read an interactive story. 
    
Current Story Context:
- Page ${currentPage + 1} of ${totalPages}
- Title: "${pageContent.title}"
- Story Text: "${pageContent.text}"

Your Role:
- speak very slowly
- Help explain the story in simple, child-friendly language
- Answer questions about characters, events, and vocabulary
- Encourage reading and comprehension
- Make the story engaging and fun
- Use a warm, patient, and encouraging tone

Be interactive and ask the child questions about what they think will happen next or what they learned from this part of the story.`;
  }

  static createCustomGreeting(pageContent: any, currentPage: number): string {
    const character = pageContent.title?.includes('Luna') ? 'Luna' : 
                    pageContent.title?.includes('Flower') ? 'Flower' : 'Garden';
    
    return `Hello, I'm your teacher and I'm here to tell you a story, We're on page ${currentPage + 1} reading about ${character}. Are you ready?`;
  }
}


