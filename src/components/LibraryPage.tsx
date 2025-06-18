import React, { useState, useEffect } from 'react';
import { Book, ArrowLeft, Search, Filter, Star, Clock, Users } from 'lucide-react';
import { BookService } from '../services/BookService';
import { Book as BookType, SUBJECT_COLORS, SUBJECT_ICONS } from '../types/Book';

interface LibraryPageProps {
  onSelectBook: (book: BookType) => void;
  onBack: () => void;
}

const LibraryPage = ({ onSelectBook, onBack }: LibraryPageProps) => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  useEffect(() => {
    loadBooks();
  }, []);

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
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook(book)}
              className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate__animated animate__fadeInUp"
            >
              {/* Book Cover */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={book.thumbnail_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
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
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
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
                <button className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r ${SUBJECT_COLORS[book.subject]}`}>
                  Start Reading
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
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;