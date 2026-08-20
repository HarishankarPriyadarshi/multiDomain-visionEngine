const clamp = (value) => Math.max(0, Math.min(255, value))

// Produces organic, connected intensity fields instead of independent random pixels.
export function generateStructuredImage(size) {
  const profiles = size === 8
    ? [
        { x: 1.2, y: 1.4, intensity: 42 },
        { x: 5.7, y: 1.7, intensity: 122 },
        { x: 2.1, y: 5.9, intensity: 198 },
        { x: 6.2, y: 5.5, intensity: 82 },
      ]
    : [
        { x: 2.6, y: 2.8, intensity: 43 },
        { x: 11.5, y: 2.5, intensity: 126 },
        { x: 4.1, y: 11.7, intensity: 202 },
        { x: 12.2, y: 11.5, intensity: 81 },
      ]
  const jitter = profiles.map(() => Math.round((Math.random() - 0.5) * 10))
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      const nearest = profiles
        .map((profile, index) => ({ profile, index, distance: Math.hypot(col - profile.x, row - profile.y) }))
        .sort((a, b) => a.distance - b.distance)[0]
      // Smooth positional variation makes each region look natural while preserving clear similarity.
      const wave = Math.round(6 * Math.sin((row + 1) * 1.7 + nearest.index) + 4 * Math.cos((col + 1) * 1.3))
      return clamp(nearest.profile.intensity + jitter[nearest.index] + wave)
    }),
  )
}
