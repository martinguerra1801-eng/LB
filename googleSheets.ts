import { rawQuestions } from "./questions";
// Firebase/Firestore desactivado: el envío real va a Google Sheets vía Apps Script (App.tsx).

export interface Submission {
  id: string;
  email: string;
  fullName: string; // Keep for fallback compatibility
  schoolNumber?: string;
  department?: string;
  group?: string;
  teacherName?: string;
  timestamp: string; // ISO String
  answers: { [questionId: number]: string };
  score: number; // Correct answers count (out of 50)
  isPerfect: boolean; // score === 50
  correctDetails: { [questionId: number]: boolean }; // Map of questionId -> wasCorrect
  syncedToGoogleSheets?: boolean;
}

// Seed data of realistic Uruguayan students from Ceibal ecosystem
export const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "sub_1",
    email: "mariasosa@ceibal.edu.uy",
    fullName: "María Sosa",
    timestamp: "2026-07-10T08:00:15.000Z",
    score: 50,
    isPerfect: true,
    answers: {}, // filled in code if needed
    correctDetails: {}
  },
  {
    id: "sub_2",
    email: "juan.perez@ceibal.edu.uy",
    fullName: "Juan Pérez",
    timestamp: "2026-07-10T08:05:22.000Z",
    score: 48,
    isPerfect: false,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_3",
    email: "valentinarodriguez@ceibal.edu.uy",
    fullName: "Valentina Rodríguez",
    timestamp: "2026-07-10T08:08:40.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_4",
    email: "lucas_silva@ceibal.edu.uy",
    fullName: "Lucas Silva",
    timestamp: "2026-07-10T08:12:11.000Z",
    score: 45,
    isPerfect: false,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_5",
    email: "sofiagomez@ceibal.edu.uy",
    fullName: "Sofía Gómez",
    timestamp: "2026-07-10T08:14:30.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_6",
    email: "mateogonzalez@ceibal.edu.uy",
    fullName: "Mateo González",
    timestamp: "2026-07-10T08:20:05.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_7",
    email: "camila_diaz@ceibal.edu.uy",
    fullName: "Camila Díaz",
    timestamp: "2026-07-10T08:22:45.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_8",
    email: "nicolasfernandez@ceibal.edu.uy",
    fullName: "Nicolás Fernández",
    timestamp: "2026-07-10T08:28:10.000Z",
    score: 49,
    isPerfect: false,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_9",
    email: "agustin_martinez@ceibal.edu.uy",
    fullName: "Agustín Martínez",
    timestamp: "2026-07-10T08:30:15.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_10",
    email: "florenciaacosta@ceibal.edu.uy",
    fullName: "Florencia Acosta",
    timestamp: "2026-07-10T08:35:50.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_11",
    email: "joaquinsanchez@ceibal.edu.uy",
    fullName: "Joaquín Sánchez",
    timestamp: "2026-07-10T08:40:12.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_12",
    email: "martinaruiz@ceibal.edu.uy",
    fullName: "Martina Ruiz",
    timestamp: "2026-07-10T08:45:30.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_13",
    email: "brunolopez@ceibal.edu.uy",
    fullName: "Bruno López",
    timestamp: "2026-07-10T08:50:00.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  },
  {
    id: "sub_14",
    email: "emiliamendez@ceibal.edu.uy",
    fullName: "Emilia Méndez",
    timestamp: "2026-07-10T08:55:00.000Z",
    score: 50,
    isPerfect: true,
    answers: {},
    correctDetails: {}
  }
];

// Helper to get submissions from localStorage with fallback to Seed Submissions
export function getSubmissions(): Submission[] {
  const stored = localStorage.getItem("little_bridge_submissions");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure existing items have the new fields so TypeScript won't choke
      return parsed.map((sub: any, index: number) => ({
        ...sub,
        schoolNumber: sub.schoolNumber || `Escuela N° ${(index * 13 + 5) % 200 + 1}`,
        department: sub.department || ["Montevideo", "Canelones", "Maldonado", "Rocha", "Colonia", "Salto"][index % 6],
        group: sub.group || `${(index % 3) + 4}to ${["A", "B", "C"][index % 3]}`,
        teacherName: sub.teacherName || sub.fullName || "Docente Ceibal",
      }));
    } catch (e) {
      console.error("Error reading submissions", e);
    }
  }

  // Populate answer maps for seed submissions to make them valid
  const seedWithDetails = SEED_SUBMISSIONS.map((sub, index) => {
    const answers: { [key: number]: string } = {};
    const correctDetails: { [key: number]: boolean } = {};
    
    rawQuestions.forEach(q => {
      if (sub.isPerfect) {
        answers[q.id] = q.correctAnswer;
        correctDetails[q.id] = true;
      } else {
        // Calculate if this question should be correct based on a deterministic distribution
        const isCorrect = (q.id <= sub.score);
        answers[q.id] = isCorrect ? q.correctAnswer : q.distractors[0];
        correctDetails[q.id] = isCorrect;
      }
    });

    return {
      ...sub,
      schoolNumber: `Escuela N° ${(index * 13 + 5) % 200 + 1}`,
      department: ["Montevideo", "Canelones", "Maldonado", "Rocha", "Colonia", "Salto"][index % 6],
      group: `${(index % 3) + 4}to ${["A", "B", "C"][index % 3]}`,
      teacherName: sub.fullName || "Docente Ceibal",
      answers,
      correctDetails
    };
  });

  localStorage.setItem("little_bridge_submissions", JSON.stringify(seedWithDetails));
  return seedWithDetails;
}

export function saveSubmission(submission: Submission): Submission[] {
  const current = getSubmissions();
  // Check if email already submitted
  const existsIdx = current.findIndex(s => s.email.toLowerCase() === submission.email.toLowerCase());
  if (existsIdx !== -1) {
    current[existsIdx] = submission;
  } else {
    current.push(submission);
  }
  localStorage.setItem("little_bridge_submissions", JSON.stringify(current));
  
  // Background async save to Firestore
  saveSubmissionToFirestore(submission);

  return current;
}

// Firestore desactivado. Se mantiene la firma para no romper las llamadas
// existentes en App.tsx, pero no hace nada: el envío a la planilla se realiza
// directamente desde App.tsx (fetch al Apps Script).
export async function saveSubmissionToFirestore(_submission: Submission) {
  return;
}

// Function to convert submissions to a CSV/Excel string
export function exportToCSV(submissions: Submission[], questionsList: any[]): string {
  // We want to generate a CSV file with:
  // - Escuela N°
  // - Departamento
  // - Grupo
  // - Nombre Docente de Aula
  // - Email
  // - Fecha de Envío
  // - Respuestas Correctas (X de 50)
  // - ¿Todas Correctas? (SÍ / NO)
  // - ¿Entra entre los 3 Ganadores? (SÍ / NO)
  // - Plus 50 columns for each question's answer and whether it was correct!
  
  // 1. Sort submissions by timestamp to determine the first 3 perfect ones
  const perfectSubmissions = [...submissions]
    .filter(s => s.isPerfect)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const winnerEmails = new Set(perfectSubmissions.slice(0, 3).map(s => s.email.toLowerCase()));

  // Headers
  const headers = [
    "Nro de Registro",
    "Escuela N°",
    "Departamento",
    "Grupo",
    "Nombre de la Docente de Aula",
    "Email Docente",
    "Fecha y Hora",
    "Respuestas Correctas (sobre 50)",
    "Puntaje Perfecto (50/50)",
    "Es Ganador (Top 3 Primero en Entregar)",
  ];

  // Add question columns
  questionsList.forEach(q => {
    headers.push(`P${q.id}: ${q.question.replace(/"/g, '""')}`);
    headers.push(`P${q.id} Resultado`);
  });

  const rows = submissions.map((sub, index) => {
    const isWinner = sub.isPerfect && winnerEmails.has(sub.email.toLowerCase());
    const row = [
      index + 1,
      sub.schoolNumber || `N° ${(index * 13 + 5) % 200 + 1}`,
      sub.department || "Montevideo",
      sub.group || "4to A",
      sub.teacherName || sub.fullName || "Docente Ceibal",
      sub.email,
      new Date(sub.timestamp).toLocaleString("es-UY"),
      `${sub.score} / 50`,
      sub.isPerfect ? "SÍ" : "NO",
      isWinner ? "SÍ (GANADOR)" : "NO"
    ];

    // Add answers and correctness
    questionsList.forEach(q => {
      const ans = sub.answers[q.id] || "";
      const wasCorrect = sub.correctDetails[q.id] || false;
      row.push(ans.replace(/"/g, '""'));
      row.push(wasCorrect ? "Correcta" : "Incorrecta");
    });

    return row.map(val => `"${val}"`).join(",");
  });

  // Excel BOM for Spanish character support (UTF-8)
  const BOM = "\uFEFF";
  return BOM + [headers.map(h => `"${h}"`).join(","), ...rows].join("\n");
}
