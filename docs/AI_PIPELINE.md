# 🤖 Pipeline de AI/OCR

Guía técnica del proceso de extracción inteligente de datos de imágenes de marcadores.

---

## 📸 Flujo general

```
Imagen del marcador (JPG/PNG)
    ↓
[1] Carga y validación
    ↓
[2] Azure Computer Vision OCR
    Extrae todo el texto visible: "BOCA 2 RIVER 1"
    ↓
[3] Image Classification
    Clasifica: tipo de marcador, posición, confianza
    ↓
[4] Match Parser
    Estructura: { home_team, away_team, home_goals, away_goals }
    ↓
[5] Club Matcher
    Relaciona: "BOCA" → ObjectId del club en BD
    ↓
[6] Normalizer
    Valida y rellena campos faltantes
    ↓
[7] Vision Validation (opcional)
    OpenAI confirma coherencia de datos
    ↓
[8] Confidence Scoring
    Calcula confianza general (0-1)
    ↓
Draft listo para confirmación del usuario
```

---

## 🔧 Componentes

### 1. OCR Service (`ocr.service.js`)

Utiliza Azure Computer Vision para extraer texto de la imagen.

**Entrada:**
- Buffer de imagen (JPG, PNG)

**Proceso:**
```javascript
const client = new ComputerVisionClient(credentials);
const result = await client.readInStream(imageStream);
```

**Salida:**
```json
{
  "rawText": "BOCA\n2\nRIVER\n1\n\n20/1/2024",
  "lines": [
    { "text": "BOCA", "boundingBox": [...] },
    { "text": "2", "boundingBox": [...] }
  ]
}
```

**Confianza:** Basada en OCR score de Azure (0-1)

---

### 2. Image Classifier (`imageClassifier.service.js`)

Clasifica el tipo de marcador para interpretar correctamente.

**Tipos soportados:**
- **Standard**: `EQUIPO 1 n EQUIPO 2 m` (formato común)
- **Rotated**: Imagen girada 90°
- **Vertical**: Texto vertical
- **Custom**: Otros formatos

**Lógica:**
```javascript
// Busca patrones: número-número (score)
// Busca nombres de equipo arriba/abajo
// Calcula ángulo de rotación
// Determina posición de cada elemento
```

**Salida:**
```json
{
  "type": "standard",
  "orientation": 0,
  "confidence": 0.88,
  "positions": {
    "homeTeam": "top-left",
    "homeScore": "center",
    "awayTeam": "bottom-right",
    "awayScore": "center"
  }
}
```

---

### 3. Match Parser (`matchImageParser.js`)

Parsea el OCR para extraer estructura de partido.

**Entrada:**
```
rawText: "BOCA\n2\nRIVER\n1\n\n20/1/2024 19:30"
classification: { type: "standard", ... }
```

**Reglas:**
```javascript
// 1. Buscar patrón: PALABRA numero PALABRA numero
// 2. Identificar cuál es home (primer equipo mencionado)
// 3. Identificar cuál es away (segundo equipo)
// 4. Extraer goles de cada uno
// 5. Buscar fecha/hora si existe

// Regex principal
const matchPattern = /^([A-Z\s]+?)\s+(\d+)\s+([A-Z\s]+?)\s+(\d+)$/m;
```

**Salida:**
```json
{
  "home_team_raw": "BOCA",
  "home_goals": 2,
  "away_team_raw": "RIVER",
  "away_goals": 1,
  "date_raw": "20/1/2024 19:30",
  "confidence": 0.92
}
```

---

### 4. Club Matcher (`clubMatcher.service.js`)

Relaciona nombres extraídos con clubes en la base de datos.

**Entrada:**
```json
{
  "home_team_raw": "BOCA",
  "away_team_raw": "RIVER",
  "tournamentId": "..."
}
```

**Proceso:**

1. **Normalizar nombre**: `"BOCA"` → `"boca"`
2. **Buscar coincidencia exacta**: Existe club con nombre "boca"?
3. **Buscar coincidencia parcial**: Contiene la palabra "boca"?
4. **Calcular similaridad**: String matching (Levenshtein distance)

**Ejemplo:**
```javascript
clubs = [
  { name: "Boca Juniors", ... },
  { name: "River Plate", ... }
]

// Entrada: "BOCA"
match("BOCA", "Boca Juniors") = 0.99  // Muy similar
match("BOCA", "River Plate") = 0.0    // No coincide

// Resultado: { clubId: "...", match_confidence: 0.99 }
```

**Salida:**
```json
{
  "home": {
    "clubId": "64f1234...",
    "clubName": "Boca Juniors",
    "match_confidence": 0.99
  },
  "away": {
    "clubId": "64f1235...",
    "clubName": "River Plate",
    "match_confidence": 0.98
  }
}
```

---

### 5. Normalizer (`matchDraftNormalizer.service.js`)

Valida y rellena campos.

**Validaciones:**
- Goles ≥ 0
- Clubes existen
- Clubes son diferentes
- Home/Away están bien asignados

**Rellenos:**
- Fecha: Usar fecha actual si no existe
- Status: `"pending"` o `"played"` según contexto

**Salida:**
```json
{
  "tournamentId": "...",
  "home": {
    "club": "64f1234...",
    "goals": 2
  },
  "away": {
    "club": "64f1235...",
    "goals": 1
  },
  "date": "2024-01-20T19:30:00Z",
  "status": "played",
  "validation_errors": []
}
```

---

### 6. Vision Validation (`visionValidation.service.js`)

**Opcional**: Usa OpenAI GPT-4o para validar coherencia.

**Entrada:**
```json
{
  "extracted_text": "BOCA 2 RIVER 1",
  "parsed_data": {
    "home": "Boca Juniors",
    "home_goals": 2,
    "away": "River Plate",
    "away_goals": 1
  }
}
```

**Prompt a OpenAI:**
```
"¿Son coherentes estos datos extraídos?
Texto: BOCA 2 RIVER 1
Datos: Boca Juniors 2 - River Plate 1
Responde: válido/inválido + razón"
```

**Salida:**
```json
{
  "is_valid": true,
  "openai_confidence": 0.95,
  "validation_reason": "Los datos coinciden con el texto extraído"
}
```

**Configuración:**
- Solo activa si `OPENAI_API_KEY` está definida
- Usa modelo `gpt-4o-mini` (económico)

---

### 7. Confidence Scoring (`confidence.js`)

Calcula puntuación final (0-1) basada en múltiples factores.

**Factores ponderados:**
```javascript
confidence = (
  ocr_score * 0.30           // OCR baseline
  + classifier_score * 0.20  // Clasificación correcta
  + parser_confidence * 0.25 // Parseo correcto
  + club_match * 0.15        // Clubes identificados
  + validation_score * 0.10  // Validación OpenAI (si aplica)
)
```

**Resultado:**
```json
{
  "overall_confidence": 0.92,
  "breakdown": {
    "ocr": 0.95,
    "classification": 0.88,
    "parsing": 0.90,
    "club_matching": 0.99,
    "validation": 0.92
  }
}
```

---

## 📊 Umbral de confianza

**Variables de entorno:**
```env
AI_SCORE_CONFIDENCE_MIN=0.85  # Mínimo para mostrar como válido
AI_STATS_CONFIDENCE_MIN=0.70  # Mínimo para incluir en estadísticas
```

**Lógica:**
- Si `confidence ≥ 0.85`: Mostrar como "Válido" ✅
- Si `0.70 ≤ confidence < 0.85`: Mostrar como "Revisar" ⚠️
- Si `confidence < 0.70`: Mostrar como "Rechazar" ❌

---

## 🔄 Manejo de múltiples imágenes

Si envías 2+ imágenes del mismo partido:

```javascript
// 1. Procesar cada imagen independientemente
const drafts = await Promise.all(images.map(img => processImage(img)));

// 2. Comparar resultados
const merged = mergeImageResults(drafts);

// 3. Usar consensus (coincidencia de múltiples imágenes aumenta confianza)
if (draft1.home_team === draft2.home_team && draft1.home_goals === draft2.home_goals) {
  confidence += 0.10; // Bonus por coincidencia
}
```

**Servicio**: `matchImageMerge.service.js`

---

## 🛠️ Casos de uso

### Caso 1: Marcador estándar

**Imagen:**
```
┌─────────────┐
│   BOCA  2   │
│             │
│  RIVER  1   │
│             │
│ 20/01/2024  │
└─────────────┘
```

**Proceso:**
1. OCR extrae: `"BOCA 2 RIVER 1"`
2. Classifier identifica formato estándar
3. Parser extrae: `{ home: "BOCA", score: 2, away: "RIVER", score: 1 }`
4. Matcher relaciona con clubes
5. Confidence: **0.95** ✅

---

### Caso 2: Marcador rotado 90°

**Imagen:**
```
B | 2 | R
O | - | I
C | 1 | V
A |   | E
  |   | R
```

**Proceso:**
1. OCR extrae: `"B O C A 2 R I V E R 1"`
2. Classifier detecta rotación (90°)
3. Normaliza: `"BOCA 2 RIVER 1"`
4. Rest del pipeline igual
5. Confidence: **0.88** ⚠️

---

### Caso 3: Marcador con logos y distractores

**Imagen:**
```
[Escudo] BOCA 2 RIVER [Escudo]
         20/1/24
    Sistema de Gol: TL ⚽
```

**Proceso:**
1. OCR extrae: `"BOCA 2 RIVER 20/1/24 Sistema de Gol TL"`
2. Parser filtra palabras conocidas: `{ home: "BOCA", score: 2, away: "RIVER" }`
3. Ignora: "Gol", "TL", "Sistema"
4. Confidence: **0.82** ⚠️ (por ruido)

---

## 🔧 Debugging

### Logs detallados

Habilita en `.env`:
```env
DEBUG=ai:pipeline
```

**Salida en consola:**
```
[ai:pipeline] Procesando imagen: marco_1.jpg
[ai:pipeline] OCR raw: "BOCA\n2\nRIVER\n1"
[ai:pipeline] Classification: type=standard, confidence=0.88
[ai:pipeline] Parsed: home=BOCA, score=2, away=RIVER, score=1
[ai:pipeline] Club matcher: home(0.99), away(0.98)
[ai:pipeline] Final confidence: 0.92
```

---

## 📈 Métricas

**Monitorea en producción:**
- % de imágenes procesadas exitosamente
- Distribución de confianza (0-1)
- Tiempos promedio de procesamiento
- Errores de Azure Vision API
- Rate limit de OpenAI

---

## 🚀 Mejoras futuras

- [ ] Machine Learning: Entrenar modelo en imágenes históricas
- [ ] OCR bilingüe: Soportar español e inglés
- [ ] Detección de jugadores: Extraer goleadores
- [ ] Análisis de estadísticas: Tarjetas amarillas, penales
- [ ] Caché de resultados: No reprocesar imágenes iguales

---

## 🔗 Referencias

- [Azure Computer Vision API](https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/)
- [OpenAI GPT-4o](https://platform.openai.com/docs/guides/vision)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)

