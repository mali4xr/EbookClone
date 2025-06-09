export class GeminiService {
  static async recognizeText(
    imageData: string, 
    apiKey: string, 
    model: string = 'gemini-1.5-flash'
  ): Promise<{ text: string; confidence: number }> {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    try {
      console.log('Starting Gemini recognition...');
      
      // Convert base64 to blob for Gemini API
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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