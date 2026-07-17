import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy,
  Download,
  Mail,
  User,
  Users,
  Settings,
  RefreshCw,
  Search,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Send,
  CheckCircle2,
  XCircle,
  Award,
  AlertCircle,
  Lock,
  Eye,
  Check,
  FileSpreadsheet,
  BookOpen,
  MapPin,
  GraduationCap,
  School,
  ClipboardList,
  Flame,
  SearchCode
} from "lucide-react";
import { questions, Question } from "./questions";
import { getSubmissions, saveSubmission, exportToCSV, Submission, saveSubmissionToFirestore } from "./submissions";
import { collection, onSnapshot, doc, setDoc } from "./lib/firestoreStub";
import { db } from "./lib/firebase";
import {
  initAuth,
  googleSignIn,
  logout,
  appendSubmissionToGoogleSheets,
  SPREADSHEET_ID
} from "./lib/googleSheets";

const URUGUAY_DEPARTMENTS = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres"
];

export default function App() {
  // Navigation views: "quiz", "result", "admin", "already-submitted"
  const [view, setView] = useState<"quiz" | "result" | "admin" | "already-submitted">("quiz");
  
  // Classroom Teacher Form State
  const [schoolNumber, setSchoolNumber] = useState(() => localStorage.getItem("ceibal_school_number") || "");
  const [department, setDepartment] = useState(() => localStorage.getItem("ceibal_department") || "Montevideo");
  const [group, setGroup] = useState(() => localStorage.getItem("ceibal_group") || "");
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem("ceibal_teacher_name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("ceibal_email") || "");
  
  // Quiz State
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem("ceibal_draft_answers");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [activeSection, setActiveSection] = useState(() => {
    const saved = localStorage.getItem("ceibal_active_section");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem("ceibal_school_number", schoolNumber);
  }, [schoolNumber]);

  useEffect(() => {
    localStorage.setItem("ceibal_department", department);
  }, [department]);

  useEffect(() => {
    localStorage.setItem("ceibal_group", group);
  }, [group]);

  useEffect(() => {
    localStorage.setItem("ceibal_teacher_name", teacherName);
  }, [teacherName]);

  useEffect(() => {
    localStorage.setItem("ceibal_email", email);
  }, [email]);

  useEffect(() => {
    localStorage.setItem("ceibal_draft_answers", JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    localStorage.setItem("ceibal_active_section", activeSection.toString());
  }, [activeSection]);
  
  // Google Auth & Sheets State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isSheetsSaving, setIsSheetsSaving] = useState(false);
  const [sheetsSyncError, setSheetsSyncError] = useState<string | null>(null);
  const [sheetsSyncSuccess, setSheetsSyncSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setSheetsSyncError(null);
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleAccessToken(result.accessToken);
        // Pre-fill fields
        if (result.user.displayName) {
          setTeacherName(result.user.displayName);
        }
        if (result.user.email) {
          setEmail(result.user.email);
        }
        return result.accessToken;
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setSheetsSyncError(err.message || String(err));
    }
    return null;
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setGoogleAccessToken(null);
  };

  // Bulk sync states for Google Sheets
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncProgress, setBulkSyncProgress] = useState(0);
  const [bulkSyncTotal, setBulkSyncTotal] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(() => {
    return localStorage.getItem("ceibal_is_testing_mode") === "true";
  });

  const handleBulkSync = async (passedToken?: string | null) => {
    const unsynced = submissions.filter(
      s => !isDemoSubmission(s.id) && !s.syncedToGoogleSheets
    );
    if (unsynced.length === 0) {
      alert("No hay respuestas de grupos pendientes por sincronizar.");
      return;
    }

    const token = passedToken || googleAccessToken;
    if (!token) {
      alert("Debes conectar tu cuenta de Google primero para poder sincronizar.");
      return;
    }

    setIsBulkSyncing(true);
    setBulkSyncTotal(unsynced.length);
    setBulkSyncProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < unsynced.length; i++) {
      const sub = unsynced[i];
      try {
        const res = await appendSubmissionToGoogleSheets(token, sub, directSpreadsheetId);
        if (res.success) {
          await saveSubmissionToFirestore({
            ...sub,
            syncedToGoogleSheets: true
          });
          successCount++;
        } else {
          failCount++;
          console.error("Failed to sync submission to Google Sheets:", sub.email, res.error);
        }
      } catch (err) {
        console.error("Error syncing submission:", sub.email, err);
        failCount++;
      }
      setBulkSyncProgress(i + 1);
    }

    setIsBulkSyncing(false);
    alert(`Sincronización finalizada.\n- Respuestas sincronizadas con éxito: ${successCount}\n- Respuestas fallidas: ${failCount}`);
  };
  
  // Admin & Database State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<Submission | null>(null);

  // Result State
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [sentEmailCopy, setSentEmailCopy] = useState(false);

  // Confirmation email template state
  const [emailSubject, setEmailSubject] = useState(() => localStorage.getItem("ceibal_email_subject") || "¡Confirmación de participación! Little Bridge Challenge 2026");
  const [emailBody, setEmailBody] = useState(() => localStorage.getItem("ceibal_email_body") || `Estimado/a docente {teacherName},

Confirmamos que el grupo {group} de la {schoolNumber} de {department} está participando en el Little Bridge Challenge 2026.

Agradecemos enormemente su compromiso y entusiasmo al liderar a sus alumnos en esta propuesta pedagógica.

Atentamente,
Equipo de Ceibal en Inglés
Little Bridge English & Ceibal`);
  const [isEditingEmailTemplate, setIsEditingEmailTemplate] = useState(false);

  useEffect(() => {
    localStorage.setItem("ceibal_email_subject", emailSubject);
  }, [emailSubject]);

  useEffect(() => {
    localStorage.setItem("ceibal_email_body", emailBody);
  }, [emailBody]);

  const getFormattedEmailBody = (sub: Submission) => {
    return emailBody
      .replace(/{teacherName}/g, sub.teacherName || sub.fullName || "")
      .replace(/{group}/g, sub.group || "")
      .replace(/{schoolNumber}/g, sub.schoolNumber || "")
      .replace(/{department}/g, sub.department || "");
  };

  // Google Sheets integration state.
  // Prioridad: variable de entorno (VITE_SHEETS_WEBHOOK_URL) > valor guardado en localStorage.
  // La URL es la del Apps Script implementado como Web App (termina en /exec).
  // URL del Apps Script (Web App) que recibe las respuestas y las escribe en la planilla.
  // Está fija acá para que funcione sin depender de variables de entorno ni de la config manual.
  const ENV_SHEETS_WEBHOOK_URL =
    (import.meta as any).env?.VITE_SHEETS_WEBHOOK_URL ||
    "https://script.google.com/a/macros/ceibal.edu.uy/s/AKfycbyX_rRAUU5XXdgoDKkiljUYG0xcrrvtVP9PtiR8nm9UnbAbx03xq7Hevw4-d2fxKuAfhA/exec";
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(
    () => ENV_SHEETS_WEBHOOK_URL || localStorage.getItem("ceibal_google_sheets_url") || ""
  );

  const handleSaveSheetsUrl = (url: string) => {
    setGoogleSheetsUrl(url);
    localStorage.setItem("ceibal_google_sheets_url", url.trim());
  };

  // Helper to extract Spreadsheet ID from URL or return raw ID
  const extractSpreadsheetId = (input: string): string => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  // Helper to check if a submission is a demo/seed submission
  const isDemoSubmission = (id: string): boolean => {
    return id.startsWith("sim_") || (id.startsWith("sub_") && id.length < 10);
  };

  // Direct Google Sheets API integration state
  const [directSpreadsheetId, setDirectSpreadsheetId] = useState<string>(() => 
    localStorage.getItem("ceibal_direct_spreadsheet_id") || "1gvaanALVlw8FGN5KM3j4x4-c7Xa1WoypksMStbz47pQ"
  );

  const handleSaveDirectSpreadsheetId = (value: string) => {
    const cleanId = extractSpreadsheetId(value);
    setDirectSpreadsheetId(cleanId);
    localStorage.setItem("ceibal_direct_spreadsheet_id", cleanId);
  };

  // Detect if url contains 'admin' or 'panel' query params or hashes to enable control features
  const isAdminMode = typeof window !== "undefined" && (
    window.location.search.toLowerCase().includes("admin") ||
    window.location.search.toLowerCase().includes("panel") ||
    window.location.hash.toLowerCase().includes("admin") ||
    window.location.hash.toLowerCase().includes("panel")
  );

  // Load submissions on mount and subscribe to Firestore
  useEffect(() => {
    const localSubs = getSubmissions();
    setSubmissions(localSubs);
    
    const unsubscribeSubmissions = onSnapshot(collection(db, "submissions"), (snapshot) => {
      const firestoreSubs: Submission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        firestoreSubs.push({
          id: data.id,
          email: data.email,
          fullName: data.fullName || data.teacherName,
          schoolNumber: data.schoolNumber,
          department: data.department,
          group: data.group,
          teacherName: data.teacherName || data.fullName,
          timestamp: data.timestamp,
          answers: data.answers,
          score: data.score,
          isPerfect: data.isPerfect,
          correctDetails: data.correctDetails,
          syncedToGoogleSheets: data.syncedToGoogleSheets || false
        } as Submission);
      });

      if (firestoreSubs.length > 0) {
        // Filter out local/seed submissions that are already present in Firestore (by email)
        const localOnly = localSubs.filter(ls => 
          !firestoreSubs.some(fs => fs.email.toLowerCase() === ls.email.toLowerCase())
        );
        // Combine real submissions and the seed/mock fallbacks
        const combined = [...firestoreSubs, ...localOnly];
        setSubmissions(combined);
      } else {
        setSubmissions(localSubs);
      }
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
    });

    // Listen to global app settings in Firestore
    const settingsDocRef = doc(db, "settings", "global");
    const unsubscribeSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (typeof data.isTestingMode === "boolean") {
          setIsTestingMode(data.isTestingMode);
          localStorage.setItem("ceibal_is_testing_mode", data.isTestingMode ? "true" : "false");
        }
      }
    }, (error) => {
      console.error("Error loading settings from Firestore:", error);
    });

    if (!isAdminMode && localStorage.getItem("ceibal_already_submitted") === "true") {
      const isTestModeOn = localStorage.getItem("ceibal_is_testing_mode") === "true";
      if (!isTestModeOn) {
        setView("already-submitted");
      }
    }

    return () => {
      unsubscribeSubmissions();
      unsubscribeSettings();
    };
  }, [isAdminMode]);

  // Handle live toggle transitions
  useEffect(() => {
    if (isTestingMode) {
      localStorage.removeItem("ceibal_already_submitted");
      if (view === "already-submitted") {
        setView("quiz");
      }
    }
  }, [isTestingMode, view]);

  // Prevent unauthorized access to administrative features
  useEffect(() => {
    if (view === "admin" && !isAdminMode) {
      setView("quiz");
    }
  }, [view, isAdminMode]);

  // Sections configuration (10 questions per section)
  const sections = [
    { id: 1, title: "Section 1: Characters and Places (1-10)", start: 1, end: 10 },
    { id: 2, title: "Section 2: Music, Tastes and Ages (11-20)", start: 11, end: 20 },
    { id: 3, title: "Section 3: School, Pets and Family (21-30)", start: 21, end: 30 },
    { id: 4, title: "Section 4: Mr Miller and Mrs MacKenzie (31-40)", start: 31, end: 40 },
    { id: 5, title: "Section 5: Ages, Siblings and Details (41-50)", start: 41, end: 50 },
  ];

  // Calculate progress
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  // Validation checks
  const isEmailValid = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };
  const isTeacherInfoComplete = 
    isEmailValid(email) && 
    teacherName.trim().length >= 3 &&
    schoolNumber.trim().length >= 1 &&
    group.trim().length >= 1;

  const isFormComplete = 
    answeredCount === totalQuestions && 
    isTeacherInfoComplete;

  // Change section and scroll to top smoothly
  const handleSectionChange = (sectionIndex: number) => {
    setActiveSection(sectionIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Select an option
  const handleSelectOption = (questionId: number, option: string) => {
    if (!isTeacherInfoComplete) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  // Jump to a specific question from navigation map
  const jumpToQuestion = (questionId: number) => {
    const sectionIndex = sections.findIndex(s => questionId >= s.start && questionId <= s.end);
    if (sectionIndex !== -1) {
      setActiveSection(sectionIndex);
      setTimeout(() => {
        const element = document.getElementById(`question-card-${questionId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  // Submit Form
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate score
      let score = 0;
      const correctDetails: Record<number, boolean> = {};
      
      questions.forEach(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correctAnswer;
        correctDetails[q.id] = isCorrect;
        if (isCorrect) score++;
      });

      const isPerfect = score === totalQuestions;
      const newSubmission: Submission = {
        id: "sub_" + Date.now(),
        email: email.trim(),
        fullName: teacherName.trim(), // Keep for fallback compatibility
        schoolNumber: `Escuela N° ${schoolNumber.trim()}`,
        department: department,
        group: group.trim(),
        teacherName: teacherName.trim(),
        timestamp: new Date().toISOString(),
        answers,
        score,
        isPerfect,
        correctDetails
      };

      const updated = saveSubmission(newSubmission);
      setSubmissions(updated);
      setLastSubmission(newSubmission);
      setSentEmailCopy(true);

      // Unconditionally save to Firestore in the background (the administrator lbarzilai@ceibal.edu.uy receives it immediately)
      setIsSheetsSaving(true);
      setSheetsSyncError(null);
      setSheetsSyncSuccess(false);
      
      saveSubmissionToFirestore({
        ...newSubmission,
        syncedToGoogleSheets: false
      }).then(() => {
        setSheetsSyncSuccess(true);
      }).catch((err: any) => {
        console.error("Firestore save error:", err);
        setSheetsSyncError("No se pudo conectar con el servidor central, pero tus respuestas están guardadas localmente.");
      }).finally(() => {
        setIsSheetsSaving(false);
      });

      // Clear saved draft/in-progress values upon successful submission
      localStorage.removeItem("ceibal_draft_answers");
      localStorage.removeItem("ceibal_active_section");
      setAnswers({});

      if (!isTestingMode) {
        localStorage.removeItem("ceibal_school_number");
        localStorage.removeItem("ceibal_department");
        localStorage.removeItem("ceibal_group");
        localStorage.removeItem("ceibal_teacher_name");
        localStorage.removeItem("ceibal_email");
        setSchoolNumber("");
        setGroup("");
        setTeacherName("");
        setEmail("");
      }

      if (!isAdminMode && !isTestingMode) {
        localStorage.setItem("ceibal_already_submitted", "true");
      }

      // Envío automático a la planilla vía Apps Script (Web App).
      // Se dispara solo, sin login ni botón. El script corre con los permisos
      // de la dueña de la planilla, así que siempre puede escribir.
      if (googleSheetsUrl) {
        // Encabezados: mismos que usa la exportación, para que la planilla
        // quede con las 50 preguntas + resultado por columna.
        const headers = [
          "Fecha y Hora UTC",
          "Escuela N°",
          "Departamento",
          "Grupo",
          "Nombre de la Docente",
          "Email Docente",
          "Fecha Local",
          "Respuestas Correctas (sobre 50)",
          "Puntaje Perfecto (50/50)",
        ];
        questions.forEach((q) => {
          headers.push(`P${q.id}: ${q.question}`);
          headers.push(`P${q.id} Resultado`);
        });

        // Fila de datos, en el mismo orden que los encabezados.
        const row: (string | number)[] = [
          newSubmission.timestamp,
          newSubmission.schoolNumber || "",
          newSubmission.department || "",
          newSubmission.group || "",
          newSubmission.teacherName || newSubmission.fullName || "",
          newSubmission.email,
          new Date(newSubmission.timestamp).toLocaleString("es-UY"),
          `${newSubmission.score} / 50`,
          newSubmission.isPerfect ? "SÍ" : "NO",
        ];
        questions.forEach((q) => {
          const ans = newSubmission.answers[q.id] || "";
          const wasCorrect = newSubmission.correctDetails[q.id] || false;
          row.push(ans);
          row.push(wasCorrect ? "Correcta" : "Incorrecta");
        });

        // El cuerpo se envía como texto plano simple (application/x-www-form-urlencoded
        // implícito al no fijar Content-Type con no-cors). Empaquetamos el JSON en el
        // parámetro "payload" para que el postData llegue completo al Apps Script.
        var params = "payload=" + encodeURIComponent(JSON.stringify({ headers: headers, row: row }));
        fetch(googleSheetsUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: params,
        }).catch((err) => {
          console.error("Error enviando a Google Sheets (Apps Script):", err);
        });
      }

      setView("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      console.error("Submit form error:", submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send a simulated email copy
  const handleSendEmailCopy = () => {
    setSentEmailCopy(true);
    setTimeout(() => {
      alert(`[SIMULACIÓN] Copia enviada con éxito al correo: ${lastSubmission?.email}\n\nNota: Al ejecutarse localmente en el navegador, el envío real de correos está desactivado por seguridad.`);
    }, 400);
  };

  // Export results to CSV
  const handleExportCSV = () => {
    const csvContent = exportToCSV(submissions, questions);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `little_bridge_challenge_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all 50 questions, options and correct answers to CSV for teachers
  const handleExportQuestionsCSV = () => {
    // Add UTF-8 BOM so Excel respects accents / Spanish characters
    let csvContent = "\uFEFF";
    
    // Header
    csvContent += "Número de Pregunta,Pregunta (Question),Opción Correcta (Correct Answer),Opción 2 (Incorrecta),Opción 3 (Incorrecta),Opción 4 (Incorrecta),Opción 5 (Incorrecta),Opción 6 (Incorrecta)\n";
    
    questions.forEach((q) => {
      // Find incorrect options (distractors)
      const otherOptions = q.options.filter(opt => opt !== q.correctAnswer);
      
      const row = [
        `Pregunta ${q.id}`,
        `"${q.question.replace(/"/g, '""')}"`,
        `"${q.correctAnswer.replace(/"/g, '""')}"`,
        ...otherOptions.map(opt => `"${opt.replace(/"/g, '""')}"`)
      ];
      
      // Ensure we have exactly 8 elements (id, text, correct, + 5 incorrect options)
      while (row.length < 8) {
        row.push("");
      }
      
      csvContent += row.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Planilla_Preguntas_Little_Bridge_Respuestas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Authenticate Admin
  const handleAdminAuth = (e: FormEvent) => {
    e.preventDefault();
    if (adminPassword.toLowerCase() === "Laura" || adminPassword === "ceibal2026") {
      setIsAdminAuthenticated(true);
      setShowPasswordError(false);
    } else {
      setShowPasswordError(true);
    }
  };

  // Reset entire simulation database
  const handleResetDatabase = () => {
    if (confirm("Are you sure you want to reset the database back to Uruguay Ceibal default sample records?")) {
      localStorage.removeItem("little_bridge_submissions");
      const reloaded = getSubmissions();
      setSubmissions(reloaded);
      alert("Sample records restored successfully.");
    }
  };

  // Clear all data to start 100% blank
  const handleClearAllData = () => {
    if (confirm("Are you sure you want to clear ALL submission records? This leaves the database completely empty for new exam deliveries.")) {
      localStorage.setItem("little_bridge_submissions", JSON.stringify([]));
      setSubmissions([]);
      alert("All submissions successfully cleared.");
    }
  };

  // Simulate a random classroom group submission
  const handleSimulateGroup = () => {
    const randomTeachers = [
      "Ana Laura Silva", "Gonzalo Fernández", "Patricia Cabrera", "Martín Rodríguez", 
      "Victoria Bentancor", "Sebastián Olivera", "Natalia Varela", "Estela Castillos"
    ];
    const randomEmails = [
      "asilva@ceibal.edu.uy", "gfernandez@gmail.com", "pcabrera@ceibal.edu.uy", "mrodriguez@ceibal.edu.uy",
      "vbentancor@hotmail.com", "solivera@ceibal.edu.uy", "nvarela@gmail.com", "ecastillos@ceibal.edu.uy"
    ];
    const randomDeps = URUGUAY_DEPARTMENTS;
    const randomGroups = ["4to A", "5to B", "6to C", "4to C", "5to A", "6to B"];
    
    const randomIndex = Math.floor(Math.random() * randomTeachers.length);
    const simTeacher = randomTeachers[randomIndex];
    const simEmail = randomEmails[randomIndex];
    const simDep = randomDeps[Math.floor(Math.random() * randomDeps.length)];
    const simGroupName = randomGroups[Math.floor(Math.random() * randomGroups.length)];
    const simSchoolNum = String(Math.floor(Math.random() * 190) + 10);

    // Score distribution: 70% chance of perfect score (50/50), 30% random high score
    const isPerfectSim = Math.random() > 0.3;
    const simScore = isPerfectSim ? 50 : Math.floor(Math.random() * 4) + 46; // 46 to 49

    const simAnswers: Record<number, string> = {};
    const simCorrectDetails: Record<number, boolean> = {};

    questions.forEach(q => {
      const isCorrect = isPerfectSim || (q.id <= simScore);
      const wrongOptions = q.options.filter(opt => opt !== q.correctAnswer);
      simAnswers[q.id] = isCorrect ? q.correctAnswer : wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      simCorrectDetails[q.id] = isCorrect;
    });

    const simSubmission: Submission = {
      id: "sim_" + Date.now(),
      email: simEmail,
      fullName: simTeacher,
      schoolNumber: `Escuela N° ${simSchoolNum}`,
      department: simDep,
      group: simGroupName,
      teacherName: simTeacher,
      timestamp: new Date().toISOString(),
      answers: simAnswers,
      score: simScore,
      isPerfect: isPerfectSim,
      correctDetails: simCorrectDetails
    };

    const updated = saveSubmission(simSubmission);
    setSubmissions(updated);
    alert(`Simulated group submission: Escuela N° ${simSchoolNum} (${simDep}), Class ${simGroupName}, Teacher ${simTeacher} with score of ${simScore}/50.`);
  };

  // Determine perfect deliveries (all 50 correct) sorted chronologically
  const perfectSubmissions = [...submissions]
    .filter(s => s.isPerfect)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Top 3 submissions (The Little Bridge Challenge Champions!)
  const top3SubmissionIds = new Set(perfectSubmissions.slice(0, 3).map(s => s.id));

  // Get active section questions
  const currentSectionConfig = sections[activeSection];
  const activeQuestions = questions.slice(currentSectionConfig.start - 1, currentSectionConfig.end);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans transition-colors duration-300 relative selection:bg-pink-100">
      
      {/* Decorative background vectors representing a corkboard with tape & pushpins */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4 relative z-10">
        
        {/* Playful Bulletin Board layout */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 bg-[#FAF1E4]/90 p-6 md:p-8 rounded-[2.5rem] border-2 border-[#EADBC8] shadow-md relative overflow-hidden">
          
          {/* Wooden border pushpin look */}
          <div className="absolute -top-3 left-6 w-6 h-6 rounded-full bg-red-500 border-2 border-red-700 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />
          <div className="absolute -top-3 right-6 w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-700 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />
          
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* STAMPED TITLE BADGE (Pink theme from PDF) */}
              <div className="inline-block border-4 border-pink-500 border-dashed text-pink-600 px-4 py-1 font-black text-xl tracking-wide rounded-md uppercase transform -rotate-1 shadow-sm bg-pink-50/50">
                The Little Bridge Challenge
              </div>
              
              {/* YELLOW STICKY NOTE (Yellow theme from PDF) */}
              <div className="bg-amber-100 border-2 border-amber-300 text-amber-900 px-3 py-1 text-xs font-bold rounded-lg shadow-sm transform rotate-1 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                Mission: Operation Little Bridge Universe
              </div>
            </div>
            
            <p className="text-xs text-slate-500 font-semibold font-mono">
              Ceibal en Inglés
            </p>
          </div>
          
          {/* Top Info Badges & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {view === "quiz" && (
              <div className="flex gap-4 items-center bg-white border-2 border-[#EADBC8] px-4 py-3 rounded-2xl shadow-sm">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Answered</p>
                  <p className="text-lg font-mono font-black text-pink-600 leading-none mt-1">
                    {answeredCount.toString().padStart(2, "0")} / {totalQuestions}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-pink-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700">{Math.round(progressPercent)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 items-center ml-auto lg:ml-0">
              {view === "quiz" && isAdminMode && (
                <button
                  onClick={() => setView("admin")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:text-pink-600 hover:bg-pink-50 px-4 py-3.5 rounded-xl border-2 border-[#EADBC8] transition-all shadow-sm cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Teacher Panel</span>
                </button>
              )}
              {view === "admin" && (
                <button
                  onClick={() => {
                    setView("quiz");
                    setSelectedSubmissionDetails(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-pink-600 hover:bg-pink-700 px-5 py-3.5 rounded-xl transition-all shadow-md shadow-pink-100 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Challenge Form</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-16 relative z-10 flex-grow">
        
        {/* Testing Mode Active Warning Banner for Colleagues */}
        {isTestingMode && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-200 text-amber-900 rounded-3xl p-4 md:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="bg-amber-100 p-2.5 rounded-2xl border border-amber-300 text-amber-700">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-amber-800">🧪 Modo de Pruebas Activo</h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  El bloqueo de reenvío está temporalmente desactivado para que tus colegas y tú puedan testear el formulario de forma ilimitada.
                </p>
              </div>
            </div>
            {isAdminMode ? (
              <button
                type="button"
                onClick={() => setView("admin")}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
              >
                Panel Docente
              </button>
            ) : (
              <span className="bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest shrink-0">
                Uso Interno CEI
              </span>
            )}
          </div>
        )}

        {/* VIEW 1: QUIZ / EXAMINATION FORM */}
        {view === "quiz" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Sections List & Instructions Sticky Notes */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              
              {/* Challenge navigation post-its */}
              <div className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-5 shadow-sm space-y-4 relative">
                
                {/* Visual blue pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 border-2 border-blue-700 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />
                
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mt-2">Challenge Progress Map</p>
                
                <div className="space-y-2">
                  {sections.map((sec, idx) => {
                    let answeredInSec = 0;
                    for (let i = sec.start; i <= sec.end; i++) {
                      if (answers[i]) answeredInSec++;
                    }
                    const isSecActive = activeSection === idx;

                    return (
                      <button
                        key={sec.id}
                        onClick={() => handleSectionChange(idx)}
                        className={`w-full p-3 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2 border cursor-pointer ${
                          isSecActive
                            ? "bg-pink-600 text-white font-bold border-pink-700 shadow-sm shadow-pink-100"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 hover:border-pink-300"
                        }`}
                      >
                        <span className="truncate font-semibold">{sec.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono shrink-0 ${
                          isSecActive ? "bg-pink-500 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {answeredInSec}/10
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Micro visual map of all 50 questions */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">Buscador de preguntas (1-50)</p>
                  <div className="grid grid-cols-10 gap-1">
                    {questions.map((q) => {
                      const isAnswered = !!answers[q.id];
                      const isCurrentSection = q.id >= currentSectionConfig.start && q.id <= currentSectionConfig.end;
                      return (
                        <button
                          key={q.id}
                          onClick={() => jumpToQuestion(q.id)}
                          title={`Pregunta #${q.id}`}
                          className={`h-6 text-[9px] font-mono rounded font-bold flex items-center justify-center transition-all cursor-pointer border ${
                            isAnswered
                              ? "bg-emerald-500 text-white border-emerald-600"
                              : isCurrentSection
                              ? "bg-pink-50 text-pink-600 border-pink-200 ring-1 ring-pink-400"
                              : "bg-slate-100 text-slate-400 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {q.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Active Teacher Profile details info card */}
              <div className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-5 shadow-sm relative text-center lg:text-left">
                {/* Visual purple pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-violet-500 border-2 border-violet-700 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />
                
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 mt-2">Perfil del Grupo Activo</p>
                <div className="flex flex-col lg:flex-row items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 border border-pink-100 flex items-center justify-center font-black text-sm uppercase shrink-0">
                    {teacherName ? teacherName.slice(0, 2) : <School className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 text-center lg:text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {teacherName.trim() || "Nombre de docente pendiente"}
                    </p>
                    <p className="text-[10px] font-semibold text-pink-600 mt-0.5">
                      {schoolNumber ? `Escuela N° ${schoolNumber}` : "Sin escuela"} {group ? `• Grupo ${group}` : ""}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5">
                      {email.trim() || "correo@ceibal.edu.uy"}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Center Column: Questions Area & Classroom Teacher Form */}
            <div className="col-span-12 lg:col-span-6 space-y-6">
              
              {/* TOP SECRET CLASSROOM TEACHER REGISTER FORM */}
              <div className="bg-[#FAF8F5] rounded-[2.5rem] p-6 md:p-8 border-2 border-[#EADBC8] shadow-sm space-y-5 relative overflow-hidden">
                
                {/* Red pushpin */}
                <div className="absolute -top-3 left-8 w-6 h-6 rounded-full bg-red-600 border-2 border-red-800 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />
                
                {/* Top Secret watermark badge */}
                <div className="absolute top-2 right-4 border border-pink-200 text-pink-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-widest uppercase select-none pointer-events-none">
                  Formulario del Grupo
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-pink-50 p-2.5 rounded-xl text-pink-600 border border-pink-100">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Registro del Grupo</h3>
                    <p className="text-[11px] text-slate-500 font-semibold">Por favor, completá los datos del docente y del grupo a continuación:</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Classroom Teacher's Name */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">
                      Nombre del docente de aula <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={teacherName}
                        onChange={(e) => setTeacherName(e.target.value)}
                        placeholder="Ej. María Rodríguez"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-all text-slate-900 font-semibold placeholder:text-slate-300 placeholder:font-normal"
                        required
                      />
                    </div>
                  </div>

                  {/* School N° */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">
                      Escuela N° <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <School className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={schoolNumber}
                        onChange={(e) => setSchoolNumber(e.target.value)}
                        placeholder="Ej. 120"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-all text-slate-900 font-semibold placeholder:text-slate-300 placeholder:font-normal"
                        required
                      />
                    </div>
                  </div>

                  {/* Group / Grade */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">
                      Grupo / Clase <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        placeholder="Ej. 5to A"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-all text-slate-900 font-semibold placeholder:text-slate-300 placeholder:font-normal"
                        required
                      />
                    </div>
                  </div>

                  {/* Department Dropdown Selection */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">
                      Departamento <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:outline-none transition-all text-slate-900 font-semibold appearance-none"
                      >
                        {URUGUAY_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Teacher's Email */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mb-1.5">
                      Correo electrónico del docente <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ej. docente@ceibal.edu.uy"
                        className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border focus:ring-2 focus:ring-pink-500 focus:outline-none transition-all text-slate-900 font-semibold placeholder:text-slate-300 placeholder:font-normal ${
                          email && !isEmailValid(email)
                            ? "border-red-300 bg-red-50 text-red-900"
                            : "border-slate-200 focus:border-pink-500 bg-white"
                        }`}
                        required
                      />
                    </div>
                    {email && !isEmailValid(email) && (
                      <p className="text-[9px] text-red-500 mt-1 font-bold">Por favor, ingrese un correo electrónico válido.</p>
                    )}
                  </div>

                </div>

              </div>

              {/* QUESTIONS AREA CONTAINER */}
              <div className="space-y-6 relative">
                {!isTeacherInfoComplete && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 text-center shadow-sm space-y-3">
                    <div className="mx-auto bg-amber-100 text-amber-800 w-12 h-12 rounded-2xl flex items-center justify-center border border-amber-200">
                      <Lock className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-900 uppercase tracking-wide">Preguntas bloqueadas</h4>
                      <p className="text-xs text-amber-700 font-semibold max-w-md mx-auto leading-relaxed">
                        Para comenzar a responder, complete los datos obligatorios del <strong>Registro del Grupo</strong> (Nombre, Escuela N°, Grupo y Correo electrónico) en el formulario de arriba.
                      </p>
                    </div>
                  </div>
                )}

                <div className={`space-y-6 ${!isTeacherInfoComplete ? "opacity-50 pointer-events-none select-none filter blur-[1px] transition-all duration-300" : "transition-all duration-300"}`}>
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Preguntas de la sección activa
                    </h3>
                    <span className="text-[10px] font-extrabold text-pink-600 bg-pink-50 border border-pink-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {currentSectionConfig.title}
                    </span>
                  </div>

                  {/* Iterate Active Questions */}
                  {activeQuestions.map((q) => {
                    const isAnswered = !!answers[q.id];
                    const selectedOption = answers[q.id];

                    return (
                      <div
                        key={q.id}
                        id={`question-card-${q.id}`}
                        className={`bg-white rounded-[2rem] p-6 md:p-8 border-2 transition-all duration-300 relative overflow-hidden ${
                          isAnswered ? "border-pink-200 shadow-md" : "border-slate-200 shadow-sm"
                        }`}
                      >
                        {/* Big watermark absolute number */}
                        <div className="absolute -top-4 -right-4 p-8 text-[7rem] font-black text-slate-100/50 select-none pointer-events-none font-mono">
                          {String(q.id).padStart(2, "0")}
                        </div>

                        <div className="relative z-10 space-y-5">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="text-sm md:text-base font-extrabold text-slate-900 leading-snug max-w-[80%] font-display">
                              <span className="text-pink-600 font-black mr-2 text-xs md:text-sm bg-pink-50 border border-pink-100 px-2.5 py-1.5 rounded-xl">
                                Pregunta #{q.id}
                              </span>
                              {q.question}
                            </h4>
                            
                            {isAnswered ? (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border border-emerald-100 uppercase">
                                <Check className="w-3 h-3" /> Respondida
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border border-amber-100 uppercase">
                                <AlertCircle className="w-3 h-3" /> Pendiente
                              </span>
                            )}
                          </div>

                          {/* 6 OPTIONS DISPOSED IN 2 COLUMNS OF 3 OPTIONS */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedOption === opt;
                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  disabled={!isTeacherInfoComplete}
                                  onClick={() => handleSelectOption(q.id, opt)}
                                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                                    isSelected
                                      ? "bg-pink-50/50 border-pink-600 text-pink-900 font-bold shadow-sm"
                                      : "border-slate-100 hover:border-pink-300 text-slate-700 hover:bg-slate-50 bg-slate-50/50"
                                  }`}
                                >
                                  <span className="leading-tight">{opt}</span>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected ? "border-pink-600 bg-pink-600" : "border-slate-200 bg-white"
                                  }`}>
                                    {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation controls bottom */}
              <div className="flex items-center justify-between bg-white p-5 rounded-[2rem] border-2 border-[#EADBC8] shadow-sm">
                <button
                  type="button"
                  disabled={activeSection === 0}
                  onClick={() => handleSectionChange(activeSection - 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                  Section {activeSection + 1} of 5
                </span>

                {activeSection < 4 ? (
                  <button
                    type="button"
                    onClick={() => handleSectionChange(activeSection + 1)}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-pink-600 hover:bg-pink-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-pink-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const element = document.getElementById("submit-sidebar-card");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      } else {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                      }
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer border border-emerald-200"
                  >
                    Jump to Submit
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: Submission Panel & Status */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              
              {/* Delivery and Autosave Status (No contest rules) */}
              <div id="submit-sidebar-card" className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-6 flex flex-col items-center text-center gap-4 relative">
                
                {/* Yellow pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-yellow-500 border-2 border-yellow-700 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />

                <div className="w-14 h-14 bg-[#FAF6F0] border-2 border-[#EADBC8] rounded-2xl flex items-center justify-center mt-2">
                  <FileSpreadsheet className="w-7 h-7 text-emerald-500 animate-pulse" />
                </div>
                
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Real-time Archiver</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Answers are streamed automatically into the central database: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold">results.xlsx</span>
                  </p>
                </div>

                <div className="w-full space-y-2 mt-1">
                  <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                    <span>Database Status</span>
                    <span className="text-emerald-500 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Active
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>

                {/* Form submit button */}
                <div className="w-full pt-2">
                  <button
                    type="button"
                    disabled={!isFormComplete || isSubmitting}
                    onClick={handleSubmitForm}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? "bg-pink-400 text-white cursor-not-allowed animate-pulse"
                        : isFormComplete
                        ? "bg-pink-600 text-white cursor-pointer hover:bg-pink-700 shadow-md shadow-pink-100 hover:-translate-y-0.5"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Enviando formulario del grupo...
                      </>
                    ) : (
                      "Enviar formulario del grupo"
                    )}
                  </button>
                  {!isFormComplete && (
                    <p className="text-[9px] font-semibold text-slate-400 mt-2.5 leading-relaxed">
                      Por favor, completá los datos de la escuela y grupo y respondé las 50 preguntas para enviar el formulario.
                    </p>
                  )}
                </div>
              </div>

              {/* Requirement details checklist */}
              <div className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-5 shadow-sm space-y-3 text-xs relative">
                
                {/* Pink pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-pink-500 border-2 border-pink-700 shadow-md flex items-center justify-center after:content-[''] after:w-1.5 after:h-1.5 after:bg-white after:rounded-full" />

                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-2">Control del Formulario</p>
                <div className="space-y-2.5 pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Nombre del docente:</span>
                    {teacherName.trim().length >= 3 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Completado</span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1">Pendiente</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Escuela N° y Grupo:</span>
                    {schoolNumber.trim().length >= 1 && group.trim().length >= 1 ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Completado</span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1">Pendiente</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Correo del docente:</span>
                    {isEmailValid(email) ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><Check className="w-3 h-3 stroke-[3]" /> Válido</span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center gap-1">Pendiente</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Preguntas respondidas:</span>
                    <span className={`font-mono font-bold ${answeredCount === totalQuestions ? "text-emerald-600" : "text-amber-500"}`}>
                      {answeredCount} / {totalQuestions}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 1.5: ALREADY SUBMITTED (BLOCKED SCREEN FOR GROUPS) */}
        {view === "already-submitted" && (
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-8 md:p-12 shadow-sm text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10 opacity-40" />
            
            <div className="flex justify-center">
              <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                <CheckCircle2 className="w-14 h-14 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Envío Registrado</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display leading-tight uppercase">
                ¡Formulario ya completado!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                Tu grupo ya ha enviado las respuestas para este formulario de Little Bridge. 
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-md mx-auto">
                Solo se permite un único envío por grupo en esta plataforma. Los resultados de tu participación han sido guardados de forma segura en la base de datos central.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-5">
              <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest block font-mono">
                ¡Muchas gracias por participar!
              </p>

              {isAdminMode && (
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl max-w-md mx-auto space-y-3 text-left">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-pink-500" />
                    Zona de Pruebas
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    ¿Eres parte de CEI y estás desarrollando el formulario?
                  </p>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Haz clic en el siguiente botón para limpiar el bloqueo local del navegador y habilitar un nuevo envío del formulario de manera inmediata.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("ceibal_already_submitted");
                      setView("quiz");
                      setAnswers({});
                      setSchoolNumber("");
                      setGroup("");
                      setTeacherName("");
                      setEmail("");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all border border-pink-500 cursor-pointer shadow-sm text-center font-sans"
                  >
                    Habilitar Reenvío del Formulario
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: SUBMISSION RESULT (SUCCESS SCREEN) */}
        {view === "result" && lastSubmission && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!isAdminMode ? (
              <div className="space-y-6 animate-fade-in">
                {/* CLEAN CONFIRMATION VIEW FOR TEACHERS/GROUPS (NO SCORE, NO RETRY, NO DETAILS) */}
                <div className="bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-8 md:p-12 shadow-sm text-center space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10 opacity-40" />
                  
                  <div className="flex justify-center">
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100">
                      <CheckCircle2 className="w-14 h-14 text-emerald-600 animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Formulario registrado correctamente</span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display leading-tight uppercase">
                      ¡Formulario enviado con éxito!
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-semibold max-w-lg mx-auto">
                      Felicitaciones, docente <strong>{lastSubmission.teacherName}</strong>. Las respuestas de tu grupo <strong>{lastSubmission.group}</strong> de la <strong>{lastSubmission.schoolNumber} ({lastSubmission.department})</strong> han sido guardadas y registradas correctamente en el sistema.
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-md mx-auto">
                      Solo se acepta un envío por grupo, por lo que tu participación para este formulario está completada y de aquí en más cerrada de forma segura. ¡Muchas gracias por tu dedicación y esfuerzo!
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                    Ceibal en Inglés
                  </div>

                  {/* Visual synchronization feedback block */}
                  <div className="max-w-md mx-auto mt-4 p-4 rounded-2xl border flex items-center justify-between text-left gap-3 text-xs font-semibold bg-slate-50 border-slate-100">
                    <div className="flex items-center gap-2">
                      {isSheetsSaving ? (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-pink-600 animate-spin" />
                      ) : sheetsSyncError ? (
                        <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black font-mono">!</div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">✓</div>
                      )}
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Servidor Central</div>
                        <div className="text-slate-700 font-black">
                          {isSheetsSaving ? (
                            "Sincronizando..."
                          ) : sheetsSyncError ? (
                            "Sincronización Fallida"
                          ) : (
                            "¡Sincronizado con éxito!"
                          )}
                        </div>
                      </div>
                    </div>

                    {sheetsSyncError ? (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSheetsSaving(true);
                          setSheetsSyncError(null);
                          try {
                            await saveSubmissionToFirestore({
                              ...lastSubmission,
                              syncedToGoogleSheets: false
                            });
                            setSheetsSyncSuccess(true);
                          } catch (err) {
                            console.error("Retry Firestore save error:", err);
                            setSheetsSyncError("Fallo reintento. Por favor revisa tu conexión.");
                          } finally {
                            setIsSheetsSaving(false);
                          }
                        }}
                        className="bg-pink-50 text-pink-700 border border-pink-100 hover:bg-pink-100 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all"
                      >
                        Reintentar
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold font-mono">ID: {lastSubmission.id}</span>
                    )}
                  </div>

                  {isTestingMode && (
                    <div className="mt-6 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 max-w-md mx-auto space-y-3 text-left">
                      <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                        Modo de Pruebas Activo
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                        Como estás en el modo de pruebas internas, puedes hacer clic abajo para reiniciar las respuestas y realizar otro envío de prueba inmediatamente con el mismo navegador.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setView("quiz");
                          setAnswers({});
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-sm text-center font-sans cursor-pointer uppercase tracking-wider"
                      >
                        Hacer otro envío de prueba
                      </button>
                    </div>
                  )}
                </div>


              </div>
            ) : (
              /* DETAILED ADMIN/DEBUG VIEW (ONLY FOR ADMINS) */
              <>
                {/* Success Card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Score breakdown card */}
                  <div className="col-span-12 md:col-span-7 bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden text-center md:text-left">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-full -z-10 opacity-40" />
                    
                    <div className="space-y-6">
                      <div className="flex justify-center md:justify-start">
                        {lastSubmission.isPerfect ? (
                          <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 relative">
                            <Trophy className="w-14 h-14 text-emerald-600 animate-bounce" />
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-sm">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          </div>
                        ) : (
                          <div className="bg-pink-50 p-5 rounded-3xl border border-pink-100">
                            <Award className="w-14 h-14 text-pink-600" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Formulario Registered Successfully</span>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display leading-tight">
                          {lastSubmission.isPerfect ? "Perfect Score Achieved!" : "¡Formulario enviado con éxito!"}
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-md font-semibold">
                          ¡Felicitaciones, <strong>{lastSubmission.teacherName}</strong>! Tus respuestas del grupo <strong>{lastSubmission.group}</strong> de <strong>{lastSubmission.schoolNumber} ({lastSubmission.department})</strong> quedaron registradas.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
                      <div className="bg-[#FAF6F0] rounded-2xl p-4 text-center border border-[#EADBC8]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Score</span>
                        <div className="text-3xl font-black mt-1 font-mono">
                          <span className={lastSubmission.isPerfect ? "text-emerald-600" : "text-pink-600"}>
                            {lastSubmission.score}
                          </span>
                          <span className="text-sm text-slate-400 font-normal"> / {totalQuestions}</span>
                        </div>
                      </div>

                      <div className="bg-[#FAF6F0] rounded-2xl p-4 text-center border border-[#EADBC8]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Efficiency</span>
                        <div className="text-3xl font-black text-slate-950 mt-1 font-mono">
                          {Math.round((lastSubmission.score / totalQuestions) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status & Options column */}
                  <div className="col-span-12 md:col-span-5 bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-8 shadow-sm flex flex-col justify-between relative">
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-pink-500" />
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Mission Evaluation Status</h3>
                      </div>

                      <div className="bg-pink-50/60 rounded-2xl p-5 border border-pink-100 text-xs text-slate-700 space-y-3">
                        {lastSubmission.isPerfect ? (
                          (() => {
                            const orderIndex = perfectSubmissions.findIndex(s => s.id === lastSubmission.id) + 1;
                            const isTop3Winner = orderIndex > 0 && orderIndex <= 3;

                            return (
                              <div className="space-y-2.5">
                                <p className="leading-relaxed font-semibold">
                                  Amazing! Your group solved all 50 questions correctly. Your chronological delivery position is:
                                </p>
                                <div className="flex justify-center my-3">
                                  <span className="bg-pink-100 text-pink-800 text-2xl font-black font-mono px-5 py-2 rounded-xl border border-pink-200 shadow-sm">
                                    #{orderIndex}
                                  </span>
                                </div>
                                {isTop3Winner ? (
                                  <p className="font-extrabold text-pink-700 flex items-center justify-center gap-1 bg-white border border-pink-100 p-2 rounded-xl">
                                    <Sparkles className="w-4 h-4 text-pink-600 shrink-0 animate-pulse" />
                                    Ranked inside the TOP 3 Winners!
                                  </p>
                                ) : (
                                  <p className="font-semibold text-slate-500 text-center">
                                    All 3 victory passes have been claimed, but you are logged in the Little Bridge Hall of Fame!
                                  </p>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <div className="space-y-3 leading-relaxed">
                            <p>
                              To qualify for the perfect delivery reward, your classroom must achieve a <strong>perfect score of 50/50</strong>.
                            </p>
                            <p className="font-semibold text-pink-600">
                              You can review the solved questionnaire and re-deliver the form as many times as you like.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5 mt-6">
                      <button
                        onClick={handleSendEmailCopy}
                        className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                          sentEmailCopy
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-100"
                        }`}
                      >
                        {sentEmailCopy ? "Teacher's Copy Sent!" : "Email Me My Results Copy"}
                      </button>

                      <button
                        onClick={() => {
                          setView("quiz");
                          setAnswers({});
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                      >
                        Solve Again (Reset)
                      </button>

                      {isAdminMode && (
                        <button
                          onClick={() => setView("admin")}
                          className="w-full py-3.5 bg-white text-slate-700 hover:text-pink-600 hover:bg-pink-50 rounded-xl text-xs font-bold transition-all border-2 border-[#EADBC8] cursor-pointer"
                        >
                          View Teacher Control Panel
                        </button>
                      )}
                    </div>
                  </div>

                </div>

                {/* Detailed answers evaluation checklist review */}
                <div className="bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider font-display">
                      Mission Question Review & Quality Control
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Analyze your group's delivered answers for each of the 50 comprehension questions:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[35rem] overflow-y-auto pr-2 scrollbar-thin">
                    {questions.map((q) => {
                      const ans = lastSubmission.answers[q.id];
                      const wasCorrect = lastSubmission.correctDetails[q.id];

                      return (
                        <div key={q.id} className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1.5 border border-slate-200 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-4 font-bold text-slate-900">
                              <span className="font-display font-black text-slate-800">Pregunta {q.id}: {q.question}</span>
                              {wasCorrect ? (
                                <span className="text-emerald-600 font-extrabold flex items-center gap-0.5 shrink-0 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px] uppercase"><CheckCircle2 className="w-3 h-3" /> Correct</span>
                              ) : (
                                <span className="text-pink-600 font-extrabold flex items-center gap-0.5 shrink-0 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full text-[9px] uppercase"><XCircle className="w-3 h-3" /> Incorrect</span>
                              )}
                            </div>
                            <div className="text-slate-500 font-medium">
                              Your Answer: <span className={`font-extrabold ${wasCorrect ? "text-emerald-700" : "text-pink-700"}`}>{ans || "(Empty)"}</span>
                            </div>
                          </div>
                          {!wasCorrect && (
                            <div className="text-emerald-800 bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl mt-1.5 font-semibold text-[11px]">
                              Correct Question Answer: <span className="font-black">{q.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW 3: TEACHER ADMINISTRATION CONTROL PANEL */}
        {view === "admin" && isAdminMode && (
          <div className="space-y-6">
            
            {/* Header Bento Panel */}
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border-2 border-[#EADBC8] shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-600 animate-pulse" />
                    <span className="text-[10px] font-extrabold tracking-widest text-pink-600 uppercase">Ceibal en Inglés</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display uppercase">
                    Teacher Dashboard & Database
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold max-w-xl">
                    Manage, review, and export the official Excel spreadsheets containing the submissions from your groups.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Excel Spreadsheet (CSV)</span>
                  </button>

                  <button
                    onClick={handleExportQuestionsCSV}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100 cursor-pointer"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Descargar Preguntas y Respuestas (Excel/CSV)</span>
                  </button>

                  <button
                    onClick={handleSimulateGroup}
                    className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100 px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
                    <span>Simulate Group Submission</span>
                  </button>
                </div>
              </div>

              {/* Password credentials inside dashboard */}
              {!isAdminAuthenticated && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="max-w-md bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-slate-400" /> Educator Credentials Verification
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      To view full student answer sheets and clean the records, enter the password. Valid passwords: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-pink-600 font-mono font-bold">admin</code> or <code className="bg-slate-200 px-1.5 py-0.5 rounded text-pink-600 font-mono font-bold">ceibal2026</code>.
                    </p>
                    
                    <form onSubmit={handleAdminAuth} className="flex gap-2">
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 font-semibold"
                      />
                      <button
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Verify
                      </button>
                    </form>
                    {showPasswordError && (
                      <p className="text-[10px] text-red-500 font-bold">Incorrect password. Please try again.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-6 flex items-center gap-4 shadow-sm">
                <div className="bg-sky-50 p-3.5 rounded-2xl text-sky-600 border border-sky-100">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
                  <span className="text-2xl font-black text-slate-950 font-mono">{submissions.length}</span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-6 flex items-center gap-4 shadow-sm">
                <div className="bg-emerald-50 p-3.5 rounded-2xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Perfect Scores (50/50)</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    {submissions.filter(s => s.isPerfect).length}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border-2 border-[#EADBC8] p-6 flex items-center gap-4 shadow-sm">
                <div className="bg-pink-50 p-3.5 rounded-2xl text-pink-600 border border-pink-100">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Top 3 Winners Claimed</span>
                  <span className="text-2xl font-black text-pink-600 font-mono">
                    {Math.min(3, submissions.filter(s => s.isPerfect).length)} / 3
                  </span>
                </div>
              </div>
            </div>

            {/* Podium Section / Speed Winners (Top 3) */}
            <div className="bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-8 shadow-sm space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 font-display flex items-center gap-2 uppercase tracking-wide">
                  <Trophy className="w-5 h-5 text-pink-500 animate-pulse" />
                  The Little Bridge Challenge Champions (Top 3 Groups)
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Chronological ranking of the first three classroom groups that submitted a 100% perfect form:
                </p>
              </div>

              {perfectSubmissions.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl text-center text-xs text-slate-400 border border-slate-200">
                  No groups have achieved a perfect 50/50 score yet. Complete the form above to claim the podium!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {perfectSubmissions.slice(0, 3).map((sub, index) => {
                    const medalColors = [
                      "bg-amber-100 text-amber-800 border-amber-200 ring-amber-400", // Gold
                      "bg-slate-100 text-slate-800 border-slate-200 ring-slate-300", // Silver
                      "bg-orange-100 text-orange-800 border-orange-200 ring-orange-300", // Bronze
                    ];
                    const currentMedal = medalColors[index];

                    return (
                      <div
                        key={sub.id}
                        className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#EADBC8] flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 border ring-2 ring-offset-1 ${currentMedal}`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{sub.teacherName || sub.fullName}</h4>
                            <p className="text-[10px] font-extrabold text-pink-600 truncate">{sub.schoolNumber} • {sub.group}</p>
                            <p className="text-[9px] text-slate-400 truncate">{sub.department}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full block text-center mb-1">
                            50 / 50
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {new Date(sub.timestamp).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Google Sheets Integration Card & General Database Table (Authenticated only) */}
            {isAdminAuthenticated && (
              <div className="space-y-6">
                {/* CONFIGURACIÓN DE MODO (PRUEBAS vs EN VIVO) */}
                <div className="bg-amber-50 rounded-[2.5rem] border-2 border-amber-200 p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Configuración del Modo de la Aplicación (Testing vs Live)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Controla si la plataforma se encuentra en período de pruebas internas (ideal para que tus colegas envíen el formulario múltiples veces para testear) o si ya está en vivo para los docentes reales.
                  </p>
                  
                  <div className="bg-white border border-amber-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Estado de la Aplicación</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isTestingMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-ping"}`} />
                        <span className={`text-xs font-black uppercase ${isTestingMode ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}`}>
                          {isTestingMode ? "🧪 Modo de Pruebas Activo (Envíos ilimitados)" : "🚀 En Vivo / Producción (Un único envío por docente)"}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        const nextMode = !isTestingMode;
                        setIsTestingMode(nextMode);
                        localStorage.setItem("ceibal_is_testing_mode", nextMode ? "true" : "false");
                        try {
                          await setDoc(doc(db, "settings", "global"), { isTestingMode: nextMode }, { merge: true });
                        } catch (err) {
                          console.error("Error updating settings doc in Firestore:", err);
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm text-white ${
                        isTestingMode 
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" 
                          : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                      }`}
                    >
                      {isTestingMode ? "Cambiar a Modo 'En Vivo'" : "Cambiar a Modo 'Pruebas'"}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {isTestingMode ? (
                      <span><strong>🧪 Modo Pruebas Activo:</strong> Tus colegas y tú pueden enviar el formulario tantas veces como quieran desde el mismo navegador para probar el funcionamiento. No se guardará el bloqueo local.</span>
                    ) : (
                      <span><strong>🚀 Modo En Vivo Activo:</strong> Cada docente real/grupo podrá realizar un único envío. Al completarse, su navegador quedará bloqueado de forma segura para evitar múltiples envíos del mismo grupo.</span>
                    )}
                  </p>
                </div>

                {/* Central Google Sheets Direct Connection Card */}
                <div className="bg-emerald-50/50 rounded-[2.5rem] border-2 border-emerald-200 p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Conexión Directa con Google Sheets (Sincronización API)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Las respuestas enviadas por los grupos se guardan y sincronizan directamente en tiempo real en la planilla de Google Sheets seleccionada usando la API oficial de Google.
                  </p>
                  
                  <div className="bg-white border border-emerald-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="text-left space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block">Planilla Vinculada</span>
                      <a 
                        href={`https://docs.google.com/spreadsheets/d/${directSpreadsheetId}/edit`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1.5 font-sans"
                      >
                        {directSpreadsheetId === "1gvaanALVlw8FGN5KM3j4x4-c7Xa1WoypksMStbz47pQ" 
                          ? "Little Bridge Challenge 2026 - Planilla Central Ceibal" 
                          : `Tu Planilla Personalizada (${directSpreadsheetId.slice(0, 10)}...)`}
                        <SearchCode className="w-4.5 h-4.5 text-emerald-500" />
                      </a>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      {googleUser ? (
                        <div className="text-right flex flex-col sm:items-end">
                          <span className="text-[10px] font-bold text-slate-500 font-mono">Conectado como {googleUser.email}</span>
                          <button
                            type="button"
                            onClick={handleGoogleLogout}
                            className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-wider font-mono mt-0.5 cursor-pointer"
                          >
                            Desconectar Google
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-100 flex items-center justify-center gap-2 font-sans"
                        >
                          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 fill-current">
                            <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          </svg>
                          Conectar tu cuenta Google
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spreadsheet ID / URL Configuration Input */}
                  <div className="bg-white border border-emerald-100 p-5 rounded-2xl space-y-2.5 shadow-sm">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest font-mono block">
                      ID o Enlace de la Planilla de Destino:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={directSpreadsheetId}
                        onChange={(e) => handleSaveDirectSpreadsheetId(e.target.value)}
                        placeholder="Pega la URL de tu Planilla de Google o el ID directamente"
                        className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                      />
                      {directSpreadsheetId !== "1gvaanALVlw8FGN5KM3j4x4-c7Xa1WoypksMStbz47pQ" && (
                        <button
                          type="button"
                          onClick={() => handleSaveDirectSpreadsheetId("1gvaanALVlw8FGN5KM3j4x4-c7Xa1WoypksMStbz47pQ")}
                          className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer shrink-0"
                        >
                          Restablecer a la Central
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Puedes pegar la URL completa de tu Planilla de Google (ej: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">https://docs.google.com/spreadsheets/d/...</code>) y el sistema extraerá automáticamente el identificador correcto.
                    </p>
                  </div>

                  {/* 403 Help & Perms Diagnostics Card */}
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 space-y-2.5">
                    <h4 className="text-[11px] font-black text-amber-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span>⚠️</span> Guía de Solución para Errores de Permiso (Error 403)
                    </h4>
                    <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1.5 font-medium leading-relaxed">
                      <li>
                        <strong>Acceso de Escritura Requerido:</strong> El usuario de Google con el que inicias sesión aquí (ej: <code className="bg-amber-100/70 px-1.5 py-0.5 rounded font-mono text-amber-900 text-[11px]">{googleUser ? googleUser.email : "tu-cuenta@gmail.com"}</code>) debe estar compartido en la Planilla con permisos de <strong>"Editor"</strong>.
                      </li>
                      <li>
                        <strong>Cuentas Ceibal / Workspace:</strong> Si tu planilla pertenece a una cuenta educativa o corporativa (como <code className="bg-amber-100/70 px-1.5 py-0.5 rounded font-mono text-amber-900 text-[11px]">@ceibal.edu.uy</code>), debes hacer clic en <strong>"Conectar tu cuenta Google"</strong> y autenticarte con esa misma dirección para evitar bloqueos por políticas de organización.
                      </li>
                      <li>
                        <strong>Cómo solucionarlo:</strong> Abre tu planilla en Google Sheets, pulsa el botón azul <strong>"Compartir"</strong> en la esquina superior derecha, y añade el correo con el que has iniciado sesión en esta app con permisos de <strong>"Editor"</strong>. ¡Luego intenta sincronizar nuevamente!
                      </li>
                    </ul>
                  </div>

                  {/* Real-time pending submissions sync widget */}
                  <div className="bg-emerald-100/50 rounded-2xl p-4 border border-emerald-200 mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center md:text-left">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest font-mono block">
                        Sincronización de respuestas
                      </span>
                      <p className="text-xs text-slate-700 font-bold">
                        Hay {submissions.filter(s => !isDemoSubmission(s.id) && !s.syncedToGoogleSheets).length} respuestas de grupos pendientes por subir a la Planilla de Google.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={async () => {
                        let token = googleAccessToken;
                        if (!token) {
                          token = await handleGoogleLogin();
                        }
                        if (token) {
                          handleBulkSync(token);
                        }
                      }}
                      disabled={isBulkSyncing || submissions.filter(s => !isDemoSubmission(s.id) && !s.syncedToGoogleSheets).length === 0}
                      className={`w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                        isBulkSyncing
                          ? "bg-emerald-300 text-white cursor-not-allowed animate-pulse"
                          : submissions.filter(s => !isDemoSubmission(s.id) && !s.syncedToGoogleSheets).length === 0
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      {isBulkSyncing ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Sincronizando ({bulkSyncProgress}/{bulkSyncTotal})...
                        </>
                      ) : !googleUser ? (
                        "Conectar Google y Sincronizar"
                      ) : (
                        "Sincronizar ahora con la Planilla Central"
                      )}
                    </button>
                  </div>
                </div>

                {/* Legacy / Custom Google Sheets Integration Settings Card */}
                <div className="bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-6 md:p-8 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                      Conexión Alternativa con Tu Propia Planilla (Google Apps Script)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Si deseas que los alumnos envíen las respuestas directamente a otra Planilla de Google de tu propiedad, puedes configurar una Web App con Google Apps Script. Las respuestas se registrarán en tiempo real tanto en la plataforma como en tu hoja de cálculo.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="url"
                      value={googleSheetsUrl}
                      onChange={(e) => handleSaveSheetsUrl(e.target.value)}
                      placeholder="Pega la URL de tu Web App de Google Apps Script (https://script.google.com/macros/s/.../exec)"
                      className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => alert("¡Configuración de Google Sheets guardada correctamente en el navegador! Ahora, al enviar un formulario, las respuestas se enviarán a tu planilla.")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 cursor-pointer whitespace-nowrap"
                    >
                      Guardar URL
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-pink-500 rounded-full" /> Código correcto para "Código.gs" (Evita errores de sintaxis)
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      El error <code className="bg-slate-200 text-pink-600 px-1 py-0.5 rounded font-bold">SyntaxError: Unexpected token '&lt;'</code> ocurrió porque pegaste código HTML o un script de frontend dentro del archivo <code className="font-mono bg-slate-200 px-1 py-0.5 rounded font-bold">Código.gs</code> de Apps Script. Los archivos de extensión <code className="font-mono bg-slate-200 px-1 py-0.5 rounded font-bold">.gs</code> en Google Drive son servidores puramente en JavaScript y <strong>no admiten etiquetas HTML</strong>.
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                      Copia y pega exactamente este código limpio de JavaScript en tu archivo <code className="font-mono bg-slate-200 px-1 py-0.5 rounded font-bold">Código.gs</code>, reemplazando todo lo que tengas allí:
                    </p>
                    <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-lg text-[10px] font-mono overflow-x-auto max-h-48 select-all">
{`function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Si la planilla está vacía, creamos los encabezados
    if (sheet.getLastRow() === 0) {
      var headers = ["Fecha y Hora", "Docente", "Email", "Escuela", "Departamento", "Grupo", "Puntaje", "Es Perfecto"];
      for (var i = 1; i <= 50; i++) {
        headers.push("Pregunta " + i);
      }
      sheet.appendRow(headers);
    }
    
    var row = [
      new Date(data.timestamp),
      data.teacherName,
      data.email,
      data.schoolNumber,
      data.department,
      data.group,
      data.score,
      data.isPerfect
    ];
    
    // Agregar respuestas 1 a 50
    for (var j = 1; j <= 50; j++) {
      row.push(data["q_" + j] || "");
    }
    
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border-2 border-[#EADBC8] overflow-hidden shadow-sm">
                
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Central Classroom Database Records
                  </h3>
                  
                  {/* Search bar */}
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by school, group or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                {/* Table wrapper */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-[#FAF6F0]/80 text-slate-400 font-extrabold uppercase border-b border-slate-100 text-[9px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Group Identification</th>
                        <th className="px-6 py-4">Classroom Teacher</th>
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4">Date & Time Sent</th>
                        <th className="px-6 py-4 text-center">Perfect</th>
                        <th className="px-6 py-4 text-center">Google Sheets</th>
                        <th className="px-6 py-4 text-center">Winner</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {submissions
                        .filter(s => 
                          (s.teacherName || s.fullName).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.schoolNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.group || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.department || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((sub) => {
                          const isWinner = sub.isPerfect && top3SubmissionIds.has(sub.id);
                          return (
                            <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{sub.schoolNumber || "School N/A"}</div>
                                <div className="text-[10px] text-pink-600 font-extrabold">{sub.group || "N/A"} • {sub.department || "N/A"}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{sub.teacherName || sub.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{sub.email}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`font-mono font-bold text-sm ${sub.isPerfect ? "text-emerald-600" : "text-pink-600"}`}>
                                  {sub.score}
                                </span>{" "}
                                <span className="text-slate-400 font-normal">/ 50</span>
                              </td>
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                                {new Date(sub.timestamp).toLocaleString("es-UY")}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {sub.isPerfect ? (
                                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-bold">YES</span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px]">NO</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {isDemoSubmission(sub.id) ? (
                                  <span className="text-slate-400 font-mono text-[9px] font-bold uppercase tracking-wider">Demo / Seed</span>
                                ) : sub.syncedToGoogleSheets ? (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                    ✓ Sincronizado
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 animate-pulse">
                                    ⚠ Pendiente
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {isWinner ? (
                                  <span className="bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded-lg text-[9px] font-bold inline-flex items-center gap-0.5">
                                    🏆 YES
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[9px]">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => setSelectedSubmissionDetails(sub)}
                                  className="text-xs text-pink-600 hover:text-pink-800 font-bold hover:underline cursor-pointer"
                                >
                                  Review Answers
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {submissions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">
                            No registered submissions found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* DB controls inside table footer block */}
                <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3 text-xs">
                  <span className="text-slate-400 font-medium">Database Management Controls:</span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleResetDatabase}
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reset to Sample Data
                    </button>
                    <button
                      onClick={handleClearAllData}
                      className="bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      Wipe All Submissions
                    </button>
                  </div>
                </div>

              </div>
              </div>
            )}

            {/* Selected Answers detail view card */}
            {selectedSubmissionDetails && (
              <div className="bg-white rounded-[2.5rem] border-2 border-[#EADBC8] p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-display">
                      Detailed Review: {selectedSubmissionDetails.teacherName || selectedSubmissionDetails.fullName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {selectedSubmissionDetails.schoolNumber} • {selectedSubmissionDetails.group} • {selectedSubmissionDetails.department} ({selectedSubmissionDetails.email})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubmissionDetails(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold hover:underline cursor-pointer"
                  >
                    Close Review
                  </button>
                </div>

                <div className="max-h-[28rem] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {questions.map((q) => {
                    const ans = selectedSubmissionDetails.answers[q.id];
                    const wasCorrect = selectedSubmissionDetails.correctDetails[q.id];

                    return (
                      <div key={q.id} className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1.5 border border-slate-200">
                        <div className="flex items-start justify-between gap-4 font-bold text-slate-900">
                          <span>Pregunta {q.id}: {q.question}</span>
                          {wasCorrect ? (
                            <span className="text-emerald-600 flex items-center gap-0.5 shrink-0 font-extrabold uppercase text-[9px]"><CheckCircle2 className="w-3.5 h-3.5" /> Correct</span>
                          ) : (
                            <span className="text-pink-600 flex items-center gap-0.5 shrink-0 font-extrabold uppercase text-[9px]"><XCircle className="w-3.5 h-3.5" /> Incorrect</span>
                          )}
                        </div>
                        <div className="text-slate-600 font-semibold">
                          Answered: <span className="text-slate-900">{ans || "(Empty)"}</span>
                        </div>
                        {!wasCorrect && (
                          <div className="text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl mt-1 font-semibold text-[11px]">
                            Correct Answer: <span className="font-black">{q.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 px-6 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="space-y-1.5 text-center md:text-left">
            <p className="font-extrabold text-slate-200 uppercase tracking-widest text-[11px]">Little Bridge - Ceibal en Inglés</p>
            <p className="text-slate-500 font-medium">Uruguay • Automated Comprehension Form Registry v1.3</p>
          </div>
          <div className="flex gap-4 font-semibold">
            <a href="https://www.ceibal.edu.uy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-200 transition-colors">
              Ceibal Portal
            </a>
            <span className="text-slate-800">|</span>
            <span className="text-slate-500 font-mono">Local Time: 2026-07-10</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
