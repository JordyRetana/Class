const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "storage");
const DATA_FILE = path.join(DATA_DIR, "classrooms.json");

const SUPPORTED_LANGUAGES = [
  "javascript",
  "html",
  "css",
  "java",
  "python",
  "csharp",
  "sql"
];

const EVALUATION_TYPES = [
  "same_output",
  "same_code",
  "contains_keywords"
];

const classrooms = new Map();

function now() {
  return new Date().toISOString();
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let code = "";

    for (let index = 0; index < 6; index += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    if (!classrooms.has(code)) return code;
  }

  return randomUUID().slice(0, 6).toUpperCase();
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ classrooms: [] }, null, 2));
  }
}

function saveClassrooms() {
  ensureDataFile();

  const data = {
    classrooms: Array.from(classrooms.values())
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadClassrooms() {
  ensureDataFile();

  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    classrooms.clear();

    for (const classroom of parsed.classrooms || []) {
      if (classroom.code) {
        classrooms.set(normalizeCode(classroom.code), {
          ...classroom,
          code: normalizeCode(classroom.code),
          exercises: Array.isArray(classroom.exercises) ? classroom.exercises : [],
          submissions: Array.isArray(classroom.submissions)
            ? classroom.submissions
            : []
        });
      }
    }
  } catch (error) {
    classrooms.clear();
  }
}

function publicExercise(exercise) {
  const {
    referenceCode,
    teacherNotes,
    ...safeExercise
  } = exercise;

  return safeExercise;
}

function publicClassroom(classroom) {
  return {
    code: classroom.code,
    name: classroom.name,
    createdAt: classroom.createdAt,
    updatedAt: classroom.updatedAt,
    exerciseCount: classroom.exercises.length
  };
}

function teacherClassroom(classroom) {
  return {
    ...classroom,
    teacherPin: undefined
  };
}

function createClassroom(data = {}) {
  const code = normalizeCode(data.code || generateRoomCode());
  const teacherPin = String(data.teacherPin || generatePin()).trim();

  if (classrooms.has(code)) {
    throw new Error("Ya existe una sala con ese codigo.");
  }

  const classroom = {
    code,
    teacherPin,
    name: String(data.name || "Clase de programacion").trim(),
    exercises: [],
    submissions: [],
    createdAt: now(),
    updatedAt: now()
  };

  classrooms.set(code, classroom);
  saveClassrooms();

  return {
    classroom: publicClassroom(classroom),
    teacherPin
  };
}

function getClassroom(code) {
  return classrooms.get(normalizeCode(code));
}

function verifyTeacherPin(code, pin) {
  const classroom = getClassroom(code);

  if (!classroom) return false;

  return String(classroom.teacherPin) === String(pin || "").trim();
}

function listExercises(code, { includePrivate = false } = {}) {
  const classroom = getClassroom(code);

  if (!classroom) return null;

  return includePrivate ? classroom.exercises : classroom.exercises.map(publicExercise);
}

function createExercise(code, data) {
  const classroom = getClassroom(code);

  if (!classroom) return null;

  const exercise = {
    id: randomUUID(),
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    language: data.language,
    starterCode: String(data.starterCode || ""),
    referenceCode: String(data.referenceCode || ""),
    evaluationType: data.evaluationType,
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    teacherNotes: String(data.teacherNotes || ""),
    createdAt: now(),
    updatedAt: now()
  };

  classroom.exercises.unshift(exercise);
  classroom.updatedAt = now();
  saveClassrooms();

  return exercise;
}

function updateExercise(code, exerciseId, data) {
  const classroom = getClassroom(code);

  if (!classroom) return null;

  const exercise = classroom.exercises.find((item) => item.id === exerciseId);

  if (!exercise) return null;

  Object.assign(exercise, {
    title: String(data.title || "").trim(),
    description: String(data.description || "").trim(),
    language: data.language,
    starterCode: String(data.starterCode || ""),
    referenceCode: String(data.referenceCode || ""),
    evaluationType: data.evaluationType,
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    teacherNotes: String(data.teacherNotes || ""),
    updatedAt: now()
  });

  classroom.updatedAt = now();
  saveClassrooms();

  return exercise;
}

function deleteExercise(code, exerciseId) {
  const classroom = getClassroom(code);

  if (!classroom) return false;

  const initialLength = classroom.exercises.length;
  classroom.exercises = classroom.exercises.filter((item) => item.id !== exerciseId);

  if (classroom.exercises.length === initialLength) return false;

  classroom.submissions = classroom.submissions.filter(
    (submission) => submission.exerciseId !== exerciseId
  );
  classroom.updatedAt = now();
  saveClassrooms();

  return true;
}

function getExerciseById(code, exerciseId) {
  const classroom = getClassroom(code);

  if (!classroom) return null;

  return classroom.exercises.find((exercise) => exercise.id === exerciseId) || null;
}

function recordSubmission(code, data) {
  const classroom = getClassroom(code);

  if (!classroom) return null;

  const submission = {
    id: randomUUID(),
    exerciseId: data.exerciseId,
    exerciseTitle: data.exerciseTitle,
    studentName: String(data.studentName || "Estudiante").trim(),
    studentCode: String(data.studentCode || ""),
    score: data.score,
    passed: Boolean(data.passed),
    resultMessage: data.resultMessage,
    createdAt: now()
  };

  classroom.submissions.unshift(submission);
  classroom.submissions = classroom.submissions.slice(0, 200);
  classroom.updatedAt = now();
  saveClassrooms();

  return submission;
}

function listSubmissions(code) {
  const classroom = getClassroom(code);

  if (!classroom) return null;

  return classroom.submissions;
}

function seedExamples() {
  if (classrooms.size > 0) return;

  const { classroom } = createClassroom({
    code: "CLASE1",
    teacherPin: "1234",
    name: "Clase demo"
  });

  createExercise(classroom.code, {
    title: "JavaScript: mostrar una suma",
    description:
      "Escriba un programa que muestre en consola el resultado de sumar 2 + 3.",
    language: "javascript",
    evaluationType: "same_output",
    starterCode: "// Escriba su solucion aqui\n",
    referenceCode: "console.log(2 + 3);",
    keywords: [],
    teacherNotes: "Ejemplo de evaluacion por mismo resultado."
  });

  createExercise(classroom.code, {
    title: "HTML: tarjeta basica",
    description:
      "Cree una tarjeta con un h1 que diga Bienvenidos y un parrafo que diga Curso de programacion.",
    language: "html",
    evaluationType: "contains_keywords",
    starterCode:
      '<!-- Escriba su HTML aqui -->\n<div class="card">\n\n</div>',
    referenceCode:
      '<div class="card">\n  <h1>Bienvenidos</h1>\n  <p>Curso de programacion</p>\n</div>',
    keywords: ["<h1>", "Bienvenidos", "<p>", "Curso de programacion"],
    teacherNotes: "Evalua por fragmentos clave."
  });
}

function validateExercisePayload(data) {
  const errors = [];

  if (!data.title || !String(data.title).trim()) errors.push("El titulo es obligatorio.");
  if (!data.description || !String(data.description).trim()) errors.push("La descripcion es obligatoria.");
  if (!data.language || !SUPPORTED_LANGUAGES.includes(data.language)) errors.push("El lenguaje seleccionado no es valido.");
  if (!data.starterCode && data.starterCode !== "") errors.push("El codigo inicial es obligatorio.");
  if (!data.referenceCode || !String(data.referenceCode).trim()) errors.push("El codigo solucion esperado es obligatorio.");
  if (!data.evaluationType || !EVALUATION_TYPES.includes(data.evaluationType)) errors.push("El tipo de evaluacion no es valido.");

  if (data.evaluationType === "same_output" && data.language !== "javascript") {
    errors.push("En este MVP, 'mismo resultado' solo ejecuta JavaScript. Para otros lenguajes use 'codigo similar/igual' o 'elementos clave'.");
  }

  if (data.evaluationType === "contains_keywords") {
    if (!Array.isArray(data.keywords) || data.keywords.length === 0) {
      errors.push("Para evaluar por elementos clave debe agregar al menos una palabra o fragmento esperado.");
    }
  }

  return errors;
}

loadClassrooms();

module.exports = {
  SUPPORTED_LANGUAGES,
  EVALUATION_TYPES,
  createClassroom,
  getClassroom,
  publicClassroom,
  teacherClassroom,
  verifyTeacherPin,
  createExercise,
  updateExercise,
  deleteExercise,
  listExercises,
  getExerciseById,
  recordSubmission,
  listSubmissions,
  seedExamples,
  validateExercisePayload
};
