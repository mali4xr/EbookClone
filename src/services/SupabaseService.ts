import { createClient } from '@supabase/supabase-js';

export interface StoryPage {
  id: string;
  page_number: number;
  title: string;
  text: string;
  image_url: string;
  video_url: string;
  background_url: string;
  quiz_data: {
    multipleChoice: {
      question: string;
      options: { text: string; isCorrect: boolean; }[];
    };
    spelling: {
      word: string;
      hint: string;
    };
    dragDrop?: {
      dragItems: { id: string; image: string; label: string }[];
      dropZones: { id: string; image: string; label: string; acceptsId: string }[];
      instructions?: string;
    };
  };
  book_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StoryPageInput {
  page_number: number;
  title?: string;
  text: string;
  image_url: string;
  video_url: string;
  background_url: string;
  quiz_data: StoryPage['quiz_data'];
  book_id?: string;
}

export class SupabaseService {
  private static instance: SupabaseService;
  public supabase;

  private constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please check your environment variables.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  static isConfigured(): boolean {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }

  async getAllStoryPages(bookId?: string): Promise<StoryPage[]> {
    try {
      let query = this.supabase
        .from('story_pages')
        .select('*')
        .order('page_number', { ascending: true });

      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching story pages:', error);
        throw new Error(`Failed to fetch story pages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllStoryPages:', error);
      throw error;
    }
  }

  async getStoryPage(pageNumber: number, bookId?: string): Promise<StoryPage | null> {
    try {
      let query = this.supabase
        .from('story_pages')
        .select('*')
        .eq('page_number', pageNumber);

      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error('Error fetching story page:', error);
        throw new Error(`Failed to fetch story page: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getStoryPage:', error);
      throw error;
    }
  }

  async upsertStoryPage(pageNumber: number, updates: Partial<StoryPageInput>): Promise<StoryPage> {
    try {
      const upsertData = {
        page_number: pageNumber,
        title: updates.title || '',
        text: updates.text || '',
        image_url: updates.image_url || '',
        video_url: updates.video_url || '',
        background_url: updates.background_url || '',
        quiz_data: updates.quiz_data || {},
        book_id: updates.book_id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('story_pages')
        .upsert(upsertData, { 
          onConflict: 'page_number,book_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting story page:', error);
        throw new Error(`Failed to upsert story page: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in upsertStoryPage:', error);
      throw error;
    }
  }

  async createStoryPage(pageData: StoryPageInput): Promise<StoryPage> {
    try {
      const { data, error } = await this.supabase
        .from('story_pages')
        .insert([pageData])
        .select()
        .single();

      if (error) {
        console.error('Error creating story page:', error);
        throw new Error(`Failed to create story page: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createStoryPage:', error);
      throw error;
    }
  }

  async deleteStoryPage(pageNumber: number, bookId?: string): Promise<void> {
    try {
      let query = this.supabase
        .from('story_pages')
        .delete()
        .eq('page_number', pageNumber);

      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting story page:', error);
        throw new Error(`Failed to delete story page: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteStoryPage:', error);
      throw error;
    }
  }

  async getTotalPages(bookId?: string): Promise<number> {
    try {
      let query = this.supabase
        .from('story_pages')
        .select('*', { count: 'exact', head: true });

      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error getting total pages:', error);
        throw new Error(`Failed to get total pages: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTotalPages:', error);
      throw error;
    }
  }

  // Convert database format to component format
  static convertToComponentFormat(dbPage: StoryPage) {
    return {
      title: dbPage.title,
      text: dbPage.text,
      image: dbPage.image_url,
      video: dbPage.video_url,
      background: dbPage.background_url,
      quiz: dbPage.quiz_data
    };
  }

  // Convert component format to database format
  static convertToDatabaseFormat(componentData: any, pageNumber: number, bookId?: string): StoryPageInput {
    return {
      page_number: pageNumber,
      title: componentData.title || '',
      text: componentData.text,
      image_url: componentData.image || componentData.image_url,
      video_url: componentData.video || componentData.video_url,
      background_url: componentData.background || componentData.background_url,
      quiz_data: componentData.quiz || {},
      book_id: bookId
    };
  }
}