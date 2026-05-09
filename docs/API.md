# 📡 Documentación de la API REST

Referencia completa de todos los endpoints disponibles en FC Stats Pro League Manager.

---

## 📌 Base URL

- **Desarrollo**: `http://localhost:3000`
- **Producción**: `https://api.ejemplo.com`

---

## 🔑 Autenticación

Todos los endpoints (excepto `/auth/login`, `/auth/register` y `/public/**`) requieren un token JWT en el header:

```http
Authorization: Bearer <token>
```

---

## 📋 Índice de endpoints

- [Autenticación](#autenticación)
- [Torneos](#torneos)
- [Clubes](#clubes)
- [Partidos](#partidos)
- [Tablas](#tablas)
- [AI/OCR](#aiocr)
- [Público](#público)

---

## 🔐 Autenticación

### Registro

```http
POST /auth/register
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura_16_caracteres"
}
```

**Respuesta exitosa (201):**
```json
{
  "_id": "64f1234567890abc123def45",
  "email": "usuario@ejemplo.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `400` - Email ya existe o validación fallida
- `500` - Error interno del servidor

---

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña_segura_16_caracteres"
}
```

**Respuesta exitosa (200):**
```json
{
  "_id": "64f1234567890abc123def45",
  "email": "usuario@ejemplo.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `401` - Email o contraseña incorrectos
- `404` - Usuario no encontrado

---

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🏆 Torneos

### Listar mis torneos

```http
GET /tournaments
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
[
  {
    "_id": "64f1234567890abc123def45",
    "adminId": "64f1234567890abc123def10",
    "name": "Liga Provincial 2024",
    "season": 2024,
    "format": "league",
    "visibility": "private",
    "publicSlug": "liga-provincial-2024",
    "logo": "https://...",
    "clubs": ["...", "..."],
    "matches": ["...", "..."],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z"
  }
]
```

---

### Crear torneo

```http
POST /tournaments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Liga Provincial 2024",
  "season": 2024,
  "format": "league",
  "visibility": "private"
}
```

**Campos:**
- `name` (string, requerido) - Nombre del torneo
- `season` (number, requerido) - Año/temporada
- `format` (string, requerido) - `"league"`, `"cup"`, o `"mixed"`
- `visibility` (string, requerido) - `"private"` o `"public"`

**Respuesta exitosa (201):**
```json
{
  "_id": "64f1234567890abc123def45",
  "adminId": "64f1234567890abc123def10",
  "name": "Liga Provincial 2024",
  "season": 2024,
  "format": "league",
  "visibility": "private",
  "publicSlug": "liga-provincial-2024",
  "clubs": [],
  "matches": [],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Obtener detalle de torneo

```http
GET /tournaments/:id
Authorization: Bearer <token>
```

**Parámetros:**
- `id` (string) - ID del torneo

**Respuesta (200):** [Igual a listar](#listar-mis-torneos)

---

### Editar torneo

```http
PUT /tournaments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Liga Provincial 2024 - Actualizado",
  "visibility": "public",
  "logo": "https://..."
}
```

**Campos editables:**
- `name` - Nombre
- `visibility` - Privacidad
- `logo` - URL del logo/escudo
- `publicSlug` - Slug para URL pública

**Respuesta (200):** Torneo actualizado

---

### Eliminar torneo

```http
DELETE /tournaments/:id
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{ "message": "Torneo eliminado" }
```

---

## ⚽ Clubes

### Listar clubes de un torneo

```http
GET /clubs?tournamentId=<id>
Authorization: Bearer <token>
```

**Parámetros query:**
- `tournamentId` (string) - ID del torneo

**Respuesta (200):**
```json
[
  {
    "_id": "64f1234567890abc123def45",
    "tournamentId": "64f1234567890abc123def40",
    "name": "Boca Juniors",
    "logo": "https://...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Crear club

```http
POST /clubs
Authorization: Bearer <token>
Content-Type: application/json

{
  "tournamentId": "64f1234567890abc123def40",
  "name": "Boca Juniors",
  "logo": "https://..."
}
```

**Campos:**
- `tournamentId` (string, requerido)
- `name` (string, requerido)
- `logo` (string, opcional) - URL del escudo

**Respuesta exitosa (201):**
```json
{
  "_id": "64f1234567890abc123def45",
  "tournamentId": "64f1234567890abc123def40",
  "name": "Boca Juniors",
  "logo": "https://...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### Editar club

```http
PUT /clubs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Boca Juniors Reserva",
  "logo": "https://nuevo-logo.jpg"
}
```

---

### Eliminar club

```http
DELETE /clubs/:id
Authorization: Bearer <token>
```

---

## 🎮 Partidos

### Listar partidos de un torneo

```http
GET /matches?tournamentId=<id>
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
[
  {
    "_id": "64f1234567890abc123def45",
    "tournamentId": "64f1234567890abc123def40",
    "home": {
      "club": "64f1234567890abc123def46",
      "clubName": "Boca Juniors",
      "goals": 2
    },
    "away": {
      "club": "64f1234567890abc123def47",
      "clubName": "River Plate",
      "goals": 1
    },
    "date": "2024-01-20T19:00:00Z",
    "status": "played",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

### Crear partido manualmente

```http
POST /matches
Authorization: Bearer <token>
Content-Type: application/json

{
  "tournamentId": "64f1234567890abc123def40",
  "homeClubId": "64f1234567890abc123def46",
  "awayClubId": "64f1234567890abc123def47",
  "homeGoals": 2,
  "awayGoals": 1,
  "date": "2024-01-20T19:00:00Z"
}
```

**Campos:**
- `tournamentId` (string, requerido)
- `homeClubId` (string, requerido)
- `awayClubId` (string, requerido)
- `homeGoals` (number, requerido)
- `awayGoals` (number, requerido)
- `date` (string ISO, requerido)

**Respuesta (201):** Partido creado

---

### Actualizar resultado

```http
PUT /matches/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "homeGoals": 3,
  "awayGoals": 1,
  "status": "played"
}
```

---

### Eliminar partido

```http
DELETE /matches/:id
Authorization: Bearer <token>
```

---

## 📊 Tablas

### Obtener tabla de posiciones

```http
GET /table/:tournamentId
Authorization: Bearer <token>
```

**Respuesta (200):**
```json
{
  "tournamentId": "64f1234567890abc123def40",
  "table": [
    {
      "position": 1,
      "clubId": "64f1234567890abc123def46",
      "clubName": "Boca Juniors",
      "clubLogo": "https://...",
      "played": 10,
      "won": 7,
      "drawn": 2,
      "lost": 1,
      "goalsFor": 24,
      "goalsAgainst": 8,
      "goalDifference": 16,
      "points": 23
    },
    {
      "position": 2,
      "clubId": "64f1234567890abc123def47",
      "clubName": "River Plate",
      "played": 10,
      "won": 6,
      "drawn": 3,
      "lost": 1,
      "goalsFor": 22,
      "goalsAgainst": 10,
      "goalDifference": 12,
      "points": 21
    }
  ]
}
```

---

## 🤖 AI/OCR

### Importar partido por imagen

```http
POST /ai/import-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form-data:
  tournamentId: "64f1234567890abc123def40"
  images: [<archivo1.jpg>, <archivo2.jpg>, ...]
```

**Parámetros:**
- `tournamentId` (string, form) - ID del torneo
- `images` (files, form) - Hasta 10 imágenes del marcador

**Respuesta (200):**
```json
{
  "import_id": "import_64f1234567890abc123def45",
  "status": "processing",
  "extracted_data": {
    "home": "Boca Juniors",
    "away": "River Plate",
    "home_goals": 2,
    "away_goals": 1,
    "confidence": 0.92,
    "original_text": "BOCA 2 RIVER 1"
  },
  "extracted_text": "BOCA 2 RIVER 1",
  "warnings": []
}
```

**Campos en respuesta:**
- `confidence` (0-1) - Confianza de la extracción
- `extracted_text` - Texto bruto del OCR
- `extracted_data` - Datos parseados
- `warnings` - Advertencias sobre precisión

---

### Validar datos extraídos

```http
POST /ai/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "tournamentId": "64f1234567890abc123def40",
  "import_id": "import_64f1234567890abc123def45",
  "confirmed_data": {
    "homeClubId": "64f1234567890abc123def46",
    "awayClubId": "64f1234567890abc123def47",
    "homeGoals": 2,
    "awayGoals": 1
  }
}
```

**Respuesta (200):**
```json
{
  "match_id": "64f1234567890abc123def50",
  "status": "created",
  "message": "Partido importado y creado exitosamente"
}
```

---

## 🌐 Público

### Obtener torneo público

```http
GET /public/tournaments/:slug
```

**Parámetros:**
- `slug` (string) - Slug público del torneo

**Respuesta (200):**
```json
{
  "_id": "64f1234567890abc123def45",
  "name": "Liga Provincial 2024",
  "season": 2024,
  "format": "league",
  "logo": "https://...",
  "publicSlug": "liga-provincial-2024",
  "clubs": [
    {
      "_id": "64f1234567890abc123def46",
      "name": "Boca Juniors",
      "logo": "https://..."
    }
  ]
}
```

---

### Obtener estadísticas públicas

```http
GET /public/tournaments/:slug/stats
```

**Respuesta (200):**
```json
{
  "table": [
    { "position": 1, "clubName": "Boca Juniors", "points": 23, ... }
  ],
  "matches": [
    { "home": "Boca", "away": "River", "score": "2-1", "date": "..." }
  ],
  "bracket": null
}
```

---

## ⚠️ Códigos de error

| Código | Significado |
|--------|-------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado |
| `400` | Bad Request - Datos inválidos |
| `401` | Unauthorized - Token inválido/expirado |
| `403` | Forbidden - No tienes permiso |
| `404` | Not Found - Recurso no existe |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Error del servidor |

---

## 🧪 Ejemplo completo: Flujo de creación de torneo

```bash
# 1. Registrarse
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"segura_16_caracteres123"}'

# Guardar token de respuesta
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Crear torneo
curl -X POST http://localhost:3000/tournaments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Liga","season":2024,"format":"league","visibility":"private"}'

# Guardar ID del torneo
TOURNAMENT_ID="64f1234567890abc123def45"

# 3. Crear clubes
curl -X POST http://localhost:3000/clubs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"Boca Juniors\"}"

curl -X POST http://localhost:3000/clubs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"name\":\"River Plate\"}"

# 4. Crear partido
curl -X POST http://localhost:3000/matches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tournamentId\":\"$TOURNAMENT_ID\",\"homeClubId\":\"<club1_id>\",\"awayClubId\":\"<club2_id>\",\"homeGoals\":2,\"awayGoals\":1,\"date\":\"2024-01-20T19:00:00Z\"}"

# 5. Ver tabla
curl -X GET http://localhost:3000/table/$TOURNAMENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Rate Limiting

- **General**: 100 requests / 15 minutos
- **Auth**: 5 requests / 15 minutos
- **AI**: 10 requests / 15 minutos

Header de respuesta:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1705334400
```

---

## 🚀 Webhook (Futuro)

Próxima versión incluirá webhooks para notificaciones en tiempo real.

