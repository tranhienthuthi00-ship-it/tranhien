export type WordTag = 'Tourism' | 'Hospitality' | 'Cruise Industry' | string;

export interface Word {
  id: string;
  vocabulary: string;
  wordType: string;
  ipa: string;
  definition: string;
  examples: string[];
  tags: WordTag[];
  difficulty: number; // 0: new, 1: easy, 2: medium, 3: hard
  lastReviewed: string; // ISO date
  nextReview: string; // ISO date
}

export interface Task {
  id: string;
  content: string;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  createdAt?: number;
  completedAt?: number;
  goalId?: string;
  isShopping?: boolean;
  wishlistId?: string;
  price?: number;
  link?: string;
}

export interface FoodPlace {
  id: string;
  name: string;
  category: 'Food' | 'Cafe' | 'Dessert' | 'Travel' | 'Other';
  status: 'Visited' | 'Want to visit';
  rating: number;
  price?: number;
  city?: string;
  address?: string;
  link?: string;
  review?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  dateVisited?: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  description?: string;
  platform?: string;
  link?: string;
  status: 'Pending' | 'Done';
  createdAt: number;
}

export interface WishlistHistoryEntry {
  date: string;
  necessity: 'Low' | 'Medium' | 'High';
  note: string;
}

export interface WishlistItem {
  id: string;
  content: string;
  addedDate: string;
  link?: string;
  price?: number;
  note?: string;
  necessity: 'Low' | 'Medium' | 'High';
  tags?: string[];
  isWorthBuying?: boolean;
  isPurchased?: boolean;
  history?: WishlistHistoryEntry[];
}

export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  type: 'Reflection' | 'Event';
  emoji?: string;
  icon?: string;
  time?: string;
  location?: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  icon: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string; // ID of the category
  value: number;
  currency: string;
  notes?: string;
  acquiredAt?: number;
  isDebt?: boolean;
  isLoan?: boolean;
  isNewMoney?: boolean;
  excludeFromNetWorth?: boolean;
  quantity?: number;
  denomination?: number;
  exchangeRate?: number;
}

export interface VideoDictation {
  id: string;
  youtubeId: string;
  title: string;
  content: string; // Used for raw text input if no items
  transcriptItems?: { text: string; offset: number; duration: number; translation?: string }[];
  lastModified: number;
  progress?: number;
}

export interface CustomSentence {
  id: string;
  vietnamese: string;
  english?: string;
  topic: string;
  createdAt: number;
}

export interface PracticeSentence {
  vi: string;
  en: string;
  hint?: string;
}

export interface PracticeParagraph {
  id: string;
  title: string;
  vietnamese: string;
  english: string;
  sentences?: PracticeSentence[];
  createdAt: number;
  practiceCount?: number;
  lastProgress?: {
    sentences: any[];
    currentIndex: number;
    totalMistakes: number;
  };
}

export interface StudyGoal {
  id: string;
  title: string;
  type: 'daily_sentences' | 'paragraph_completion' | 'custom' | 'habit';
  targetValue: number;
  currentValue: number;
  notes?: string;
  deadline?: number; // timestamp
  createdAt: number;
  isCompleted: boolean;
  completedAt?: number;
  review?: string;
  journey?: {
    id: string;
    timestamp: number;
    content: string;
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
  icon?: string;
  goalId?: string;
  dateEarned?: number;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  category: string;
  reminderTimes: string[];
  daysOfWeek: number[];
  streak: number;
  maxStreak: number;
  createdAt: number;
  isActive: boolean;
  lastCompletedDate?: string;
  history: { [date: string]: { [time: string]: boolean } };
  repeatType?: 'day' | 'week' | 'month';
  frequency?: number;
}

export interface TodayTask {
  id: string;
  title: string;
  time: string;
  isCompleted: boolean;
  habitId?: string;
  snoozedCount?: number;
  notified?: boolean;
  date?: string;
}

export interface CardSpend {
  id: string | number;
  name: string;
  amount: string;
  notes: string;
}
