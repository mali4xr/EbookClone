# Interactive Kids Book with Conversational AI

A beautiful, interactive children's reading application with text-to-speech, quizzes, and AI-powered conversational assistance.

## Features

### 📚 Interactive Reading Experience
- **Text-to-Speech**: Natural voice narration with customizable voice, speed, pitch, and volume
- **Word Highlighting**: Visual tracking of current word being read
- **Beautiful Animations**: Smooth page transitions and engaging visual effects using Animate.css
- **Interactive Elements**: Clickable hotspots on each page with sound effects

### 🤖 Conversational AI Integration
- **ElevenLabs AI Assistant**: Real-time voice conversations during reading and quizzes
- **Context-Aware Help**: AI understands current page content and provides relevant assistance
- **Reading Support**: AI helps explain difficult words, discusses story events, and encourages comprehension
- **Quiz Assistance**: AI provides hints and guidance during quiz questions

### 🎯 Educational Quizzes
- **Multiple Choice Questions**: Comprehension questions based on story content
- **Spelling Challenges**: Interactive spelling practice with voice prompts
- **Camera OCR**: Take photos of handwritten answers for automatic checking
- **Progress Tracking**: Page navigation locked until quiz completion (2/2 score required)

### 🎨 Modern Design
- **Responsive Layout**: Works beautifully on desktop, tablet, and mobile
- **Apple-Level Aesthetics**: Clean, sophisticated design with attention to detail
- **Smooth Animations**: Engaging transitions and micro-interactions
- **Accessibility**: High contrast ratios and keyboard navigation support

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Animate.css
- **AI Integration**: ElevenLabs Conversational AI SDK
- **OCR**: Tesseract.js for handwriting recognition
- **Camera**: React Webcam for photo capture
- **Animations**: Canvas Confetti for celebrations

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env` file and update it with your API keys:

```bash
# Copy the example environment file
cp .env .env.local
```

Edit `.env.local` with your actual API keys:

```env
# ElevenLabs Conversational AI Configuration
VITE_ELEVENLABS_AGENT_ID=your-actual-agent-id-here
VITE_ELEVENLABS_API_KEY=your-actual-api-key-here
VITE_ELEVENLABS_USE_SIGNED_URL=false
VITE_ELEVENLABS_SIGNED_URL_ENDPOINT=/api/signed-url

# Google Gemini API Configuration (Optional)
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
VITE_GEMINI_MODEL=gemini-1.5-flash
```

#### ElevenLabs Setup:
1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Go to [Conversational AI](https://elevenlabs.io/app/conversational-ai)
3. Create a new AI agent or select an existing one
4. Copy the Agent ID from your dashboard
5. Optionally, get your API key from the profile settings

#### Google Gemini Setup (Optional):
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. This is used as a fallback for handwriting recognition when Tesseract.js fails

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Usage Guide

### Reading Mode
1. Click the **Play** button to start text-to-speech narration
2. Watch words highlight as they're being read
3. Click the **AI Assistant** button for conversational help
4. Interact with clickable elements on each page
5. Complete the page to unlock the quiz

### Quiz Mode
1. Answer the multiple choice question about the story
2. Complete the spelling challenge using:
   - **Text Input**: Type your answer directly
   - **Camera Mode**: Write on paper and take a photo
3. Get real-time AI assistance and hints
4. Score 2/2 to unlock the next page

### Settings
- Adjust voice characteristics (speed, pitch, volume)
- Select different narrator voices
- Edit page content and quiz questions
- Configure AI assistant settings

## AI Integration Details

The app uses environment variables for secure API key management:

#### Security Features
- All API keys are stored in environment variables
- No sensitive data exposed in frontend code
- Secure configuration through .env files
- Development and production environment separation

#### ElevenLabs Integration

### Reading Assistant
- Explains difficult vocabulary
- Discusses story themes and characters
- Encourages reading comprehension
- Provides context-aware responses

### Quiz Helper
- Offers hints for multiple choice questions
- Assists with spelling pronunciation
- Provides educational feedback
- Celebrates achievements

### Configuration Options
- **Agent ID**: Configured via VITE_ELEVENLABS_AGENT_ID
- **API Key**: Optional, configured via VITE_ELEVENLABS_API_KEY
- **Signed URL**: For private agents, configure VITE_ELEVENLABS_USE_SIGNED_URL=true
- **Context Awareness**: AI receives current page and quiz information
- **Voice Integration**: Seamless integration with text-to-speech

#### Gemini Integration
- **Fallback OCR**: Used when Tesseract.js fails to recognize handwriting
- **Model Selection**: Configurable via VITE_GEMINI_MODEL
- **Optional Service**: App works without Gemini, using only Tesseract.js

## Customization

### Adding New Story Content
Edit `src/data/storyData.ts` to add new pages:

```typescript
{
  text: "Your story text here...",
  image: "https://your-image-url.jpg",
  background: "https://your-background-url.jpg",
  quiz: {
    multipleChoice: {
      question: "Your question?",
      options: [
        { text: "Correct answer", isCorrect: true },
        { text: "Wrong answer", isCorrect: false }
      ]
    },
    spelling: {
      word: "challenge",
      hint: "This word means something difficult"
    }
  }
}
```

### Customizing AI Behavior
The AI assistant behavior is controlled through context strings in components:

- `getReadingAIContext()` in BookContent.tsx
- `getAIContext()` in QuizModal.tsx
- `getSettingsAIContext()` in SettingsModal.tsx

### Environment Configuration
All sensitive settings are now managed through environment variables:

- **Development**: Use `.env.local` for local development
- **Production**: Set environment variables in your hosting platform
- **Security**: Never commit actual API keys to version control

### Styling Customization
- Edit `tailwind.config.js` for color schemes and design tokens
- Modify `src/index.css` for custom animations
- Update component classes for layout changes

## Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Features Required**: 
  - Web Speech API (for text-to-speech)
  - MediaDevices API (for camera access)
  - WebSocket support (for AI conversations)

## Performance Considerations

- Images are loaded from external URLs (Pexels)
- Text-to-speech uses browser's built-in voices
- AI conversations require internet connection
- OCR processing happens locally in the browser

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.