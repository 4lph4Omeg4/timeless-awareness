export interface ContentPackage {
  blogTitle: string;
  blogContent: string;
  imagePrompt: string;
  facebookPost: string;
  instagramPost: string;
  twitterPost: string;
  linkedinPost: string;
  telegramPost: string;
  discordPost: string;
  redditPost: string;
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export enum LogoPosition {
  BottomLeft = 'BottomLeft',
  BottomRight = 'BottomRight',
}

export interface BrandingConfig {
  logoFile: File | null;
  logoUrl?: string; // Added for storage persistence
  url: string;
  position: LogoPosition;
  opacity: number; // 0 to 100
}

export interface GenerationState {
  isGeneratingText: boolean;
  isGeneratingImage: boolean;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  idea: string;
  content: ContentPackage;
  imageUrl: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  branding?: {
    logoUrl?: string;
    url?: string;
    position?: LogoPosition;
    opacity?: number;
  };
}