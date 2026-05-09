const ease = [0.25, 0.46, 0.45, 0.94];

export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.30, ease } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease } },
};

export const staggerGrid = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};

export const cardItem = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.34, ease } },
};

export const statItem = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.30, ease } },
};

export const heroItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease } },
};

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.16 } },
  exit:    { opacity: 0, transition: { duration: 0.13 } },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease } },
  exit:    { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15 } },
};
