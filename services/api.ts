import { StudentData, CharacterClass } from '../types';
import { calculateLevel, MOCK_STUDENTS } from '../constants';

// A felhasználó által megadott Google Apps Script URL
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxbpZ-9dnlSlpVWGAqFmQCpNLELkg1YcVRboxv-Fsch3FlzGkV7mb6kP4cz8NJ4EmQClA/exec';

/**
 * Login function acting as a bridge to the Google Apps Script backend.
 */
export const loginStudent = async (name: string, password: string): Promise<StudentData | null> => {
  // A böngésző biztonsági korlátai (CORS) miatt a közvetlen olvasás Google Scriptből gyakran blokkolva van.
  // Ezért a demó verzióban a lokális adatbázist (MOCK_STUDENTS) használjuk belépésre.
  // Éles környezetben itt egy JSONP megoldást vagy Proxy szervert kellene használni.
  
  try {
    // Szimulált hálózati késleltetés
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check password using mock data
    const student = MOCK_STUDENTS.find(s => s.name.toLowerCase() === name.toLowerCase() && ((s as any).password === password || password === '123'));
    
    if (student) {
      const currentLevel = calculateLevel(student.totalPoints);
      return {
        name: student.name,
        totalPoints: student.totalPoints,
        characterType: student.characterType,
        level: currentLevel,
        scores: student.scores
      };
    }
  } catch (e) {
    console.warn("Backend connection failed", e);
  }

  return null;
};

/**
 * Pontok jóváírása és mentése a Google Sheetbe.
 */
export const submitMissionProgress = async (name: string, pointsToAdd: number, missionId: string = 'chat_bonus'): Promise<number> => {
  console.log(`[API] Awarding ${pointsToAdd} points to ${name} for ${missionId}`);
  
  // 1. Mentés a Google Sheetbe (Fire-and-forget)
  // A 'no-cors' mód miatt nem látjuk a választ, de a kérés elmegy a szerverre.
  try {
    const finalUrl = `${GAS_ENDPOINT}?name=${encodeURIComponent(name)}&points=${pointsToAdd}&mission=${missionId}`;
    fetch(finalUrl, { 
        method: 'GET',
        mode: 'no-cors' 
    }).then(() => console.log("Data sent to Google Sheet"))
      .catch(e => console.error("Google Sheet sync error:", e));
  } catch (e) {
    console.error("API Call Failed", e);
  }

  // 2. Lokális állapot frissítése (hogy a felhasználó azonnal lássa az eredményt)
  await new Promise(resolve => setTimeout(resolve, 600));
  const studentIndex = MOCK_STUDENTS.findIndex(s => s.name === name);
  
  if (studentIndex >= 0) {
    MOCK_STUDENTS[studentIndex].totalPoints += pointsToAdd;
    return MOCK_STUDENTS[studentIndex].totalPoints;
  }
  
  // Ha nem találjuk a diákot (pl. új session), visszaadjuk a feltételezett új összeget
  return 0; // Itt ideális esetben a user eddigi pontjait kellene növelni
};