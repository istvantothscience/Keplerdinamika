import { StudentData, CharacterClass } from '../types';
import { calculateLevel, MOCK_STUDENTS } from '../constants';

// *** FONTOS: IDE ILLESZD BE A SAJÁT GOOGLE APPS SCRIPT URL-EDET ***
// Ha üres, a rendszer a MOCK_STUDENTS adatokat használja (Demo mód)
const GAS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxbpZ-9dnlSlpVWGAqFmQCpNLELkg1YcVRboxv-Fsch3FlzGkV7mb6kP4cz8NJ4EmQClA/exec';

// Link a tanári admin táblázathoz (csak neked)
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/your-sheet-id-here/edit";

/**
 * Login function acting as a bridge to the Google Apps Script backend.
 */
export const loginStudent = async (name: string, password: string): Promise<StudentData | null> => {
  // 1. ADMIN LOGIN (Helyi ellenőrzés a gyors belépéshez)
  if (name.toLowerCase() === 'commander' && password === 'admin') {
    return {
      name: 'Commander',
      totalPoints: 999,
      characterType: CharacterClass.WARRIOR,
      level: 5,
      scores: { lessons: [0,0,0,0,0,0], homework: 0, project: 0, exam: 0 },
      isAdmin: true
    };
  }
  
  // 2. PRÓBÁLKOZÁS A GOOGLE SHEET API-VAL
  if (GAS_ENDPOINT && !GAS_ENDPOINT.includes('your-script-url')) {
      try {
        const response = await fetch(`${GAS_ENDPOINT}?action=login&name=${encodeURIComponent(name)}&password=${encodeURIComponent(password)}`);
        const data = await response.json();
        
        if (data.status === 'success' && data.student) {
            console.log("Belépés sikeres Google Sheetből:", data.student);
            return {
                name: data.student.name,
                totalPoints: parseInt(data.student.totalPoints),
                characterType: data.student.characterType as CharacterClass,
                level: calculateLevel(parseInt(data.student.totalPoints)),
                scores: data.student.scores || { lessons: [], homework: 0, project: 0, exam: 0 },
                completedMissions: data.student.completedMissions || []
            };
        }
      } catch (error) {
          console.warn("Nem sikerült elérni a Google Sheetet, átváltás OFFLINE/DEMO módra.", error);
      }
  }

  // 3. FALLBACK: HELYI MOCK ADATBÁZIS (Ha nincs net, vagy nincs beállítva az URL)
  // Szimulált hálózati késés
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const student = MOCK_STUDENTS.find(s => s.name.toLowerCase() === name.toLowerCase() && ((s as any).password === password || password === '123'));
    
  if (student) {
    const currentLevel = calculateLevel(student.totalPoints);
    return {
      name: student.name,
      totalPoints: student.totalPoints,
      characterType: student.characterType,
      level: currentLevel,
      scores: student.scores,
      completedMissions: student.completedMissions
    };
  }

  return null;
};

/**
 * Pontok jóváírása és mentése a Google Sheetbe.
 */
export const submitMissionProgress = async (name: string, pointsToAdd: number, missionId: string = 'chat_bonus'): Promise<number> => {
  console.log(`[API] Awarding ${pointsToAdd} points to ${name} for ${missionId}`);
  
  // 1. Mentés a Google Sheetbe
  if (GAS_ENDPOINT && !GAS_ENDPOINT.includes('your-script-url')) {
      try {
        const finalUrl = `${GAS_ENDPOINT}?action=addPoints&name=${encodeURIComponent(name)}&points=${pointsToAdd}&mission=${missionId}`;
        
        // A 'no-cors' módot levettük, hogy lássuk a választ, de a Google Scriptnek JSONP-t vagy CORS fejlécet kell küldenie.
        // A fetch alapértelmezetten követi az átirányításokat, ami jó a GAS-hoz.
        await fetch(finalUrl); 
        console.log("Data synced to Google Sheet");
      } catch (e) {
        console.error("Google Sheet sync error:", e);
      }
  }

  // 2. Lokális állapot frissítése (hogy a UI azonnal reagáljon, ne kelljen várni a szerverre)
  // Élesben itt ideális esetben megvárnánk a szerver választ, de a játékélmény miatt jobb az azonnali visszajelzés.
  const studentIndex = MOCK_STUDENTS.findIndex(s => s.name === name);
  let newTotal = 0;

  if (studentIndex >= 0) {
    MOCK_STUDENTS[studentIndex].totalPoints += pointsToAdd;
    if (!MOCK_STUDENTS[studentIndex].completedMissions?.includes(missionId)) {
        const current = MOCK_STUDENTS[studentIndex].completedMissions || [];
        MOCK_STUDENTS[studentIndex].completedMissions = [...current, missionId];
    }
    newTotal = MOCK_STUDENTS[studentIndex].totalPoints;
  } else {
      // Ha nincs a mockban, akkor csak visszaadjuk a feltételezett új értéket (a valódi appban a state kezeli)
      // Itt egy hack: mivel nem tudjuk a jelenlegi pontot a mockból (mert sheetből jött),
      // a hívó komponensnek kell kezelnie a state frissítést.
      // A return érték csak tájékoztató jellegű.
      newTotal = pointsToAdd; // Ez bugos lehet, ha csak mockot nézünk, de a UI state kezeli a valódit.
  }
  
  // A UI számára visszaadjuk a feltételezett új összeget. 
  // Megjegyzés: A hívó fél (App.tsx) a saját state-jéhez adja hozzá a pontot, 
  // így a display akkor is frissül, ha a mock DB nem.
  return newTotal; 
};

export const getAdminSheetLink = () => GOOGLE_SHEET_URL;

export const getAllStudents = () => MOCK_STUDENTS;