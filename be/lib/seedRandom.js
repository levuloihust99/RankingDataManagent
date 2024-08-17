import seedrandom from "seedrandom"

export function getRNG(seed) {
    const rng = seedrandom(seed)
    return rng
}
