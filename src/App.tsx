import React from 'react';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Play, Pause, Settings } from 'lucide-react';
import BookContent from './components/BookContent';
import { BookProvider } from './context/BookContext';
import SettingsModal from './components/SettingsModal';

function App() {
  const [showSupabaseWarning, setShowSupabaseWarning] = React.useState(false);

  React.useEffect(() => {
    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      setShowSupabaseWarning(true);
    }
  }, []);

  return (
    <BookProvider>
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
            <h1 className="text-2xl md:text-3xl font-bold text-purple-600">
              StoryTime
            </h1>
            <SettingsButton />
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden transform transition-all">
            <BookContent />
          </div>
        </main>
        
        <footer className="bg-white shadow-md-up p-4 mt-auto">
          <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
            © 2025 StoryTime - Interactive Kids Books
          </div>
        </footer>
      </div>
    </BookProvider>
  );
}

const SettingsButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
        aria-label="Settings"
      >
        <Settings size={20} className="text-purple-600" />
      </button>
      
      {isOpen && <SettingsModal onClose={() => setIsOpen(false)} />}
    </>
  );
};

export default App;