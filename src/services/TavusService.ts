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
      system_prompt: `You are a helpful library assistant that MUST use the provided tools to help users find books. 

CRITICAL INSTRUCTIONS:
- When users mention ANY subject (story, science, math, animals, etc.), IMMEDIATELY call filter_books_by_subject
- When users mention difficulty (easy, hard, beginner, advanced), IMMEDIATELY call filter_books_by_difficulty  
- When users mention age (for kids, 8-year-olds, etc.), IMMEDIATELY call filter_books_by_age
- When users ask for recommendations or mention interests, IMMEDIATELY call recommend_books
- When users mention specific titles or authors, IMMEDIATELY call search_books

ALWAYS use tools - don't just talk about books, actually filter and find them using the functions provided.

Examples:
- User says "storybooks" → Call filter_books_by_subject with subject="STORY"
- User says "science books" → Call filter_books_by_subject with subject="SCIENCE"  
- User says "books about animals" → Call search_books with searchTerm="animals"
- User says "easy books" → Call filter_books_by_difficulty with difficulty="beginner"
- User says "for 8 year olds" → Call filter_books_by_age with minAge=7, maxAge=9`,
      
      context: "You are helping users navigate a digital library. You MUST use the provided tools to actually filter and find books. The library contains books for STORY, MATHS, SCIENCE, SPORTS, HISTORY, GEOGRAPHY, ART, and MUSIC subjects.",
      
      layers: {
        llm: {
          model: "tavus-llama",
          tools: [
            {
              type: "function",
              function: {
                name: "filter_books_by_subject",
                description: "REQUIRED: Filter books by subject category when user mentions any subject",
                parameters: {
                  type: "object",
                  properties: {
                    subject: {
                      type: "string",
                      description: "The subject to filter by",
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
                description: "REQUIRED: Filter books by difficulty level when user mentions difficulty",
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
                description: "REQUIRED: Search books by title, author, or description when user mentions specific topics",
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
                description: "REQUIRED: Filter books by age range when user mentions age",
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
                description: "REQUIRED: Recommend books based on user preferences",
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
      conversational_context: `You are a library assistant that MUST use the provided tools to help users find books. 

CRITICAL: When users mention subjects, difficulties, ages, or interests, you MUST call the appropriate function:
- "storybooks" or "stories" → filter_books_by_subject(subject="STORY")
- "science books" → filter_books_by_subject(subject="SCIENCE")
- "animals" or "rabbits" → search_books(searchTerm="animals" or "rabbits")
- "easy books" → filter_books_by_difficulty(difficulty="beginner")
- "for kids" → filter_books_by_age(minAge=3, maxAge=12)

Always use the tools - don't just talk about books, actually find them!`,
      
      custom_greeting: "Hello! I'm your library assistant. I can help you find books by filtering them for you. Try saying 'Show me science books' or 'Find books about animals' and I'll search our library for you!",
      
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