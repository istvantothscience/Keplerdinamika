import { CharacterClass, RankTitle, Mission, StudentData } from './types';

export const LEVEL_THRESHOLDS = {
  LVL1: 0,
  LVL2: 41,
  LVL3: 51,
  LVL4: 71,
  LVL5: 91
};

export const getRankTitle = (points: number): RankTitle => {
  if (points >= LEVEL_THRESHOLDS.LVL5) return RankTitle.COMMANDER;
  if (points >= LEVEL_THRESHOLDS.LVL4) return RankTitle.LIEUTENANT;
  if (points >= LEVEL_THRESHOLDS.LVL3) return RankTitle.OFFICER_CANDIDATE;
  if (points >= LEVEL_THRESHOLDS.LVL2) return RankTitle.CADET;
  return RankTitle.ROOKIE;
};

export const calculateLevel = (points: number): number => {
  if (points >= LEVEL_THRESHOLDS.LVL5) return 5;
  if (points >= LEVEL_THRESHOLDS.LVL4) return 4;
  if (points >= LEVEL_THRESHOLDS.LVL3) return 3;
  if (points >= LEVEL_THRESHOLDS.LVL2) return 2;
  return 1;
};

export const SECTORS: Mission[] = [
  { 
    id: 'S01', 
    title: 'Szektor 1: Az Erő', 
    description: 'Diagnosztika és Erőhatások.', 
    minPoints: 0,
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080',
    classroomLink: 'https://classroom.google.com/',
    story: "Üdvözlöm a Kepler-452b-n. A hajónk jelenleg úgy néz ki, mint egy konzervdoboz, amit egy fekete lyuk rágott meg, majd kiköpött. Az első feladatunk: rájönni, miért nem működik semmi. A diagnosztikai modul szerint az 'Erő' fogalma hiányzik az adatbázisból. Kérem, pótolja, mielőtt a létfenntartó rendszer is sztrájkba lép."
  },
  { 
    id: 'S02', 
    title: 'Szektor 2: Tehetetlenség', 
    description: 'Newton I. törvénye.', 
    minPoints: 20,
    imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=1080',
    classroomLink: 'https://classroom.google.com/',
    story: "A hajtóműveink leálltak, de a hajó még mindig sodródik. Newton I. törvénye szerint ez így is marad, amíg neki nem megyünk valaminek. Ami valószínűleg egy aszteroida lesz. A számításaim szerint 99.9% az esélye a végzetes ütközésnek, de ne hagyja, hogy ez elrontsa a kedvét. Tanulmányozza a tehetetlenséget!"
  },
  { 
    id: 'S03', 
    title: 'Szektor 3: Dinamika', 
    description: 'Newton II. törvénye.', 
    minPoints: 41,
    imageUrl: 'https://images.unsplash.com/photo-1614728853911-53e3d2f9b252?q=80&w=1080',
    classroomLink: 'https://classroom.google.com/',
    story: "Sikerült beindítani egy segédhajtóművet! Most már csak azt kell kiszámolni, mekkora Erő (F) kell ahhoz, hogy ezt a Tömegű (m) roncshalmazt Gyorsulásra (a) bírjuk. Ha elvéti a képletet, a Napba zuhanunk. Nincs nyomás."
  }, 
  { 
    id: 'S04', 
    title: 'Szektor 4: Gravitáció', 
    description: 'Vonzás és súly.', 
    minPoints: 51,
    imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1080',
    classroomLink: 'https://classroom.google.com/',
    story: "A bolygó felszíne felé zuhanunk. A jó hír: van gravitáció. A rossz hír: van gravitáció. Ideje megtanulni a különbséget a tömeg és a súly között, különben nagyon laposak leszünk a földetérésnél."
  },
  { 
    id: 'S05', 
    title: 'Szektor 5: Súrlódás', 
    description: 'Ellenállás és mozgás.', 
    minPoints: 71,
    imageUrl: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=1080',
    classroomLink: 'https://classroom.google.com/',
    story: "Sikeresen landoltunk (értsd: becsapódtunk). Most el kell húznunk a roncsokat a bázisig. A talaj azonban nem egyezik bele. Súrlódás. Tapad. Csúszik. Vagyis nem csúszik. Oldja meg, Kadét."
  },
  { 
    id: 'S06', 
    title: 'Szektor 6: Végjáték', 
    description: 'Komplex dinamika.', 
    minPoints: 91,
    imageUrl: 'https://images.unsplash.com/photo-1454789548728-85d2696cf667?q=80&w=1080',
    classroomLink: 'https://classroom.google.com/',
    story: "Gratulálok. Túléltük. Már csak a végső vizsga van hátra, hogy bebizonyítsa, nem csak a szerencsének köszönhetően vagyunk életben. A rendszer teljes kapacitással üzemel. Indítsa a szimulációt."
  },
];

export const MOCK_STUDENTS: StudentData[] = [
  { 
    name: 'Cadet Kovacs', 
    totalPoints: 15, 
    characterType: CharacterClass.PILOT, 
    level: 1,
    scores: {
      lessons: [5, 2, 0, 0, 0, 0],
      homework: 5,
      project: 3,
      exam: 0
    }
  },
  { 
    name: 'Cadet Nagy', 
    totalPoints: 45, 
    characterType: CharacterClass.SCIENTIST, 
    level: 2,
    scores: {
      lessons: [5, 5, 5, 5, 5, 0],
      homework: 10,
      project: 10,
      exam: 0
    }
  },
  { 
    name: 'Cadet Varga', 
    totalPoints: 95, 
    characterType: CharacterClass.WARRIOR, 
    level: 5,
    scores: {
      lessons: [5, 5, 5, 5, 5, 5],
      homework: 20,
      project: 20,
      exam: 25
    }
  },
];