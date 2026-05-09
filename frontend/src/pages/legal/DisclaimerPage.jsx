import LegalLayout from "../../components/legal/LegalLayout";

export default function DisclaimerPage() {
  return (
    <LegalLayout
      title="Aviso Legal"
      subtitle="Información legal y aclaraciones relacionadas con el uso de FC Stats Pro League Manager."
    >
      <Section title="1. Independencia de marca">
        <p>
          FC Stats Pro League Manager es un proyecto independiente y no está
          afiliado, asociado ni respaldado oficialmente por Electronic Arts,
          EA Sports o la franquicia EA SPORTS FC.
        </p>

        <p>
          Todas las marcas comerciales, nombres y referencias pertenecen a sus
          respectivos propietarios.
        </p>
      </Section>

      <Section title="2. Uso competitivo">
        <p>
          La plataforma está orientada a la organización de torneos y ligas
          competitivas administradas por comunidades, organizadores y jugadores.
        </p>

        <p>
          FC Stats Pro no organiza competiciones oficiales ni representa a
          entidades deportivas profesionales.
        </p>
      </Section>

      <Section title="3. Exactitud de estadísticas">
        <p>
          Aunque la plataforma intenta mantener información precisa, los datos
          ingresados dependen de los administradores y usuarios del sistema.
        </p>

        <p>
          Las estadísticas generadas automáticamente mediante OCR o IA pueden
          contener errores de interpretación.
        </p>
      </Section>

      <Section title="4. Disponibilidad del servicio">
        <p>
          FC Stats Pro puede experimentar interrupciones temporales por
          mantenimiento, mejoras técnicas o factores externos relacionados con
          infraestructura y servicios de terceros.
        </p>
      </Section>

      <Section title="5. Limitación de responsabilidad">
        <p>
          FC Stats Pro no será responsable por pérdidas de datos, interrupciones
          del servicio o daños derivados del uso de la plataforma.
        </p>

        <p>
          El uso del sistema es responsabilidad exclusiva del usuario.
        </p>
      </Section>

      <Section title="6. Servicios externos">
        <p>
          Algunas funcionalidades pueden depender de servicios externos de IA,
          OCR, hosting, almacenamiento o autenticación.
        </p>

        <p>
          La disponibilidad y funcionamiento de dichos servicios puede variar.
        </p>
      </Section>

      <Section title="7. Actualizaciones">
        <p>
          La plataforma puede modificar características, diseño, estructura o
          funcionalidades en cualquier momento para mejorar el producto.
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
        FC Stats Pro League Manager · 2026
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