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

export interface CreatePersonaRequest {
  persona_name: string;
  system_prompt: string;
  context: string;
  layers: {
    llm: {
      model: string;
      tools: Array<{
        type: string;
        function: {
          name: string;
          description: string;
          parameters: {
            type: string;
            properties: Record<string, any>;
            required: string[];
          };
        };
      }>;
    };
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

  static getLibraryPersonaId(): string {
    return import.meta.env.VITE_TAVUS_LIBRARY_PERSONA_ID || '';
  }

  static isConfigured(): boolean {
    return !!(this.getApiKey() && this.getReplicaId());
  }

  static async createLibraryPersona(): Promise<any> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Tavus API key not configured');
    }

    const personaData: CreatePersonaRequest = {
      persona_name: "Library Assistant",
      system_prompt: "You are a helpful library assistant that helps users find books. You can filter books by subject, difficulty level, age range, and search terms. When a user asks for book recommendations or wants to filter books, use the appropriate tools to help them. Be friendly, patient, and especially helpful to users with accessibility needs.",
      context: "You are helping users navigate a digital library with various books for different subjects, age groups, and difficulty levels. The library contains books for STORY, MATHS, SCIENCE, SPORTS, HISTORY, GEOGRAPHY, ART, and MUSIC subjects.",
      layers: {
        llm: {
          model: "tavus-llama",
          tools: [
            {
              type: "function",
              function: {
                name: "filter_books_by_subject",
                description: "Filter books by subject category",
                parameters: {
                  type: "object",
                  properties: {
                    subject: {
                      type: "string",
                      description: "The subject to filter by (STORY, MATHS, SCIENCE, SPORTS, HISTORY, GEOGRAPHY, ART, MUSIC, or ALL)",
                      enum: ["STORY", "MATHS", "SCIENCE", "SPORTS", "HISTORY", "GEOGRAPHY", "ART", "MUSIC", "ALL"]
                    }
                  },
                  required: ["subject"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "filter_books_by_difficulty",
                description: "Filter books by difficulty level",
                parameters: {
                  type: "object",
                  properties: {
                    difficulty: {
                      type: "string",
                      description: "The difficulty level to filter by",
                      enum: ["beginner", "intermediate", "advanced", "ALL"]
                    }
                  },
                  required: ["difficulty"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "search_books",
                description: "Search books by title, author, or description",
                parameters: {
                  type: "object",
                  properties: {
                    searchTerm: {
                      type: "string",
                      description: "The search term to look for in book titles, authors, or descriptions"
                    }
                  },
                  required: ["searchTerm"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "filter_books_by_age",
                description: "Filter books by age range",
                parameters: {
                  type: "object",
                  properties: {
                    minAge: {
                      type: "number",
                      description: "Minimum age for the books"
                    },
                    maxAge: {
                      type: "number",
                      description: "Maximum age for the books"
                    }
                  },
                  required: ["minAge", "maxAge"]
                }
              }
            },
            {
              type: "function",
              function: {
                name: "recommend_books",
                description: "Recommend books based on user preferences",
                parameters: {
                  type: "object",
                  properties: {
                    preferences: {
                      type: "string",
                      description: "User's preferences or interests"
                    }
                  },
                  required: ["preferences"]
                }
              }
            }
          ]
        }
      }
    };

    try {
      const response = await fetch(`${this.BASE_URL}/personas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(personaData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus API error: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating library persona:', error);
      throw error;
    }
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

  static async createLibraryConversation(): Promise<TavusConversation> {
    const conversationRequest: CreateConversationRequest = {
      replica_id: this.getReplicaId(),
      persona_id: this.getLibraryPersonaId() || this.getPersonaId(),
      conversation_name: "Library Assistant Chat",
      conversational_context: "The user is browsing a digital library and may need help finding books that match their interests, age, or difficulty level. Be especially helpful to users with accessibility needs.",
      custom_greeting: "Hello! I'm your library assistant. I can help you find books by subject, difficulty level, age range, or any specific interests you have. What kind of books are you looking for today?",
      properties: {
        max_call_duration: 1800, // 30 minutes
        participant_left_timeout: 300,
        participant_absent_timeout: 60,
        enable_recording: false,
        enable_closed_captions: true,
        apply_greenscreen: false,
        language: 'english'
      }
    };

    return this.createConversation(conversationRequest);
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