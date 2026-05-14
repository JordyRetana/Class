import React, { useEffect, useMemo, useState } from "react";
import { LogIn, RefreshCw, Send, Trophy } from "lucide-react";
import CodeEditor from "../components/CodeEditor";
import { evaluateCode, getClassroom, getExercises } from "../services/api";

const languageLabels = {
  javascript: "JavaScript",
  html: "HTML",
  css: "CSS",
  java: "Java",
  python: "Python",
  csharp: "C#",
  sql: "SQL"
};

const evaluationLabels = {
  same_output: "Mismo resultado",
  same_code: "Codigo igual o similar",
  contains_keywords: "Elementos clave"
};

function EstudiantePage({ session, onSessionChange }) {
  const [joinForm, setJoinForm] = useState({
    classroomCode: session?.classroomCode || "",
    studentName: session?.studentName || ""
  });
  const [classroom, setClassroom] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);

  const selectedExercise = useMemo(() => {
    return exercises.find((exercise) => exercise.id === selectedExerciseId) || null;
  }, [exercises, selectedExerciseId]);

  useEffect(() => {
    if (session?.classroomCode && session?.studentName) {
      enterRoom(session);
    }
  }, []);

  async function enterRoom(activeSession) {
    setStatus(null);
    setLoadingExercises(true);

    try {
      const response = await getClassroom(activeSession.classroomCode);

      if (!response.ok) {
        setStatus({ type: "error", text: response.message || "No se pudo entrar." });
        return;
      }

      setClassroom(response.classroom);
      onSessionChange({
        classroomCode: activeSession.classroomCode.trim().toUpperCase(),
        studentName: activeSession.studentName.trim()
      });
      await loadExercises(activeSession.classroomCode);
    } catch (error) {
      setStatus({
        type: "error",
        text: "No se pudo conectar con el backend. Revise que VITE_API_URL apunte a la URL publica de Render."
      });
    } finally {
      setLoadingExercises(false);
    }
  }

  async function handleJoin(event) {
    event.preventDefault();

    if (!joinForm.classroomCode.trim() || !joinForm.studentName.trim()) {
      setStatus({ type: "error", text: "Escriba su nombre y el codigo de sala." });
      return;
    }

    await enterRoom(joinForm);
  }

  async function loadExercises(classroomCode = session?.classroomCode) {
    if (!classroomCode) return;

    setStatus(null);
    setLoadingExercises(true);

    try {
      const response = await getExercises(classroomCode);

      if (!response.ok) {
        setStatus({
          type: "error",
          text: response.message || "No se pudieron cargar los ejercicios."
        });
        return;
      }

      const list = response.exercises || [];
      setExercises(list);

      if (list.length > 0) {
        const current = list.find((item) => item.id === selectedExerciseId) || list[0];
        setSelectedExerciseId(current.id);

        if (!selectedExerciseId || selectedExerciseId !== current.id) {
          setStudentCode(current.starterCode || "");
          setResult(null);
        }
      } else {
        setSelectedExerciseId("");
        setStudentCode("");
        setResult(null);
      }
    } catch (error) {
      setStatus({
        type: "error",
        text: "No se pudo conectar con el backend. Revise que VITE_API_URL apunte a la URL publica de Render."
      });
    } finally {
      setLoadingExercises(false);
    }
  }

  function handleSelectExercise(id) {
    const exercise = exercises.find((item) => item.id === id);

    setSelectedExerciseId(id);
    setStudentCode(exercise?.starterCode || "");
    setResult(null);
    setStatus(null);
  }

  async function handleEvaluate() {
    if (!selectedExercise) {
      setStatus({ type: "error", text: "Debe seleccionar un ejercicio." });
      return;
    }

    setLoadingEvaluation(true);
    setStatus(null);
    setResult(null);

    try {
      const response = await evaluateCode({
        classroomCode: classroom.code,
        payload: {
          exerciseId: selectedExercise.id,
          studentCode,
          studentName: session?.studentName || joinForm.studentName
        }
      });

      if (!response.ok) {
        setStatus({
          type: "error",
          text: response.message || "No se pudo evaluar el codigo."
        });
        return;
      }

      setResult(response);
    } catch (error) {
      setStatus({
        type: "error",
        text: "No se pudo conectar con el backend para evaluar. Revise la URL publica del backend."
      });
    } finally {
      setLoadingEvaluation(false);
    }
  }

  if (!classroom) {
    return (
      <section className="workspace two-columns">
        <form className="panel compact-panel" onSubmit={handleJoin}>
          <div className="panel-title">
            <div>
              <span className="kicker">Estudiante</span>
              <h2>Entrar a la sala</h2>
              <p>Use el codigo que aparece en la pantalla del profesor.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Nombre
              <input
                value={joinForm.studentName}
                onChange={(event) =>
                  setJoinForm((current) => ({
                    ...current,
                    studentName: event.target.value
                  }))
                }
                placeholder="Ej: Maria"
              />
            </label>

            <label>
              Codigo de sala
              <input
                value={joinForm.classroomCode}
                onChange={(event) =>
                  setJoinForm((current) => ({
                    ...current,
                    classroomCode: event.target.value.toUpperCase()
                  }))
                }
                placeholder="Codigo del profesor"
              />
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={loadingExercises}>
            <LogIn size={18} />
            {loadingExercises ? "Entrando..." : "Entrar como estudiante"}
          </button>

          {status && <div className={`notice ${status.type}`}>{status.text}</div>}
        </form>

        <section className="panel compact-panel">
          <span className="kicker">Acceso privado</span>
          <h2>Use el codigo de su profesor</h2>
          <p>
            Cada sala tiene un codigo propio. Pidalo al profesor antes de
            entrar.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className="workspace student-grid">
      <section className="panel">
        <div className="panel-title">
          <div>
            <span className="kicker">Sala {classroom.code}</span>
            <h2>Resolver ejercicio</h2>
            <p>
              {session?.studentName || joinForm.studentName}, seleccione un ejercicio
              y envie su solucion.
            </p>
          </div>

          <button
            className="ghost-button"
            onClick={() => loadExercises(classroom.code)}
            type="button"
            disabled={loadingExercises}
          >
            <RefreshCw size={16} />
            {loadingExercises ? "Cargando..." : "Actualizar"}
          </button>
        </div>

        <label>
          Ejercicio
          <select
            value={selectedExerciseId}
            onChange={(event) => handleSelectExercise(event.target.value)}
            disabled={exercises.length === 0}
          >
            {exercises.length === 0 && (
              <option value="">No hay ejercicios disponibles</option>
            )}

            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.title}
              </option>
            ))}
          </select>
        </label>

        {selectedExercise && (
          <div className="exercise-box">
            <h3>{selectedExercise.title}</h3>
            <p>{selectedExercise.description}</p>

            <div className="pill-row">
              <span>{languageLabels[selectedExercise.language] || selectedExercise.language}</span>
              <span>
                {evaluationLabels[selectedExercise.evaluationType] ||
                  selectedExercise.evaluationType}
              </span>
            </div>
          </div>
        )}

        {selectedExercise ? (
          <CodeEditor
            title="Editor del estudiante"
            subtitle="Escriba aqui su solucion."
            language={selectedExercise.language}
            value={studentCode}
            onChange={setStudentCode}
            height="430px"
          />
        ) : (
          <div className="empty-state">
            El profesor aun no ha publicado ejercicios en esta sala.
          </div>
        )}

        <button
          className="primary-button"
          type="button"
          onClick={handleEvaluate}
          disabled={loadingEvaluation || !selectedExercise}
        >
          <Send size={18} />
          {loadingEvaluation ? "Evaluando..." : "Enviar solucion"}
        </button>

        {status && <div className={`notice ${status.type}`}>{status.text}</div>}
      </section>

      <aside className="panel result-panel">
        <span className="kicker">Retroalimentacion</span>
        <h2>Resultado</h2>

        {!result && (
          <div className="empty-state">
            Cuando envie su solucion, aqui vera el score y los detalles.
          </div>
        )}

        {result && (
          <div className="result-content">
            <div
              className={`score-ring ${
                result.score === 100
                  ? "perfect"
                  : result.score >= 60
                    ? "medium"
                    : "low"
              }`}
            >
              <Trophy size={28} />
              <strong>{result.score}%</strong>
              <span>{result.result?.passed ? "Aprobado" : "Por mejorar"}</span>
            </div>

            <div className="feedback-card">
              <h3>{result.result?.passed ? "Muy bien" : "Revise su solucion"}</h3>
              <p>{result.result?.message || "Evaluacion completada."}</p>
            </div>

            {result.result?.details?.expectedOutput !== undefined && (
              <div className="detail-box">
                <h4>Salida esperada</h4>
                <pre>
                  {JSON.stringify(result.result.details.expectedOutput, null, 2)}
                </pre>
              </div>
            )}

            {result.result?.details?.studentOutput !== undefined && (
              <div className="detail-box">
                <h4>Salida de su codigo</h4>
                <pre>
                  {JSON.stringify(result.result.details.studentOutput, null, 2)}
                </pre>
              </div>
            )}

            {result.result?.details?.error && (
              <div className="detail-box error-detail">
                <h4>Error</h4>
                <pre>{result.result.details.error}</pre>
              </div>
            )}

            {result.result?.details?.keywordResults && (
              <div className="keyword-list">
                <h4>Elementos esperados</h4>

                {result.result.details.keywordResults.map((item) => (
                  <div
                    key={item.keyword}
                    className={item.passed ? "keyword ok" : "keyword missing"}
                  >
                    <span>{item.passed ? "OK" : "NO"}</span>
                    <code>{item.keyword}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </section>
  );
}

export default EstudiantePage;
