const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  return response.json();
}

function pinHeaders(teacherPin) {
  return teacherPin ? { "X-Teacher-Pin": teacherPin } : {};
}

export function getCatalog() {
  return request("/catalog");
}

export function createClassroom(payload) {
  return request("/classrooms", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function teacherLogin({ classroomCode, teacherPin }) {
  return request(`/classrooms/${classroomCode}/teacher-login`, {
    method: "POST",
    body: JSON.stringify({ teacherPin })
  });
}

export function getTeacherClassroom({ classroomCode, teacherPin }) {
  return request(`/classrooms/${classroomCode}/teacher`, {
    headers: pinHeaders(teacherPin)
  });
}

export function getClassroom(classroomCode) {
  return request(`/classrooms/${classroomCode}`);
}

export function getExercises(classroomCode) {
  return request(`/classrooms/${classroomCode}/exercises`);
}

export function createExercise({ classroomCode, teacherPin, payload }) {
  return request(`/classrooms/${classroomCode}/exercises`, {
    method: "POST",
    headers: pinHeaders(teacherPin),
    body: JSON.stringify(payload)
  });
}

export function updateExercise({ classroomCode, teacherPin, exerciseId, payload }) {
  return request(`/classrooms/${classroomCode}/exercises/${exerciseId}`, {
    method: "PUT",
    headers: pinHeaders(teacherPin),
    body: JSON.stringify(payload)
  });
}

export function deleteExercise({ classroomCode, teacherPin, exerciseId }) {
  return request(`/classrooms/${classroomCode}/exercises/${exerciseId}`, {
    method: "DELETE",
    headers: pinHeaders(teacherPin)
  });
}

export function evaluateCode({ classroomCode, payload }) {
  return request(`/classrooms/${classroomCode}/evaluate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getSubmissions({ classroomCode, teacherPin }) {
  return request(`/classrooms/${classroomCode}/submissions`, {
    headers: pinHeaders(teacherPin)
  });
}
