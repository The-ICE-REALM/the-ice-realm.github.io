/**
 * Scrolls to a page section (instantly when the player prefers reduced motion)
 * and moves keyboard focus to the section's heading so the next Tab starts there.
 */
export function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (!section) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  section.querySelector<HTMLElement>("[data-section-heading]")?.focus({ preventScroll: true });
}
