export interface Book {
  id: string;
  title: string;
  subject: 'STORY' | 'MATHS' | 'SCIENCE' | 'SPORTS' | 'HISTORY' | 'GEOGRAPHY' | 'ART' | 'MUSIC';
  author: string;
  publisher: string;
  description?: string;
  thumbnail_url: string;
  cover_image_url: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  target_age_min: number;
  target_age_max: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  book_id: string;
  user_id?: string;
  voice_index: number;
  rate: number;
  pitch: number;
  volume: number;
  settings_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const SUBJECT_COLORS = {
  STORY: 'from-purple-500 to-pink-500',
  MATHS: 'from-blue-500 to-cyan-500',
  SCIENCE: 'from-green-500 to-emerald-500',
  SPORTS: 'from-orange-500 to-red-500',
  HISTORY: 'from-amber-500 to-yellow-500',
  GEOGRAPHY: 'from-teal-500 to-blue-500',
  ART: 'from-pink-500 to-rose-500',
  MUSIC: 'from-indigo-500 to-purple-500'
} as const;

export const SUBJECT_ICONS = {
  STORY: '📚',
  MATHS: '🔢',
  SCIENCE: '🔬',
  SPORTS: '⚽',
  HISTORY: '🏛️',
  GEOGRAPHY: '🌍',
  ART: '🎨',
  MUSIC: '🎵'
} as const;