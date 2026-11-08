import { onMounted, onUnmounted, type Ref } from "vue";

/** Enhance the existing page without changing its content or navigation. */
export function usePageEffects(
  page: Ref<HTMLElement | null>,
  pointerLight: Ref<HTMLElement | null>,
) {
  let cleanup = () => {};

  onMounted(() => {
    const root = page.value;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const revealElements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    let x = 0;
    let y = 0;
    let nextCard: HTMLElement | null = null;
    let activeCard: HTMLElement | null = null;
    let cardBounds: DOMRect | null = null;

    const resetCard = () => {
      if (activeCard) {
        activeCard.style.removeProperty("--tilt-x");
        activeCard.style.removeProperty("--tilt-y");
        activeCard.style.removeProperty("--card-x");
        activeCard.style.removeProperty("--card-y");
        activeCard.removeAttribute("data-tilting");
      }
      activeCard = null;
      cardBounds = null;
    };

    const resetPointer = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      nextCard = null;
      resetCard();
      pointerLight.value?.classList.remove("is-active");
    };

    const paintPointer = () => {
      frame = 0;
      if (pointerLight.value) {
        pointerLight.value.style.transform = `translate3d(${x - 360}px, ${y - 360}px, 0)`;
        pointerLight.value.classList.add("is-active");
      }

      if (nextCard !== activeCard) {
        resetCard();
        activeCard = nextCard;
        // Measure before applying tilt so the moving card cannot move its own origin.
        cardBounds = activeCard?.getBoundingClientRect() ?? null;
      }
      if (!activeCard || !cardBounds) return;
      const localX = Math.max(0, Math.min(cardBounds.width, x - cardBounds.left));
      const localY = Math.max(0, Math.min(cardBounds.height, y - cardBounds.top));
      activeCard.style.setProperty("--card-x", `${localX}px`);
      activeCard.style.setProperty("--card-y", `${localY}px`);
      activeCard.style.setProperty("--tilt-x", `${(0.5 - localY / cardBounds.height) * 7}deg`);
      activeCard.style.setProperty("--tilt-y", `${(localX / cardBounds.width - 0.5) * 7}deg`);
      activeCard.setAttribute("data-tilting", "");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      nextCard = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".project-card")
        : null;
      if (!frame) frame = requestAnimationFrame(paintPointer);
    };

    const reveal = (element: HTMLElement) => {
      element.classList.add("is-revealed");
      observer?.unobserve(element);
    };

    const onFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      // Keyboard navigation must never land inside an invisible section.
      let element = event.target.closest<HTMLElement>("[data-reveal]");
      while (element) {
        reveal(element);
        element = element.parentElement?.closest<HTMLElement>("[data-reveal]") ?? null;
      }
    };

    const syncPreferences = () => {
      resetPointer();
      if (reducedMotion.matches) {
        observer?.disconnect();
        revealElements.forEach(reveal);
      }
    };

    if (!reducedMotion.matches && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target as HTMLElement);
        }
      }, { threshold: 0.08 });
      revealElements.forEach((element) => {
        element.classList.add("reveal-pending");
        observer?.observe(element);
      });
    }

    root.addEventListener("pointermove", onPointerMove, { passive: true });
    root.addEventListener("pointerleave", resetPointer);
    root.addEventListener("focusin", onFocus);
    window.addEventListener("scroll", resetPointer, { passive: true });
    window.addEventListener("resize", resetPointer);
    window.addEventListener("blur", resetPointer);
    reducedMotion.addEventListener("change", syncPreferences);
    finePointer.addEventListener("change", syncPreferences);

    cleanup = () => {
      resetPointer();
      observer?.disconnect();
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", resetPointer);
      root.removeEventListener("focusin", onFocus);
      window.removeEventListener("scroll", resetPointer);
      window.removeEventListener("resize", resetPointer);
      window.removeEventListener("blur", resetPointer);
      reducedMotion.removeEventListener("change", syncPreferences);
      finePointer.removeEventListener("change", syncPreferences);
    };
  });

  onUnmounted(() => cleanup());
}
