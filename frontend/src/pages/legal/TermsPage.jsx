import LegalLayout from "../../components/legal/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      subtitle="Condiciones generales de uso de la plataforma FC Stats Pro League Manager."
    >
      <Section title="1. Uso de la plataforma">
        <p>
          FC Stats Pro League Manager es una plataforma SaaS destinada a la
          gestión de ligas, torneos y estadísticas deportivas relacionadas con
          videojuegos de fútbol competitivo.
        </p>

        <p>
          El usuario se compromete a utilizar la plataforma de manera legal,
          responsable y respetando las normas de convivencia digital.
        </p>
      </Section>

      <Section title="2. Cuenta de administrador">
        <p>
          Cada administrador es responsable de la seguridad de su cuenta y de
          toda la actividad realizada dentro de ella.
        </p>

        <p>
          FC Stats Pro no se responsabiliza por accesos no autorizados causados
          por negligencia del usuario.
        </p>
      </Section>

      <Section title="3. Contenido generado">
        <p>
          Los torneos, clubes, resultados y estadísticas ingresadas en la
          plataforma pertenecen al administrador que las crea.
        </p>

        <p>
          El usuario es responsable de la veracidad y legitimidad del contenido
          publicado.
        </p>
      </Section>

      <Section title="4. Sistema de IA y OCR">
        <p>
          La plataforma puede utilizar sistemas automatizados de reconocimiento
          de imágenes e inteligencia artificial para procesar capturas de
          partidos.
        </p>

        <p>
          Aunque se busca la mayor precisión posible, FC Stats Pro no garantiza
          exactitud absoluta en resultados extraídos automáticamente.
        </p>
      </Section>

      <Section title="5. Disponibilidad del servicio">
        <p>
          FC Stats Pro puede actualizar, modificar o suspender partes del
          servicio para mejoras técnicas, mantenimiento o seguridad.
        </p>
      </Section>

      <Section title="6. Limitación de responsabilidad">
        <p>
          FC Stats Pro no está afiliado oficialmente con Electronic Arts,
          EA Sports o la franquicia EA SPORTS FC.
        </p>

        <p>
          Todas las marcas mencionadas pertenecen a sus respectivos propietarios.
        </p>
      </Section>

      <Section title="7. Cambios en los términos">
        <p>
          Estos términos pueden actualizarse en cualquier momento para reflejar
          mejoras, cambios legales o nuevas funcionalidades de la plataforma.
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