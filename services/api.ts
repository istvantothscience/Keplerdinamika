import { StudentData, CharacterClass } from '../types';
import { calculateLevel, MOCK_STUDENTS } from '../constants';
import { supabase } from './supabaseClient';

/**
 * Maps Supabase DB row to StudentData interface
 */
const mapDbToStudent = (data: any): StudentData => {
  return {
    name: data.name,
    email: data.email,
    totalPoints: data.total_points,
    characterType: data.character_type as CharacterClass,
    level: calculateLevel(data.total_points),
    scores: {
      lessons: data.scores_lessons || [0,0,0,0,0,0],
      homework: data.scores_homework || [0,0,0,0,0,0],
      project: data.score_project || 0,
      exam: data.score_exam || 0
    },
    completedMissions: data.completed_missions || [],
    isAdmin: data.name.toLowerCase() === 'commander' // Simple check
  };
};

/**
 * Login using Supabase table query
 */
export const loginStudent = async (name: string, password: string): Promise<StudentData | null> => {
  console.log(`Attempting login for: ${name}`);

  // 1. Check for Admin Hardcoded (Optional safety net)
  if (name.toLowerCase() === 'commander' && password === 'admin') {
    return {
      name: 'Commander',
      totalPoints: 999,
      characterType: CharacterClass.WARRIOR,
      level: 5,
      scores: { lessons: [0,0,0,0,0,0], homework: [0,0,0,0,0,0], project: 0, exam: 0 },
      isAdmin: true,
      completedMissions: []
    };
  }

  // 2. Query Supabase
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('name', name) // Case insensitive match
      .eq('password', password)
      .single();

    if (error) {
      console.warn("Supabase Login Error:", error.message);
      return null;
    }

    if (data) {
      return mapDbToStudent(data);
    }
  } catch (err) {
    console.error("Connection error:", err);
  }

  return null;
};

/**
 * Register new student in Supabase
 */
export const registerStudent = async (name: string, email: string, password: string, charClass: CharacterClass): Promise<StudentData> => {
    console.log("Registering:", name, email, charClass);

    // Initial Empty State
    const newStudentDb = {
        name: name,
        email: email,
        password: password, // Storing plain text as requested
        character_type: charClass,
        total_points: 0,
        scores_lessons: [0,0,0,0,0,0],
        scores_homework: [0,0,0,0,0,0],
        score_project: 0,
        score_exam: 0,
        completed_missions: []
    };

    const { data, error } = await supabase
        .from('students')
        .insert([newStudentDb])
        .select()
        .single();

    if (error) {
        console.error("Registration Error:", error);
        throw new Error("Registration failed: " + error.message);
    }

    return mapDbToStudent(data);
};

/**
 * Updates points and mission status in Supabase
 * REFACTOR: Now calculates Total Points as a SUM of all components to ensure consistency.
 * Maps specific missions to specific Homework/Lesson slots.
 */
export const submitMissionProgress = async (name: string, points: number, missionId: string): Promise<number> => {
  console.log(`[API] Processing update for ${name}: Mission ${missionId}, Points ${points}`);

  if (name.includes('TesztPista')) {
      console.log('Test user detected, skipping DB update.');
      return 100 + points; // Return a fake total so UI doesn't reset to 0
  }

  // 1. Fetch current data to have the latest arrays
  const { data: currentData, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .eq('name', name)
      .single();

  if (fetchError || !currentData) {
      console.error("Could not fetch user for update", fetchError);
      return 0;
  }

  // 2. Prepare Data Structures (Create copies to avoid mutation issues)
  const lessons = [...(currentData.scores_lessons || [0,0,0,0,0,0])];
  const homework = [...(currentData.scores_homework || [0,0,0,0,0,0])];
  let project = currentData.score_project || 0;
  let exam = currentData.score_exam || 0;
  let completedMissions = currentData.completed_missions || [];

  // 3. MAP MISSIONS TO SPECIFIC DB FIELDS
  if (missionId === 'sm1_physics_quiz') {
      // Mission 1 -> Házi feladat 1 (Index 0)
      homework[0] = Math.max(homework[0], points);
  
  } else if (missionId === 'sm2_inertia') {
      // Mission 2 -> Házi feladat 2 (Index 1)
      homework[1] = Math.max(homework[1], points);
  
  } else if (missionId === 'sm3_billiards') {
      // Mission 3 -> Házi feladat 3 (Index 2)
      homework[2] = Math.max(homework[2], points);

  } else if (missionId === 'sm3_rocket') {
      // Mission 5 -> Házi feladat 5 (Index 4)
      homework[4] = Math.max(homework[4] || 0, points);

  } else if (missionId === 'sm6_air_resistance') {
      // Mission 6 -> Házi feladat 6 (Index 5)
      homework[5] = Math.max(homework[5] || 0, points);

  } else if (missionId === 'sm4_arcade_game') {
      // Mission 4 -> Házi feladat 4 (Index 3)
      homework[3] = Math.max(homework[3], points);

  } else if (missionId === 'PROJECT') {
      project = Math.max(project, points);

  } else if (missionId === 'TESZT') {
      exam = Math.max(exam, points);

  } else {
      // Egyéb pontok (pl. Chatbot jutalom, Admin manuális adás)
      lessons[0] = (lessons[0] || 0) + points;
  }

  // 4. Update Completed Missions List (if unique)
  // LOGIC UPDATE: Mission specific completion thresholds
  let shouldMarkComplete = true;
  
  // Mission 4: Requires >= 8 points
  if (missionId === 'sm4_arcade_game' && points < 8) {
      shouldMarkComplete = false;
  }
  
  // Mission 3: Requires max points (10)
  if (missionId === 'sm3_billiards' && points < 10) {
      shouldMarkComplete = false;
  }

  // Mission 5 (Rocket): Requires max points (5)
  if (missionId === 'sm3_rocket' && points < 5) {
      shouldMarkComplete = false;
  }

  // Mission 6 (Air Resistance): Requires max points (9)
  if (missionId === 'sm6_air_resistance' && points < 9) {
      shouldMarkComplete = false;
  }

  if (shouldMarkComplete && !completedMissions.includes(missionId) && !missionId.startsWith('admin') && !missionId.startsWith('chat')) {
      completedMissions = [...completedMissions, missionId];
  }

  // 5. RECALCULATE GRAND TOTAL
  // Total = Sum(Lessons) + Sum(Homework) + Project + Exam
  const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const newTotalPoints = sumArray(lessons) + sumArray(homework) + project + exam;

  // 6. Perform Database Update
  const { data: updatedData, error: updateError } = await supabase
      .from('students')
      .update({
          scores_lessons: lessons,
          scores_homework: homework,
          score_project: project,
          score_exam: exam,
          total_points: newTotalPoints,
          completed_missions: completedMissions
      })
      .eq('name', name)
      .select()
      .single();

  if (updateError) {
      console.error("Update failed", updateError);
      return currentData.total_points; // Return old total on error
  }

  return updatedData.total_points;
};

export const resetStudentProgress = async (name: string): Promise<boolean> => {
  console.log(`[API] Resetting progress for ${name}`);

  const { error } = await supabase
      .from('students')
      .update({
          scores_lessons: [0,0,0,0,0,0],
          scores_homework: [0,0,0,0,0,0],
          score_project: 0,
          score_exam: 0,
          total_points: 0,
          completed_missions: []
      })
      .eq('name', name);

  if (error) {
      console.error("Reset failed", error);
      return false;
  }

  return true;
};

export const getAdminSheetLink = () => "https://supabase.com/dashboard/project/zmzjnqvsywizojqoewus/editor";

export const getAllStudents = async (): Promise<StudentData[]> => {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('total_points', { ascending: false });

    if (error) {
        console.error("Fetch all failed", error);
        return MOCK_STUDENTS; // Fallback
    }

    return data.map(mapDbToStudent);
};