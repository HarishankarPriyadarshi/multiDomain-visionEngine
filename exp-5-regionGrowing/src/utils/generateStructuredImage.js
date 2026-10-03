const clamp = (value) => Math.max(0, Math.min(255, value));

const ALPHABETS = {
  A: [
    "00110000",
    "01101000",
    "11001100",
    "11001100",
    "11111100",
    "11001100",
    "11001100",
    "11001100",
  ],

  B: [
    "11111000",
    "11001100",
    "11001100",
    "11111000",
    "11001100",
    "11001100",
    "11001100",
    "11111000",
  ],

  C: [
    "01111100",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
    "01111100",
  ],

  D: [
    "11111000",
    "11001100",
    "11000110",
    "11000110",
    "11000110",
    "11000110",
    "11001100",
    "11111000",
  ],

  E: [
    "11111110",
    "11000000",
    "11000000",
    "11111100",
    "11000000",
    "11000000",
    "11000000",
    "11111110",
  ],

  F: [
    "11111110",
    "11000000",
    "11000000",
    "11111100",
    "11000000",
    "11000000",
    "11000000",
    "11000000",
  ],

  G: [
    "01111100",
    "11000000",
    "11000000",
    "11011110",
    "11000110",
    "11000110",
    "11000110",
    "01111100",
  ],

  H: [
    "11000110",
    "11000110",
    "11000110",
    "11111110",
    "11000110",
    "11000110",
    "11000110",
    "11000110",
  ],
};

export function generateStructuredImage(size) {
  const letters = Object.keys(ALPHABETS);

  const selectedLetter =
    letters[Math.floor(Math.random() * letters.length)];

  const pattern = ALPHABETS[selectedLetter];

  const backgroundIntensity = 40;
  const letterIntensity = 190;

  const image = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      // Map target size to 8x8 alphabet pattern
      const sourceRow = Math.floor((row / size) * 8);
      const sourceCol = Math.floor((col / size) * 8);

      const isLetter = pattern[sourceRow][sourceCol] === "1";

      const baseIntensity = isLetter
        ? letterIntensity
        : backgroundIntensity;

      // Small variation so pixels are not perfectly identical
      const noise = Math.round((Math.random() - 0.5) * 8);

      return clamp(baseIntensity + noise);
    }),
  );

  return image;
}