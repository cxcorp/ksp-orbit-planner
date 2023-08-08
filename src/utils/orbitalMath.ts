export const orbitalRadius = (
    angleRad: number,
    apoapsis: number,
    periapsis: number
) =>
    2 *
    ((apoapsis * periapsis) /
        (apoapsis + periapsis - (apoapsis - periapsis) * Math.cos(angleRad)));
