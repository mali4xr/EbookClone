import React from 'react';
import { AlertTriangle } from 'lucide-react';
import BookContent from './components/BookContent';
import LibraryPage from './components/LibraryPage';
import EndPage from './components/EndPage';
import { BookProvider, BookContext } from './context/BookContext';
import { Book } from './types/Book';
import SettingsModal from './components/SettingsModal';

type AppState = 'library' | 'story' | 'end';

interface QuizAnswer {
  pageTitle: string;
  multipleChoiceQuestion: string;
  multipleChoiceAnswer: string;
  spellingWord: string;
  spellingAnswer: string;
  isCorrect: boolean;
}

function App() {
  const [showSupabaseWarning, setShowSupabaseWarning] = React.useState(false);
  const [appState, setAppState] = React.useState<AppState>('library');
  const [selectedBook, setSelectedBook] = React.useState<Book | null>(null);
  const [quizAnswers, setQuizAnswers] = React.useState<QuizAnswer[]>([]);
  const [totalScore, setTotalScore] = React.useState(0);

  React.useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setShowSupabaseWarning(true);
    }
  }, []);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setAppState('story');
    setQuizAnswers([]);
    setTotalScore(0);
  };

  const handleStoryComplete = (answers: QuizAnswer[], score: number) => {
    setQuizAnswers(answers);
    setTotalScore(score);
    setAppState('end');
  };

  const handleReturnToLibrary = () => {
    setAppState('library');
    setSelectedBook(null);
    setQuizAnswers([]);
    setTotalScore(0);
  };

  // Show library page
  if (appState === 'library') {
    return (
      <LibraryPage 
        onSelectBook={handleSelectBook}
        onBack={() => {}} // No back action from library
      />
    );
  }

  // Show end page
  if (appState === 'end') {
    return (
      <EndPage
        onReturnToLanding={handleReturnToLibrary}
        quizAnswers={quizAnswers}
        totalScore={totalScore}
        maxScore={quizAnswers.length * 2} // 2 points per page (multiple choice + spelling)
      />
    );
  }

  // Show main story with selected book
  return (
    <BookProvider 
      onStoryComplete={handleStoryComplete}
      key={selectedBook?.id} // Force re-render when book changes
    >
      <BookInitializer book={selectedBook} />
      <div className="font-sans min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex flex-col">
        {/* Supabase Configuration Warning */}
        {showSupabaseWarning && (
          <div className="bg-orange-100 border-b border-orange-200 p-3">
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              <AlertTriangle size={20} className="text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-orange-800 text-sm font-medium">
                  Database Not Connected
                </p>
                <p className="text-orange-700 text-xs">
                  Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file to enable database features.
                </p>
              </div>
              <button
                onClick={() => setShowSupabaseWarning(false)}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        <header className="bg-white shadow-md p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleReturnToLibrary}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                ← Library
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-purple-600">
                  {selectedBook?.title || 'Interactive Learning'}
                </h1>
                {selectedBook && (
                  <p className="text-sm text-gray-600">
                    {selectedBook.subject} • by {selectedBook.author}
                  </p>
                )}
              </div>
            </div>
            <SettingsButton />
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden transform transition-all">
            <BookContent onStoryComplete={handleStoryComplete} />
          </div>
        </main>
        
        <footer className="bg-white shadow-md-up p-4 mt-auto">
          <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
            © 2025 Interactive Learning Platform - Educational Content for Kids
          </div>
        </footer>
      </div>
    </BookProvider>
  );
}

// Component to initialize book in context
const BookInitializer = ({ book }: { book: Book | null }) => {
  const { setCurrentBook } = React.useContext(BookContext);
  
  React.useEffect(() => {
    if (book) {
      setCurrentBook(book);
    }
  }, [book, setCurrentBook]); // Added proper dependency array

  return null;
};

const SettingsButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
        aria-label="Settings"
      >
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
      
      {isOpen && <SettingsModal onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default App;