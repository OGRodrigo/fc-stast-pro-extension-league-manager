import LegalLayout from "../../components/legal/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Información sobre cómo FC Stats Pro League Manager recopila, utiliza y protege los datos de los usuarios."
    >
      <Section title="1. Información recopilada">
        <p>
          FC Stats Pro puede recopilar información proporcionada directamente
          por los usuarios, incluyendo:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>Nombre de administrador</li>
          <li>Correo electrónico</li>
          <li>Información de torneos y clubes</li>
          <li>Resultados y estadísticas deportivas</li>
          <li>Imágenes cargadas para procesamiento OCR</li>
        </ul>
      </Section>

      <Section title="2. Uso de la información">
        <p>
          La información recopilada es utilizada exclusivamente para:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>Gestionar torneos y clubes</li>
          <li>Mostrar estadísticas y tablas</li>
          <li>Procesar imágenes mediante OCR e IA</li>
          <li>Mejorar funcionalidades de la plataforma</li>
          <li>Garantizar seguridad y estabilidad</li>
        </ul>
      </Section>

      <Section title="3. Sistema OCR e inteligencia artificial">
        <p>
          Las imágenes subidas por los usuarios pueden ser procesadas mediante
          servicios externos de reconocimiento óptico y modelos de IA para
          extraer estadísticas automáticamente.
        </p>

        <p>
          FC Stats Pro utiliza estos sistemas únicamente con fines funcionales
          relacionados con la gestión deportiva.
        </p>
      </Section>

      <Section title="4. Seguridad de datos">
        <p>
          Implementamos medidas técnicas y organizativas razonables para proteger
          la información de los usuarios contra accesos no autorizados,
          alteraciones o pérdida de datos.
        </p>

        <p>
          Sin embargo, ningún sistema conectado a internet puede garantizar
          seguridad absoluta.
        </p>
      </Section>

      <Section title="5. Compartición de información">
        <p>
          FC Stats Pro no vende información personal a terceros.
        </p>

        <p>
          Algunos servicios externos utilizados por la plataforma pueden
          procesar información estrictamente necesaria para funciones técnicas,
          como OCR, almacenamiento o autenticación.
        </p>
      </Section>

      <Section title="6. Contenido público">
        <p>
          Los torneos marcados como públicos pueden ser visibles mediante
          enlaces compartidos públicamente.
        </p>

        <p>
          El administrador es responsable del contenido mostrado en páginas
          públicas del torneo.
        </p>
      </Section>

      <Section title="7. Cookies y almacenamiento local">
        <p>
          La plataforma puede utilizar almacenamiento local y tecnologías
          similares para mantener sesiones activas y mejorar la experiencia
          del usuario.
        </p>
      </Section>

      <Section title="8. Cambios en esta política">
        <p>
          Esta política puede actualizarse para reflejar mejoras técnicas,
          cambios legales o nuevas funcionalidades del sistema.
        </p>
      </Section>

      <div
        className="rounded-2xl border px-5 py-4 text-sm"
        style={{
          borderColor: "rgba(36,255,122,.12)",
          background: "rgba(255,255,255,.025)",
          color: "var(--fifa-mute)",
        }}
      >
        Última actualización: 2026
      </div>
    </LegalLayout>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-black uppercase tracking-wide"
        style={{
          fontFamily: "var(--font-title)",
          color: "var(--fifa-neon)",
        }}
      >
        {title}
      </h2>

      <div
        className="space-y-4 text-sm leading-8"
        style={{
          color: "rgba(255,255,255,.82)",
        }}
      >
        {children}
      </div>
    </section>
  );
}