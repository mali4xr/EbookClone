export class GeminiService {
  private static readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash';
  
  private static readonly SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_LOW_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_LOW_AND_ABOVE" },
    { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_LOW_AND_ABOVE" },
  ];

  static getApiKey(): string {
    return import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  static getModel(): string {
    return import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
  }

  static logTokenInfo(
    label: string,
    tokenInfo: any,
    usageMetadata?: any
  ) {
    const promptTokens =
      usageMetadata?.promptTokenCount ?? tokenInfo?.promptTokenCount ?? "-";
    const candidateTokens =
      usageMetadata?.candidatesTokenCount ??
      usageMetadata?.candidatesTokensCount ??
      tokenInfo?.candidatesTokenCount ??
      "-";
    const totalTokens =
      usageMetadata?.totalTokenCount ?? tokenInfo?.totalTokens ?? "-";
    console.log(
      `[${label}] Gemini Token Usage:\n` +
        `  prompt tokens: ${promptTokens}\n` +
        `  candidate tokens: ${candidateTokens}\n` +
        `  total: ${totalTokens}`
    );
  }

  static async countTokens(payload: any) {
    try {
      const apiKey = this.getApiKey();
      if (!apiKey) throw new Error("API key is not configured.");
      
      const endpoint = `${this.BASE_URL}:countTokens?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Token count error");
      }
      
      return await response.json();
    } catch (err) {
      console.error("Token count error:", err);
      return null;
    }
  }

  static async generateContent(payload: any) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const payloadWithSafety = {
      ...payload,
      safetySettings: this.SAFETY_SETTINGS,
    };

    const endpoint = `${this.BASE_URL}:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithSafety),
    });

    if (!response.ok) {
      let errorMsg = `Gemini API Error (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = `Gemini API Error: ${errorData.error?.message || JSON.stringify(errorData)}`;
      } catch (jsonError) {
        console.error('Could not parse error response as JSON', jsonError);
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  static async getDrawingIdea(): Promise<string> {
    const prompt = "fun, creative drawing idea for a child.one sentence only. like: 'A friendly robot drinking a milkshake' or 'A snail with a birthday cake for a shell'.";
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    // Token count before sending
    const tokenInfo = await this.countTokens(payload);
    this.logTokenInfo("Get Idea (countTokens)", tokenInfo);

    const result = await this.generateContent(payload);
    this.logTokenInfo("Get Idea (generateContent)", null, result.usageMetadata);

    return result.candidates[0].content.parts[0].text.trim();
  }

  static async recognizeImage(base64ImageData: string): Promise<string> {
    const descriptionPrompt = "short description only, No colors. No intoductions, child sensitive, child safe. E.g. pencil line drawing of smiling sun, mushroom house with a girl";
    const payload = {
      contents: [
        {
          parts: [
            { text: descriptionPrompt },
            {
              inlineData: { mimeType: "image/png", data: base64ImageData },
            },
          ],
        },
      ],
    };

    // Token count for recognized drawing
    const tokenInfo = await this.countTokens(payload);
    this.logTokenInfo("Recognized Drawing (countTokens)", tokenInfo);

    const result = await this.generateContent(payload);
    this.logTokenInfo("Recognized Drawing (generateContent)", null, result.usageMetadata);

    return result.candidates[0].content.parts[0].text.trim();
  }

  static async recognizePhoto(base64ImageData: string): Promise<string> {
    const descriptionPrompt = "Describe this photo in detailed keywords related to the subject. Focus on the main subject and two key feature,like 'a smiling sun', 'a round roof house with a tree', 'a cat chasing a ball'. Do not use introduction,Do not mention any colors.";
    const payload = {
      contents: [
        {
          parts: [
            { text: descriptionPrompt },
            {
              inlineData: { mimeType: "image/png", data: base64ImageData },
            },
          ],
        },
      ],
    };

    // Token count for recognized photo
    const tokenInfo = await this.countTokens(payload);
    this.logTokenInfo("Recognized Photo (countTokens)", tokenInfo);

    const result = await this.generateContent(payload);
    this.logTokenInfo("Recognized Photo (generateContent)", null, result.usageMetadata);

    return result.candidates[0].content.parts[0].text.trim();
  }

  static async generateStory(recognizedImage: string): Promise<string> {
    const prompt = `Write a very short (2-3 sentences), happy, and simple story for a young child (3-5 years old) about this: "${recognizedImage}"`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    // Token count for story
    const tokenInfo = await this.countTokens(payload);
    this.logTokenInfo("Create Story (countTokens)", tokenInfo);

    const result = await this.generateContent(payload);
    this.logTokenInfo("Create Story (generateContent)", null, result.usageMetadata);

    return result.candidates[0].content.parts[0].text.trim();
  }

  static async recognizeText(
    imageData: string, 
    apiKey?: string, 
    model?: string
  ): Promise<{ text: string; confidence: number }> {
    const finalApiKey = apiKey || this.getApiKey();
    const finalModel = model || this.getModel();
    
    if (!finalApiKey) {
      throw new Error('Gemini API key is required');
    }

    try {
      console.log('Starting Gemini recognition...');
      
      // Convert base64 to blob for Gemini API
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${finalApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Extract and transcribe any handwritten or printed text visible in this image. Return only the text content, nothing else."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text detected';

      return {
        text: text.trim(),
        confidence: 0.85 // Simulated confidence for Gemini
      };
    } catch (error) {
      console.error('Gemini recognition error:', error);
      throw new Error(`Failed to recognize text with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getAvailableModels(): { value: string; label: string }[] {
    return [
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast)' },
      { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Best Quality)' },
      { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
      { value: 'gemini-1.0-pro-vision', label: 'Gemini 1.0 Pro Vision' },
      { value: 'gemini-pro', label: 'Gemini Pro (Legacy)' },
      { value: 'gemini-pro-vision', label: 'Gemini Pro Vision (Legacy)' }
    ];
  }
}