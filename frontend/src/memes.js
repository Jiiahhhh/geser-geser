// Hardcoded meme pool — swap these URLs for real memes before going live.
// Using picsum.photos for reliable loading during development.
export const MEMES = [
  { id:  1, url: 'https://picsum.photos/seed/geser1/400/520',  alt: 'Meme 1' },
  { id:  2, url: 'https://picsum.photos/seed/geser2/400/520',  alt: 'Meme 2' },
  { id:  3, url: 'https://picsum.photos/seed/geser3/400/520',  alt: 'Meme 3' },
  { id:  4, url: 'https://picsum.photos/seed/geser4/400/520',  alt: 'Meme 4' },
  { id:  5, url: 'https://picsum.photos/seed/geser5/400/520',  alt: 'Meme 5' },
  { id:  6, url: 'https://picsum.photos/seed/geser6/400/520',  alt: 'Meme 6' },
  { id:  7, url: 'https://picsum.photos/seed/geser7/400/520',  alt: 'Meme 7' },
  { id:  8, url: 'https://picsum.photos/seed/geser8/400/520',  alt: 'Meme 8' },
  { id:  9, url: 'https://picsum.photos/seed/geser9/400/520',  alt: 'Meme 9' },
  { id: 10, url: 'https://picsum.photos/seed/geser10/400/520', alt: 'Meme 10' },
  { id: 11, url: 'https://picsum.photos/seed/geser11/400/520', alt: 'Meme 11' },
  { id: 12, url: 'https://picsum.photos/seed/geser12/400/520', alt: 'Meme 12' },
  { id: 13, url: 'https://picsum.photos/seed/geser13/400/520', alt: 'Meme 13' },
  { id: 14, url: 'https://picsum.photos/seed/geser14/400/520', alt: 'Meme 14' },
  { id: 15, url: 'https://picsum.photos/seed/geser15/400/520', alt: 'Meme 15' },
  { id: 16, url: 'https://picsum.photos/seed/geser16/400/520', alt: 'Meme 16' },
  { id: 17, url: 'https://picsum.photos/seed/geser17/400/520', alt: 'Meme 17' },
  { id: 18, url: 'https://picsum.photos/seed/geser18/400/520', alt: 'Meme 18' },
  { id: 19, url: 'https://picsum.photos/seed/geser19/400/520', alt: 'Meme 19' },
  { id: 20, url: 'https://picsum.photos/seed/geser20/400/520', alt: 'Meme 20' },
];

/** Return a new shuffled copy of the meme array */
export function shuffledMemes() {
  return [...MEMES].sort(() => Math.random() - 0.5);
}
