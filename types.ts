export enum CharacterClass {
  SCIENTIST = 'Tudos',
  PILOT = 'Pilota',
  WARRIOR = 'Harcos'
}

export interface StudentScores {
  lessons: [number, number, number, number, number, number]; // 6 tanóra pontszámai
  homework: [number, number, number, number, number, number]; // 6 házi feladat pontszámai (Updated to array)
  project: number;
  exam: number;
}

export interface StudentData {
  name: string;
  email?: string;
  totalPoints: number;
  scores: StudentScores;
  characterType: CharacterClass;
  level: number;
  isAdmin?: boolean;
  completedMissions?: string[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  story: string;
  imageUrl: string;
  classroomLink: string;
  minPoints: number;
  completed?: boolean;
  type?: 'main' | 'project' | 'exam'; // Added type to distinguish special nodes
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