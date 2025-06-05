import React from 'react';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, Play, Pause, Settings } from 'lucide-react';
import BookContent from './components/BookContent';
import { BookProvider } from './context/BookContext';
import SettingsModal from './components/SettingsModal';

function App() {
  return (
    <BookProvider>
      <div className="font-sans min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex flex-col">
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