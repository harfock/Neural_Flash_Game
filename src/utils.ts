export const PALETTE = [
  "#00FFFF", // Bright Cyan
  "#FFFF00", // Vibrant Yellow
  "#00FF00", // Lime Green
  "#FF00FF", // Bright Magenta
  "#FF5500", // Tangerine Orange
  "#FFFFFF", // Stark White
  "#0088FF", // Neon Blue
  "#FFFFAA", // Soft Cream
  "#FFBB00", // Dark Gold
  "#D0A0FF", // Vivid Lavender
  "#FF3366", // Coral Pink
  "#A0FFFF", // Ice Sky
];

export const EMOJIS = [
  "🍎", "🍌", "🍉", "🍇", "🍒", "🍍", "🍊", "🍓", "🥝", "🥑",
  "🌽", "🥕", "🍕", "🍔", "🍟", "🍩", "🧁", "🍪", "🍦", "🍭",
  "🎈", "🌟", "🔥", "☀️", "🍀", "🔔", "🏆", "🎁", "🚗", "✈️",
  "⚽", "🎸", "🐶", "🐱", "🐻", "🦁", "🐸", "🦉", "🦋", "🐠"
];

export function getLetterLabel(index: number): string {
  let temp = index;
  let label = "";
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
}

/**
 * Assigns colors to cells ensuring no adjacent cell (top, left, diagonals) has the same color.
 * Guaranteed high contrast for the grid.
 */
export function assignAlternatingColors(count: number, numCols: number): string[] {
  const assignedColors: string[] = [];
  
  for (let idx = 0; idx < count; idx++) {
    const row = Math.floor(idx / numCols);
    const col = idx % numCols;
    
    const topIdx = (row - 1) * numCols + col;
    const leftIdx = row * numCols + (col - 1);
    const topLeftIdx = (row - 1) * numCols + (col - 1);
    const topRightIdx = (row - 1) * numCols + (col + 1);
    
    const forbidden: string[] = [];
    if (row > 0 && assignedColors[topIdx]) forbidden.push(assignedColors[topIdx]);
    if (col > 0 && assignedColors[leftIdx]) forbidden.push(assignedColors[leftIdx]);
    if (row > 0 && col > 0 && assignedColors[topLeftIdx]) forbidden.push(assignedColors[topLeftIdx]);
    if (row > 0 && col < numCols - 1 && assignedColors[topRightIdx]) forbidden.push(assignedColors[topRightIdx]);
    
    // Find options that are not forbidden
    const options = PALETTE.filter(c => !forbidden.includes(c));
    if (options.length > 0) {
      // Pick a random comfortable option
      assignedColors.push(options[Math.floor(Math.random() * options.length)]);
    } else {
      // Direct fall back if constrained
      assignedColors.push(PALETTE[idx % PALETTE.length]);
    }
  }
  
  return assignedColors;
}
