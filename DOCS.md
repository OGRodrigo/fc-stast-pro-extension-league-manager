# 📚 Documentación — FC Stats Pro League Manager

Índice completo de la documentación del proyecto. Elige el documento según tus necesidades.

---

## 🚀 Comenzar rápido

**¿Nuevo en el proyecto?**
1. Empieza por [README.md](./README.md) — Visión general
2. Luego [INSTALLATION.md](./docs/INSTALLATION.md) — Instala localmente
3. Finalmente [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — Entiende la estructura

---

## 📖 Documentación disponible

### Inicio

| Documento | Para | Leer si... |
|-----------|------|-----------|
| [README.md](./README.md) | Todos | Quieres saber qué es el proyecto |
| [INSTALLATION.md](./docs/INSTALLATION.md) | Desarrolladores | Necesitas instalarlo localmente |
| [.env.example](./.env.example) | Desarrolladores | Necesitas configurar variables |

### Desarrollo

| Documento | Para | Leer si... |
|-----------|------|-----------|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Desarrolladores | Necesitas entender cómo funciona |
| [API.md](./docs/API.md) | Backend/Frontend devs | Necesitas referencia de endpoints |
| [AI_PIPELINE.md](./docs/AI_PIPELINE.md) | Backend devs | Quieres entender OCR/IA |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Contribuidores | Quieres contribuir al proyecto |
| [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Todos | Tienes problemas |

### Proyecto

| Documento | Para | Leer si... |
|-----------|------|-----------|
| [CHANGELOG.md](./CHANGELOG.md) | Product managers | Quieres ver cambios de versión |
| [ROADMAP.md](./ROADMAP.md) | Todos | Quieres saber qué viene |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | DevOps | Necesitas deployar a producción |

---

## 🎯 Busca por caso de uso

### "Quiero instalar el proyecto"
→ [INSTALLATION.md](./docs/INSTALLATION.md)

### "Quiero entender cómo está hecho"
→ [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

### "Quiero usar la API"
→ [API.md](./docs/API.md)

### "Quiero contribuir código"
→ [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

### "Quiero deployar a producción"
→ [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### "Tengo un problema"
→ [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

### "Quiero entender OCR/IA"
→ [AI_PIPELINE.md](./docs/AI_PIPELINE.md)

### "¿Qué cambió en la versión?"
→ [CHANGELOG.md](./CHANGELOG.md)

### "¿Qué viene próximamente?"
→ [ROADMAP.md](./ROADMAP.md)

### "¿Qué es este proyecto?"
→ [README.md](./README.md)

---

## 🔧 Stack técnico

<details>
<summary><b>Backend</b> — Node.js + Express + MongoDB</summary>

- **Express.js** — Framework web
- **MongoDB + Mongoose** — Base de datos
- **JWT** — Autenticación
- **Helmet.js** — Seguridad HTTP
- **Azure Computer Vision** — OCR
- **OpenAI API** — Validación de datos

[Ver más →](./docs/ARCHITECTURE.md#-stack-tecnológico)
</details>

<details>
<summary><b>Frontend</b> — React + Vite + Tailwind</summary>

- **React 18** — UI framework
- **Vite** — Build tool
- **React Router** — Navegación
- **Axios** — Cliente HTTP
- **Tailwind CSS** — Estilos
- **Framer Motion** — Animaciones

[Ver más →](./docs/ARCHITECTURE.md#-stack-tecnológico)
</details>

---

## 📊 Arquitectura (resumen)

```
Frontend (React)             Backend (Express)           Base de datos
   ↓                             ↓                          ↓
Dashboard        ←→  REST API  ←→  Controllers  ←→  MongoDB
Torneos                        ↓                      (Torneos,
Clubes                   Services + AI                Clubes,
Partidos                 (OCR, Validación)           Partidos)
Tablas                        ↓
Brackets                 Azure Vision
                         OpenAI
```

[Documentación completa →](./docs/ARCHITECTURE.md)

---

## 🚀 Quick start

```bash
# 1. Instalar
npm install && cd frontend && npm install && cd ..

# 2. Configurar .env
cp .env.example .env
# Rellenar con valores reales

# 3. Iniciar (2 terminales)
npm run dev              # Backend en 3000
cd frontend && npm run dev  # Frontend en 5173
```

[Guía detallada →](./docs/INSTALLATION.md)

---

## 📡 API endpoints (principales)

```
POST   /auth/register              Crear cuenta
POST   /auth/login                 Iniciar sesión

GET    /tournaments                Listar mis torneos
POST   /tournaments                Crear torneo
PUT    /tournaments/:id            Editar torneo

POST   /clubs                       Crear club
GET    /matches                     Listar partidos
POST   /matches                     Crear partido

POST   /ai/import-image            Importar por OCR
GET    /public/tournaments/:slug   Ver torneo público
```

[Referencia completa →](./docs/API.md)

---

## 🤖 Sistema de IA

El proyecto incluye un sofisticado pipeline de OCR que:

1. **Extrae** texto de imágenes con Azure Vision
2. **Clasifica** el tipo de marcador
3. **Parsea** estructura (equipos, goles)
4. **Relaciona** con clubes en BD
5. **Valida** con OpenAI (opcional)
6. **Calcula** confianza (0-1)

[Documentación técnica →](./docs/AI_PIPELINE.md)

---

## 🔐 Seguridad

El proyecto implementa:
- ✅ Helmet.js para headers HTTP seguros
- ✅ JWT con expiración configurable
- ✅ Rate limiting en endpoints críticos
- ✅ CORS whitelist por dominio
- ✅ Validación de entrada robusta
- ✅ Contraseñas hasheadas con bcryptjs

[Más detalles →](./docs/ARCHITECTURE.md#-seguridad)

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

## 🚀 Deployment

### Heroku
```bash
heroku create fc-stats-api
heroku config:set JWT_SECRET=...
git push heroku main
```

### DigitalOcean / VPS
```bash
# SSH al servidor
scp -r . user@server:/app
# Instalar dependencias
# Configurar Nginx + SSL
# Iniciar con PM2
```

[Guía completa →](./docs/DEPLOYMENT.md)

---

## 🆘 ¿Tienes problemas?

1. **Revisa primero:** [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
2. **Busca en logs:** `npm run dev` y copia el error
3. **Pregunta en:** [GitHub Discussions](https://github.com/tu-repo/discussions)
4. **Contacta:** darkscencia@gmail.com

---

## 🤝 Contribuir

¿Quieres ayudar?

1. Fork el repositorio
2. Lee [CONTRIBUTING.md](./docs/CONTRIBUTING.md)
3. Crea una rama: `git checkout -b feature/mi-feature`
4. Haz commits: `git commit -m "feature: descripción"`
5. Abre un Pull Request

---

## 📈 Roadmap

¿Qué viene próximamente?

- ✅ v1.0.0 — Release estable (actual)
- 🔄 v1.1.0 — Notificaciones en tiempo real
- 🔄 v1.2.0 — Funcionalidades sociales
- 🔄 v1.5.0 — IA mejorada
- 🔄 v2.0.0 — App móvil (2025)

[Roadmap completo →](./ROADMAP.md)

---

## 📝 Changelog

**v1.0.0** (2024-01-20)
- ✅ Autenticación y CRUD completo
- ✅ OCR inteligente
- ✅ Tablas y brackets dinámicos
- ✅ API REST segura
- ✅ Frontend responsivo

[Ver más →](./CHANGELOG.md)

---

## 💡 Conceptos clave

### JWT (JSON Web Tokens)
Token de autenticación sin estado. Se envía en cada request con:
```
Authorization: Bearer <token>
```

### OCR (Optical Character Recognition)
Extrae texto automáticamente de imágenes. Usa **Azure Computer Vision**.

### Mongoose
Librería para MongoDB que proporciona schemas y validaciones.

### Vite
Build tool ultrarrápido para React. Mejor que Webpack.

### Tailwind CSS
Framework CSS basado en utility classes. Más rápido que Bootstrap.

---

## 🗂️ Estructura de carpetas

```
├── src/                    # Backend
│   ├── controllers/        # Lógica de negocios
│   ├── models/             # Esquemas MongoDB
│   ├── routes/             # Endpoints
│   ├── services/           # Lógica reutilizable
│   └── middlewares/        # Auth, rate limit
├── frontend/               # React frontend
│   └── src/
│       ├── pages/          # Rutas principales
│       ├── components/     # UI reutilizable
│       ├── api/            # Cliente HTTP
│       └── auth/           # Autenticación
├── docs/                   # Documentación
├── .env.example            # Variables de entorno
├── package.json            # Dependencias
└── README.md               # Este archivo
```

---

## 🎓 Para aprender más

- [Express.js docs](https://expressjs.com/)
- [MongoDB docs](https://docs.mongodb.com/)
- [React docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Git documentation](https://git-scm.com/doc)

---

## 📞 Soporte

- 💬 [GitHub Discussions](https://github.com/tu-repo/discussions)
- 📧 darkscencia@gmail.com
- 🐛 [GitHub Issues](https://github.com/tu-repo/issues)

---

## 📜 Licencia

ISC — Copyright © 2024 Rodrigo

---

**Última actualización:** Enero 2024

Haz actualizado la documentación? Abre un PR para mejorarla.

