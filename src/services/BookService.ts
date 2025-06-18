import { SupabaseService } from './SupabaseService';
import { Book, UserSettings } from '../types/Book';

export class BookService {
  private static instance: BookService;
  private supabase;

  private constructor() {
    this.supabase = SupabaseService.getInstance();
  }

  static getInstance(): BookService {
    if (!BookService.instance) {
      BookService.instance = new BookService();
    }
    return BookService.instance;
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('books')
        .select('*')
        .eq('is_active', true)
        .order('subject', { ascending: true })
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching books:', error);
        throw new Error(`Failed to fetch books: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllBooks:', error);
      throw error;
    }
  }

  async getBooksBySubject(subject: string): Promise<Book[]> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('books')
        .select('*')
        .eq('subject', subject)
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching books by subject:', error);
        throw new Error(`Failed to fetch books: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBooksBySubject:', error);
      throw error;
    }
  }

  async getBook(bookId: string): Promise<Book | null> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching book:', error);
        throw new Error(`Failed to fetch book: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getBook:', error);
      throw error;
    }
  }

  async getUserSettings(bookId: string, userId?: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('user_settings')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', userId || null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching user settings:', error);
        throw new Error(`Failed to fetch user settings: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getUserSettings:', error);
      throw error;
    }
  }

  async saveUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('user_settings')
        .upsert({
          book_id: settings.book_id,
          user_id: settings.user_id || null,
          voice_index: settings.voice_index || 0,
          rate: settings.rate || 1.0,
          pitch: settings.pitch || 1.0,
          volume: settings.volume || 1.0,
          settings_data: settings.settings_data || {},
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'book_id,user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving user settings:', error);
        throw new Error(`Failed to save user settings: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in saveUserSettings:', error);
      throw error;
    }
  }

  async createBook(bookData: Omit<Book, 'id' | 'created_at' | 'updated_at'>): Promise<Book> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

      if (error) {
        console.error('Error creating book:', error);
        throw new Error(`Failed to create book: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createBook:', error);
      throw error;
    }
  }

  async updateBook(bookId: string, updates: Partial<Book>): Promise<Book> {
    try {
      const { data, error } = await this.supabase.supabase
        .from('books')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId)
        .select()
        .single();

      if (error) {
        console.error('Error updating book:', error);
        throw new Error(`Failed to update book: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateBook:', error);
      throw error;
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    try {
      const { error } = await this.supabase.supabase
        .from('books')
        .update({ is_active: false })
        .eq('id', bookId);

      if (error) {
        console.error('Error deleting book:', error);
        throw new Error(`Failed to delete book: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteBook:', error);
      throw error;
    }
  }
}