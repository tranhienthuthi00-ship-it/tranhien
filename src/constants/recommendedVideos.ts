export interface RecommendedVideo {
  id: string;
  youtubeId: string;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Conversation' | 'TED-Ed' | 'News' | 'Movie';
  thumbnail: string;
}

export const RECOMMENDED_VIDEOS: RecommendedVideo[] = [
  {
    id: 'rec-1',
    youtubeId: 'L-STmHl70To',
    title: 'How to learn any language | Lydia Machova',
    level: 'Intermediate',
    category: 'TED-Ed',
    thumbnail: 'https://img.youtube.com/vi/L-STmHl70To/mqdefault.jpg'
  },
  {
    id: 'rec-2',
    youtubeId: 'XpMv-fN-5kU',
    title: 'The science of curiosity | TED-Ed',
    level: 'Advanced',
    category: 'TED-Ed',
    thumbnail: 'https://img.youtube.com/vi/XpMv-fN-5kU/mqdefault.jpg'
  },
  {
    id: 'rec-3',
    youtubeId: 'F2fBySPlRRM',
    title: '5 tips to improve your writing',
    level: 'Beginner',
    category: 'Conversation',
    thumbnail: 'https://img.youtube.com/vi/F2fBySPlRRM/mqdefault.jpg'
  },
  {
    id: 'rec-4',
    youtubeId: 'vV3XWovSTZ0',
    title: 'English Conversation with Subtitles',
    level: 'Beginner',
    category: 'Conversation',
    thumbnail: 'https://img.youtube.com/vi/vV3XWovSTZ0/mqdefault.jpg'
  },
  {
    id: 'rec-5',
    youtubeId: '1m7SAtT0v5Y',
    title: 'How to sound smart in your TEDx Talk',
    level: 'Intermediate',
    category: 'Movie',
    thumbnail: 'https://img.youtube.com/vi/1m7SAtT0v5Y/mqdefault.jpg'
  }
];
