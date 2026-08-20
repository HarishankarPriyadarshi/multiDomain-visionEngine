export const keyOf = (row, col) => `${row}-${col}`

export const getNeighbours = (row, col, size, connectivity) => {
  const directions = connectivity === 8
    ? [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
    : [[-1, 0], [0, -1], [0, 1], [1, 0]]
  return directions
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(({ row: r, col: c }) => r >= 0 && r < size && c >= 0 && c < size)
}

export const coordinate = (pixel) => pixel ? `(${pixel.row + 1}, ${pixel.col + 1})` : '—'
