# 🆘 Troubleshooting — Solución de problemas

Guía para resolver problemas comunes durante desarrollo y uso de FC Stats Pro.

---

## 🚀 Problemas de inicio

### Error: "JWT_SECRET no definido o demasiado corto"

**Síntomas:**
```
❌ FATAL: JWT_SECRET no definido o demasiado corto. Servidor no iniciado.
```

**Solución:**
1. Abre `.env`
2. Verifica la línea `JWT_SECRET`
3. Debe tener **mínimo 32 caracteres**

```env
# ❌ Corto
JWT_SECRET=abc123

# ✅ Correcto
JWT_SECRET=d09931458fe26105a289d057d4ac605632850f8156775a5cee5bd45e016b6191f15d4e9118f1d9d97857def2e766314af3a432805e013ca630d08284bf3acbb2
```

Regenera con:
```bash
# Windows PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { [char](Get-Random -InputObject (48..90) + (97..122) + (48..57)) } -join '')))

# macOS/Linux
openssl rand -base64 32
```

---

### Error: "ECONNREFUSED localhost:27017"

**Síntomas:**
```
MongoError: connect ECONNREFUSED 127.0.0.1:27017
```

**Causa:** MongoDB no está corriendo.

**Solución:**

Si usas **MongoDB local**:
```bash
# Windows
# Busca "MongoDB Server" en Servicios y comprueba que está activo

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

Si usas **MongoDB Atlas**:
```env
# Verifica que MONGO_URI sea correcto
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/fc_stats_pro
```

Comprueba la connection string:
```bash
# Debería conectar sin error
npm run dev
# Deberías ver: ✅ Conectado a MongoDB
```

---

### Error: "Porta 3000 ya en uso"

**Síntomas:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solución:**

**Opción 1:** Cambiar puerto
```env
PORT=3001  # En lugar de 3000
```

**Opción 2:** Matar proceso que usa puerto

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

---

## 🔐 Problemas de autenticación

### Error: "Invalid token"

**Síntomas:**
```
401 Unauthorized
{ message: "Invalid token" }
```

**Soluciones:**
1. **Token expirado**: Haz login de nuevo
2. **Token mal formado**: Borra localStorage
   ```javascript
   localStorage.clear()
   // Recarga página
   ```
3. **JWT_SECRET cambió**: Todos los tokens se invalidan

---

### Error: "Email ya existe"

**Síntomas:**
```
400 Bad Request
{ message: "Email ya registrado" }
```

**Solución:**
- Usa un email diferente
- O si es para testing, limpia la BD:
  ```bash
  # En MongoDB Atlas o local
  db.admins.deleteMany({ email: "test@example.com" })
  ```

---

## 🖼️ Problemas de OCR

### Error: "Azure Vision API key no válida"

**Síntomas:**
```
401 Unauthorized
Error: The provided credentials were invalid or invalid format
```

**Soluciones:**
1. Verifica que copiaste bien la key en `.env`
2. Comprueba que la subscription esté activa en [Azure Portal](https://portal.azure.com)
3. Regenera la key:
   - Ve a tu recurso Computer Vision
   - Keys → Regenerate Key 1

---

### Error: "Rate limit de Azure Vision"

**Síntomas:**
```
429 Too Many Requests
Could not process image due to rate limit
```

**Solución:**
- Espera 60 segundos antes de la próxima importación
- O upgrarea el tier de Azure Vision

---

### Las imágenes OCR no se procesan

**Síntomas:**
```
{ status: "failed", message: "No text detected" }
```

**Causa:** Imagen no legible por OCR.

**Soluciones:**
1. Sube imagen más clara (mejor resolución)
2. Mejor iluminación
3. Marcador más grande
4. Menos ángulo de rotación

Formatos soportados:
- JPG (recomendado)
- PNG
- BMP
- TIFF
- Máximo 4MB

---

## 💾 Problemas de base de datos

### Error: "MongoNetworkError"

**Síntomas:**
```
MongoNetworkError: getaddrinfo ENOTFOUND cluster.mongodb.net
```

**Soluciones:**
1. Verifica conexión a internet
2. En **MongoDB Atlas**:
   - Ve a Security → Network Access
   - Agrega tu IP: 0.0.0.0/0 (o IP específica)

---

### Error: "MongoAuthenticationError"

**Síntomas:**
```
MongoAuthenticationError: authentication failed
```

**Soluciones:**
1. Verifica usuario/contraseña en MONGO_URI
2. Si la contraseña tiene caracteres especiales, debe estar URL-encoded:
   ```
   mongodb+srv://user:pass%40word@cluster.mongodb.net/db
   ```
3. Comprueba que el usuario existe en MongoDB Atlas

---

### BD muy lenta

**Síntomas:**
```
Query takes >2 seconds
```

**Soluciones:**
```javascript
// 1. Verificar índices
db.tournaments.getIndexes()
db.matches.getIndexes()

// 2. Crear índices si no existen
db.tournaments.createIndex({ adminId: 1 })
db.matches.createIndex({ tournamentId: 1 })
db.clubs.createIndex({ tournamentId: 1 })

// 3. Limpiar datos innecesarios
db.matches.deleteMany({ tournamentId: "old-id" })
```

---

## 🌐 Problemas de CORS

### Error: "Origin not allowed by CORS"

**Síntomas:**
```
Access to XMLHttpRequest at 'http://localhost:3000/tournaments' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solución:**
En `.env`:
```env
# Agregar tu URL frontend
CLIENT_URL=http://localhost:5173

# Para múltiples URLs
CLIENT_URL=http://localhost:5173,http://localhost:8080,https://app.ejemplo.com
```

Reinicia backend:
```bash
npm run dev
```

---

## 🎨 Problemas de frontend

### React no compila

**Síntomas:**
```
error in ./src/App.jsx
SyntaxError: Unexpected token
```

**Soluciones:**
```bash
# 1. Limpiar caché
rm -rf node_modules/.vite
rm frontend/.env.local

# 2. Reinstalar dependencias
cd frontend
rm -rf node_modules package-lock.json
npm install

# 3. Verificar sintaxis
npm run build
```

---

### Estilos Tailwind no aplican

**Síntomas:**
```
Classes como "bg-blue-500" no funcionan
```

**Soluciones:**
1. Verifica que `index.html` tenga:
   ```html
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />
     <!-- Vite injection -->
   </head>
   ```

2. Reconstruye:
   ```bash
   cd frontend
   npm run build
   npm run dev
   ```

---

## 🧪 Problemas de testing

### Tests no ejecutan

**Síntomas:**
```
No tests found related to files changed
```

**Soluciones:**
```bash
# 1. Instalar dependencias de test
npm install --save-dev jest @testing-library/react

# 2. Crear jest.config.js
npm run test
```

---

## 📊 Problemas de performance

### API muy lenta

**Síntomas:**
```
Response time: >2000ms
```

**Soluciones:**
```bash
# 1. Verificar logs
npm run dev
# Ver qué endpoint es lento

# 2. Verificar queries a BD
// En mongoose
const result = await Tournament.find().explain("executionStats");
console.log(result); // Ver si usa índice

# 3. Limpiar data vieja
db.matches.deleteMany({ createdAt: { $lt: ISODate("2024-01-01") } })
```

---

### Frontend lento

**Síntomas:**
```
Page renders slowly, feels sluggish
```

**Soluciones:**
```bash
# 1. Ver tamaño de bundle
cd frontend
npm run build
# Revisar archivo dist/assets/

# 2. Usar React DevTools
# Instalar extensión en Chrome
# Identificar componentes que se renderean mucho

# 3. Lazy load componentes grandes
import { lazy, Suspense } from 'react';
const LazyComponent = lazy(() => import('./Heavy'));

// Usar:
<Suspense fallback={<LoadingScreen />}>
  <LazyComponent />
</Suspense>
```

---

## 🔒 Problemas de seguridad

### Headers de seguridad no aparecen

**Síntomas:**
```
Missing X-Frame-Options header
Missing X-Content-Type-Options header
```

**Solución:**
Verifica que Helmet esté activo en `app.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

### Contraseña débil aceptada

**Síntomas:**
```
Se acepta contraseña "123"
```

**Solución:**
En `auth.controller.js`, verifica validación:
```javascript
if (password.length < 8) {
  return res.status(400).json({ message: 'Contraseña muy corta (mín. 8 caracteres)' });
}
```

---

## 📱 Problemas en móvil

### No funciona en teléfono

**Síntomas:**
```
ERR_INVALID_IP_ADDRESS
```

**Solución:**
En `.env`, agrega tu IP local:
```env
CLIENT_URL=http://192.168.1.100:5173

# Obtén IP con:
# macOS: ipconfig getifaddr en0
# Linux: hostname -I
# Windows: ipconfig (busca "IPv4 Address")
```

Accede desde móvil (mismo WiFi):
```
http://192.168.1.100:5173
```

---

## 🆘 Aún no funciona?

1. **Verificar logs:**
   ```bash
   npm run dev
   # Copia el error completo
   ```

2. **Limpiar y reinstalar:**
   ```bash
   rm -rf node_modules .env
   npm install
   cp .env.example .env
   # Rellena .env
   npm run dev
   ```

3. **Preguntar:**
   - [GitHub Discussions](https://github.com/tu-repo/discussions)
   - Email: darkscencia@gmail.com
   - Incluye: error, .env (sin valores sensibles), OS, Node version

---

## 📝 Logs útiles para debugging

```bash
# Ver todo con debug detallado
DEBUG=* npm run dev

# Solo logs de BD
DEBUG=mongoose* npm run dev

# Solo logs de API
DEBUG=express* npm run dev

# Guardar logs a archivo
npm run dev > app.log 2>&1
tail -f app.log
```

---

**¿Problema no listado aquí?** Crea un [Issue en GitHub](https://github.com/tu-repo/issues).

