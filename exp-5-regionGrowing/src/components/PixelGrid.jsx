import { keyOf } from "../utils/regionGrowingUtils";

export function PixelGrid({
  image,
  seed,
  process,
  interactive = false,
  onSelect,
  mode = "image",
}) {
  const size = image.length;
  const classesFor = (row, col) => {
    const key = keyOf(row, col);
    const classes = [];
    const isComplete = process.phase === "COMPLETE";

    if (isComplete) {
      if (process.region.has(key)) {
        classes.push("accepted", "region-complete");
        if (row > 0 && process.region.has(keyOf(row - 1, col)))
          classes.push("accepted-neighbor-top");
        if (row < size - 1 && process.region.has(keyOf(row + 1, col)))
          classes.push("accepted-neighbor-bottom");
        if (col > 0 && process.region.has(keyOf(row, col - 1)))
          classes.push("accepted-neighbor-left");
        if (col < size - 1 && process.region.has(keyOf(row, col + 1)))
          classes.push("accepted-neighbor-right");
      }
      return classes.join(" ");
    }

    if (seed && key === keyOf(seed.row, seed.col)) classes.push("seed");
    if (
      process.current &&
      key === keyOf(process.current.row, process.current.col)
    )
      classes.push("current");
    if (
      process.candidate &&
      key === keyOf(process.candidate.row, process.candidate.col)
    )
      classes.push("candidate");
    if (process.region.has(key) && key !== (seed && keyOf(seed.row, seed.col)))
      classes.push("accepted");
    if (process.rejected.has(key)) classes.push("rejected");
    if (
      process.phase === "SHOW_NEIGHBOURS" &&
      process.neighbours.some((n) => n.row === row && n.col === col)
    )
      classes.push("neighbour");
    return classes.join(" ");
  };
  return (
    <div className={`grid-wrap ${mode}`}>
      <div
        className="pixel-grid"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {image.flatMap((line, row) =>
          line.map((value, col) => {
            const isSeed = seed && row === seed.row && col === seed.col;
            return (
              <button
                key={`${row}-${col}`}
                className={`pixel ${classesFor(row, col)}`}
                style={
                  mode === "image"
                    ? {
                        backgroundColor: `rgb(${value}, ${value}, ${value})`,
                        color: value > 150 ? "#18243e" : "#fff",
                      }
                    : undefined
                }
                onClick={() => interactive && onSelect(row, col)}
                disabled={!interactive}
                title={`Row ${row + 1}, Column ${col + 1}: ${value}`}
              >
                {mode === "matrix"
                  ? value
                  : isSeed && process.phase !== "COMPLETE" && (
                      <span className="seed-dot">S</span>
                    )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
