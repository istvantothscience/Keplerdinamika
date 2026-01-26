export enum CharacterClass {
  SCIENTIST = 'Tudos',
  PILOT = 'Pilota',
  WARRIOR = 'Harcos'
}

export interface StudentScores {
  lessons: [number, number, number, number, number, number]; // 6 tanóra pontszámai
  homework: number;
  project: number;
  exam: number;
}

export interface StudentData {
  name: string;
  totalPoints: number;
  scores: StudentScores; // Részletes pontszámok
  characterType: CharacterClass;
  level: number;
  isAdmin?: boolean; // New flag for admin users
  completedMissions?: string[]; // Track IDs of completed missions
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  story: string; // Douglas Adams stílusú sztori
  imageUrl: string;
  classroomLink: string;
  minPoints: number;
  completed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'system' | 'model';
  text: string;
  timestamp: number;
}

export enum RankTitle {
  ROOKIE = "Újonc", // LVL 1
  CADET = "Kadét", // LVL 2
  OFFICER_CANDIDATE = "Tisztjelölt", // LVL 3
  LIEUTENANT = "Hadnagy", // LVL 4
  COMMANDER = "Parancsnok" // LVL 5
}