# ✅ PLAN DE QA PARA CIERRE — FC Stats Pro League Manager

**Versión**: 1.0  
**Fase**: Validación pre-lanzamiento  
**Responsable QA**: Rodrigo (validación visual + funcional)  
**Responsable Tech**: Claudio (bugs críticos)  

---

## 🎯 Objetivo

Validar que cada funcionalidad:
1. ✅ Funciona end-to-end (no rompe)
2. ✅ Se ve bien (UI/UX)
3. ✅ Maneja errores gracefully
4. ✅ Es rápido (sin delays)
5. ✅ Es seguro (no data leaks)

---

## 📅 Timeline

**Fase 1: Setup** (30 min)
- [ ] Clonar/instalar dependencies
- [ ] .env configurado
- [ ] DB limpia
- [ ] Ambos servidores (backend + frontend) corriendo

**Fase 2: Auth** (45 min)
**Fase 3: CRUD principal** (60 min)
**Fase 4: Features avanzadas** (60 min)
**Fase 5: UX/Responsive** (45 min)
**Fase 6: Seguridad** (30 min)

**Total estimado**: ~4 horas

---

## ✅ FASE 1: SETUP

### 1.1 Instalación
```bash
# Backend
npm install
npm run dev    # Puerto 3000, debe mostrar: "✅ Server running"

# Frontend
cd frontend
npm install
npm run dev    # Puerto 5173, debe mostrar: "✨ ready in X ms"
```

- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] No hay red squiggles en VS Code
- [ ] `.env` tiene valores reales para Azure + OpenAI

### 1.2 Base de datos
```bash
# Limpiar (opcional)
# conectarse a MongoDB local
# db.dropDatabase() en fc_stats_pro_league_manager
```

- [ ] MongoDB corriendo en localhost:27017
- [ ] BD `fc_stats_pro_league_manager` existe
- [ ] Colecciones pueden crearse

### 1.3 Verificar Endpoints básicos
```bash
curl http://localhost:3000/health
# Respuesta: {"status":"ok","service":"fc-stats-pro-league-manager-api"}

curl http://localhost:5173
# Abre login page
```

- [ ] Backend health check ✅
- [ ] Frontend carga ✅

---

## ✅ FASE 2: AUTH (Flujo completo)

### 2.1 Register
**Acceso**: http://localhost:5173/register

#### Test 2.1.1: Register válido
```
Input:
  Nombre: "Rodrigo García"
  Email: "rodrigo@example.com"
  Password: "Test123456"
  Confirm: "Test123456"

Esperado:
  ✅ Botón "Registrarse" habilitado
  ✅ Input validation (6+ chars, emails válidos)
  ✅ Redirige a Dashboard
  ✅ Token guardado en localStorage
  ✅ Admin mostrado en header
```

- [ ] Form valida antes de submit (client-side)
- [ ] Submit sin errores
- [ ] Redirige a dashboard
- [ ] Header muestra nombre del admin
- [ ] Perfil accesible

#### Test 2.1.2: Register con email existente
```
Input:
  Email: "rodrigo@example.com" (mismo del 2.1.1)

Esperado:
  ❌ Error: "Ya existe un administrador con este email"
  ✅ Form no se borra, se puede editar
```

- [ ] Error mostrado claramente
- [ ] No crea duplicado

#### Test 2.1.3: Validación de campos
```
Casos:
  Nombre vacío → Error visible
  Email inválido (ej: "abc") → Error visible
  Password < 6 chars → Error visible
  Passwords no coinciden → Error visible
```

- [ ] Todos los errores se muestran
- [ ] No permite submit si hay errores

### 2.2 Login
**Acceso**: http://localhost:5173/login

#### Test 2.2.1: Login correcto
```
Input:
  Email: "rodrigo@example.com"
  Password: "Test123456"

Esperado:
  ✅ Button "Inicia sesión" → "Iniciando..."
  ✅ Sin retraso excesivo (<2s)
  ✅ Redirige a Dashboard
  ✅ Token válido (JWT decode muestra ID)
```

- [ ] Login sin errores
- [ ] Token guardado
- [ ] Redirección automática
- [ ] Dashboard carga datos

#### Test 2.2.2: Credenciales incorrectas
```
Input:
  Email: "rodrigo@example.com"
  Password: "WrongPassword123"

Esperado:
  ❌ Error: "Credenciales inválidas"
  ✅ Form no se borra
  ✅ Botón vuelve a "Inicia sesión"
```

- [ ] Error claro y amable
- [ ] No expone si email existe o no (seguridad)
- [ ] Campo password se puede corregir fácilmente

#### Test 2.2.3: Email no registrado
```
Input:
  Email: "noexiste@example.com"
  Password: "cualquier"

Esperado:
  ❌ Error: "Credenciales inválidas"
```

- [ ] Mismo error que contraseña incorrecta (no revela info)

### 2.3 Forgot Password ⚠️

**IMPORTANTE**: Este test requiere SMTP configurado.

#### Test 2.3.1: Generar token (sin SMTP)
```
Acceso: http://localhost:5173/forgot-password
Input:
  Email: "rodrigo@example.com"

Esperado (en desarrollo sin SMTP):
  ✅ Mensaje: "Si existe cuenta, recibirás email..."
  ✅ Devuelve devResetUrl (solo en dev)
```

- [ ] Página accesible
- [ ] Mensaje es claro
- [ ] Si en DEV: devResetUrl aparece en respuesta

#### Test 2.3.2: Reset con token válido
```
Acceso: http://localhost:5173/reset-password/{token}
Input:
  Nueva contraseña: "NewPass123456"
  Confirmar: "NewPass123456"

Esperado:
  ✅ Valida que coincidan
  ✅ Valida 6+ chars
  ✅ Submit guardando...
  ✅ Redirige a login
  ✅ Nuevo login funciona con nueva contraseña
```

- [ ] Validación de campos
- [ ] Reset funciona
- [ ] Login con nueva contraseña funciona

#### Test 2.3.3: Token expirado
```
Acceso: http://localhost:5173/reset-password/token-invalido

Esperado:
  ❌ Error: "El enlace es inválido o ha expirado"
  ✅ Botón "Volver al inicio de sesión"
```

- [ ] Error claro
- [ ] No permite submit

### 2.4 Logout
**Acceso**: Dashboard, click en avatar/menu

#### Test 2.4.1: Logout limpia session
```
Esperado:
  ✅ Token eliminado de localStorage
  ✅ Redirige a login
  ✅ Intentar acceder /dashboard → redirige a /login
```

- [ ] Logout funciona
- [ ] Protected routes redirigen
- [ ] No hay token en devtools

---

## ✅ FASE 3: CRUD PRINCIPAL

### 3.1 Torneos

#### Test 3.1.1: Crear torneo
**Acceso**: Dashboard → "Crear nuevo torneo" o Tournaments → "Nuevo"

```
Input:
  Nombre: "Liga Pro Clubs 2026"
  Tipo: "Liga"
  Temporada: "2026"
  Formato: "league" o "cup" o "mixed"
  Visibility: "draft" (borrador)
  Logo: (upload imagen)
  Public slug: "liga-pro-clubs-2026"

Esperado:
  ✅ Validación: Nombre obligatorio, min 3 chars
  ✅ Validación: Slug único y válido
  ✅ Validación: Año es número
  ✅ Se crea sin errores
  ✅ Aparece en lista de torneos
  ✅ Se puede editar inmediatamente
```

- [ ] Form completo y validado
- [ ] Torneo aparece en lista
- [ ] Logo se sube correctamente
- [ ] Slug se genera/valida

#### Test 3.1.2: Editar torneo
**Acceso**: Click en torneo → "Editar"

```
Cambios:
  Nombre: "Liga Pro 2026 - Verano"
  Visibility: "public"
  Color: cambiar color primario

Esperado:
  ✅ Cambios se guardan
  ✅ No rompe datos existentes (clubes, partidos)
  ✅ Cambio de visibility es inmediato
  ✅ Página pública se actualiza
```

- [ ] Edición funciona
- [ ] Cambios se ven en dashboard/lista
- [ ] No hay pérdida de datos

#### Test 3.1.3: Eliminar torneo
```
Acceso: Click torneo → Menu → "Eliminar"

Esperado:
  ⚠️ Confirmación: "¿Estás seguro? Se eliminarán partidos y datos."
  ✅ Si confirma → Desaparece de lista
  ✅ Si cancela → No sucede nada
```

- [ ] Confirmación es clara
- [ ] Eliminación irrevocable
- [ ] No aparece en lista después

#### Test 3.1.4: Agregar clubes al torneo
**Acceso**: Torneo detail → "Agregar equipos"

```
Esperado:
  ✅ Lista clubes disponibles (creados antes)
  ✅ Click en club → se agrega
  ✅ Club aparece en tabla
  ✅ Puede quitar club (confirm)
```

- [ ] Agregar funciona
- [ ] Quitar funciona
- [ ] Tabla se actualiza
- [ ] Validación: no permite duplicados

### 3.2 Clubes

#### Test 3.2.1: Crear club
**Acceso**: Clubs → "Nuevo equipo"

```
Input:
  Nombre: "Real Madrid"
  Sigla: "RM"
  Logo: (upload)
  Color: "#ff0000"

Esperado:
  ✅ Validación: Nombre 2+, sigla 2-4 chars
  ✅ Club aparece en lista
  ✅ Logo se sube
  ✅ Se puede asignar a torneos
```

- [ ] Validación completa
- [ ] Club aparece en lista
- [ ] Logo visible en card
- [ ] Se puede editar

#### Test 3.2.2: Editar club
```
Cambios:
  Nombre: "Real Madrid CF"
  Color: "#ffd700"

Esperado:
  ✅ Cambios guardan
  ✅ Partidos existentes se actualizan
  ✅ Color cambia en UI
```

- [ ] Edición funciona
- [ ] No rompe partidos asociados

#### Test 3.2.3: Eliminar club
```
Esperado:
  ⚠️ Confirmación clara
  ✅ Solo se elimina si NO tiene partidos
  ❌ O da error: "No puedes eliminar, tiene X partidos"
```

- [ ] Si no tiene partidos → se elimina
- [ ] Si tiene partidos → error claro

### 3.3 Partidos

#### Test 3.3.1: Crear partido
**Acceso**: Torneo detail → "Nuevo partido"

```
Input:
  Local: "Real Madrid"
  Visitante: "Barcelona"
  Goles Local: 3
  Goles Visitante: 2
  Stats adicionales (opcional):
    - Posesión, tiros, pases, etc.

Esperado:
  ✅ Validación: Clubes válidos
  ✅ Marcador se guarda
  ✅ Aparece en tabla de partidos
  ✅ Tabla de posiciones se actualiza (RM +3pts, BAR +1pt)
```

- [ ] Form validado
- [ ] Partido se crea
- [ ] Tabla actualiza puntos
- [ ] Diferenciad de goles correcta

#### Test 3.3.2: Editar partido
```
Cambios:
  Goles Local: 3 → 4
  Goles Visitante: 2 → 1

Esperado:
  ✅ Tabla de posiciones se recalcula
  ✅ Dif goles actualiza (RM: +3 → +3, BAR: +1 → -3)
```

- [ ] Edición recalcula tabla
- [ ] Historial correcto

#### Test 3.3.3: Eliminar partido
```
Esperado:
  ⚠️ Confirmación
  ✅ Tabla de posiciones se recalcula
  ✅ Dif goles restaura
```

- [ ] Eliminación actualiza tabla
- [ ] No quedan datos huérfanos

---

## ✅ FASE 4: FEATURES AVANZADAS

### 4.1 Tabla de posiciones

**Acceso**: Torneo detail → Tab "Tabla"

#### Test 4.1.1: Cálculo correcto
```
Escenario:
  RM: 2W (6pts), 1D (1pt) = 7pts | GF: 8 | GC: 3 | DG: +5
  BAR: 2W (6pts), 1L (0pts) = 6pts | GF: 6 | GC: 4 | DG: +2
  ATM: 1W, 1D, 1L = 4pts | GF: 4 | GC: 5 | DG: -1

Orden esperado:
  1. RM (7pts, +5)
  2. BAR (6pts, +2)
  3. ATM (4pts, -1)
```

- [ ] Orden es correcto
- [ ] Puntos sumados bien
- [ ] Diferencia de goles correcta
- [ ] GF/GC contabilizados

#### Test 4.1.2: Actualización dinámica
```
Crear nuevo partido: RM 1-0 ATM
(RM gana +3pts, ATM pierde)

Esperado:
  ✅ Tabla actualiza sin refresh
  ✅ RM sube a 10pts
  ✅ DG RM: +5 → +6
  ✅ ATM: -1 → -2
```

- [ ] Tabla se actualiza
- [ ] Cálculos exactos
- [ ] No requiere refresh

### 4.2 Bracket de playoffs (si existe)

**Acceso**: Torneo detail (mixed o cup) → Tab "Bracket"

#### Test 4.2.1: Generación automática
```
Escenario:
  Torneo cup con 8 equipos

Esperado:
  ✅ Bracket con 4 semis
  ✅ Muestra: Team A vs Team B
  ✅ Espacio para resultados

Flujo:
  SF1: RM vs BAR → Input 3-2 → RM avanza
  SF2: ATM vs SEV → Input 2-1 → ATM avanza
  F: RM vs ATM → Input 2-0 → RM CAMPEÓN
```

- [ ] Bracket se genera
- [ ] Muestra equipos correctos
- [ ] Permite ingresar resultados
- [ ] Siguiente ronda se activa
- [ ] Ganador final es claro

#### Test 4.2.2: Mixed format (liga + playoffs)
```
Escenario:
  Torneo mixed: 10 jornadas de liga, luego top 4 a semis

Esperado:
  ✅ Fase 1: Liga (tabla)
  ✅ Fase 2: Playoffs (bracket con top 4)
  ✅ Winner es campeón
```

- [ ] Liga se juega y tabla define
- [ ] Top 4 acceden a playoffs
- [ ] Bracket funciona

### 4.3 OCR / IA (ImportMatchImage)

**Acceso**: Torneo detail → "Importar desde imagen"

#### Test 4.3.1: Upload simple (1 imagen)
```
Pasos:
  1. Seleccionar imagen con resultado de partido
     (ej: screenshot de FIFA, resultado en pantalla)
  2. Click "Analizar imagen"

Esperado:
  ✅ Loading indicator (animación)
  ✅ 2-5 seg de procesamiento (Azure OCR)
  ✅ Preview con resultados detectados:
     - Equipo Local
     - Equipo Visitante
     - Goles Local
     - Goles Visitante
     - Confianza (%)
  ✅ Botón "Confirmar e importar"
  ✅ Partido se crea correctamente
```

- [ ] Upload funciona
- [ ] OCR deteccta datos
- [ ] Preview es legible
- [ ] Confirmación importa
- [ ] Tabla se actualiza

#### Test 4.3.2: Upload múltiple (3 imágenes)
```
Pasos:
  1. Seleccionar 3 imágenes
  2. Click "Analizar"

Esperado:
  ✅ Se procesan todas (max 10)
  ✅ Merge de resultados (si hay dupls, toma mejor confianza)
  ✅ Preview unificado
  ✅ Importar crea partidos
```

- [ ] Múltiples imágenes funcionan
- [ ] No duplica partidos
- [ ] Merge es inteligente

#### Test 4.3.3: Error handling
```
Casos:
  1. Imagen sin resultado legible
  2. Archivo muy grande (>10MB)
  3. Tipo incorrecto (PDF, etc)
  4. Timeout de Azure

Esperado:
  ✅ Error amable y claro
  ✅ No bloquea UI
  ✅ Botón para reintentar
```

- [ ] Errores manejados gracefully
- [ ] UI no se rompe
- [ ] Mensajes claros

### 4.4 Página pública

**Acceso**: http://localhost:5173/public/tournaments/liga-pro-clubs-2026
(o slug del torneo creado con visibility: public)

#### Test 4.4.1: Página sin login
```
Esperado:
  ✅ Se carga sin token
  ✅ Muestra nombre del torneo
  ✅ Muestra tabla
  ✅ Muestra partidos
  ✅ NO muestra botones de editar
  ✅ Logo visible
  ✅ Responsive en móvil
```

- [ ] Página carga sin login
- [ ] Datos correctos
- [ ] No es editable
- [ ] Responsive

#### Test 4.4.2: Compartir en redes (OG tags)
```
Pasos:
  1. Copiar URL: http://localhost.../public/tournaments/liga-...
  2. Pegar en Discord, WhatsApp, etc.

Esperado:
  ✅ Aparece preview con:
     - Nombre del torneo
     - Descripción (Tipo + Temporada)
     - Imagen (logo del torneo)
     - Enlace
```

- [ ] OG tags se generan
- [ ] Preview en Discord/WhatsApp
- [ ] Logo aparece

#### Test 4.4.3: Privacidad (visibility: draft)
```
Torneo con visibility: "draft"

Acceso: http://localhost:5173/public/tournaments/...

Esperado:
  ❌ 404 o "Torneo no encontrado"
  ✅ URL no funciona sin login
```

- [ ] Draft no es accesible públicamente
- [ ] Solo owner ve si está logueado

---

## ✅ FASE 5: UX / RESPONSIVE / VISUAL

### 5.1 Mobile testing (iOS + Android)

**Dispositivos**:
- [ ] iPhone 12 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Android pequeño (320px)
- [ ] Tablet iPad (768px)

**Navegación** (todos deben funcionar):
- [ ] Login/Register ✅ responsive
- [ ] Dashboard (hero, cards apiladas) ✅
- [ ] Tournaments list (cards apilados) ✅
- [ ] Torneo detail (tabs: tabla, partidos, bracket) ✅
- [ ] Crear partido (form sin scroll horizontal) ✅
- [ ] Import imagen (file picker funciona) ✅
- [ ] Settings (form legible) ✅

**Problemas comunes a buscar**:
- [ ] Botones muy pequeños (<44px)
- [ ] Inputs no se ven
- [ ] Scroll horizontal innecesario
- [ ] Touch targets superpuestos
- [ ] Fuente muy pequeña (<14px)

### 5.2 Tema visual (Dark mode + Neon green)

**Verificar en todas las páginas**:
- [ ] Fondo oscuro (#0a0f15 aprox)
- [ ] Acentos neón verde (#24ff7a)
- [ ] Cards con borde sutil (1px, 18% opacity)
- [ ] Glass effect (backdrop-blur)
- [ ] Sombras sutiles (no agresivas)
- [ ] Texto legible en fondo oscuro

**Páginas críticas**:
- [ ] Login/Register (hero + card)
- [ ] Dashboard (hero + cards)
- [ ] Tournaments (grid de cards)
- [ ] Tournament detail (hero + tabs)
- [ ] Public page (same visual)

**Colores a validar**:
```
--fifa-neon = #24ff7a (verde)
--fifa-text = #fff (blanco)
--fifa-mute = #9ca3af (gris)
--fifa-line = rgba(255,255,255,0.08) (bordes)
```

### 5.3 Velocidad / Performance

#### Test 5.3.1: Load times
```
Medidas:
  Dashboard carga → < 2 seg (con datos)
  Torneo detail → < 2 seg
  Tabla + Bracket render → < 1 seg
  Crear partido → submit < 1 seg
```

- [ ] Dashboard rápido
- [ ] Tablas rápidas
- [ ] Submit inmediato

#### Test 5.3.2: Transiciones
```
Esperado:
  Botones: Hover effect suave (<100ms)
  Cards: Fade-in silencioso
  Modales: Animación clara pero rápida
  No delays: Click → acción < 300ms
```

- [ ] Animaciones suaves
- [ ] No hay lags
- [ ] UI responsiva

### 5.4 Accesibilidad (a nivel básico)

#### Test 5.4.1: Keyboard navigation
```
Login page:
  Tab → Email input ✅
  Tab → Password input ✅
  Tab → Remember me ✅
  Tab → Login button ✅
  Enter → Submit ✅
```

- [ ] Todos los inputs accesibles por Tab
- [ ] Enter funciona en forms

#### Test 5.4.2: Focus visible
```
Esperado:
  Click input → borde verde/outline claro ✅
  Tab en botón → outline visible ✅
```

- [ ] Focus es visible
- [ ] No hay inputs "invisibles"

#### Test 5.4.3: Alt text en imágenes
```
Verificar:
  Logo → alt text presente
  Team logos → alt text presente
  Iconos → aria-label o title
```

- [ ] Images tienen alt
- [ ] Iconos tienen labels

---

## ✅ FASE 6: SEGURIDAD

### 6.1 Auth & Tokens

#### Test 6.1.1: Token expiry
```
1. Login → Token en localStorage
2. Esperar JWT_EXPIRES_IN (7d en dev, ajustar .env a 1m para test)
3. Intentar usar token expirado

Esperado:
  ❌ Error: "Token expired"
  ✅ Redirect a login
```

- [ ] Token expira correctamente
- [ ] Redirect a login es automático

#### Test 6.1.2: Invalid token
```
localStorage token → cambiar último carácter
Acceso a ruta protegida

Esperado:
  ❌ 401 Unauthorized
  ✅ Redirige a login
```

- [ ] Token inválido es detectado
- [ ] Seguridad: no expone datos

#### Test 6.1.3: Logout limpia token
```
1. Login
2. Logout
3. Abrir DevTools → localStorage → token no existe

Esperado:
  ✅ Token eliminado
  ✅ Acceso a /dashboard → redirige a login
```

- [ ] Logout es seguro
- [ ] Token completamente eliminado

### 6.2 Input Validation

#### Test 6.2.1: XSS prevention
```
Input field (email, nombre, etc):
  Ingresar: <script>alert('xss')</script>

Esperado:
  ✅ Se guarda como string literal (no ejecuta)
  ✅ Muestra renderizado como texto, no HTML
```

- [ ] XSS no es posible
- [ ] Inputs sanitizados

#### Test 6.2.2: SQL Injection (backend protected)
```
Email input:
  " OR "1"="1

Esperado:
  ❌ No hace bypass de login
  ✅ Mongoose (ODM) escapa automáticamente
```

- [ ] BD segura
- [ ] No hay injection

#### Test 6.2.3: CSRF (si hay forms POST)
```
Verificar:
  Formularios no tienen CSRF token (optinonal si backend es JSON API)
  O: Headers tienen SameSite cookies
```

- [ ] CORS protegido
- [ ] No hay vulnerabilidades CSRF evidentes

### 6.3 Data Privacy

#### Test 6.3.1: Multi-admin isolation
```
Escenario:
  Admin A crea Torneo X
  Admin B intenta ver/editar Torneo X

Esperado:
  ❌ Admin B no ve Torneo X en su lista
  ❌ Si accede por URL directo → 403 Forbidden
```

- [ ] Cada admin ve solo sus datos
- [ ] Validación en backend (createdBy)

#### Test 6.3.2: Error messages (no info leaks)
```
Login con email inexistente:
  ❌ Error NO dice: "Este email no está registrado"
  ✅ Error genérico: "Credenciales inválidas"
```

- [ ] Errores son genéricos
- [ ] No revelan info de usuarios

### 6.4 Rate Limiting

#### Test 6.4.1: Auth rate limit (20 intentos / 15min)
```
Pasos:
  1. Login incorrecto 21 veces en < 15 min
  2. Intento 22

Esperado:
  ❌ Error: "Demasiados intentos, intenta más tarde"
  ⏱️ 15 min de cooldown
```

- [ ] Rate limit funciona
- [ ] Bloquea al usuario legítimamente

#### Test 6.4.2: General rate limit (300 req / 15min)
```
Pasos:
  Hacer muchas solicitudes (>300) en poco tiempo

Esperado:
  ❌ Error 429: "Demasiadas solicitudes"
```

- [ ] General rate limit funciona
- [ ] No permite spam

---

## 📊 MATRIZ DE VALIDACIÓN

| Feature | Test Case | Esperado | ✅/❌ | Notas |
|---------|-----------|----------|-------|-------|
| Register | Email válido | Crea admin | | |
| Register | Email duplicado | Error claro | | |
| Login | Credentials OK | Token + redirect | | |
| Login | Credentials bad | Error, no info leak | | |
| Forgot pwd | SMTP not configured | Dev URL en dev | | |
| Clubs CRUD | Create/Read/Update/Delete | Todas funcionan | | |
| Tournaments CRUD | Todas operaciones | Todas funcionan | | |
| Matches CRUD | Todas operaciones | Tabla actualiza | | |
| Table | Cálculo puntos | Correcto (W=3,D=1,L=0) | | |
| Bracket | Generación + resultados | Flujo completo | | |
| OCR/IA | Upload + análisis | Imagen → partido | | |
| Public page | Sin login | Visible + OG tags | | |
| Mobile | Responsive | Funciona <768px | | |
| Security | Token expiry | Redirige login | | |
| Security | XSS prevention | No ejecuta scripts | | |
| Security | Multi-admin isolation | Cada uno ve lo suyo | | |
| Performance | Load times | < 2s principales | | |
| Dark mode | Visual | Neon + dark correcto | | |

---

## 🏁 CHECKLIST FINAL (Pre-lanzamiento)

### Funcionalidad
- [ ] Auth funciona 100% (incluyendo forgot pwd con SMTP si requiere)
- [ ] CRUD tournaments funciona
- [ ] CRUD clubs funciona
- [ ] CRUD matches funciona
- [ ] Tabla de posiciones calcula correctamente
- [ ] Bracket funciona (si existe)
- [ ] OCR/IA importa partidos (end-to-end)
- [ ] Página pública es accesible y privada según config
- [ ] Settings permite actualizar perfil/contraseña/branding

### UX/Visual
- [ ] Responsive en móvil (390px, 768px, 1200px)
- [ ] Dark mode + neon verde es consistente
- [ ] Animaciones suaves, sin lags
- [ ] Botones/inputs tienen tamaño adecuado (44px+)
- [ ] Fuentes legibles (<14px prohibited)
- [ ] Confirmaciones para acciones destructivas

### Seguridad
- [ ] Token JWT expira correctamente
- [ ] Invalid token redirige login
- [ ] Logout limpia session
- [ ] XSS no es posible
- [ ] Multi-admin aislamiento funciona
- [ ] Errores no revelan info
- [ ] Rate limiting funciona

### Performance
- [ ] Dashboard < 2s
- [ ] Tabla < 1s
- [ ] Submit < 1s
- [ ] Sin scroll horizontal en móvil

### Deployment (Pre-prod)
- [ ] .env tiene valores reales (no localhost)
- [ ] DATABASE_URL apunta a prod
- [ ] SMTP_HOST configurado
- [ ] FRONTEND_URL es dominio real
- [ ] NODE_ENV=production en servidor

---

## 📝 Template de reporte de bug

Si encuentra bug durante QA:

```markdown
## Bug: [Título claro]

**Severidad**: 🔴 Crítica / 🟡 Media / 🟢 Baja

**Pasos para reproducir**:
1. ...
2. ...
3. ...

**Esperado**: 
...

**Actual**: 
...

**Screenshots/Video**: (si aplica)
...

**Environment**:
- Browser: Chrome 130 / Firefox / Safari
- Device: Desktop / iPhone 12 / Android
- URL: http://...
```

---

## 🎬 Iniciar QA

**Paso 1**: Llenar FASE 1 (Setup)
**Paso 2**: Llenar FASE 2-6 en orden
**Paso 3**: Consolidar bugs en documento separado
**Paso 4**: Priorizar fixes (críticas primero)
**Paso 5**: Re-test después de fixes
**Paso 6**: Sign-off para lanzamiento

---

**Responsable**: Rodrigo  
**Fecha inicio**: 2026-05-09  
**Fecha fin estimada**: 2026-05-10  
