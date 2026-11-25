// Transition « page qui se tourne » : la page pivote légèrement autour de son bord gauche.
export const PAGE_TOURNE = {
  initial: { opacity: 0, rotateY: 22, x: 18, transformPerspective: 1400 },
  animate: { opacity: 1, rotateY: 0, x: 0, transformPerspective: 1400 },
  exit: { opacity: 0, rotateY: -12, x: -10, transformPerspective: 1400 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  style: { transformOrigin: 'left center' },
};
