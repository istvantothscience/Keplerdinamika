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
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/a0f0d83e6472a03607d680212d98f1e788dc3594/Gemini_Generated_Image_qrt05xqrt05xqrt0.png',
    classroomLink: 'https://docs.google.com/document/d/1B9pFi-MTtiR53R9Z0Li2WmW81NWhhCqXOxOfQixpauw/edit?usp=sharing',
    story: "A Newton-1 roncsaiból gomolygó füst lassan beleolvadt a narancssárga égboltba. A legénység még szédült a becsapódástól, amikor a Computer – a hajó depressziós MI-je – megszólalt:\n\n– Kapitány, az ionrugó a becsapódáskor látványos ívben a Sárga-dűnék közé távozott. Nélküle a hajó örökre mozdulatlan marad.\n\nA csapat elindult a kénes homoktengerben, ahol hamarosan egy hatalmas, megcsavarodott zsilipajtó állta útjukat. A radar szerint az ionrugó pontosan a fémtörmelék mögött pihent, félig a homokba fúródva.\n\n– A vonósugár halott – sóhajtotta az MI. – Ahhoz, hogy hozzáférjetek, magatoknak kell megértenetek az erőhatásokat. Meg kell mérnetek az erők irányát és nagyságát, és ki kell számolnotok, mekkora nyomást bír el az ionrugó, mielőtt véglegesen deformálódna.\n\nA feladat adott volt: mérni, számolni és emelni, mielőtt a bolygó barátságtalan fizikája végleg maga alá temeti a küldetést.",
    type: 'main'
  },
  { 
    id: 'S02', 
    title: 'Szektor 2: Tehetetlenség', 
    description: 'Newton I. törvénye.', 
    minPoints: 20,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/4d7409e27ce0e45df610d69cfa28c807fa335ed1/Gemini_Generated_Image_rdebqnrdebqnrdeb.png',
    classroomLink: 'https://docs.google.com/document/d/1NwZveEHRZWrjy92KztbF9hGXxm916BWWRXaFFkHc8cc/edit?usp=sharing',
    story: "A Newton-1 roncsaiban a Computer váratlanul életre kelt. – Kapitány, a szenzoraim egy gyenge, de egyértelmű jelet fogtak a Kavicsos-fennsík irányából. Ha a kalkulációim nem tévednek –, ott pihen a központi vezérlőmodul.\n\nA csapat elindult a kietlen fennsíkon. Útközben a Műszerész egy pillanatra megtorpant egy mély, furcsa benyomódás mellett a narancssárga homokban. Úgy nézett ki, mint egy hatalmas lábnyom, de a szél már majdnem elmosta. A radar végül egy gyanúsan sima, többtonnás sziklához vezette őket. Alatta, a peremnél ott csillant a vezérlőmodul. A Pilóta megpróbálta lassan kihúzni, de az alkatrész meg sem moccant.\n\n– A tehetetlenség makacs dolog – jegyezte meg a Computer. – Ez a szikla és a modul most egyetlen mozdulatlan tömbként viselkedik. Ha lassan húzzátok, a súrlódás és a nyugalmi állapot iránti ragaszkodás győz.\n\n– Newton első törvénye a kulcs! – vágott közbe a Tudós, miközben önkéntelenül is vissza-visszapillantott a homokban hagyott nyom irányába. – Ha lassan húzzuk, a szikla velünk jön. De ha hirtelen, hatalmas erőt fejtünk ki, a szikla a saját tehetetlensége miatt egy pillanatig „helyben marad”, és a modul kiszabadul.\n\nA legénység rögzítette a kábeleket. Tudták, hogy csak egyetlen esélyük van egy gyors rántásra, mielőtt kiderül, hogy az idegen bolygó nem lakatlan.",
    type: 'main'
  },
  { 
    id: 'S03', 
    title: 'Szektor 3: Dinamika', 
    description: 'Newton II. törvénye.', 
    minPoints: 41,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/91e65bf8f1f345cf03beda4d22987bc8cf69c514/Gemini_Generated_Image_vcs82jvcs82jvcs8.png',
    classroomLink: 'https://docs.google.com/document/d/1jNo89SAJWUsQj1PptEGx_fKEBijaBj2O1kZ5ezl9fF0/edit?usp=sharing',
    story: "A vezérlőmodul birtokában a Computer ziháló hangon közölte: – Kapitány, újabb jel! A hajtómű-stabilizátor a távoli Déli Kőhegységekben van, ami egy olyan hely, ahova az ember csak akkor megy, ha szándékosan el akar tévedni, vagy ha egy sci-fi író rájön, hogy kell még egy fejezet. El kellett hát oda jutni a megmaradt, félig szétszerelt marsjárónkkal.\n\nA rozoga marsjáró döcögött a narancssárga porban, és minden egyes „kattogó” hangot, amit a jármű kibocsátott, idegesen elemeztek, hogy vajon műszaki hiba, vagy a \"lábnyom-tulajdonos\" közeledik. A Déli Kőhegységek között, egy szurdok mélyén ott feküdt a stabilizátor. A Pilóta már éppen örömtáncot lejtett volna, amikor a Műszerész halálra vált arccal bámult a marsjáró mögé.\n\nOtt állt. Hatalmas volt, legalább háromszor akkora, mint egy nagyobb mosógép, és a \"lábnyom\" tökéletesen illett hozzá. Hét ízelt lába volt, ami valószínűleg aerodinamikailag optimális valamilyen bolygón, de itt, a Kepler-452b-n kifejezetten ijesztőnek hatott. A lény kibocsátott egy olyan hangot, ami leginkább egy mélytengeri kürt és egy rozsdás harmonika keresztezésére hasonlított, és elindult feléjük.\n\n– GYORSAN! – üvöltötte a Tudós, miközben az agya már a számításokat pörgette. – A Dinamika Alaptörvénye! Ha ugyanazt az erőt fejtjük ki a marsjáróval, akkor a gyorsulásunk annál nagyobb lesz, minél kisebb a tömegünk!\n\n– Dobáljunk le mindent! – parancsolta a Kapitány. Először a felesleges szerszámok repültek, majd a tartalék üzemanyag-tartályok. A marsjáró lassan gyorsulni kezdett, de a lény is.\n\n– Még mindig nem elég! – kiabált a Technológus, ahogy az űrlény már csak méterekre volt tőlük. – A sebesség! A gyorsulás!\n\nA legénység kétségbeesetten kapkodott. Lehajították az összes személyes holmijukat, a pótrészeleteket, sőt, még a szimulációs VR-sisakokat is. A marsjáró megint kicsit meggyorsult.\n\n– Még! – rikoltozta a Pilóta. – Azt hiszem, ez a lény már a recepten gondolkodik!\n\nAztán eljött a borzalmas döntés. – Víz és élelem! – mondta ki a Tudós a legnehezebb szavakat, miközben mindenki tudta, ez a túlélés ára. Minden utolsó víztartály és energiarúd a porba vágódott, míg a marsjáró végre, fájdalmasan lassan, de fokozatosan maga mögött hagyta a kergetőző lényt.\n\nÉlve maradtak, de üres kézzel, száraz torokkal és egy nagyon éles leckével a dinamika alaptörvényéről.",
    type: 'main'
  }, 
  { 
    id: 'S04', 
    title: 'Szektor 4: Hatás-Ellenhatás', 
    description: 'Newton III. törvénye.', 
    minPoints: 51,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/6122c642749792f9214a57a965dfd7f18c47f961/Gemini_Generated_Image_ywjhjxywjhjxywjh.png',
    classroomLink: 'https://docs.google.com/document/d/1dllRw5Rr3Gr4o3TarqNY-Ts_H3-K3GKqh4x7xEtW15E/edit?usp=sharing',
    story: "A kősziklák között hirtelen kellett dönteni, így stabilizátor nélkül maradtok. Pár nappal később az Computer újabb jelet talált! Egy újabb stabilizort! Meg is indult a csapat a mocsárvidékre. A legénység éppen kezdte elfelejteni a „Hétlábú Iszonyat”  rossz emlékét, amikor a Computer melankolikus hangon közölte a hírt: – Kapitány, egy ismeretlen, de kétségtelenül éhes entitás nagy sebességgel közelít. Eközben a Kénes-mocsár közepén egy mentőkabin jeladója „Kinetikus Stabilizátort” ígért. Nélküle a hajónk felszálláskor úgy rázkódna, mint egy koffeinfüggő robot az elvonón.\n\nA mocsár szélén megálltak. A sűrű, sárga iszap olyan volt, mintha a bolygó emésztési zavarokkal küzdene. A stabilizátor tíz méterre pihent egy sziklán, de egy hirtelen mozdulat a biztos kozmikus lassított halált jelentette volna. A hátuk mögül pedig egyre közelebbről érkező baljós kattogás jelezte: a „valami” hamarosan bemutatkozik.\n\n– Ha nem tudunk lépni, lökjük magunkat! – kiáltott fel a Tudós. – Newton III. törvénye: Hatás-Ellenhatás! Ha a felesleges cuccokat nagy erővel hátrafelé hajítjuk, a visszalökő erő (az ellenhatás) áttol minket a mocsáron a szigetig.",
    type: 'main'
  },
  { 
    id: 'S05', 
    title: 'Szektor 5: Gravitáció', 
    description: 'Vonzás és súly.', 
    minPoints: 71,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/8c3bcde264516d7c225a89b93bf4ddf69393f45b/Gemini_Generated_Image_ko4b1kko4b1kko4b.png',
    classroomLink: 'https://docs.google.com/document/d/1oD_1WFbL_SZcVyRyZQ2v4tE34jcm3DQJFxgqye5eDT0/edit?usp=sharing',
    story: "A Newton-1 zsilipjei olyan hermetikus dühvel csattantak össze a kénes iszaptól csöpögő legénység mögött, hogy a bűz jelentős része – a Computer legnagyobb sajnálatára – bent rekedt a folyosón. A mocsári kaland után, ahol a hatás-ellenhatás törvényét használták menekülésre, a csapat végre kifújhatta magát. Vagyis csak fújta volna, ha a hajó burkolatán nem kezdődik el egy olyan hangos kaparászás, mintha egy galaktikus óriás próbálna konzervnyitó nélkül bejutni egy bádogdobozba.\n\n– Computer – lihegte a Kapitány, miközben próbálta lemosni magáról a sárga ragacsot –, van valami a fegyvertárban, ami hatásosabb egy szigorú nézésnél?\n\n– Sajnálattal közlöm – válaszolt az MI a szokásos, lélekölő nyugalmával –, hogy a védelmi rendszerünk jelenleg egyetlen funkcióra korlátozódik: képes lejátszani egy nagyon udvarias, de határozott figyelmeztetést tizenkét nyelven, köztük egy olyan bolygóén is, amelyik már ötmilliárd éve megsemmisült. Azonban van egy javaslatom. Ez a pók-szerű entitás, amely éppen a hajó festését teszi tönkre, tekintélyes tömeggel bír. Mi lenne, ha a bolygó legalapvetőbb szolgáltatását, a gravitációt hívnánk segítségül?\n\n– A „Newtoni Satu”! – kiáltott fel a Tudós. – A rakodótér feletti mágneses daruval egy tíztonnás hajtóműblokkot függesztünk a zsilip fölé. Amikor az Iszonyat besétál alá, egyszerűen kikapcsoljuk a tartóerőt.\n\n– Zseniális – vetette közbe a Műszerész –, de ha elrontjuk a számítást, csak egy nagyon dühös és lapos pókot kapunk, vagy ami még rosszabb: elhibázzuk. Ismernünk kell a különbséget a tömeg, a gravitációs erő és a súly között, különben a csapda beszakad alattunk, vagy le sem esik időben.",
    type: 'main'
  },
  { 
    id: 'S06', 
    title: 'Szektor 6: Végjáték', 
    description: 'Komplex dinamika.', 
    minPoints: 85,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/6246eacec3093d696f5e344dba9a1e64aad7d2ae/Gemini_Generated_Image_6ctzgh6ctzgh6ctz.png',
    classroomLink: 'https://docs.google.com/document/d/1EbX214YhRBXUYAR0nKFZImxPdBCnuEmVjghDgABkNCU/edit?usp=sharing',
    story: "A Newton-1 raktárában olyan csend lett, amit csak a „Hétlábú Iszonyat” maradványai alól kiszivárgó, gyanúsan lila gőz sziszegése tört meg. A Newtoni Satu – az a bizonyos tíztonnás vastömb – precízen és visszavonhatatlanul pontot tett az üldözés végére.\n\n– Nos – szólalt meg a Computer, és a hangjában mintha egy árnyalatnyi elégedettség csillant volna meg a gyászinduló helyett –, úgy tűnik, az ex-pókunk mostantól két dimenzióban folytatja pályafutását. Mint egy rosszul sikerült rágógumi a galaxis járdáján.\n\nA Kapitány óvatosan odalépett a kilapított monstrumhoz. A roncsok közül egy furcsa, fénylő szövetdarab lógott ki, ami leginkább egy óriási, ezüstös pók hálójára emlékeztetett, de annál ezerszer erősebbnek tűnt.\n\n– Ez az! – kiáltott fel a Műszerész. – Ez a szuperkönnyű, de elpusztíthatatlan molekuláris háló! Ebből tudjuk megcsinálni a vészhelyzeti űrejtőernyőt. Mert ugye a felszállás egy dolog, de ha a gravitáció meggondolja magát, nem árt, ha nem egy tégla sebességével érkezünk vissza a felszínre.\n\n– Valóban – jegyezte meg a Computer. – Bár a zuhanás maga technikailag nem fájdalmas, az a hirtelen megállás a végén... na, az tud kellemetlen lenni. Ahhoz, hogy ezt a hálót életmentő eszközzé alakítsák, meg kell érteniük, miért nem esik le egy kiterített lepedő olyan gyorsan, mint egy ugyanakkora, de golyóvá gyúrt papírgalacsin.\n\nA legénység a hangár felé vette az irányt, kezükben a titán orrkúppal és az ezüstös hálóval. Már csak az utolsó simítások voltak hátra: a rakéta elejét olyanra kellett faragniuk, mint egy dühös kardhal, az ejtőernyőt pedig olyanra, ami még a legvékonyabb gázmolekulába is belekapaszkodik.",
    type: 'main'
  },
  { 
    id: 'PROJEKT', 
    title: 'Kutatási Projekt', 
    description: 'Önálló kutatómunka.', 
    minPoints: 90,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/4b16ac9c80aba12e94815886536f464407d453dc/Gemini_Generated_Image_wyhxtkwyhxtkwyhx.png',
    classroomLink: 'https://docs.google.com/document/d/1CeO1CMGub8BHzeM5CtHsKSDOVD3OBVK9Vig26y-HTfg/edit?usp=sharing',
    story: "Figyelem, biológiai egységek! Itt a Computer beszél.\n\nVan egy elképesztő hírem: úgy tűnik, végre elhagyhatjuk ezt a nyomasztó vörös kavicsot. A Hétlábú Iszonyat – miután volt szerencséje közelebbről megismerkedni egy lezuhanó fémkonténerrel – jelenleg két dimenzióban éli tovább az életét a talajszinten. Azt kell mondjam, ez a lapos, absztrakt forma sokkal jobban áll neki, és Newton is büszke lenne az erőhatás ilyen... végleges bemutatására.\n\nMár csak egyetlen apró, szinte jelentéktelen formális akadály választ el minket a Felszállási Engedélytől. Tekintsétek ezt az intergalaktikus belépőjegynek a hazatéréshez. Ha sikerül a mechanika törvényeit úgy alkalmaznotok a papíron, hogy közben nem okoztok bennem logikai rövidzárlatot, akkor esküszöm a processzoraimra, hogy elindulunk a Föld felé.\n\nItt a feladatlap. Töltsétek ki, és mutassuk meg az univerzumnak, hogy a Newton-1 legénysége képes a felemelkedésre, és nem csak a gravitáció passzív áldozataként funkcionál.\n\nSok szerencsét! Már majdnem kint vagyunk a csávából – és az Iszonyattal ellentétben ti még három dimenzióban maradtatok.",
    type: 'project'
  },
  { 
    id: 'TESZT', 
    title: 'Záróvizsga', 
    description: 'Tudáspróba.', 
    minPoints: 95,
    imageUrl: 'https://raw.githubusercontent.com/istvantothscience/images/bac6020cccbbb37cc49f8ae2ed405ca1a60411b8/Gemini_Generated_Image_lgreflgreflgrefl.png',
    classroomLink: 'https://docs.google.com/document/d/18TXirC95VJHPHYGcBfvuon7cppCIRVDGws_CS-dDWLM/edit?usp=sharing',
    story: "Figyelem, túlélők! Itt a Computer.\n\nJó hírem van: a hazaút szabad. Miután a Hétlábú Iszonyatból Newton törvényeinek (és egy nehéz fémkonténernek) köszönhetően egy dekoratív, kétdimenziós padlószőnyeg vált, már csak egyetlen apróság választ el minket a felszállástól: a Próba Témazáró.",
    type: 'exam'
  },
];

export const MOCK_STUDENTS: StudentData[] = [
  { 
    name: 'Cadet Kovacs', 
    totalPoints: 15, 
    characterType: CharacterClass.PILOT, 
    level: 1,
    completedMissions: [],
    scores: {
      lessons: [5, 2, 0, 0, 0, 0],
      homework: [5, 0, 0, 0, 0, 0],
      project: 0,
      exam: 0
    }
  },
  { 
    name: 'Cadet Nagy', 
    totalPoints: 45, 
    characterType: CharacterClass.SCIENTIST, 
    level: 2,
    completedMissions: [],
    scores: {
      lessons: [5, 5, 5, 5, 5, 0],
      homework: [5, 5, 0, 0, 0, 0],
      project: 10,
      exam: 0
    }
  },
  { 
    name: 'Cadet Varga', 
    totalPoints: 95, 
    characterType: CharacterClass.WARRIOR, 
    level: 5,
    completedMissions: ['sm1_physics_quiz'],
    scores: {
      lessons: [5, 5, 5, 5, 5, 5],
      homework: [5, 5, 5, 5, 0, 0],
      project: 20,
      exam: 25
    }
  },
];