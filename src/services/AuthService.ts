import { createClient } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  role?: string;
}

export class AuthService {
  private static instance: AuthService;
  private supabase;
  private isConfigured: boolean = false;

  private constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase configuration missing. Authentication features will be disabled.');
      this.isConfigured = false;
      // Create a dummy client to prevent errors
      this.supabase = null;
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isConfigured = true;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      this.isConfigured = false;
      this.supabase = null;
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  static isConfigured(): boolean {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }

  private checkConfiguration(): void {
    if (!this.isConfigured || !this.supabase) {
      throw new Error('Supabase is not configured. Please check your environment variables.');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    this.checkConfiguration();
    
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: data.user.user_metadata?.role || 'user'
      };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    this.checkConfiguration();
    
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: 'user'
      };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!this.isConfigured || !this.supabase) {
      return; // Nothing to sign out from
    }
    
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.isConfigured || !this.supabase) {
      return null; // Return null instead of throwing error
    }
    
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.warn('Error getting current user:', error.message);
        return null;
      }

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        role: user.user_metadata?.role || 'user'
      };
    } catch (error) {
      console.warn('Error getting current user:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    if (!this.isConfigured || !this.supabase) {
      // Return a dummy subscription that does nothing
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
    
    return this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'user'
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  async getSession() {
    if (!this.isConfigured || !this.supabase) {
      return null;
    }
    
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  getConfigurationStatus(): { isConfigured: boolean; message?: string } {
    if (!this.isConfigured) {
      return {
        isConfigured: false,
        message: 'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing or invalid.'
      };
    }
    return { isConfigured: true };
  }
}