import React, { useState, useEffect } from 'react';
import { Book, ArrowLeft, Search, Filter, Star, Clock, Users, Settings, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { BookService } from '../services/BookService';
import { Book as BookType, SUBJECT_COLORS, SUBJECT_ICONS } from '../types/Book';

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
    target_age_max: 12
  });

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
      target_age_max: 12
    });
  };

  const handleAddBook = () => {
    resetForm();
    setEditingBook(null);
    setShowAddBook(true);
  };

  const handleEditBook = (book: BookType) => {
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
      target_age_max: book.target_age_max
    });
    setEditingBook(book);
    setShowAddBook(true);
  };

  const handleSaveBook = async () => {
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
    try {
      const bookService = BookService.getInstance();
      await bookService.deleteBook(book.id);
      await loadBooks();
      setDeletingBook(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete book');
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
            <button
              onClick={handleAddBook}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Add Book</span>
            </button>
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
              className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate__animated animate__fadeInUp group"
            >
              {/* Book Cover */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={book.thumbnail_url}
                  alt={book.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => onSelectBook(book)}
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
                
                {/* Action buttons overlay */}
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
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 cursor-pointer" onClick={() => onSelectBook(book)}>
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
                  onClick={() => onSelectBook(book)}
                  className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-all duration-300 transform hover:scale-105 bg-gradient-to-r ${SUBJECT_COLORS[book.subject]}`}
                >
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

      {/* Add/Edit Book Modal */}
      {showAddBook && (
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