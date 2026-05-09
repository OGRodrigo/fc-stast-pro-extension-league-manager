# 🚀 Guía de Despliegue

Instrucciones para llevar FC Stats Pro League Manager a producción.

---

## 📋 Checklist pre-deploy

- [ ] Todas las variables de `.env` están configuradas
- [ ] JWT_SECRET tiene mínimo 32 caracteres seguros
- [ ] MongoDB Atlas está configurado con whitelist de IPs
- [ ] Certificados SSL están listos
- [ ] Dominio apunta a servidor
- [ ] Email está configurado y probado
- [ ] Backups de base de datos están habilitados
- [ ] Logs están configurados
- [ ] Rate limiting está ajustado

---

## 🌐 Opciones de hosting

### 1. Heroku (Recomendado para comenzar)

**Ventajas:**
- Deploy automático desde Git
- Base de datos incluida
- SSL gratis
- Escalable

**Pasos:**

```bash
# 1. Instalar Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# 2. Login
heroku login

# 3. Crear app
heroku create fc-stats-pro-api

# 4. Agregar variables de entorno
heroku config:set JWT_SECRET=tu_valor_seguro
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set NODE_ENV=production
# ... resto de variables

# 5. Build pack (Node.js automático)
# Los build packs se detectan automáticamente

# 6. Deploy
git push heroku main

# 7. Ver logs
heroku logs --tail
```

**Costo:** $7/mes (dyno básico)

---

### 2. DigitalOcean (Mejor control)

**Ventajas:**
- Control total
- Droplets económicos ($5/mes)
- Marketplace con apps preinstaladas
- Excelente documentación

**Pasos:**

```bash
# 1. Crear Droplet (Ubuntu 22.04 LTS)
# Acceso desde: https://cloud.digitalocean.com

# 2. SSH al servidor
ssh root@tu_ip

# 3. Instalar Node.js y npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Instalar PM2
sudo npm install -g pm2

# 5. Instalar Nginx
sudo apt-get install -y nginx

# 6. Instalar SSL (Let's Encrypt)
sudo apt-get install -y certbot python3-certbot-nginx

# 7. Clonar repositorio
git clone https://github.com/usuario/fc-stats-pro.git
cd fc-stats-pro

# 8. Instalar dependencias
npm install --production

# 9. Crear archivo .env
sudo nano .env
# Agregar todas las variables

# 10. Iniciar con PM2
pm2 start src/index.js --name "fc-stats-api"
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup

# 11. Configurar Nginx
sudo nano /etc/nginx/sites-available/default
```

**Configuración Nginx:**
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 12. SSL con Let's Encrypt
sudo certbot --nginx -d api.ejemplo.com

# 13. Prueba Nginx
sudo nginx -t

# 14. Reinicia Nginx
sudo systemctl restart nginx
```

**Costo:** $5+/mes (Droplet básico)

---

### 3. AWS (Mayor escala)

**Servicios:**
- EC2: Instancia Linux
- RDS: Base de datos MongoDB
- CloudFront: CDN
- Route53: DNS

**Pasos básicos:**

```bash
# Crear instancia EC2
# Usar security group: puertos 80, 443, 22 abiertos

# SSH
ssh -i tu-clave.pem ec2-user@tu-ip

# Instalar Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18

# Resto similar a DigitalOcean
```

**Costo:** Variable (desde $15+/mes)

---

## 🐳 Docker

Para mayor portabilidad:

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Build y run:**
```bash
docker build -t fc-stats-api .
docker run -p 3000:3000 --env-file .env fc-stats-api
```

---

## 🗄️ Base de datos en producción

### MongoDB Atlas

**1. Crear cluster:**
- Ve a [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Crea proyecto
- Selecciona tier (M0 gratis, M1 $57/mes)

**2. Configurar whitelist:**
```
Security → Network Access
Add IP Address: tu_servidor_ip (o 0.0.0.0/0 para desarrollo)
```

**3. Obtener connection string:**
```
mongodb+srv://usuario:password@cluster.mongodb.net/fc_stats_pro?retryWrites=true&w=majority
```

**4. Habilitar backups:**
```
Clusters → Backup
Enable Automatic Backups
Retain backups for 30 days
```

**5. En `.env`:**
```env
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/fc_stats_pro?retryWrites=true&w=majority
NODE_ENV=production
```

---

## 🔐 Variables de producción

**Crear archivo `.env.production`:**

```env
# Servidor
PORT=3000
NODE_ENV=production

# Base de datos
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/fc_stats_pro

# Autenticación
JWT_SECRET=generador_seguro_32_caracteres_minimo_aqui_1234567890abcdef
JWT_EXPIRES_IN=7d

# URLs permitidas (CORS)
CLIENT_URL=https://app.ejemplo.com

# Azure Vision
AZURE_VISION_ENDPOINT=https://region.cognitiveservices.azure.com/
AZURE_VISION_KEY=tu_production_key
AZURE_VISION_API_VERSION=2023-10-01

# OpenAI
OPENAI_API_KEY=sk-proj-tu_production_key
OPENAI_MODEL=gpt-4o-mini

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
SMTP_FROM=FC Stats Pro <tu_email@gmail.com>

# Rate limiting más estricto
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## 🌍 Frontend (React)

### Build

```bash
cd frontend
npm run build
```

Genera carpeta `dist/` con archivos optimizados.

### Servir estáticamente

**Opción 1: Nginx**
```nginx
server {
    listen 80;
    server_name app.ejemplo.com;

    root /var/www/fc-stats-app;
    index index.html;

    location / {
        try_files $uri /index.html;  # SPA routing
    }

    location /api/ {
        proxy_pass http://localhost:3000;
    }
}
```

**Opción 2: Vercel (Recomendado para frontend)**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Configurar API backend
# Variables de entorno en Vercel dashboard: VITE_API_URL
```

**Opción 3: GitHub Pages**
```bash
# En vite.config.js
export default {
  base: '/fc-stats-pro/',
  // ... resto de config
}

# Build y push a gh-pages
npm run build
git add dist
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

---

## 📊 Monitoreo

### PM2 Monitoring

```bash
# Instalar módulo PM2
pm2 install pm2-auto-pull

# Monitoreo web (PM2+)
pm2 web

# Acceder a: http://localhost:9615
```

### Logs

```bash
# Ver logs en tiempo real
pm2 logs fc-stats-api

# Logs persistentes
pm2 logs fc-stats-api > /var/log/fc-stats.log
```

### Sentry (Error tracking)

```bash
npm install @sentry/node

# En app.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'https://...@sentry.io/...' });
app.use(Sentry.Handlers.errorHandler());
```

---

## 🔄 CI/CD

### GitHub Actions

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test
      - run: cd frontend && npm run build
      
      - name: Deploy to DigitalOcean
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H ${{ secrets.SERVER_IP }} >> ~/.ssh/known_hosts
          scp -i ~/.ssh/deploy_key -r . root@${{ secrets.SERVER_IP }}:/app
          ssh -i ~/.ssh/deploy_key root@${{ secrets.SERVER_IP }} 'cd /app && npm install && pm2 restart fc-stats-api'
```

---

## 🆘 Troubleshooting

### Error: "Cannot find module"
```bash
npm install
npm list  # Verificar dependencias
```

### MongoDB connection timeout
```bash
# Verificar whitelist en Atlas
# Aumentar timeout en .env
MONGO_URI=mongodb+srv://...?serverSelectionTimeoutMS=5000
```

### Rate limit en Azure Vision
```bash
# Esperar 60 segundos entre requests
# O actualizar a tier superior
```

### Certificado SSL expirado
```bash
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

## 📈 Escalabilidad

### Agregar Redis (caché)

```bash
npm install redis

# app.js
const redis = require('redis');
const client = redis.createClient({
  host: 'tu-redis.redis.cache.windows.net',
  port: 6380,
  password: process.env.REDIS_PASSWORD
});
```

### Load balancer (nginx)

```nginx
upstream api_servers {
    server localhost:3000 weight=3;
    server localhost:3001 weight=3;
    server localhost:3002;
}

server {
    listen 80;
    server_name api.ejemplo.com;
    
    location / {
        proxy_pass http://api_servers;
    }
}
```

---

## 🔒 Seguridad

### Verificación final

```bash
# 1. SSL valida
curl -I https://api.ejemplo.com

# 2. CORS configurado
curl -H "Origin: https://app.ejemplo.com" https://api.ejemplo.com

# 3. Rate limit activo
for i in {1..110}; do curl https://api.ejemplo.com/health; done
# Debería fallar después de 100 requests

# 4. Helmet activo
curl -I https://api.ejemplo.com
# Ver headers de seguridad
```

### Actualizar dependencias

```bash
npm outdated              # Ver qué está desactualizado
npm update --save         # Actualizar versiones menores
npm audit                 # Verificar vulnerabilidades
npm audit fix             # Corregir automáticamente
```

---

## ✅ Checklist post-deploy

- [ ] API responde en `/health`
- [ ] Frontend carga sin errores
- [ ] Login funciona
- [ ] Crear torneo funciona
- [ ] Importar imagen OCR funciona
- [ ] Emails se envían
- [ ] SSL válido
- [ ] Rate limiting activo
- [ ] Logs disponibles
- [ ] Backups configurados
- [ ] Monitoreo activo

---

## 🚨 Plan de rollback

Si algo falla en producción:

```bash
# 1. Revertir última versión
git revert HEAD

# 2. Rebuild
npm install
npm run build

# 3. Reiniciar
pm2 restart fc-stats-api

# 4. Monitorear
pm2 logs fc-stats-api
```

---

## 📞 Soporte

- **Error desconocido**: Revisar logs en `/var/log/`
- **MongoDB**: Verificar Atlas console
- **Azure Vision**: Comprobar suscripción activa
- **Email**: Probar credenciales en mailer

