# 🔴 AUDITORÍA: CONECTORES DESCONECTADOS — FC Stats Pro

**Fecha**: 2026-05-09  
**Auditor**: Claudio (análisis técnico)  
**Estado**: EN REVISIÓN POR RODRIGO  

---

## 📋 Resumen Ejecutivo

El proyecto tiene **backend seguro** (commit c3799e2) y **frontend visualmente completo**, pero hay **10 conectores críticos** que están parcial o totalmente desconectados:

| Conector | Estado | Severidad | Impacto |
|----------|--------|-----------|---------|
| 📧 Email recovery (SMTP) | ❌ No configurado | 🔴 CRÍTICA | Usuario no puede recuperar acceso |
| 🎨 Branding personalizado | ⚠️ Código sin validar | 🟡 MEDIA | Admin pone colores pero no se aplican |
| 📊 Tabla de posiciones | ⚠️ Código sin validar | 🟡 MEDIA | ¿Calcula puntos correctamente? |
| 🏆 Bracket de playoffs | ⚠️ Mencionado "en mejora" | 🟡 MEDIA | ¿Existe? ¿Funciona en todos formatos? |
| 🖼️ OCR/IA end-to-end | ⚠️ Servicios sin validar | 🟡 MEDIA | ¿La importación completa funciona? |
| 🌍 Página pública | ⚠️ Código sin validar | 🟡 MEDIA | ¿Se ve bien? ¿OG tags funcionan? |
| ⚙️ Settings/Profile | ⚠️ Código sin validar | 🟡 MEDIA | ¿Actualiza nombre/email/contraseña? |
| 💾 Upload de imágenes | ⚠️ Validación incompleta | 🟡 MEDIA | ¿Hay límite de tamaño? ¿Tipo? |
| 📱 Responsive design | ⚠️ Parcial | 🟡 MEDIA | ¿Funciona en móvil pequeño? |
| 🔐 XSS/CSRF prevention | ⚠️ Frontend sin validar | 🟡 MEDIA | ¿El frontend sanitiza inputs? |

---

## 🔴 CRÍTICA: Recuperación de contraseña

### Descripción
Sistema de "forgot password" implementado pero **SMTP NO ESTÁ CONFIGURADO**.

### Código
- **Backend**: `src/controllers/auth.controller.js` lines 195-259
- **Frontend**: `frontend/src/pages/ForgotPassword.jsx` + `ResetPassword.jsx`

### Cómo funciona
1. Admin envía email → Genera token válido
2. **Si SMTP_HOST definido** → Envía mail real
3. **Si SMTP_HOST NO definido** → Solo logs + dev URL en respuesta

### El problema
```
.env actual:
  PORT=3000
  MONGO_URI=...
  JWT_SECRET=...
  ✅ AZURE_VISION_ENDPOINT (OCR)
  ✅ OPENAI_API_KEY (IA)
  ❌ NO SMTP_HOST
  ❌ NO SMTP_PORT
  ❌ NO SMTP_USER
  ❌ NO SMTP_PASS
  ❌ NO SMTP_FROM
  ❌ NO FRONTEND_URL (default: localhost:5173)
```

### Impacto en producción
- Admin olvida contraseña → ❌ NO recibe email → ❌ NO puede entrar
- **BLOQUEA entrada al sistema completo**

### Solución requerida
✅ Configurar SMTP en `.env`:
```
SMTP_HOST=smtp.gmail.com (o tu servidor)
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=noreply@fc-stats-pro.com
SMTP_SECURE=true
FRONTEND_URL=https://tu-dominio.com (NO localhost)
```

---

## 🟡 MEDIA: Branding personalizado

### Descripción
Admin puede customizar **nombre de liga** y **color primario**, pero ¿se aplica en toda la app?

### Código
- **Backend**: `src/controllers/auth.controller.js` lines 301-318 (updateBranding)
- **Frontend**: `frontend/src/pages/Settings.jsx` (presumible)
- **API**: `frontend/src/api/index.js` profileApi.updateBranding()

### Implementación actual
```js
// Backend guarda:
admin.branding = {
  leagueName: string,
  primaryColor: "#24ff7a"
}

// Frontend carga en AuthContext:
...branding ?? { leagueName: "", primaryColor: "#24ff7a" }
```

### Problemas identificados
1. ¿El color se aplica con CSS variables globales?
2. ¿Se actualiza la página al cambiar?
3. ¿Se ve en el nombre de la liga en todas las páginas?
4. ¿La página pública respeta el branding?

### A validar
- [ ] Settings permite cambiar leagueName
- [ ] Settings permite cambiar primaryColor (color picker)
- [ ] Cambio se refleja en Dashboard/Header/Tournaments
- [ ] No requiere reload
- [ ] Página pública usa el branding correcto

---

## 🟡 MEDIA: Tabla de posiciones

### Descripción
Sistema de cálculo de tabla basado en partidos. ¿Funciona correctamente?

### Código
- **Controller**: `src/controllers/table.controller.js`
- **Routes**: `src/routes/table.routes.js`
- **API**: `tournamentsApi.getTable(tId)`

### Requisitos
✅ GET `/tournaments/:tId/table` devuelve tabla ordenada por:
1. Puntos (desc)
2. Diferencia de goles (desc)
3. Goles a favor (desc)

### Problemas a validar
- [ ] ¿Suma bien los puntos? (W=3, D=1, L=0)
- [ ] ¿Calcula diferencia de goles?
- [ ] ¿Ordena correctamente si hay empates?
- [ ] ¿Se actualiza cuando se crea nuevo partido?
- [ ] ¿Se actualiza si se edita partido?
- [ ] ¿Se actualiza si se borra partido?
- [ ] ¿Qué pasa si un equipo aún no juega?

---

## 🟡 MEDIA: Bracket de playoffs

### Descripción
Mencionado en CLAUDE_CONTEXT como "en mejora". **¿Existe realmente?**

### Código a buscar
- `ProBracket.jsx` (existe en `frontend/src/components/`)
- `TournamentDetail.jsx` lo usa presumiblemente
- ¿Hay lógica de generación de bracket?

### Problemas críticos
1. ¿El bracket se genera automáticamente?
2. ¿Funciona para formato `league`, `cup`, `mixed`?
3. ¿Muestra semis y finals?
4. ¿Los resultados se cargan correctamente?
5. ¿Se ve bien en móvil?

### Flujo esperado
```
Torneo (mixed) →
  Fase 1: Liga (tabla) → Top 4 avanzan
  Fase 2: Playoffs (bracket) → Winner es campeón
```

---

## 🟡 MEDIA: Sistema OCR/IA end-to-end

### Descripción
Importar partidos desde imágenes. **¿Realmente funciona completo?**

### Código
- **Routes**: `src/routes/ai.routes.js` → POST `/ai/parse-match-images`
- **Controller**: `src/controllers/ai.controller.js` (50+ líneas, con lógica compleja)
- **Servicios**: 7 archivos en `src/services/ai/`
- **Frontend**: `ImportMatchImage.jsx`

### Flujo implementado
```
1. Upload imágenes → uploadMatchImages middleware
2. imageClassifier → clasifica tipo (full stats, score, etc.)
3. Extrae OCR (Azure) → fallback OpenAI
4. Parsea estructura → clubes, score, stats
5. Merge resultados (múltiples imágenes)
6. Normaliza y valida
7. Guarda en BD
```

### Problemas a validar
- [ ] ¿Detecta correctamente los clubes?
- [ ] ¿Extrae el score correcto?
- [ ] ¿Maneja imágenes múltiples?
- [ ] ¿Confidence threshold es correcto?
- [ ] ¿Errores se muestran claramente en UI?
- [ ] ¿Timeout en Azure?
- [ ] ¿Rate limiting funciona?

### Configuración actual
```
AZURE_VISION_ENDPOINT=https://fifa-ocr.cognitiveservices.azure.com/
AZURE_VISION_KEY=BVEm...
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
AI_SCORE_CONFIDENCE_MIN=0.85
AI_STATS_CONFIDENCE_MIN=0.70
AI_IMPORT_MAX_IMAGES=10
```

---

## 🟡 MEDIA: Página pública

### Descripción
Acceso sin login a `/public/tournaments/:slug`. ¿Se ve bien?

### Código
- **Routes**: `src/routes/public.routes.js`
- **Controller**: `src/controllers/public.controller.js`
- **Middleware OG tags**: `src/app.js` lines 87-116
- **Frontend**: `PublicTournamentPage.jsx`

### Implementado
✅ GET `/public/tournaments/:slug` devuelve JSON  
✅ OG tags dinámicas para Discord/WhatsApp/redes  
✅ Solo muestra torneo si `visibility === "public"`

### Problemas a validar
- [ ] ¿Se carga la página sin token?
- [ ] ¿Muestra tabla correctamente?
- [ ] ¿Muestra partidos?
- [ ] ¿Muestra bracket si aplica?
- [ ] ¿Responde en móvil?
- [ ] ¿OG tags aparecen en Discord?
- [ ] ¿Logo aparece si está definido?

---

## 🟡 MEDIA: Settings / Profile

### Descripción
Admin actualiza perfil, contraseña, branding. ¿Todo funciona?

### Código
- **Frontend**: `Settings.jsx`
- **Backend**: `auth.controller.js` lines 124-318
- **Endpoints**: PATCH `/auth/profile`, `/auth/password`, `/auth/branding`

### A validar
- [ ] Cambiar nombre → funciona
- [ ] Cambiar email → funciona
- [ ] Cambiar contraseña (requiere actual) → funciona
- [ ] Cambiar liga y color → funciona
- [ ] Validaciones muestran errores
- [ ] Éxito muestra toast/feedback

---

## 🟡 MEDIA: Upload de imágenes

### Descripción
`ImportMatchImage.jsx` permite subir imágenes. ¿Hay validación?

### Problemas
- [ ] ¿Valida tipo MIME (solo jpg/png)?
- [ ] ¿Hay límite de tamaño?
- [ ] ¿Hay límite de cantidad (max 10)?
- [ ] ¿Feedback visual durante upload?
- [ ] ¿Error si archivo muy grande?

### Middleware actual
- `uploadMatchImages` en `src/middlewares/`
- Usa `multer` (configurado para 10 máximo)

---

## 🟡 MEDIA: Responsive Design

### Descripción
¿La UI funciona bien en móvil pequeño?

### A validar en iOS/Android
- [ ] Login page
- [ ] Dashboard
- [ ] Tournaments list
- [ ] Tournament detail (tabla, partidos, bracket)
- [ ] Create match
- [ ] Import image
- [ ] Settings
- [ ] Public tournament page

### Tamaños a probar
- iPhone 12 (390px)
- iPhone 14 Pro Max (430px)
- Android pequeño (320px)
- Tablet (768px)

---

## 🟡 MEDIA: Security - XSS/CSRF Prevention

### Descripción
Backend está seguro (helmet, rate limit), ¿frontend valida inputs?

### A validar
- [ ] Inputs con caracteres especiales no rompen
- [ ] HTML injected no se ejecuta
- [ ] SQL injection (backend ya protegido)
- [ ] CSRF tokens (si hay forms)

---

## ✅ VERIFICADO Y FUNCIONAL

1. **Auth básica** (login/register)
2. **CRUD de torneos** (create, read, update, delete)
3. **CRUD de clubes**
4. **CRUD de partidos**
5. **Multi-admin** (cada admin ve solo sus datos)
6. **JWT tokens** (7d expiry)
7. **Password hash** (bcryptjs)
8. **CORS + helmet** (seguridad)
9. **Rate limiting** (15min windows)
10. **Página 404**

---

## 📌 Siguiente paso

**Esperar feedback de Rodrigo** para priorizar qué validar primero en el plan de QA.

Preguntas a Rodrigo:
1. ¿La email recovery es crítica ahora o la dejas post-lanzamiento?
2. ¿Cuál es la fecha de cierre del proyecto?
3. ¿Hay clientes esperando testing?
4. ¿Qué features son MUST-HAVE vs nice-to-have?
