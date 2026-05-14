const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const {
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
} = require("./data/exerciseStore");

const { evaluateSimple } = require("./services/simpleEvaluator");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
const allowedOrigin = process.env.FRONTEND_ORIGIN;

app.use(cors({
  origin: allowedOrigin ? allowedOrigin.split(",").map((origin) => origin.trim()) : true
}));
app.use(express.json({ limit: "900kb" }));

seedExamples();

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function getTeacherPin(req) {
  return req.headers["x-teacher-pin"] || req.query.pin || req.body?.teacherPin;
}

function requireClassroom(req, res, next) {
  const classroom = getClassroom(req.params.code);

  if (!classroom) {
    return res.status(404).json({
      ok: false,
      message: "Sala no encontrada. Revise el codigo."
    });
  }

  req.classroom = classroom;
  next();
}

function requireTeacher(req, res, next) {
  if (!verifyTeacherPin(req.params.code, getTeacherPin(req))) {
    return res.status(401).json({
      ok: false,
      message: "PIN de profesor incorrecto."
    });
  }

  next();
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend funcionando correctamente"
  });
});

app.get("/api/catalog", (req, res) => {
  res.json({
    ok: true,
    languages: SUPPORTED_LANGUAGES,
    evaluationTypes: EVALUATION_TYPES
  });
});

app.post("/api/classrooms", (req, res) => {
  try {
    const result = createClassroom(req.body);

    res.status(201).json({
      ok: true,
      message: "Sala creada correctamente.",
      ...result
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error.message
    });
  }
});

app.post("/api/classrooms/:code/teacher-login", requireClassroom, (req, res) => {
  if (!verifyTeacherPin(req.params.code, req.body?.teacherPin)) {
    return res.status(401).json({
      ok: false,
      message: "Codigo o PIN incorrecto."
    });
  }

  res.json({
    ok: true,
    classroom: teacherClassroom(req.classroom)
  });
});

app.get("/api/classrooms/:code", requireClassroom, (req, res) => {
  res.json({
    ok: true,
    classroom: publicClassroom(req.classroom)
  });
});

app.get(
  "/api/classrooms/:code/teacher",
  requireClassroom,
  requireTeacher,
  (req, res) => {
    res.json({
      ok: true,
      classroom: teacherClassroom(req.classroom)
    });
  }
);

app.get("/api/classrooms/:code/exercises", requireClassroom, (req, res) => {
  res.json({
    ok: true,
    exercises: listExercises(req.params.code)
  });
});

app.post(
  "/api/classrooms/:code/exercises",
  requireClassroom,
  requireTeacher,
  (req, res) => {
    const errors = validateExercisePayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Hay datos invalidos en el ejercicio.",
        errors
      });
    }

    const exercise = createExercise(req.params.code, req.body);

    res.status(201).json({
      ok: true,
      message: "Ejercicio creado correctamente.",
      exercise
    });
  }
);

app.put(
  "/api/classrooms/:code/exercises/:id",
  requireClassroom,
  requireTeacher,
  (req, res) => {
    const errors = validateExercisePayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "Hay datos invalidos en el ejercicio.",
        errors
      });
    }

    const exercise = updateExercise(req.params.code, req.params.id, req.body);

    if (!exercise) {
      return res.status(404).json({
        ok: false,
        message: "Ejercicio no encontrado."
      });
    }

    res.json({
      ok: true,
      message: "Ejercicio actualizado correctamente.",
      exercise
    });
  }
);

app.delete(
  "/api/classrooms/:code/exercises/:id",
  requireClassroom,
  requireTeacher,
  (req, res) => {
    const deleted = deleteExercise(req.params.code, req.params.id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "Ejercicio no encontrado."
      });
    }

    res.json({
      ok: true,
      message: "Ejercicio eliminado correctamente."
    });
  }
);

app.post("/api/classrooms/:code/evaluate", requireClassroom, async (req, res) => {
  try {
    const { exerciseId, studentCode, studentName } = req.body;

    if (!exerciseId || studentCode === undefined) {
      return res.status(400).json({
        ok: false,
        message: "Debe enviar exerciseId y studentCode."
      });
    }

    const exercise = getExerciseById(req.params.code, exerciseId);

    if (!exercise) {
      return res.status(404).json({
        ok: false,
        message: "Ejercicio no encontrado."
      });
    }

    const result = await evaluateSimple({
      exercise,
      studentCode
    });

    const submission = recordSubmission(req.params.code, {
      exerciseId,
      exerciseTitle: exercise.title,
      studentName,
      studentCode,
      score: result.score,
      passed: result.passed,
      resultMessage: result.message
    });

    res.json({
      ok: true,
      classroomCode: normalizeCode(req.params.code),
      exerciseId,
      language: exercise.language,
      score: result.score,
      result,
      submission
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Error interno evaluando el codigo.",
      detail: error.message
    });
  }
});

app.get(
  "/api/classrooms/:code/submissions",
  requireClassroom,
  requireTeacher,
  (req, res) => {
    res.json({
      ok: true,
      submissions: listSubmissions(req.params.code)
    });
  }
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend ejecutandose en http://0.0.0.0:${PORT}`);
});
