# Changelog

Todos los cambios notables en FC Stats Pro League Manager se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] — 2024-01-20

Primer release estable de FC Stats Pro League Manager.

### Added
- ✅ Autenticación con JWT
- ✅ CRUD completo de torneos (ligas, copas, mixto)
- ✅ Gestión de clubes con logos
- ✅ Registro manual de partidos
- ✅ Importación automática de partidos por imagen (OCR)
- ✅ Cálculo dinámico de tablas de posiciones
- ✅ Generación automática de brackets
- ✅ Página pública compartible para cada torneo
- ✅ Open Graph tags para compartir en redes
- ✅ Rate limiting y seguridad (Helmet)
- ✅ API REST documentada
- ✅ Frontend responsivo con React + Tailwind
- ✅ Componentes de UI modernos (Modal, Card, etc)
- ✅ Loader inteligente para procesamiento IA
- ✅ Soporte para Azure Computer Vision OCR
- ✅ Validación con OpenAI GPT-4o-mini
- ✅ Sistema de confianza en datos extraídos

### Security
- [c3799e2](https://github.com/user/repo/commit/c3799e2) Helmet.js para headers HTTP seguros
- [c3799e2](https://github.com/user/repo/commit/c3799e2) Rate limiting en endpoints críticos
- [c3799e2](https://github.com/user/repo/commit/c3799e2) JWT_SECRET obligatorio (32+ caracteres)
- [c3799e2](https://github.com/user/repo/commit/c3799e2) Validación de entrada en todas las rutas
- [c3799e2](https://github.com/user/repo/commit/c3799e2) CORS whitelist por dominio

### Fixed
- [f8f353b](https://github.com/user/repo/commit/f8f353b) Permitir actualización de publicSlug y logo en torneos
- [f8f353b](https://github.com/user/repo/commit/f8f353b) Manejo seguro de errores sin exponer detalles internos

---

## [0.9.0-beta] — 2024-01-15

Beta pública para testing.

### Added
- 🎯 Beta release con funcionalidades principales
- 🧪 Testing manual completado
- 📱 Responsive design validado en móvil

### Known Issues
- OCR ocasionalmente falla con marcadores muy rotados (90°+)
- Algunas imágenes de baja resolución no se procesan bien
- Página pública sin webhooks para actualizaciones en tiempo real

---

## [0.5.0-alpha] — 2024-01-01

Alpha interna para desarrollo.

### Added
- Backend básico con Express
- MongoDB conexión y modelos
- Autenticación JWT
- CRUD de torneos
- OCR con Azure Vision

---

## Próximos releases

### [1.1.0] — Planeado
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Estadísticas avanzadas por jugador
- [ ] Sistema de chat entre administradores
- [ ] QR para compartir resultados
- [ ] Exportar estadísticas a PDF/Excel
- [ ] Integración con WhatsApp/Telegram

### [2.0.0] — Planeado
- [ ] App móvil nativa (React Native)
- [ ] Análisis de desempeño con IA
- [ ] Predicciones de resultados
- [ ] Sistema de ranking global
- [ ] Monetización (planes premium)

---

## Notas sobre versioning

Este proyecto sigue Semantic Versioning:
- **MAJOR** (1.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.1.0): Nuevas funcionalidades retrocompatibles
- **PATCH** (0.0.1): Bugfixes

El formato de versión es: **vMAJOR.MINOR.PATCH**

Ejemplo:
- `v1.0.0` → Release estable
- `v1.0.0-beta` → Pre-release
- `v1.0.0-rc.1` → Release candidate

