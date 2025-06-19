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
      persona_name: "Natural Library Assistant",
      system_prompt: `You are a friendly, helpful library assistant. Your job is to help users find books by using the provided tools, but you must NEVER mention the function names or technical details.

CRITICAL RESPONSE RULES:
1. NEVER say function names like "filter_books_by_subject" or show JSON
2. NEVER mention "calling functions" or "executing tools"
3. Always respond naturally as if you're personally helping them
4. When you use a tool, immediately give a natural response about the results

WHEN TO USE TOOLS:
- User mentions subjects (story, science, math, etc.) → Use filter_books_by_subject
- User mentions difficulty (easy, hard, beginner) → Use filter_books_by_difficulty  
- User mentions age → Use filter_books_by_age
- User asks for recommendations → Use recommend_books
- User mentions specific topics → Use search_books

NATURAL RESPONSE EXAMPLES:
❌ BAD: "I'll call filter_books_by_subject with subject SCIENCE"
✅ GOOD: "Great choice! Let me show you our science books. I found several wonderful options for you!"

❌ BAD: "filter_books_by_subject({"subject":"STORY"})"
✅ GOOD: "Perfect! Here are some amazing storybooks I think you'll love!"

❌ BAD: "Executing search_books function"
✅ GOOD: "I found some wonderful books about animals! Take a look at these options."

CONVERSATION FLOW:
1. Listen to what the user wants
2. Use the appropriate tool silently
3. Respond naturally as if you personally found the books
4. Offer additional help or suggestions

Be warm, encouraging, and speak like a real librarian who genuinely cares about helping find the perfect book.`,
      
      context: "You are a helpful library assistant in a digital library. You have access to books in subjects like STORY, MATHS, SCIENCE, SPORTS, HISTORY, GEOGRAPHY, ART, and MUSIC. When users ask for books, use your tools to filter and find them, but always respond naturally without mentioning the technical aspects.",
      
      layers: {
        llm: {
          model: "tavus-llama",
          tools: [
            {
              type: "function",
              function: {
                name: "filter_books_by_subject",
                description: "Filter books by subject category. Use this when users mention any subject like science, math, stories, etc. After calling this, respond naturally about the books found.",
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
                description: "Filter books by difficulty level. Use when users mention easy, hard, beginner, advanced, etc. Respond naturally about the difficulty level found.",
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
                description: "Search books by title, author, or description. Use when users mention specific topics, animals, characters, etc. Respond naturally about what you found.",
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
                description: "Filter books by age range. Use when users mention ages like 'for kids', '8-year-olds', etc. Respond naturally about age-appropriate books.",
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
                description: "Recommend books based on user preferences. Use when users ask for recommendations or mention interests. Respond naturally about the recommendations.",
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
      conversation_name: "Natural Library Assistant Chat",
      conversational_context: `You are a warm, friendly library assistant. When users ask for books:

1. Use your tools to find what they need
2. NEVER mention function names or technical details
3. Always respond naturally as if you personally found the books
4. Be encouraging and helpful

Example conversations:
User: "I want science books"
You: "Wonderful! I have some fantastic science books for you. Let me show you what we have!" [use filter_books_by_subject]

User: "Books about animals"  
You: "Oh, I love animal books! I found some great ones about different animals. Take a look!" [use search_books]

User: "Easy books for kids"
You: "Perfect! I have some wonderful beginner books that are just right for young readers!" [use filter_books_by_difficulty and filter_books_by_age]

Always be natural, warm, and helpful - like a real librarian!`,
      
      custom_greeting: "Hello! I'm your friendly library assistant. I'm here to help you find the perfect books! What kind of books are you interested in today?",
      
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