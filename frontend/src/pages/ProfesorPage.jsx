import React, { useEffect, useMemo, useState } from "react";
import {
  Clipboard,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Wand2
} from "lucide-react";
import CodeEditor from "../components/CodeEditor";
import {
  createClassroom,
  createExercise,
  deleteExercise,
  getSubmissions,
  getTeacherClassroom,
  teacherLogin,
  updateExercise
} from "../services/api";

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "csharp", label: "C#" },
  { value: "sql", label: "SQL" }
];

const evaluationOptions = [
  {
    value: "same_output",
    label: "Mismo resultado",
    helper: "Ejecuta solucion y respuesta. En este MVP solo funciona con JavaScript."
  },
  {
    value: "same_code",
    label: "Codigo igual o similar",
    helper: "Compara normalizando espacios y comentarios."
  },
  {
    value: "contains_keywords",
    label: "Elementos clave",
    helper: "El estudiante pasa si incluye todos los fragmentos esperados."
  }
];

const templates = {
  javascript: {
    title: "JavaScript: calcular total",
    description: "Muestre en consola el total de 2500 + 1800.",
    starterCode: "// Escriba su codigo aqui\n",
    referenceCode: "const total = 2500 + 1800;\nconsole.log(total);",
    evaluationType: "same_output",
    keywords: ""
  },
  html: {
    title: "HTML: crear tarjeta",
    description:
      "Cree una tarjeta con un h1 que diga Bienvenidos y un parrafo que diga Curso de programacion.",
    starterCode: '<!-- Escriba su HTML aqui -->\n<div class="card">\n\n</div>',
    referenceCode:
      '<div class="card">\n  <h1>Bienvenidos</h1>\n  <p>Curso de programacion</p>\n</div>',
    evaluationType: "contains_keywords",
    keywords: "<h1>\nBienvenidos\n<p>\nCurso de programacion"
  },
  css: {
    title: "CSS: boton principal",
    description:
      "Cree una clase .btn-primary con fondo azul, texto blanco y bordes redondeados.",
    starterCode: ".btn-primary {\n\n}",
    referenceCode:
      ".btn-primary {\n  background: blue;\n  color: white;\n  border-radius: 8px;\n}",
    evaluationType: "contains_keywords",
    keywords: ".btn-primary\nbackground\nblue\ncolor\nwhite\nborder-radius"
  },
  java: {
    title: "Java: imprimir saludo",
    description: "Escriba una clase Main que imprima Hola mundo en consola.",
    starterCode:
      "public class Main {\n  public static void main(String[] args) {\n\n  }\n}",
    referenceCode:
      'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hola mundo");\n  }\n}',
    evaluationType: "contains_keywords",
    keywords: "public class Main\npublic static void main\nSystem.out.println\nHola mundo"
  },
  python: {
    title: "Python: imprimir total",
    description: "Imprima el resultado de 10 + 15.",
    starterCode: "# Escriba su codigo aqui\n",
    referenceCode: "total = 10 + 15\nprint(total)",
    evaluationType: "contains_keywords",
    keywords: "print\n10\n15"
  },
  csharp: {
    title: "C#: imprimir mensaje",
    description: "Imprima Bienvenido en consola.",
    starterCode:
      "using System;\n\nclass Program {\n  static void Main() {\n\n  }\n}",
    referenceCode:
      'using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Bienvenido");\n  }\n}',
    evaluationType: "contains_keywords",
    keywords: "Console.WriteLine\nBienvenido"
  },
  sql: {
    title: "SQL: consultar clientes",
    description: "Seleccione todos los campos de la tabla Clientes.",
    starterCode: "-- Escriba su consulta aqui\n",
    referenceCode: "SELECT * FROM Clientes;",
    evaluationType: "contains_keywords",
    keywords: "SELECT\nFROM\nClientes"
  }
};

const emptyForm = {
  title: templates.javascript.title,
  description: templates.javascript.description,
  language: "javascript",
  evaluationType: templates.javascript.evaluationType,
  starterCode: templates.javascript.starterCode,
  referenceCode: templates.javascript.referenceCode,
  keywords: templates.javascript.keywords,
  teacherNotes: ""
};

function exerciseToForm(exercise) {
  return {
    title: exercise.title || "",
    description: exercise.description || "",
    language: exercise.language || "javascript",
    evaluationType: exercise.evaluationType || "contains_keywords",
    starterCode: exercise.starterCode || "",
    referenceCode: exercise.referenceCode || "",
    keywords: Array.isArray(exercise.keywords) ? exercise.keywords.join("\n") : "",
    teacherNotes: exercise.teacherNotes || ""
  };
}

function ProfesorPage({ session, onSessionChange }) {
  const [joinForm, setJoinForm] = useState({
    name: "Mi clase",
    classroomCode: session?.classroomCode || "",
    teacherPin: session?.teacherPin || ""
  });
  const [classroom, setClassroom] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const evaluationHelper = useMemo(() => {
    return (
      evaluationOptions.find((item) => item.value === form.evaluationType)
        ?.helper || ""
    );
  }, [form.evaluationType]);

  useEffect(() => {
    if (session?.classroomCode && session?.teacherPin) {
      loadTeacherRoom(session);
    }
  }, []);

  function isMissingClassroom(response) {
    return response?.message?.toLowerCase().includes("sala no encontrada");
  }

  function clearExpiredSession(message) {
    onSessionChange(null);
    setClassroom(null);
    setSubmissions([]);
    setEditingId(null);
    setForm(emptyForm);
    setJoinForm((current) => ({
      ...current,
      classroomCode: "",
      teacherPin: ""
    }));
    setStatus({
      type: "error",
      text:
        message ||
        "La sala guardada ya no existe. Cree una sala nueva para continuar."
    });
  }

  async function loadTeacherRoom(activeSession = session) {
    if (!activeSession?.classroomCode || !activeSession?.teacherPin) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await getTeacherClassroom(activeSession);

      if (!response.ok) {
        if (isMissingClassroom(response)) {
          clearExpiredSession(
            "La sala anterior ya no existe en el servidor. Cree una sala nueva."
          );
          return;
        }

        setStatus({ type: "error", text: response.message || "No se pudo abrir la sala." });
        return;
      }

      setClassroom(response.classroom);
      setJoinForm((current) => ({
        ...current,
        classroomCode: activeSession.classroomCode,
        teacherPin: activeSession.teacherPin
      }));
      await loadSubmissions(activeSession);
    } catch (error) {
      setStatus({ type: "error", text: "No se pudo conectar con el backend." });
    } finally {
      setLoading(false);
    }
  }

  async function loadSubmissions(activeSession = session) {
    if (!activeSession?.classroomCode || !activeSession?.teacherPin) return;

    const response = await getSubmissions(activeSession);

    if (response.ok) {
      setSubmissions(response.submissions || []);
    }
  }

  async function handleCreateRoom(event) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await createClassroom({ name: joinForm.name });

      if (!response.ok) {
        setStatus({ type: "error", text: response.message || "No se pudo crear la sala." });
        return;
      }

      const nextSession = {
        classroomCode: response.classroom.code,
        teacherPin: response.teacherPin
      };

      onSessionChange(nextSession);
      setClassroom(response.classroom);
      setJoinForm((current) => ({
        ...current,
        classroomCode: response.classroom.code,
        teacherPin: response.teacherPin
      }));
      setSubmissions([]);
      setStatus({
        type: "success",
        text: `Sala creada. Codigo: ${response.classroom.code}. PIN profesor: ${response.teacherPin}.`
      });
    } catch (error) {
      setStatus({ type: "error", text: "No se pudo conectar con el backend." });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await teacherLogin(joinForm);

      if (!response.ok) {
        setStatus({ type: "error", text: response.message || "No se pudo entrar." });
        return;
      }

      const nextSession = {
        classroomCode: joinForm.classroomCode.trim().toUpperCase(),
        teacherPin: joinForm.teacherPin.trim()
      };

      onSessionChange(nextSession);
      setClassroom(response.classroom);
      await loadSubmissions(nextSession);
    } catch (error) {
      setStatus({ type: "error", text: "No se pudo conectar con el backend." });
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyTemplate(language) {
    const template = templates[language];

    if (!template) return;

    setForm((current) => ({
      ...current,
      language,
      title: template.title,
      description: template.description,
      starterCode: template.starterCode,
      referenceCode: template.referenceCode,
      evaluationType: template.evaluationType,
      keywords: template.keywords
    }));
    setStatus(null);
  }

  function startNewExercise() {
    setEditingId(null);
    setForm(emptyForm);
    setStatus(null);
  }

  function startEdit(exercise) {
    setEditingId(exercise.id);
    setForm(exerciseToForm(exercise));
    setStatus(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!session?.classroomCode || !session?.teacherPin) {
      setStatus({ type: "error", text: "Primero debe crear o abrir una sala." });
      return;
    }

    setLoading(true);
    setStatus(null);

    const payload = {
      ...form,
      keywords: form.keywords
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      const action = editingId
        ? updateExercise({
            ...session,
            exerciseId: editingId,
            payload
          })
        : createExercise({
            ...session,
            payload
          });
      const response = await action;

      if (!response.ok) {
        if (isMissingClassroom(response)) {
          clearExpiredSession(
            "La sala ya no existe en el servidor. Cree una sala nueva y vuelva a publicar el ejercicio."
          );
          return;
        }

        setStatus({
          type: "error",
          text: response.errors?.join(" ") || response.message || "No se pudo guardar."
        });
        return;
      }

      await loadTeacherRoom(session);
      setEditingId(response.exercise.id);
      setStatus({
        type: "success",
        text: editingId ? "Ejercicio actualizado." : "Ejercicio creado."
      });
    } catch (error) {
      setStatus({ type: "error", text: "No se pudo conectar con el backend." });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(exerciseId) {
    if (!window.confirm("Eliminar este ejercicio y sus entregas?")) return;

    setLoading(true);
    setStatus(null);

    try {
      const response = await deleteExercise({
        ...session,
        exerciseId
      });

      if (!response.ok) {
        if (isMissingClassroom(response)) {
          clearExpiredSession(
            "La sala ya no existe en el servidor. Cree una sala nueva."
          );
          return;
        }

        setStatus({ type: "error", text: response.message || "No se pudo borrar." });
        return;
      }

      if (editingId === exerciseId) startNewExercise();
      await loadTeacherRoom(session);
      setStatus({ type: "success", text: "Ejercicio eliminado." });
    } catch (error) {
      setStatus({ type: "error", text: "No se pudo conectar con el backend." });
    } finally {
      setLoading(false);
    }
  }

  function copyStudentCode() {
    navigator.clipboard?.writeText(classroom?.code || "");
  }

  function handleLogout() {
    onSessionChange(null);
    setClassroom(null);
    setSubmissions([]);
    setEditingId(null);
    setForm(emptyForm);
    setJoinForm((current) => ({
      ...current,
      classroomCode: "",
      teacherPin: ""
    }));
    setStatus(null);
  }

  if (!classroom) {
    return (
      <section className="workspace two-columns">
        <form className="panel compact-panel" onSubmit={handleCreateRoom}>
          <div className="panel-title">
            <div>
              <span className="kicker">Profesor</span>
              <h2>Crear sala en vivo</h2>
              <p>Se genera un codigo para estudiantes y un PIN privado para usted.</p>
            </div>
          </div>

          <label>
            Nombre de la clase
            <input
              value={joinForm.name}
              onChange={(event) =>
                setJoinForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            <Plus size={18} />
            {loading ? "Creando..." : "Crear sala"}
          </button>
        </form>

        <form className="panel compact-panel" onSubmit={handleLogin}>
          <div className="panel-title">
            <div>
              <span className="kicker">Acceso</span>
              <h2>Abrir sala existente</h2>
              <p>Use el codigo de sala y el PIN del profesor.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Codigo
              <input
                value={joinForm.classroomCode}
                onChange={(event) =>
                  setJoinForm((current) => ({
                    ...current,
                    classroomCode: event.target.value.toUpperCase()
                  }))
                }
                placeholder="Codigo de sala"
              />
            </label>

            <label>
              PIN
              <input
                value={joinForm.teacherPin}
                onChange={(event) =>
                  setJoinForm((current) => ({
                    ...current,
                    teacherPin: event.target.value
                  }))
                }
                placeholder="PIN privado"
                type="password"
              />
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            <LogIn size={18} />
            {loading ? "Entrando..." : "Entrar como profesor"}
          </button>

          {status && <div className={`notice ${status.type}`}>{status.text}</div>}
        </form>
      </section>
    );
  }

  return (
    <section className="workspace professor-grid">
      <aside className="panel side-panel">
        <span className="kicker">Sala activa</span>
        <h2>{classroom.name}</h2>

        <div className="room-code">
          <span>Codigo estudiante</span>
          <strong>{classroom.code}</strong>
          <button type="button" className="ghost-button" onClick={copyStudentCode}>
            <Clipboard size={16} />
            Copiar
          </button>
        </div>

        <button
          className="ghost-button full-button"
          type="button"
          onClick={() => loadTeacherRoom(session)}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Actualizar panel
        </button>

        <button className="ghost-button full-button" type="button" onClick={startNewExercise}>
          <Plus size={16} />
          Nuevo ejercicio
        </button>

        <button className="ghost-button full-button" type="button" onClick={handleLogout}>
          <LogOut size={16} />
          Cerrar sesion
        </button>

        <div className="list-block">
          <h3>Ejercicios</h3>
          {classroom.exercises?.length === 0 && (
            <div className="empty-state">Todavia no hay ejercicios.</div>
          )}

          {classroom.exercises?.map((exercise) => (
            <div
              key={exercise.id}
              className={`list-item ${editingId === exercise.id ? "selected" : ""}`}
            >
              <button type="button" onClick={() => startEdit(exercise)}>
                <strong>{exercise.title}</strong>
                <span>{exercise.language}</span>
              </button>
              <button
                type="button"
                className="icon-danger"
                onClick={() => handleDelete(exercise.id)}
                aria-label="Eliminar ejercicio"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="list-block">
          <h3>Entregas recientes</h3>
          {submissions.length === 0 && (
            <div className="empty-state">Aun no hay entregas.</div>
          )}

          {submissions.slice(0, 8).map((submission) => (
            <div className="submission-row" key={submission.id}>
              <strong>{submission.studentName}</strong>
              <span>{submission.exerciseTitle}</span>
              <b className={submission.score === 100 ? "ok-text" : "warn-text"}>
                {submission.score}%
              </b>
            </div>
          ))}
        </div>
      </aside>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="panel-title">
          <div>
            <span className="kicker">Editor profesor</span>
            <h2>{editingId ? "Editar ejercicio" : "Crear ejercicio"}</h2>
            <p>Los cambios quedan disponibles para estudiantes de esta sala.</p>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={() => applyTemplate(form.language)}
          >
            <Wand2 size={16} />
            Plantilla
          </button>
        </div>

        <div className="form-grid">
          <label>
            Titulo
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Ej: Crear una funcion de suma"
            />
          </label>

          <label>
            Lenguaje
            <select
              value={form.language}
              onChange={(event) => applyTemplate(event.target.value)}
            >
              {languageOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Descripcion para estudiante
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>

        <label>
          Tipo de evaluacion
          <select
            value={form.evaluationType}
            onChange={(event) => updateField("evaluationType", event.target.value)}
          >
            {evaluationOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <small>{evaluationHelper}</small>
        </label>

        {form.evaluationType === "contains_keywords" && (
          <label>
            Elementos clave, uno por linea
            <textarea
              rows="5"
              value={form.keywords}
              onChange={(event) => updateField("keywords", event.target.value)}
            />
          </label>
        )}

        <label>
          Notas privadas
          <textarea
            rows="3"
            value={form.teacherNotes}
            onChange={(event) => updateField("teacherNotes", event.target.value)}
          />
        </label>

        {status && <div className={`notice ${status.type}`}>{status.text}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? "Guardando..." : editingId ? "Guardar cambios" : "Crear ejercicio"}
        </button>
      </form>

      <section className="panel editor-panel-stack">
        <CodeEditor
          title="Codigo inicial"
          subtitle="Esto vera el estudiante al abrir el ejercicio."
          language={form.language}
          value={form.starterCode}
          onChange={(value) => updateField("starterCode", value)}
          height="260px"
        />

        <div className="solution-title">
          <span className="kicker">Solucion esperada</span>
          <h2>Codigo del profesor</h2>
          <p>Se usa como referencia para evaluar.</p>
        </div>

        <CodeEditor
          language={form.language}
          value={form.referenceCode}
          onChange={(value) => updateField("referenceCode", value)}
          height="300px"
        />
      </section>
    </section>
  );
}

export default ProfesorPage;
