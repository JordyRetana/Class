import React, { useState } from "react";
import ProfesorPage from "./pages/ProfesorPage";
import EstudiantePage from "./pages/EstudiantePage";

function readSavedSession(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

function App() {
  const [view, setView] = useState("profesor");
  const [teacherSession, setTeacherSession] = useState(() =>
    readSavedSession("codeclass.teacher")
  );
  const [studentSession, setStudentSession] = useState(() =>
    readSavedSession("codeclass.student")
  );

  function saveTeacherSession(session) {
    setTeacherSession(session);

    if (session) {
      localStorage.setItem("codeclass.teacher", JSON.stringify(session));
    } else {
      localStorage.removeItem("codeclass.teacher");
    }
  }

  function saveStudentSession(session) {
    setStudentSession(session);

    if (session) {
      localStorage.setItem("codeclass.student", JSON.stringify(session));
    } else {
      localStorage.removeItem("codeclass.student");
    }
  }

  return (
    <main className="app-shell">
      <header className="main-header">
        <div className="brand-block">
          <span className="eyebrow">CodeClass Studio</span>
          <h1>Aula en vivo para ejercicios de codigo</h1>
          <p>
            El profesor crea una sala con codigo y PIN. Los estudiantes entran
            desde otra computadora, resuelven ejercicios y el profesor ve las
            entregas en el panel.
          </p>
        </div>

        <nav className="role-switch" aria-label="Cambiar rol">
          <button
            type="button"
            className={view === "profesor" ? "active" : ""}
            onClick={() => setView("profesor")}
          >
            Profesor
          </button>

          <button
            type="button"
            className={view === "estudiante" ? "active" : ""}
            onClick={() => setView("estudiante")}
          >
            Estudiante
          </button>
        </nav>
      </header>

      {view === "profesor" ? (
        <ProfesorPage
          session={teacherSession}
          onSessionChange={saveTeacherSession}
        />
      ) : (
        <EstudiantePage
          session={studentSession}
          onSessionChange={saveStudentSession}
        />
      )}
    </main>
  );
}

export default App;
