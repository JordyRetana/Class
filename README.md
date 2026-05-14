# CodeClass Studio

Plataforma educativa para crear salas en vivo, publicar ejercicios de codigo y recibir entregas de estudiantes.

## Que incluye

- Sala de profesor con codigo para estudiantes y PIN privado.
- Vista estudiante para entrar desde otra computadora con el codigo de sala.
- Crear, editar y borrar ejercicios desde el panel del profesor.
- Evaluacion automatica por resultado, codigo similar o elementos clave.
- Registro de entregas recientes para que el profesor vea nombre, ejercicio y score.
- Almacenamiento local persistente en `backend/data/storage/classrooms.json`.

## Requisitos

- Node.js 18 o superior.
- Dos terminales: una para backend y otra para frontend.

## Ejecutar en la misma computadora

### Backend

```bash
cd backend
npm install
npm run dev
```

El backend queda en:

```txt
http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend queda normalmente en:

```txt
http://localhost:5173
```

## Usar en dos computadoras de la misma red

1. En la computadora del profesor, ejecute el backend:

```bash
cd backend
npm run dev
```

2. En otra terminal, ejecute el frontend abierto para la red:

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

3. Busque la IP local de la computadora del profesor. En Windows:

```powershell
ipconfig
```

4. En la computadora del estudiante abra:

```txt
http://IP-DEL-PROFESOR:5173
```

Ejemplo:

```txt
http://192.168.1.25:5173
```

5. Si el frontend del estudiante no logra evaluar, configure la URL del backend antes de iniciar el frontend:

```powershell
$env:VITE_API_URL="http://IP-DEL-PROFESOR:4000/api"
npm run dev -- --host 0.0.0.0
```

## Usar desde redes distintas

Para estudiantes fuera de la misma red, no sirve `localhost` ni la IP local de la computadora del profesor. Debe publicar la app en internet.

La guia completa esta en:

```txt
DEPLOYMENT.md
```

Resumen:

- Suba el repo a GitHub.
- Publique el backend en Render, Railway o un VPS.
- Publique el frontend en Vercel o Netlify.
- Configure `VITE_API_URL` en el frontend con la URL publica del backend.

## Flujo de uso

1. El profesor entra en la vista Profesor.
2. Crea una sala o abre una existente con codigo y PIN.
3. Copia el codigo de estudiante.
4. Crea ejercicios o edita los existentes.
5. El estudiante entra en la vista Estudiante con su nombre y el codigo de sala.
6. El estudiante resuelve y envia.
7. El profesor presiona Actualizar panel y ve las entregas recientes.

## Tipos de evaluacion

- Mismo resultado: ejecuta la solucion del profesor y la del estudiante. En este MVP solo funciona con JavaScript.
- Codigo igual o similar: compara codigo normalizado.
- Elementos clave: valida que aparezcan palabras, etiquetas o fragmentos esperados.

## Nota de produccion

Este MVP ejecuta JavaScript con `worker_threads`, timeout y contexto limitado de Node. Para produccion real conviene usar un sandbox externo como Judge0, Docker aislado o un servicio de ejecucion separado.
