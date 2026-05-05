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
}

export interface FoodPlace {
  id: string;
  name: string;
  category: 'Food' | 'Cafe' | 'Dessert' | 'Travel' | 'Other';
  status: 'Visited' | 'Want to visit';
  rating: number;
  price?: number;
  address?: string;
  link?: string;
  review?: string;
  notes?: string;
  tags?: string[];
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
}
