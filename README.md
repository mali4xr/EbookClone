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

### 2. Configure ElevenLabs AI (Optional)
To enable conversational AI features:

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Create a Conversational AI agent in the dashboard
3. Get your Agent ID from the agent settings

**For Public Agents:**
- Use the Agent ID directly in the ConversationalAIButton component
- No additional server setup required

**For Private Agents:**
- Set up a server endpoint to generate signed URLs
- Configure the endpoint in the AI settings modal

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

The app uses ElevenLabs Conversational AI SDK for natural voice interactions:

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
- **Agent ID**: For public agents, use directly
- **Signed URL**: For private agents, requires server endpoint
- **Context Awareness**: AI receives current page and quiz information
- **Voice Integration**: Seamless integration with text-to-speech

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
Modify the context strings in components to change how the AI assistant behaves:

- `getReadingAIContext()` in BookContent.tsx
- `getAIContext()` in QuizModal.tsx
- `getSettingsAIContext()` in SettingsModal.tsx

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