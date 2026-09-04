import { StudentData, CharacterClass } from '../types';
import { calculateLevel } from '../constants';
import { supabase } from './supabaseClient';

/**
 * INTEGRÁCIÓ A KÖZÖS "FIZIKA PONTKÖVETŐ" RENDSZERREL
 * --------------------------------------------------
 * - A diák a közös Supabase Auth-tal lép be (e-mail + jelszó). Fiókot NEM itt hoz létre:
 *   ha nincs fiókja / elfelejtette a jelszót -> https://fizika-pontkoveto.vercel.app
 * - A bejelentkezett diák kilétét (osztály + név) a `app_whoami` RPC adja a JWT-ből.
 * - Csak a 8.a osztály használhatja jelenleg a Keplert (ALLOWED_CLASSES).
 * - A KEPLER JÁTÉK SAJÁT HALADÁSA (XP, szint, küldetés-nyitás) lokálisan tárolódik
 *   (localStorage, diákonként), hogy a felület viselkedése ne változzon.
 * - Emellett minden teljesített küldetés pontja CSENDBEN átmegy a közös rendszerbe is a
 *   `app_submit_score` RPC-vel (ott "app:kepler-dinamika" forrásjelöléssel jelenik meg).
 */

const APP_ID = 'kepler-dinamika';
const ALLOWED_CLASSES = ['8a']; // később bővíthető, ha más osztályt is bekötsz

export const CLASS_RESTRICTION_MESSAGE =
  'A Kepler-küldetés jelenleg csak a 8.a osztálynak érhető el.';
export const NO_CLASS_MESSAGE =
  'A fiókod nincs osztályhoz kötve. Első belépés / rendezés: https://fizika-pontkoveto.vercel.app';

// --- LOKÁLIS HALADÁS (localStorage) -----------------------------------------

interface LocalProgress {
  name: string;
  classCode: string;
  characterType: CharacterClass | null;
  totalPoints: number;
  scores: {
    lessons: number[];
    homework: number[];
    project: number;
    exam: number;
  };
  completedMissions: string[];
}

let currentAuthUserId: string | null = null;

const emptyProgress = (name: string, classCode: string): LocalProgress => ({
  name,
  classCode,
  characterType: null,
  totalPoints: 0,
  scores: { lessons: [0, 0, 0, 0, 0, 0], homework: [0, 0, 0, 0, 0, 0], project: 0, exam: 0 },
  completedMissions: [],
});

const progressKey = (uid: string) => `kepler:progress:${uid}`;

const loadProgress = (uid: string): LocalProgress | null => {
  try {
    const raw = localStorage.getItem(progressKey(uid));
    if (!raw) return null;
    const p = JSON.parse(raw) as LocalProgress;
    // védőháló a mezőkre
    p.scores = p.scores || emptyProgress(p.name, p.classCode).scores;
    p.scores.lessons = p.scores.lessons || [0, 0, 0, 0, 0, 0];
    p.scores.homework = p.scores.homework || [0, 0, 0, 0, 0, 0];
    p.completedMissions = p.completedMissions || [];
    return p;
  } catch {
    return null;
  }
};

const saveProgress = (uid: string, p: LocalProgress) => {
  try {
    localStorage.setItem(progressKey(uid), JSON.stringify(p));
  } catch (e) {
    console.warn('Nem sikerült menteni a helyi haladást', e);
  }
};

const toStudentData = (p: LocalProgress): StudentData => ({
  name: p.name,
  classCode: p.classCode,
  totalPoints: p.totalPoints,
  characterType: p.characterType ?? CharacterClass.SCIENTIST,
  level: calculateLevel(p.totalPoints),
  scores: {
    lessons: p.scores.lessons as StudentData['scores']['lessons'],
    homework: p.scores.homework as StudentData['scores']['homework'],
    project: p.scores.project,
    exam: p.scores.exam,
  },
  completedMissions: p.completedMissions,
  isAdmin: false,
  needsCharacter: p.characterType == null,
});

// --- BEJELENTKEZÉS ----------------------------------------------------------

interface WhoAmI {
  class_code: string;
  name: string;
}

const whoami = async (): Promise<WhoAmI | null> => {
  const { data, error } = await supabase.rpc('app_whoami');
  if (error) {
    console.warn('app_whoami hiba:', error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.class_code) return null;
  return { class_code: String(row.class_code), name: String(row.name ?? '') };
};

const hydrate = async (): Promise<StudentData | null> => {
  const { data: userData } = await supabase.auth.getUser();
  const authUser = userData?.user;
  if (!authUser) {
    currentAuthUserId = null;
    return null;
  }

  const who = await whoami();
  if (!who) {
    await supabase.auth.signOut();
    currentAuthUserId = null;
    throw new Error(NO_CLASS_MESSAGE);
  }
  if (!ALLOWED_CLASSES.includes(who.class_code.toLowerCase())) {
    await supabase.auth.signOut();
    currentAuthUserId = null;
    throw new Error(CLASS_RESTRICTION_MESSAGE);
  }

  currentAuthUserId = authUser.id;

  let progress = loadProgress(authUser.id);
  if (!progress) {
    progress = emptyProgress(who.name, who.class_code);
  } else {
    // a névsor / osztály a közös rendszer szerint a mérvadó
    progress.name = who.name || progress.name;
    progress.classCode = who.class_code;
  }
  saveProgress(authUser.id, progress);
  return toStudentData(progress);
};

/** Bejelentkezés a közös Supabase Auth-tal. */
export const signIn = async (email: string, password: string): Promise<StudentData> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    // magyarosított gyakori hiba
    if (/invalid login credentials/i.test(error.message)) {
      throw new Error('Hibás e-mail vagy jelszó.');
    }
    throw new Error(error.message);
  }
  const student = await hydrate();
  if (!student) throw new Error('Sikertelen azonosítás. Próbáld újra.');
  return student;
};

/** App-indításkor: meglévő munkamenet visszaállítása. */
export const restoreSession = async (): Promise<StudentData | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data?.session) return null;
    return await hydrate();
  } catch (e) {
    console.warn('Munkamenet visszaállítás sikertelen:', e);
    try {
      await supabase.auth.signOut();
    } catch {
      /* noop */
    }
    return null;
  }
};

export const signOutStudent = async (): Promise<void> => {
  currentAuthUserId = null;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Kijelentkezési hiba:', e);
  }
};

/** Első belépéskor kiválasztott kaszt mentése a helyi haladásba. */
export const saveCharacter = (cls: CharacterClass): void => {
  if (!currentAuthUserId) return;
  const p = loadProgress(currentAuthUserId);
  if (!p) return;
  p.characterType = cls;
  saveProgress(currentAuthUserId, p);
};

// --- PONTOK BEKÜLDÉSE ------------------------------------------------------

type Category = 'ora' | 'feladat' | 'projektfeladat' | 'temazaro';

interface SchoolMapping {
  topic: string;
  item: string;
  category: Category;
  note: string;
}

/** Kepler missionId -> közös iskolai rendszer témakör/kategória. `null` = nem megy át. */
const SCHOOL_MAP: Record<string, SchoolMapping> = {
  sm1_physics_quiz: { topic: 'Dinamika – Erőhatások', item: 'sm1', category: 'feladat', note: 'OP-01 Roncsderbi' },
  sm2_inertia: { topic: 'Dinamika – Tehetetlenség (Newton I.)', item: 'sm2', category: 'feladat', note: 'OP-02 Inerciarendszerek' },
  sm4_arcade_game: { topic: 'Dinamika – Newton II.', item: 'sm4', category: 'feladat', note: 'OP-04 Aszteroida mező' },
  sm3_rocket: { topic: 'Dinamika – Hatás-ellenhatás (Newton III.)', item: 'sm3_rocket', category: 'feladat', note: 'OP-03 Rugós rakéta' },
  sm3_billiards: { topic: 'Dinamika – Lendület, ütközés', item: 'sm5_billiards', category: 'feladat', note: 'OP-05 Newton biliárd' },
  sm6_air_resistance: { topic: 'Dinamika – Közegellenállás', item: 'sm6', category: 'feladat', note: 'OP-06 Aerodinamika' },
  PROJECT: { topic: 'Kutatási projekt', item: 'project', category: 'projektfeladat', note: 'Kepler kutatási projekt' },
  TESZT: { topic: 'Dinamika témazáró', item: 'exam', category: 'temazaro', note: 'Kepler záróvizsga' },
};

const submitToSchool = async (points: number, mapping: SchoolMapping): Promise<void> => {
  try {
    const { error } = await supabase.rpc('app_submit_score', {
      p_app: APP_ID,
      p_topic: mapping.topic,
      p_item: mapping.item,
      p_points: points,
      p_category: mapping.category,
      p_note: mapping.note,
      p_mode: 'highest',
    });
    if (error) console.warn('app_submit_score hiba:', error.message);
  } catch (e) {
    console.warn('app_submit_score kivétel:', e);
  }
};

const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

/**
 * Küldetés-haladás rögzítése.
 * A szignatúra változatlan (a küldetés-komponensek ezt hívják).
 * 1) frissíti a helyi (localStorage) haladást a régi slot-leképezéssel,
 * 2) ismert küldetéshez csendben beküldi a pontot a közös iskolai rendszerbe is,
 * 3) visszaadja az új helyi összpontszámot.
 */
export const submitMissionProgress = async (
  name: string,
  points: number,
  missionId: string,
): Promise<number> => {
  console.log(`[API] ${name}: ${missionId} (+${points})`);

  // Offline zsűri-teszt: nincs DB, nincs beküldés
  if (name.includes('TesztPista')) {
    return 100 + points;
  }

  if (!currentAuthUserId) {
    console.warn('Nincs bejelentkezett diák, a pont nem menthető.');
    return 0;
  }

  const progress = loadProgress(currentAuthUserId) || emptyProgress(name, ALLOWED_CLASSES[0]);
  const lessons = [...progress.scores.lessons];
  const homework = [...progress.scores.homework];
  let project = progress.scores.project;
  let exam = progress.scores.exam;
  let completedMissions = [...progress.completedMissions];

  // --- MISSION -> DB MEZŐ (a régi logika megtartva) ---
  if (missionId === 'sm1_physics_quiz') {
    homework[0] = Math.max(homework[0] || 0, points);
  } else if (missionId === 'sm2_inertia') {
    homework[1] = Math.max(homework[1] || 0, points);
  } else if (missionId === 'sm3_billiards') {
    homework[2] = Math.max(homework[2] || 0, points);
  } else if (missionId === 'sm3_rocket') {
    homework[4] = Math.max(homework[4] || 0, points);
  } else if (missionId === 'sm6_air_resistance') {
    homework[5] = Math.max(homework[5] || 0, points);
  } else if (missionId === 'sm4_arcade_game') {
    homework[3] = Math.max(homework[3] || 0, points);
  } else if (missionId === 'PROJECT') {
    project = Math.max(project, points);
  } else if (missionId === 'TESZT') {
    exam = Math.max(exam, points);
  } else {
    // Egyéb pontok (chatbot jutalom, stb.) — csak helyben, a közös rendszerbe nem megy
    lessons[0] = (lessons[0] || 0) + points;
  }

  // --- Teljesítés-küszöbök (a régi logika megtartva) ---
  let shouldMarkComplete = true;
  if (missionId === 'sm4_arcade_game' && points < 8) shouldMarkComplete = false;
  if (missionId === 'sm3_billiards' && points < 10) shouldMarkComplete = false;
  if (missionId === 'sm3_rocket' && points < 5) shouldMarkComplete = false;
  if (missionId === 'sm6_air_resistance' && points < 9) shouldMarkComplete = false;

  if (
    shouldMarkComplete &&
    !completedMissions.includes(missionId) &&
    !missionId.startsWith('admin') &&
    !missionId.startsWith('chat')
  ) {
    completedMissions = [...completedMissions, missionId];
  }

  const newTotalPoints = sumArray(lessons) + sumArray(homework) + project + exam;

  const updated: LocalProgress = {
    ...progress,
    totalPoints: newTotalPoints,
    scores: { lessons, homework, project, exam },
    completedMissions,
  };
  saveProgress(currentAuthUserId, updated);

  // --- Csendes beküldés a közös iskolai rendszerbe ---
  const mapping = SCHOOL_MAP[missionId];
  if (mapping && points > 0) {
    await submitToSchool(points, mapping);
  }

  return newTotalPoints;
};

/** A tanári/ranglista funkciók a közös rendszerben vannak. */
export const getAdminSheetLink = () => 'https://fizika-pontkoveto.vercel.app';
