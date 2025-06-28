import React, { useState, useEffect } from 'react';
import { Book, ArrowLeft, Search, Filter, Star, Clock, Users, Settings, Plus, Trash2, Edit, Save, X, LogIn, LogOut, Shield, AlertCircle, RotateCcw } from 'lucide-react';
import { BookService } from '../services/BookService';
import { AuthService, User } from '../services/AuthService';
import { Book as BookType, SUBJECT_COLORS, SUBJECT_ICONS } from '../types/Book';
import AuthModal from './AuthModal';
import LibraryAIAssistant from './LibraryAIAssistant';
import AIDrawingBook from './AIDrawingBook';

interface LibraryPageProps {
  onSelectBook: (book: BookType) => void;
  onBack: () => void;
}

interface BookFormData {
  title: string;
  subject: BookType['subject'];
  author: string;
  publisher: string;
  description: string;
  thumbnail_url: string;
  cover_image_url: string;
  difficulty_level: BookType['difficulty_level'];
  target_age_min: number;
  target_age_max: number;
  is_available: boolean;
}

const LibraryPage = ({ onSelectBook, onBack }: LibraryPageProps) => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [showAddBook, setShowAddBook] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [deletingBook, setDeletingBook] = useState<BookType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authConfigError, setAuthConfigError] = useState<string | null>(null);
  const [recommendedBooks, setRecommendedBooks] = useState<BookType[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showAIDrawingBook, setShowAIDrawingBook] = useState(false);

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    subject: 'STORY',
    author: '',
    publisher: '',
    description: '',
    thumbnail_url: '',
    cover_image_url: '',
    difficulty_level: 'beginner',
    target_age_min: 3,
    target_age_max: 12,
    is_available: true
  });

  const authService = AuthService.getInstance();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      setIsCheckingAuth(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if Supabase is configured
      const configStatus = authService.getConfigurationStatus();
      if (!configStatus.isConfigured) {
        setAuthConfigError(configStatus.message || 'Authentication not configured');
        setCurrentUser(null);
        setIsCheckingAuth(false);
        return;
      }

      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setAuthConfigError(null);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthConfigError('Failed to check authentication status');
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [currentUser]);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, selectedSubject, selectedDifficulty]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const bookService = BookService.getInstance();
      const booksData = await bookService.getAllBooks();
      setBooks(booksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = books;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject !== 'ALL') {
      filtered = filtered.filter(book => book.subject === selectedSubject);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'ALL') {
      filtered = filtered.filter(book => book.difficulty_level === selectedDifficulty);
    }

    setFilteredBooks(filtered);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSubject('ALL');
    setSelectedDifficulty('ALL');
  };

  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedSubject !== 'ALL' || selectedDifficulty !== 'ALL';
  };

  const getUniqueSubjects = () => {
    const subjects = [...new Set(books.map(book => book.subject))];
    return subjects.sort();
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSubjectBorderColor = (subject: string) => {
    switch (subject) {
      case 'STORY': return 'border-purple-400';
      case 'MATHS': return 'border-blue-400';
      case 'SCIENCE': return 'border-green-400';
      case 'SPORTS': return 'border-orange-400';
      case 'HISTORY': return 'border-amber-400';
      case 'GEOGRAPHY': return 'border-teal-400';
      case 'ART': return 'border-pink-400';
      case 'MUSIC': return 'border-indigo-400';
      default: return 'border-gray-400';
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject: 'STORY',
      author: '',
      publisher: '',
      description: '',
      thumbnail_url: '',
      cover_image_url: '',
      difficulty_level: 'beginner',
      target_age_min: 3,
      target_age_max: 12,
      is_available: true
    });
  };

  const handleAddBook = () => {
    if (authConfigError) {
      setError('Authentication is not configured. Please check your Supabase environment variables.');
      return;
    }
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    resetForm();
    setEditingBook(null);
    setShowAddBook(true);
  };

  const handleEditBook = (book: BookType) => {
    if (authConfigError) {
      setError('Authentication is not configured. Please check your Supabase environment variables.');
      return;
    }
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setFormData({
      title: book.title,
      subject: book.subject,
      author: book.author,
      publisher: book.publisher,
      description: book.description || '',
      thumbnail_url: book.thumbnail_url,
      cover_image_url: book.cover_image_url,
      difficulty_level: book.difficulty_level,
      target_age_min: book.target_age_min,
      target_age_max: book.target_age_max,
      is_available: book.is_available ?? true
    });
    setEditingBook(book);
    setShowAddBook(true);
  };

  const handleSaveBook = async () => {
    if (!currentUser) {
      setError('Authentication required to save books');
      return;
    }

    try {
      const bookService = BookService.getInstance();
      
      if (editingBook) {
        // Update existing book
        await bookService.updateBook(editingBook.id, formData);
      } else {
        // Create new book
        await bookService.createBook(formData);
      }
      
      await loadBooks();
      setShowAddBook(false);
      setEditingBook(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save book');
    }
  };

  const handleDeleteBook = async (book: BookType) => {
    if (!currentUser) {
      setError('Authentication required to delete books');
      return;
    }

    try {
      const bookService = BookService.getInstance();
      await bookService.deleteBook(book.id);
      await loadBooks();
      setDeletingBook(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book');
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleBookSelect = (book: BookType) => {
    // Check if this is the Creative Art Adventures book
    if (book.title === 'Creative Art Adventures' && book.subject === 'ART') {
      setShowAIDrawingBook(true);
    } else {
      onSelectBook(book);
    }
  };

  // AI Assistant handlers
  const handleAIFilterChange = (filters: {
    searchTerm?: string;
    selectedSubject?: string;
    selectedDifficulty?: string;
    ageRange?: { min: number; max: number };
  }) => {
    if (filters.searchTerm !== undefined) {
      setSearchTerm(filters.searchTerm);
    }
    if (filters.selectedSubject !== undefined) {
      setSelectedSubject(filters.selectedSubject);
    }
    if (filters.selectedDifficulty !== undefined) {
      setSelectedDifficulty(filters.selectedDifficulty);
    }
    // Handle age range filtering if needed
    console.log('AI Filter applied:', filters);
  };

  const handleBookRecommendation = (books: BookType[]) => {
    setRecommendedBooks(books);
    setShowRecommendations(true);
    console.log('AI Recommendations:', books);
  };

  // Show AI Drawing Book if selected
  if (showAIDrawingBook) {
    return <AIDrawingBook onBack={() => setShowAIDrawingBook(false)} />;
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Library</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadBooks}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-3">
                <Book size={32} className="text-purple-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Interactive Library</h1>
                  <p className="text-gray-600">Choose your learning adventure</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Auth Configuration Warning */}
              {authConfigError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Auth not configured</span>
                </div>
              )}

              {/* Auth Status */}
              {!authConfigError && currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                    <Shield size={16} />
                    <span className="text-sm font-medium">Admin: {currentUser.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : !authConfigError ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <LogIn size={20} />
                  <span>Admin Login</span>
                </button>
              ) : null}

              {/* Add Book Button */}
              <button
                onClick={handleAddBook}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors transform hover:scale-105 ${
                  currentUser && !authConfigError
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!currentUser || !!authConfigError}
                title={authConfigError ? 'Authentication not configured' : !currentUser ? 'Admin login required' : 'Add new book'}
              >
                <Plus size={20} />
                <span>Add Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search books, authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>
                    {SUBJECT_ICONS[subject as keyof typeof SUBJECT_ICONS]} {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <Star size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                <option value="ALL">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center">
              <button
                onClick={clearAllFilters}
                disabled={!hasActiveFilters()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  hasActiveFilters()
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
                title={hasActiveFilters() ? 'Clear all filters' : 'No active filters'}
              >
                <RotateCcw size={16} />
                <span className="font-medium">Clear Filters</span>
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Active filters:</span>
                
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                
                {selectedSubject !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    Subject: {SUBJECT_ICONS[selectedSubject as keyof typeof SUBJECT_ICONS]} {selectedSubject}
                    <button
                      onClick={() => setSelectedSubject('ALL')}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                
                {selectedDifficulty !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Level: {selectedDifficulty}
                    <button
                      onClick={() => setSelectedDifficulty('ALL')}
                      className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 animate__animated animate__fadeInUp group ${
                book.is_available 
                  ? 'hover:scale-105 hover:shadow-xl' 
                  : 'opacity-75'
              }`}
            >
              {/* Book Cover */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={book.thumbnail_url}
                  alt={book.title}
                  className={`w-full h-full object-cover cursor-pointer border-4 ${getSubjectBorderColor(book.subject)} transition-all duration-300 hover:border-opacity-80`}
                  onClick={() => handleBookSelect(book)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x300?text=Book+Cover';
                  }}
                />
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${SUBJECT_COLORS[book.subject]}`}>
                  {SUBJECT_ICONS[book.subject]} {book.subject}
                </div>
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(book.difficulty_level)}`}>
                  {book.difficulty_level}
                </div>
                
                {/* Special indicator for AI Drawing Book */}
                {book.title === 'Creative Art Adventures' && book.subject === 'ART' && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold">
                    🎨 AI Drawing
                  </div>
                )}
                
                {/* Unavailable overlay */}
                {!book.is_available && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full">
                      <span className="text-gray-700 font-bold text-sm">🔒 Coming Soon</span>
                    </div>
                  </div>
                )}
                
                {/* Action buttons overlay - only show for authenticated users */}
                {currentUser && !authConfigError && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBook(book);
                        }}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors transform hover:scale-110"
                        title="Edit book"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingBook(book);
                        }}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors transform hover:scale-110"
                        title="Delete book"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 cursor-pointer" onClick={() => handleBookSelect(book)}>
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  by {book.author}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {book.publisher}
                </p>
                
                {book.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {book.description}
                  </p>
                )}

                {/* Age Range */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users size={12} />
                    <span>Ages {book.target_age_min}-{book.target_age_max}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Interactive</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-4 pb-4">
                <button 
                  onClick={() => book.is_available ? handleBookSelect(book) : undefined}
                  disabled={!book.is_available}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                    book.is_available 
                      ? `text-white transform hover:scale-105 bg-gradient-to-r ${SUBJECT_COLORS[book.subject]} hover:shadow-lg` 
                      : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                  }`}
                >
                  {!book.is_available 
                    ? '🔒 Coming Soon' 
                    : book.title === 'Creative Art Adventures' && book.subject === 'ART' 
                      ? 'Start Drawing' 
                      : 'Start Reading'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <Book size={64} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters() 
                ? 'Try adjusting your search or filters' 
                : 'No books available in the library'
              }
            </p>
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RotateCcw size={16} />
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Assistant */}
      <LibraryAIAssistant
        books={books}
        onFilterChange={handleAIFilterChange}
        onBookRecommendation={handleBookRecommendation}
      />

      {/* Auth Modal */}
      {showAuthModal && !authConfigError && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">🤖 AI Recommendations</h2>
              <button 
                onClick={() => setShowRecommendations(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-purple-300"
                    onClick={() => {
                      handleBookSelect(book);
                      setShowRecommendations(false);
                    }}
                  >
                    <img
                      src={book.thumbnail_url}
                      alt={book.title}
                      className={`w-full h-32 object-cover rounded mb-2 border-2 ${getSubjectBorderColor(book.subject)}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/400x300?text=Book+Cover';
                      }}
                    />
                    <h3 className="font-semibold text-sm mb-1">{book.title}</h3>
                    <p className="text-xs text-gray-600">by {book.author}</p>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${SUBJECT_COLORS[book.subject]} mt-2`}>
                      {SUBJECT_ICONS[book.subject]} {book.subject}
                    </div>
                  </div>
                ))}
              </div>
              {recommendedBooks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recommendations found. Try asking the AI assistant for specific topics!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Book Modal */}
      {showAddBook && currentUser && !authConfigError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddBook(false);
                  setEditingBook(null);
                  resetForm();
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value as BookType['subject'] })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="STORY">📚 Story</option>
                    <option value="MATHS">🔢 Maths</option>
                    <option value="SCIENCE">🔬 Science</option>
                    <option value="SPORTS">⚽ Sports</option>
                    <option value="HISTORY">🏛️ History</option>
                    <option value="GEOGRAPHY">🌍 Geography</option>
                    <option value="ART">🎨 Art</option>
                    <option value="MUSIC">🎵 Music</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                  <input
                    type="url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty_level}
                    onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as BookType['difficulty_level'] })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={formData.target_age_min}
                    onChange={(e) => setFormData({ ...formData, target_age_min: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                  <input
                    type="number"
                    min="1"
                    max="18"
                    value={formData.target_age_max}
                    onChange={(e) => setFormData({ ...formData, target_age_max: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Book Availability Toggle */}
              <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  📚 Book Availability
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {formData.is_available ? 'Available for Reading' : 'Coming Soon'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.is_available 
                        ? 'Students can start reading this book immediately' 
                        : 'Book will show "Coming Soon" and be disabled for students'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${formData.is_available ? 'text-green-600' : 'text-gray-500'}`}>
                      {formData.is_available ? '✅ Available' : '⏳ Coming Soon'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                        formData.is_available ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_available ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddBook(false);
                  setEditingBook(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBook}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save size={16} />
                {editingBook ? 'Update Book' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Delete Book</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{deletingBook.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeletingBook(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBook(deletingBook)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;