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
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      });
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
      // First try to refresh the session
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        console.warn('Error getting session:', sessionError.message);
        // If session is invalid, clear it
        await this.supabase.auth.signOut();
        return null;
      }

      // If no session, return null
      if (!sessionData.session) {
        return null;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (sessionData.session.expires_at && sessionData.session.expires_at < now) {
        console.warn('Session expired, attempting refresh...');
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('Failed to refresh session:', refreshError.message);
          // Clear the expired session
          await this.supabase.auth.signOut();
          return null;
        }

        if (!refreshData.session?.user) {
          return null;
        }

        return {
          id: refreshData.session.user.id,
          email: refreshData.session.user.email || '',
          role: refreshData.session.user.user_metadata?.role || 'user'
        };
      }

      // Session is valid, get user
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.warn('Error getting current user:', error.message);
        // If JWT is invalid, clear the session
        if (error.message.includes('JWT') || error.message.includes('expired')) {
          await this.supabase.auth.signOut();
        }
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
      // Clear any invalid session
      try {
        await this.supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('Error clearing invalid session:', signOutError);
      }
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
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
        return;
      }

      // Check if the session is valid
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at < now) {
          console.warn('Received expired session in auth state change');
          callback(null);
          return;
        }
      }

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        role: session.user.user_metadata?.role || 'user'
      };
      callback(user);
    });
  }

  async getSession() {
    if (!this.isConfigured || !this.supabase) {
      return null;
    }
    
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.warn('Error getting session:', error.message);
        return null;
      }

      // Check if session is expired
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at < now) {
          console.warn('Session is expired');
          // Try to refresh
          const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
          if (refreshError) {
            console.warn('Failed to refresh expired session:', refreshError.message);
            await this.supabase.auth.signOut();
            return null;
          }
          return refreshData.session;
        }
      }

      return session;
    } catch (error) {
      console.warn('Error in getSession:', error);
      return null;
    }
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

  // Helper method to clear expired sessions
  async clearExpiredSession(): Promise<void> {
    if (!this.isConfigured || !this.supabase) {
      return;
    }

    try {
      await this.supabase.auth.signOut();
      console.log('Cleared expired session');
    } catch (error) {
      console.warn('Error clearing expired session:', error);
    }
  }
}