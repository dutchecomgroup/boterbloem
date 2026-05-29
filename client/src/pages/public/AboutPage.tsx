import { usePublicSettings } from "../../hooks/usePublicSettings";

export default function AboutPage() {
  const { data } = usePublicSettings();
  const about = data?.about;
  return (
    <section className="container-narrow py-20">
      <div className="text-xs uppercase tracking-[0.3em] text-gold-dark mb-3">Over</div>
      <h1 className="text-5xl md:text-6xl mb-8">{about?.heading ?? "Over Atelier Boterbloem"}</h1>
      {about?.imageFilename && (
        <img
          src={`/uploads/gallery/${about.imageFilename}`}
          alt=""
          className="w-full rounded-lg my-10 shadow-sm"
        />
      )}
      <div className="prose-lg text-charcoal/80 leading-relaxed whitespace-pre-line text-lg">
        {about?.body ||
          "Vanuit liefde voor het ambacht maken wij elke taart met de hand. Ieder ontwerp wordt persoonlijk afgestemd op jouw verhaal — van de eerste schets tot het laatste suikerbloemetje."}
      </div>
    </section>
  );
}
