# 🤝 Guía para contribuidores

¡Gracias por querer contribuir a FC Stats Pro League Manager! Esta guía te ayudará a comenzar.

---

## 🎯 Antes de empezar

- Suscribete a [GitHub](https://github.com) si aún no tienes cuenta
- Fork el repositorio
- Clona tu fork localmente

```bash
git clone https://github.com/tu-usuario/fc-stats-pro.git
cd fc-stats-pro
git remote add upstream https://github.com/original-repo/fc-stats-pro.git
```

---

## 📋 Flujo de contribución

### 1. Crea una rama para tu cambio

```bash
git checkout -b feature/mi-feature
# o
git checkout -b bugfix/mi-bug
```

**Convención de nombres:**
- `feature/`: Nuevas funcionalidades
- `bugfix/`: Arreglos de bugs
- `docs/`: Cambios de documentación
- `refactor/`: Mejoras de código
- `test/`: Nuevos tests

---

### 2. Realiza tus cambios

```bash
# Backend
npm run dev

# Frontend (otra terminal)
cd frontend
npm run dev
```

---

### 3. Escribe o actualiza tests

```bash
# Backend
npm test

# Frontend
cd frontend
npm test
```

---

### 4. Sigue el estilo de código

### Estilo JavaScript

```javascript
// ✅ Bueno
const getUserData = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  return user;
};

// ❌ Evita
var getUserData = function(userId){
  User.findById(userId, function(err, user){
    if(err) return error;
    return user;
  });
};
```

**Reglas:**
- Usa `const`/`let` (no `var`)
- Usa async/await (no callbacks)
- Comillas simples para strings
- 2 espacios de indentación
- Nombres descriptivos en inglés
- Máximo 100 caracteres por línea

### Estilo React

```jsx
// ✅ Bueno
const TournamentCard = ({ tournament, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="tournament-card">
      <h2>{tournament.name}</h2>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Ocultar' : 'Ver'}
      </button>
    </div>
  );
};

export default TournamentCard;

// ❌ Evita
class TournamentCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }
  render() {
    // ...
  }
}
```

**Reglas:**
- Usa functional components
- Hooks para state management
- Props validadas
- Nombres en PascalCase

---

### 5. Commit con mensajes claros

```bash
git add .
git commit -m "feature: agregar editor de torneos con validación"
```

**Formato:**
```
<tipo>: <descripción breve>

<descripción opcional más larga>

- Punto 1
- Punto 2
```

**Tipos permitidos:**
- `feature:` Nueva funcionalidad
- `fix:` Arreglo de bug
- `docs:` Cambios de documentación
- `style:` Formato de código
- `refactor:` Cambios sin afectar funcionalidad
- `test:` Nuevos tests
- `chore:` Cambios de herramientas/deps

**Ejemplos:**
```
feature: agregar importación de partidos por imagen
fix: corregir error en cálculo de tabla
docs: actualizar guía de instalación
style: aplicar prettier a controllers
refactor: extraer lógica de validación a servicio
test: agregar tests para clubMatcher
chore: actualizar mongoose a v8.0
```

---

### 6. Push a tu fork

```bash
git push origin feature/mi-feature
```

---

### 7. Crea un Pull Request

En [GitHub](https://github.com), haz clic en "New Pull Request"

**Rellena el template:**

```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Docs

## Cambios
- Punto 1
- Punto 2

## Testing
Describe cómo probaste esto:
- [ ] Frontend: probé en Chrome/Firefox
- [ ] Backend: ejecuté npm test
- [ ] E2E: completé flujo login → crear torneo

## Checklist
- [ ] Mi código sigue el estilo del proyecto
- [ ] He actualizado la documentación
- [ ] Agregué tests (si es feature o fix)
- [ ] No hay cambios sin revisar

## Screenshots (si es UI)
[Agrega imágenes si es relevante]
```

---

## 🐛 Reporting bugs

Si encuentras un bug, abre un **Issue** con:

```markdown
## Descripción
Qué pasó inesperadamente

## Pasos para reproducir
1. Haz clic en X
2. Ingresa Y
3. Observa Z

## Comportamiento esperado
Qué debería haber pasado

## Comportamiento actual
Qué pasó realmente

## Entorno
- OS: Windows 10 / macOS / Linux
- Node: 18.0.0
- Browser: Chrome 120
- API: http://localhost:3000

## Logs/Screenshots
[Agrega errors o pantallazos]
```

---

## 💡 Solicitando features

Abre un **Issue** con:

```markdown
## Descripción
Qué feature le falta al proyecto

## Caso de uso
Cuándo/por qué necesitarías esto

## Solución propuesta
Cómo crees que debería implementarse

## Alternativas consideradas
Otras opciones que pensaste

## Contexto adicional
Ejemplos, referencias, etc.
```

---

## 🔍 Estándares de código

### Backend (Node.js/Express)

**Estructura de controlador:**
```javascript
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validación
    if (!id) {
      return res.status(400).json({ message: 'ID requerido' });
    }

    // Lógica
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    // Respuesta
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error interno' });
  }
};
```

**Estructura de servicio:**
```javascript
class UserService {
  async getUserById(id) {
    if (!id) throw new Error('ID requerido');
    return await User.findById(id);
  }

  async updateUser(id, updates) {
    // Lógica de actualización
  }
}

module.exports = new UserService();
```

### Frontend (React)

**Estructura de página:**
```jsx
const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const data = await api.tournaments.get(id);
      setTournament(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!tournament) return <NotFound />;

  return (
    <MainLayout>
      <TournamentHeader tournament={tournament} />
      <TournamentStats tournament={tournament} />
    </MainLayout>
  );
};

export default TournamentDetail;
```

---

## 🧪 Testing

### Backend (Ejemplo con Jest)

```javascript
// club.service.test.js
describe('ClubService', () => {
  describe('createClub', () => {
    it('debería crear un club con datos válidos', async () => {
      const data = { tournamentId: '123', name: 'Boca' };
      const result = await ClubService.createClub(data);
      
      expect(result).toHaveProperty('_id');
      expect(result.name).toBe('Boca');
    });

    it('debería rechazar sin tournamentId', async () => {
      const data = { name: 'Boca' };
      
      expect(() => ClubService.createClub(data))
        .rejects.toThrow('tournamentId requerido');
    });
  });
});
```

### Frontend (React Testing Library)

```javascript
// TournamentCard.test.jsx
import { render, screen } from '@testing-library/react';
import TournamentCard from './TournamentCard';

describe('TournamentCard', () => {
  const mockTournament = {
    _id: '123',
    name: 'Liga Test',
    season: 2024
  };

  it('debería renderizar el nombre del torneo', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('Liga Test')).toBeInTheDocument();
  });

  it('debería llamar onSelect al hacer clic', () => {
    const onSelect = jest.fn();
    render(
      <TournamentCard 
        tournament={mockTournament}
        onSelect={onSelect}
      />
    );
    
    screen.getByRole('button').click();
    expect(onSelect).toHaveBeenCalledWith(mockTournament);
  });
});
```

---

## 📚 Documentación

Si modificas funcionalidad:
1. Actualiza comentarios en el código
2. Actualiza [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Actualiza [API.md](./API.md) si hay cambios de endpoints
4. Actualiza [README.md](../README.md) si hay cambios importantes

---

## 🚀 Performance

Antes de hacer PR:

```bash
# Backend
npm run build     # Verificar que compila
npm test          # Pasar todos los tests
npm audit         # Sin vulnerabilidades críticas

# Frontend
cd frontend
npm run build     # Verificar que se construye
npm test          # Pasar todos los tests
# Verificar tamaño de bundle
```

---

## 🔐 Seguridad

Si encuentras una vulnerabilidad:
- **NO** abras un issue público
- Envía email privado a: darkscencia@gmail.com
- Espera respuesta antes de publicar

---

## 📖 Recursos útiles

- [Mongoose docs](https://mongoosejs.com/)
- [Express guide](https://expressjs.com/)
- [React docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Git workflow](https://git-scm.com/book/en/v2)

---

## 💬 Preguntas?

- Abre una [Discussion](https://github.com/tu-repo/discussions)
- Contacta: darkscencia@gmail.com

---

## 🙏 Gracias

Cada contribución, por pequeña que sea, ayuda a mejorar el proyecto. ¡Apreciamos tu tiempo!

