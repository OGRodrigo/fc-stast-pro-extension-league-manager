# 📦 Guía de Instalación — FC Stats Pro League Manager

Pasos detallados para instalar y configurar el proyecto en desarrollo y producción.

---

## 📋 Requisitos previos

### Obligatorios
- **Node.js 16+** ([descargar](https://nodejs.org/))
- **npm 8+** (incluido con Node.js)
- **Git** ([descargar](https://git-scm.com/))
- **MongoDB** (Atlas o local)

### Para funcionalidades AI/OCR (opcional)
- **Azure Computer Vision API key** ([crear en Azure](https://portal.azure.com/))
- **OpenAI API key** ([crear en OpenAI](https://platform.openai.com/))

### Para envío de emails (opcional)
- **Gmail account** con contraseña de aplicación

---

## 🔧 Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/fc-stats-pro-league-manager.git
cd fc-stats-pro-league-manager
```

### 2. Instalar dependencias

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 3. Configurar variables de entorno

```bash
# Crear archivo .env en la raíz
cp .env.example .env
```

Edita `.env` con tus valores:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos MongoDB
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/fc_stats_pro?appName=Cluster0

# Autenticación JWT
JWT_SECRET=usa_un_valor_seguro_de_minimo_32_caracteres_aqui_1234567890
JWT_EXPIRES_IN=7d

# URLs del cliente (CORS)
CLIENT_URL=http://localhost:5173

# Azure Computer Vision (OCR)
AZURE_VISION_ENDPOINT=https://tu-region.cognitiveservices.azure.com/
AZURE_VISION_KEY=tu_azure_vision_key_aqui
AZURE_VISION_API_VERSION=2023-10-01

# OpenAI (validación de datos)
OPENAI_API_KEY=sk-proj-tu_openai_key_aqui
OPENAI_MODEL=gpt-4o-mini

# Confianza en AI
AI_SCORE_CONFIDENCE_MIN=0.85
AI_STATS_CONFIDENCE_MIN=0.70
AI_IMPORT_MAX_IMAGES=10

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password_aqui
SMTP_FROM=FC Stats Pro <tu_email@gmail.com>
```

### 4. Verificar conexión a MongoDB

```bash
npm run dev
```

Si ves en la consola `✅ Conectado a MongoDB`, está funcionando correctamente.

### 5. Iniciar en desarrollo

**Terminal 1** (Backend):
```bash
npm run dev
# Debería ver: 🚀 API corriendo en http://localhost:3000
```

**Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
# Debería ver: Local:   http://localhost:5173/
```

Abre http://localhost:5173 en tu navegador.

---

## 📝 Configuración de MongoDB

### Opción 1: MongoDB Atlas (Recomendado)

1. Crea cuenta en [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Crea un proyecto y cluster
3. Copia la connection string
4. Pégala en `MONGO_URI` en `.env`

```
mongodb+srv://usuario:password@cluster.mongodb.net/nombre_db?appName=Cluster0
```

### Opción 2: MongoDB Local

1. Descarga [MongoDB Community](https://docs.mongodb.com/manual/installation/)
2. Instala y inicia el servicio
3. En `.env` usa:

```
MONGO_URI=mongodb://localhost:27017/fc_stats_pro
```

### Verificar conexión

```bash
# En Node.js REPL o en el backend durante dev
mongoose.connection.on('connected', () => console.log('✅ MongoDB conectado'))
```

---

## 🔐 Configuración de Azure Vision (OCR)

### Crear cuenta de Azure

1. Ve a [portal.azure.com](https://portal.azure.com)
2. Crea una suscripción (free tier disponible)
3. Busca "Computer Vision" en el marketplace
4. Crea un recurso nuevo
5. Copia el **endpoint** y **key 1**

### Agregar a .env

```env
AZURE_VISION_ENDPOINT=https://tu-region.cognitiveservices.azure.com/
AZURE_VISION_KEY=tu_key_aqui
AZURE_VISION_API_VERSION=2023-10-01
```

### Probar

El backend automáticamente usará Azure Vision cuando proceses imágenes.

---

## 🤖 Configuración de OpenAI (Opcional)

### Crear API key

1. Crea cuenta en [platform.openai.com](https://platform.openai.com/)
2. Ve a API Keys
3. Crea una nueva key
4. Cópiala a `.env`

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
```

Si **NO** configuras esto, el sistema usará solo Azure OCR + heurísticas.

---

## 📧 Configuración de Email (Opcional)

Para recuperación de contraseñas y notificaciones:

### Usar Gmail

1. Activa ["App Passwords"](https://myaccount.google.com/apppasswords) en tu cuenta Google
2. Genera una contraseña de 16 caracteres para esta aplicación
3. Agrega a `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password_16_caracteres
SMTP_FROM=FC Stats Pro <tu_email@gmail.com>
```

### Usar otro proveedor

Reemplaza `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` según tu proveedor.

---

## 🏗️ Instalación en producción

### Usar un servidor

```bash
# Ejemplo con Ubuntu/Debian

# 1. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clonar repositorio
git clone https://github.com/tu-usuario/fc-stats-pro-league-manager.git
cd fc-stats-pro-league-manager

# 3. Instalar dependencias
npm install --production
cd frontend && npm install --production && npm run build && cd ..

# 4. Configurar .env con variables de producción
nano .env
```

### Usar PM2 para mantener el servidor activo

```bash
npm install -g pm2

# Iniciar
pm2 start src/index.js --name "fc-stats-api"

# Guardar configuración
pm2 save

# Iniciar con el sistema
pm2 startup
```

### Usar Nginx como proxy inverso

```nginx
server {
    listen 80;
    server_name api.ejemplo.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.ejemplo.com
```

---

## ✅ Validar instalación

```bash
# 1. Backend debe responder
curl http://localhost:3000/health
# Respuesta esperada: {"status":"ok","service":"fc-stats-pro-league-manager-api"}

# 2. Frontend debe estar disponible
curl http://localhost:5173
# Debería ver HTML de React

# 3. MongoDB debe estar conectado
# Ver logs en la consola: ✅ Conectado a MongoDB
```

---

## 🆘 Troubleshooting

### Error: "JWT_SECRET no definido o demasiado corto"
- Abre `.env`
- Verifica que `JWT_SECRET` tenga mínimo 32 caracteres
- Reinicia el servidor

### Error: "Origen no permitido por CORS"
- En `.env`, agrega tu URL a `CLIENT_URL`
- Separa múltiples URLs con comas: `http://localhost:5173,https://app.com`

### Error: "MongoError: connect ECONNREFUSED"
- Verifica que MongoDB esté corriendo
- Si usas Atlas, verifica la connection string en `.env`
- Comprueba IP whitelist en MongoDB Atlas

### Error: "AZURE_VISION_KEY no válida"
- Verifica que copiaste bien la key
- Comprueba que la key esté activa en Azure Portal
- Prueba regenerando la key

### Port 3000 ya en uso
```bash
# Cambiar puerto en .env
PORT=3001
```

### Limpiar caché de npm
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Desarrollo en móvil

Para probar desde tu teléfono durante desarrollo:

```bash
# Obtén tu IP local
ipconfig getifaddr en0  # macOS
hostname -I             # Linux
ipconfig                # Windows (busca "IPv4 Address")

# En .env, agrega tu IP a CLIENT_URL
CLIENT_URL=http://192.168.1.100:5173

# Accede desde móvil (mismo WiFi)
http://192.168.1.100:5173
```

---

## 🎯 Siguiente paso

Una vez instalado, revisa:
- [ARCHITECTURE.md](./ARCHITECTURE.md) para entender la estructura
- [API.md](./API.md) para la documentación de endpoints
- [AI_PIPELINE.md](./AI_PIPELINE.md) para cómo funciona el OCR

