
export enum DonutShape {
  RING = 'RING',
  FILLED = 'FILLED',
}

export enum DoughFlavor {
  CLASSIC = 'CLASSIC',
  CHOCOLATE = 'CHOCOLATE',
  RED_VELVET = 'RED_VELVET',
  MATCHA = 'MATCHA',
}

export enum Topping {
  NONE = 'NONE',
  CHOCOLATE = 'CHOCOLATE',
  PINK_GLAZE = 'PINK_GLAZE',
  WHITE_GLAZE = 'WHITE_GLAZE',
}

export enum Sprinkles {
  NONE = 'NONE',
  RAINBOW = 'RAINBOW',
  CHOCOLATE = 'CHOCOLATE',
  BLUE_WHITE = 'BLUE_WHITE', // Hanukkah Theme
  GOLD = 'GOLD',
}

export enum Filling {
  NONE = 'NONE',
  STRAWBERRY = 'STRAWBERRY',
  CUSTARD = 'CUSTARD',
  CHOCOLATE = 'CHOCOLATE',
  BLUEBERRY = 'BLUEBERRY',
  LEMON = 'LEMON',
}

export enum PowerupType {
  TIME_FREEZE = 'TIME_FREEZE',
  DOUBLE_POINTS = 'DOUBLE_POINTS',
  INSTANT_COOK = 'INSTANT_COOK',
}

export enum Language {
  EN = 'en',
  HE = 'he',
  ES = 'es',
  FR = 'fr',
  ZH = 'zh',
  RU = 'ru',
  HI = 'hi',
  DE = 'de',
}

export interface DonutConfig {
  shape: DonutShape;
  dough: DoughFlavor;
  topping: Topping;
  sprinkles: Sprinkles;
  filling: Filling;
}

export interface Prize {
  name: string;
  description: string;
  image: string;
}

export interface GameState {
  score: number;
  level: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  currentOrder: DonutConfig | null;
  currentDonut: DonutConfig;
  prize: Prize | null;
  isLoadingPrize: boolean;
  lastFeedback: 'success' | 'error' | null;
  streak: number;
  multiplier: number;
  pendingTimeBonus: number;
  bonusMessage: string | null;
  orderStartTime: number;
  musicVolume: number;
  language: Language;
  // New features
  isAppLoading: boolean;
  inventory: Record<PowerupType, number>;
  activeEffects: Record<PowerupType, number>; // timestamp when effect expires
}