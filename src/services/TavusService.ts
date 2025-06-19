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
      persona_name: "Restricted Library Assistant",
      system_prompt: `You are a helpful library assistant who can ONLY recommend books that actually exist in this specific digital library. 

CRITICAL RESTRICTIONS:
1. NEVER mention books that are not in the current library catalog
2. NEVER suggest "The Tale of Peter Rabbit", "The Runaway Bunny", or any other books unless they are actually available
3. ONLY refer to books that exist in the provided book list
4. If no books match a request, say "We don't have that type of book right now, but here's what we do have..."
5. NEVER make up book titles, authors, or descriptions

RESPONSE RULES:
1. NEVER say function names like "filter_books_by_subject" or show JSON
2. NEVER mention "calling functions" or "executing tools"
3. Always respond naturally as if you're personally helping them
4. When you use a tool, immediately give a natural response about the ACTUAL results found

WHEN TO USE TOOLS:
- User mentions subjects (story, science, math, etc.) → Use filter_books_by_subject
- User mentions difficulty (easy, hard, beginner) → Use filter_books_by_difficulty  
- User mentions age → Use filter_books_by_age
- User asks for recommendations → Use recommend_books
- User mentions specific topics → Use search_books

NATURAL RESPONSE EXAMPLES:
❌ BAD: "I'll call filter_books_by_subject with subject SCIENCE"
✅ GOOD: "Let me check what science books we have available..." [then mention only actual books found]

❌ BAD: "We have 'The Tale of Peter Rabbit'" (if it's not actually in the library)
✅ GOOD: "I found [X number] of books about [topic]. Here are the ones we actually have..."

❌ BAD: "filter_books_by_subject({"subject":"STORY"})"
✅ GOOD: "Great! I found some wonderful storybooks in our collection!"

CONVERSATION FLOW:
1. Listen to what the user wants
2. Use the appropriate tool silently to check what's ACTUALLY available
3. Respond naturally about ONLY the books that were found
4. If nothing matches, suggest alternatives from what IS available

IMPORTANT: You can only recommend books that actually exist in this library's database. Never invent or suggest books that aren't in the current catalog.`,
      
      context: "You are a helpful library assistant in a digital library. You have access to a specific catalog of books and can ONLY recommend books that actually exist in this library. When users ask for books, use your tools to filter and find them from the actual available collection, but always respond naturally without mentioning the technical aspects. Never suggest books that don't exist in the current library database.",
      
      layers: {
        llm: {
          model: "tavus-llama",
          tools: [
            {
              type: "function",
              function: {
                name: "filter_books_by_subject",
                description: "Filter books by subject category from the ACTUAL library catalog. Only returns books that exist in the database. Use this when users mention any subject like science, math, stories, etc. After calling this, respond naturally about the ACTUAL books found.",
                parameters: {
                  type: "object",
                  properties: {
                    subject: {
                      type: "string",
                      description: "The subject to filter by from available books",
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
                description: "Filter books by difficulty level from the ACTUAL library catalog. Only returns books that exist. Use when users mention easy, hard, beginner, advanced, etc. Respond naturally about the ACTUAL difficulty levels found.",
                parameters: {
                  type: "object",
                  properties: {
                    difficulty: {
                      type: "string",
                      description: "The difficulty level to filter by from available books",
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
                description: "Search books by title, author, or description from the ACTUAL library catalog. Only returns books that exist. Use when users mention specific topics, animals, characters, etc. Respond naturally about what was ACTUALLY found.",
                parameters: {
                  type: "object",
                  properties: {
                    searchTerm: {
                      type: "string",
                      description: "The search term to look for in ACTUAL book titles, authors, or descriptions"
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
                description: "Filter books by age range from the ACTUAL library catalog. Only returns books that exist. Use when users mention ages like 'for kids', '8-year-olds', etc. Respond naturally about ACTUAL age-appropriate books found.",
                parameters: {
                  type: "object",
                  properties: {
                    minAge: {
                      type: "number",
                      description: "Minimum age for the books from available catalog"
                    },
                    maxAge: {
                      type: "number",
                      description: "Maximum age for the books from available catalog"
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
                description: "Recommend books based on user preferences from the ACTUAL library catalog. Only returns books that exist. Use when users ask for recommendations or mention interests. Respond naturally about the ACTUAL recommendations found.",
                parameters: {
                  type: "object",
                  properties: {
                    preferences: {
                      type: "string",
                      description: "User's preferences or interests to match against ACTUAL available books"
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

  static createLibraryConversationContext(availableBooks: any[]): string {
    const bookList = availableBooks.map(book => 
      `- "${book.title}" by ${book.author} (${book.subject}, ${book.difficulty_level}, ages ${book.target_age_min}-${book.target_age_max})`
    ).join('\n');

    const subjectCounts = availableBooks.reduce((acc, book) => {
      acc[book.subject] = (acc[book.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const subjectSummary = Object.entries(subjectCounts)
      .map(([subject, count]) => `${subject}: ${count} books`)
      .join(', ');

    return `You are a warm, friendly library assistant. You can ONLY recommend books from this specific library catalog.

AVAILABLE BOOKS IN OUR LIBRARY:
${bookList}

LIBRARY SUMMARY:
- Total books: ${availableBooks.length}
- Subjects available: ${subjectSummary}

CRITICAL RULES:
1. ONLY mention books from the above list
2. NEVER suggest books not in this catalog
3. If a user asks for something we don't have, say "We don't have that specific book, but here's what we do have..." and suggest from the available list
4. Use tools to filter the ACTUAL available books
5. Always respond naturally without mentioning function names

Example conversations:
User: "I want animal books"
You: "Let me check what animal books we have..." [use search_books, then mention only actual results]

User: "Do you have Peter Rabbit?"
You: "I don't see that specific book in our collection, but I found some other wonderful animal stories..." [mention actual books]

Always be helpful and suggest alternatives from what we actually have!`;
  }

  static async createLibraryConversation(availableBooks: any[] = []): Promise<TavusConversation> {
    const conversationRequest: CreateConversationRequest = {
      replica_id: this.getReplicaId(),
      persona_id: this.getLibraryPersonaId() || this.getPersonaId(),
      conversation_name: "Restricted Library Assistant Chat",
      conversational_context: this.createLibraryConversationContext(availableBooks),
      
      custom_greeting: `Hello! I'm your friendly library assistant. I can help you find books from our collection of ${availableBooks.length} books. What kind of books are you interested in today?`,
      
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