# 🏗️ Arquitectura del proyecto

Visión general de cómo está organizado FC Stats Pro League Manager a nivel técnico.

---

## 📊 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cliente (React + Vite)                       │
│                  http://localhost:5173                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Express.js (API REST)                              │
│              http://localhost:3000                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Middlewares (Auth, Rate Limit, CORS, Helmet)            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Routes → Controllers → Services → Models                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ AI Pipeline (OCR, Clasificación, Normalización)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐          ┌────────┐          ┌────────┐
    │MongoDB │        │ Azure  │          │ OpenAI │
    │        │        │Vision  │          │  API   │
    └────────┘        └────────┘          └────────┘
```

---

## 📂 Estructura de carpetas — Backend

```
src/
├── config/
│   └── db.js                    # Conexión a MongoDB
├── controllers/                 # Lógica de negocio
│   ├── auth.controller.js       # Registro, login, JWT
│   ├── tournament.controller.js # CRUD torneos
│   ├── club.controller.js       # CRUD clubes
│   ├── match.controller.js      # CRUD partidos
│   ├── table.controller.js      # Cálculo de tablas
│   ├── ai.controller.js         # OCR y procesamiento
│   └── public.controller.js     # Endpoints públicos
├── models/                      # Esquemas MongoDB
│   ├── Admin.js                 # Usuario administrador
│   ├── Tournament.js            # Liga/Torneo
│   ├── Club.js                  # Equipo
│   └── Match.js                 # Partido/Encuentro
├── routes/                      # Definición de endpoints
│   ├── auth.routes.js
│   ├── tournament.routes.js
│   ├── club.routes.js
│   ├── match.routes.js
│   ├── ai.routes.js
│   ├── public.routes.js
│   └── table.routes.js
├── middlewares/                 # Intercepción de requests
│   ├── auth.middleware.js       # Verificación JWT
│   ├── rateLimiter.js           # Rate limiting
│   └── uploadMatchImages.js     # Procesamiento de upload
├── services/                    # Lógica reutilizable
│   └── ai/
│       ├── ocr.service.js       # Extracción de texto (Azure)
│       ├── matchImageParser.js  # Parseo de datos OCR
│       ├── matchDraftNormalizer.service.js  # Normalización
│       ├── clubMatcher.service.js           # Matching de clubes
│       ├── imageClassifier.service.js       # Clasificación de imágenes
│       ├── visionValidation.service.js      # Validación (OpenAI)
│       └── matchImageMerge.service.js       # Merge de múltiples imágenes
├── utils/
│   └── ai/
│       ├── confidence.js        # Cálculo de confianza
│       └── normalizeClubName.js # Normalización de nombres
├── app.js                       # Configuración Express
└── index.js                     # Punto de entrada
```

---

## 📂 Estructura de carpetas — Frontend

```
frontend/src/
├── pages/                       # Componentes de página (1 por ruta)
│   ├── Dashboard.jsx            # Dashboard principal
│   ├── Tournaments.jsx          # Listado de mis torneos
│   ├── TournamentDetail.jsx     # Detalle de torneo
│   ├── Clubs.jsx                # Gestión de clubes
│   ├── CreateMatch.jsx          # Crear/editar partido
│   ├── ImportMatchImage.jsx     # Importar por imagen
│   ├── PublicTournamentPage.jsx # Vista pública
│   ├── Login.jsx                # Autenticación
│   ├── Register.jsx
│   ├── Settings.jsx
│   └── NotFound.jsx
├── components/                  # Componentes reutilizables
│   ├── ui/                      # Componentes primitivos
│   │   ├── Modal.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ClubAvatar.jsx
│   │   ├── StatsGrid.jsx
│   │   ├── AiAnalyzingLoader.jsx
│   │   └── LoadingScreen.jsx
│   ├── Bracket.jsx              # Visualización de bracket
│   ├── ProBracket.jsx
│   └── TournamentShareModal.jsx
├── auth/                        # Contexto de autenticación
│   ├── AuthContext.jsx
│   └── ProtectedRoute.jsx
├── layout/                      # Layouts principales
│   └── MainLayout.jsx
├── api/                         # Cliente HTTP
│   ├── client.js                # Configuración Axios
│   └── index.js                 # Funciones API
├── utils/
│   └── helpers.js               # Funciones utilitarias
├── assets/                      # Imágenes, logos, etc.
├── App.jsx                      # Root component
└── main.jsx                     # Entry point
```

---

## 🔄 Flujo de datos

### 1. Autenticación (Login)

```
Frontend: Login form
    ↓
POST /auth/login (email, password)
    ↓
Backend: auth.controller.js
    ↓
Verificar usuario en MongoDB (Admin)
    ↓
Comparar contraseña (bcryptjs)
    ↓
Generar JWT token
    ↓
Respuesta: { token, user }
    ↓
Frontend: Guardar token en localStorage
    ↓
AuthContext actualiza estado global
```

### 2. Crear Torneo

```
Frontend: Tournament form
    ↓
POST /tournaments (nombre, formato, logo, etc)
    ↓
Backend: tournament.controller.js
    ↓
auth.middleware verifica JWT
    ↓
Validar datos (nombre, fecha, etc)
    ↓
Mongoose crea documento en MongoDB
    ↓
Respuesta: { _id, nombre, ... }
    ↓
Frontend: Navega a detalle del torneo
    ↓
GET /tournaments/:id (para cargar datos)
```

### 3. Importar Partido por Imagen

```
Frontend: Selecciona imagen
    ↓
POST /ai/import-image (FormData con imagen)
    ↓
Backend: ai.controller.js
    ↓
multer guarda archivo temporalmente
    ↓
ocr.service.js → Azure Vision API
    ↓
Extrae texto de imagen (posición, score, equipos)
    ↓
matchImageParser.js → Parsea estructura
    ↓
clubMatcher.service.js → Relaciona con equipos en DB
    ↓
matchDraftNormalizer.service.js → Valida y normaliza
    ↓
imageClassifier.service.js → Clasifica tipo de marcador
    ↓
visionValidation.service.js → OpenAI valida (opcional)
    ↓
Respuesta: { away, home, score, confidence }
    ↓
Frontend: Muestra preview y permite editar
    ↓
Usuario confirma y guarda
    ↓
POST /matches con datos confirmados
    ↓
Backend: table.controller calcula posición en tabla
```

### 4. Página Pública

```
Usuario externo: Comparte link público
    ↓
GET /public/tournaments/slug
    ↓
Backend: public.controller.js
    ↓
Buscar torneo con publicSlug y visibility="public"
    ↓
Si es bot (Discord, WhatsApp, etc):
    Retorna HTML con Open Graph tags
    ↓
Si es usuario normal:
    Retorna JSON con datos
    ↓
Frontend: PublicTournamentPage renderiza
    ↓
Muestra tabla, bracket, resultados (solo lectura)
```

---

## 🔐 Seguridad

### JWT (JSON Web Tokens)

```javascript
// Generación (login)
const token = jwt.sign(
  { userId: admin._id, email: admin.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verificación (en cada request autenticado)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await Admin.findById(decoded.userId);
```

### Middlewares de seguridad

```javascript
app.use(helmet());                 // Headers HTTP seguros
app.use(cors({ origin: [whitelist] })); // CORS configurado
app.use(generalLimiter);           // Rate limit: 100 req/15 min
app.use(authLimiter);              // Auth limit: 5 req/15 min
```

### Validación de entrada

Todos los controladores validan:
- Campos requeridos
- Tipos de datos
- Rangos de valores
- Formatos (email, URL, etc)

---

## 📊 Modelos de datos

### Admin
```javascript
{
  _id: ObjectId,
  email: String (único),
  password: String (hasheada),
  tournaments: [ObjectId],  // refs a Tournament
  createdAt: Date,
  updatedAt: Date
}
```

### Tournament
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,       // ref a Admin
  name: String,
  season: Number,
  format: "league" | "cup" | "mixed",
  visibility: "private" | "public",
  publicSlug: String,      // URL pública
  logo: String,            // URL a imagen
  clubs: [ObjectId],       // refs a Club
  matches: [ObjectId],     // refs a Match
  createdAt: Date,
  updatedAt: Date
}
```

### Club
```javascript
{
  _id: ObjectId,
  tournamentId: ObjectId,  // ref a Tournament
  name: String,
  logo: String,            // URL a imagen
  matches: [ObjectId],     // refs a Match
  createdAt: Date
}
```

### Match
```javascript
{
  _id: ObjectId,
  tournamentId: ObjectId,
  home: { club: ObjectId, goals: Number },
  away: { club: ObjectId, goals: Number },
  date: Date,
  status: "pending" | "played" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🤖 Pipeline de AI/OCR

```
Imagen de marcador
    ↓
[1] OCR (Azure Computer Vision)
    Extrae texto: "Equipo A 2 - 1 Equipo B"
    ↓
[2] Image Classifier
    Clasifica: tipo de marcador, posición, confianza
    ↓
[3] Match Parser
    Parsea: away_team, away_goals, home_team, home_goals
    ↓
[4] Club Matcher
    Relaciona con clubes en BD: "Equipo A" → Club ID ABC
    ↓
[5] Normalizer
    Valida estructura y rellena defaults
    ↓
[6] Vision Validation (opcional, OpenAI)
    Confirma que los datos extraídos son coherentes
    ↓
[7] Confidence Score
    Calcula confianza general (0-1)
    ↓
Retorna: { away, home, confidence, extracted_text }
```

---

## 🔄 Ciclo de vida de un partido

### Estados

```
pending    →  played    →  [final]
           ↓
          cancelled
```

### Cálculo de tabla

Cuando un partido pasa a `played`:

1. Extraer goles home/away
2. Para cada equipo, actualizar:
   - Partidos jugados (+1)
   - Goles a favor
   - Goles en contra
   - Diferencia de gol
   - Puntos (3 si gana, 1 si empata, 0 si pierde)
3. Ordenar tabla por: Puntos desc, Diferencia de gol desc, Goles desc
4. Asignar posición (1, 2, 3, ...)

---

## 🌐 Endpoints públicos

```
GET /public/tournaments/:slug
  └─ Si es bot: retorna OG tags
  └─ Si es usuario: retorna JSON

GET /public/tournaments/:slug/stats
  └─ Tabla y resultados
```

---

## 🚀 Deployment

### Variables de entorno por ambiente

```bash
# Development
NODE_ENV=development
DEBUG=true
MONGO_URI=mongodb://localhost/fc_stats_pro

# Production
NODE_ENV=production
DEBUG=false
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fc_stats_pro
CLIENT_URL=https://app.ejemplo.com
```

### CI/CD (recomendado)

```yaml
# .github/workflows/deploy.yml
- Test
- Build frontend
- Build backend
- Run tests
- Deploy a producción
```

---

## 📈 Performance

### Optimizaciones implementadas

- **Mongoose indexing**: Índices en `email`, `publicSlug`, `tournamentId`
- **Rate limiting**: Protección contra abuse
- **CORS whitelist**: Solo dominios permitidos
- **Image optimization**: Límite de 10 imágenes por import
- **JWT expiry**: Tokens expiran en 7 días

### Mejoras futuras

- [ ] Caché de Redis para tablas
- [ ] Compresión gzip en responses
- [ ] CDN para imágenes
- [ ] Lazy loading en frontend
- [ ] Infinite scroll en listas

---

## 🔗 Flujos principales

Ver [AI_PIPELINE.md](./AI_PIPELINE.md) para detalles del OCR.

