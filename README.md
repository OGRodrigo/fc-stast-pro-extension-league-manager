# FC Stats Pro League Manager 🏆

Sistema integral de gestión de ligas de fútbol con análisis avanzado de partidos mediante IA y OCR. Permite crear torneos, gestionar clubes, registrar resultados y generar estadísticas en tiempo real.

**Versión:** 1.0.0 (Beta)  
**Stack:** Node.js + Express + React + MongoDB  
**Autor:** Rodrigo  
**Licencia:** ISC

---

## 🎯 Características principales

### Backend
- **Gestión completa de torneos**: Crear, editar, eliminar y publicar ligas
- **Administración de clubes**: Crear equipos con escudos, gestionar plantillas
- **Registro de partidos**: Ingreso manual o por importación de imágenes
- **OCR inteligente**: Extracción automática de datos de fotos de marcadores
- **Tablas dinámicas**: Cálculo automático de puntos, diferencia de gol, etc.
- **Brackets automáticos**: Generación de playoff trees para competiciones
- **API REST segura**: Autenticación JWT, rate limiting, validaciones

### Frontend
- **Dashboard intuitivo**: Visualización de ligas, resultados y estadísticas
- **Gestor de partidos**: Interfaz para crear y editar encuentros
- **Importación visual**: Captura de imágenes de marcadores y extracción de datos
- **Páginas públicas**: Compartir torneos con enlaces públicos
- **Responsive design**: Optimizado para desktop y móvil
- **Animaciones fluidas**: UX moderna con Framer Motion

### Seguridad
- Helmet.js para headers HTTP seguros
- Rate limiting en endpoints críticos
- JWT con expiración configurable
- Validación de entrada en todas las rutas
- CORS configurado por dominio
- Contraseñas hasheadas con bcryptjs

---

## 🚀 Quick Start

### Requisitos previos
- Node.js 16+
- MongoDB (atlas o local)
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd fc-stats-pro-league-manager

# Instalar dependencias backend
npm install

# Instalar dependencias frontend
cd frontend
npm install
cd ..

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Desarrollo

```bash
# Terminal 1: Backend (http://localhost:3000)
npm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### Producción

```bash
# Backend
npm start

# Frontend
cd frontend
npm run build
```

---

## 📁 Estructura del proyecto

```
fc-stats-pro-league-manager/
├── src/                          # Backend
│   ├── config/                   # Configuraciones (DB, etc.)
│   ├── controllers/              # Lógica de negocios
│   ├── models/                   # Esquemas MongoDB
│   ├── routes/                   # Definición de endpoints
│   ├── middlewares/              # Auth, rate limit, upload
│   ├── services/                 # Servicios AI y utilidades
│   │   └── ai/                   # OCR, clasificación, normalización
│   └── utils/                    # Funciones auxiliares
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── pages/                # Componentes de página
│   │   ├── components/           # Componentes reutilizables
│   │   ├── auth/                 # Contexto y rutas protegidas
│   │   ├── api/                  # Cliente Axios
│   │   └── assets/               # Imágenes, logos, etc.
│   ├── index.html
│   └── vite.config.js
├── .env                          # Variables de entorno
└── package.json
```

---

## 🔌 API REST

Documentación completa en [API.md](./API.md)

### Endpoints principales

**Autenticación**
- `POST /auth/register` - Crear cuenta
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar token

**Torneos**
- `GET /tournaments` - Listar mis torneos
- `POST /tournaments` - Crear torneo
- `GET /tournaments/:id` - Detalle de torneo
- `PUT /tournaments/:id` - Editar torneo
- `DELETE /tournaments/:id` - Eliminar torneo

**Clubes**
- `GET /clubs` - Listar clubes
- `POST /clubs` - Crear club
- `PUT /clubs/:id` - Editar club
- `DELETE /clubs/:id` - Eliminar club

**Partidos**
- `GET /matches` - Listar partidos
- `POST /matches` - Registrar partido
- `PUT /matches/:id` - Actualizar resultado
- `DELETE /matches/:id` - Eliminar partido

**IA/OCR**
- `POST /ai/import-image` - Procesar imagen de marcador
- `POST /ai/validate` - Validar datos extraídos

**Público**
- `GET /public/tournaments/:slug` - Ver torneo público
- `GET /public/tournaments/:slug/stats` - Estadísticas públicas

---

## ⚙️ Configuración

Ver [.env.example](./.env.example) para todas las variables disponibles.

### Variables críticas

```
# Base de datos
MONGO_URI=mongodb+srv://...
JWT_SECRET=<mínimo 32 caracteres>

# URLs permitidas (CORS)
CLIENT_URL=http://localhost:5173,https://app.example.com

# AI/OCR
AZURE_VISION_KEY=<key de Azure Computer Vision>
OPENAI_API_KEY=<key de OpenAI>

# Email
SMTP_USER=<email>
SMTP_PASS=<password app>
```

---

## 📖 Documentación completa

- **[INSTALLATION.md](./docs/INSTALLATION.md)** - Guía detallada de instalación
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitectura técnica y decisiones
- **[API.md](./docs/API.md)** - Referencia completa de endpoints
- **[AI_PIPELINE.md](./docs/AI_PIPELINE.md)** - Cómo funciona la extracción OCR
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Guía de despliegue en producción
- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - Cómo contribuir al proyecto

---

## 🛠️ Stack tecnológico

### Backend
- **Express.js** - Framework web
- **MongoDB + Mongoose** - Base de datos
- **JWT** - Autenticación
- **Helmet.js** - Seguridad HTTP
- **Azure Computer Vision** - OCR
- **OpenAI API** - Validación de datos
- **Multer** - Procesamiento de archivos
- **Nodemailer** - Envío de emails

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **Framer Motion** - Animaciones
- **react-qr-code** - Códigos QR

---

## 🧪 Testing

```bash
# Backend
npm test

# Frontend
cd frontend
npm test
```

---

## 🐛 Issues y soporte

Para reportar bugs o sugerir mejoras:
- Abre un [GitHub Issue](https://github.com/tu-repo/issues)
- Contacta a: darkscencia@gmail.com

---

## 📄 Licencia

ISC © 2024 Rodrigo

---

## 🎓 Próximas mejoras (Roadmap)

- [ ] Sistema de notificaciones en tiempo real (WebSockets)
- [ ] Estadísticas avanzadas y gráficos
- [ ] Aplicación móvil nativa
- [ ] Sistema de chat entre administradores
- [ ] Integración con redes sociales
- [ ] Análisis de desempeño de jugadores

---

**¿Preguntas o sugerencias?** Contacta al equipo de desarrollo.

