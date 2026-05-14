# Publicar CodeClass en internet

Para que profesor y estudiantes entren desde redes distintas, la app necesita dos URLs publicas:

- Backend publico: API Node/Express.
- Frontend publico: sitio React/Vite.

La opcion mas directa es Render para backend y Vercel para frontend.

## 1. Subir el repo a GitHub

Primero autentique GitHub CLI:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth login
```

Luego cree y suba el repo:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" repo create plataforma-codigo-mvp --private --source . --remote origin --push
```

Si lo quiere publico, use `--public` en vez de `--private`.

## 2. Publicar backend en Render

1. Entre a Render y cree un `Web Service`.
2. Conecte el repo de GitHub.
3. Configure:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

4. Variables de entorno recomendadas:

```txt
NODE_ENV=production
DATA_DIR=/var/data
```

5. Agregue un Disk en Render:

```txt
Mount Path: /var/data
Size: 1 GB
```

Render le dara una URL parecida a:

```txt
https://plataforma-codigo-backend.onrender.com
```

La API queda en:

```txt
https://plataforma-codigo-backend.onrender.com/api
```

## 3. Publicar frontend en Vercel

1. Entre a Vercel y cree un nuevo proyecto desde el mismo repo.
2. Configure:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

3. Agregue esta variable de entorno en Vercel:

```txt
VITE_API_URL=https://TU-BACKEND.onrender.com/api
```

4. Despliegue.

Vercel le dara una URL parecida a:

```txt
https://plataforma-codigo-mvp.vercel.app
```

Esa es la URL que comparten profesor y estudiantes.

## 4. CORS opcional

El backend permite cualquier origen por defecto para facilitar pruebas. Si quiere limitarlo al frontend publicado, agregue en Render:

```txt
FRONTEND_ORIGIN=https://TU-FRONTEND.vercel.app
```

## 5. Probar

1. Abra la URL de Vercel.
2. En Profesor, cree una sala.
3. Comparta el codigo con estudiantes.
4. Cada estudiante entra con su nombre y codigo de sala desde cualquier red.
