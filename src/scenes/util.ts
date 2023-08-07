const clamp = (input: number, min: number, max: number): number =>
    input < min ? min : input > max ? max : input;

export const map = (
    current: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
): number => {
    const mapped: number =
        ((current - in_min) * (out_max - out_min)) / (in_max - in_min) +
        out_min;
    return clamp(mapped, out_min, out_max);
};

/** an oscillating triangle wave that goes like (0, 90), (45, 45) (90, 0), (135, 45) (180, 90), (225, 45) (270, 0) */
export const triangleWave = (x: number) => Math.abs(((x - 90) % 180) - 90);
