import { type CelestialObjectInfo } from "../objects/CelestialObjects";

export const orbitalRadius = (
    angleRad: number,
    apoapsis: number,
    periapsis: number
) =>
    2 *
    ((apoapsis * periapsis) /
        (apoapsis + periapsis - (apoapsis - periapsis) * Math.cos(angleRad)));

/**
 * Converts apoapsis/periapsis as measured from the center of an object to KSP apoapsis/periapsis.
 *
 * In KSP, apoapsis and periapsis are shown relative to the celestial object's radius.
 * */
export const toKspApsis = (
    apoapsisOrPeriapsis: number,
    object: CelestialObjectInfo
) => apoapsisOrPeriapsis - object.radius;

export const fromKspApsis = (
    apoapsisOrPeriapsis: number,
    object: CelestialObjectInfo
) => apoapsisOrPeriapsis + object.radius;

export type km = number;

export const KM_TO_M = 1000;

// https://www.planetary.org/articles/3380
// R_a = a(1+e)
// R_p = a(1-e)
export const getApoapsisAndPeriapsis = (
    eccentricity: number,
    semiMajorAxis: number
) => {
    const a = semiMajorAxis;
    const e = eccentricity;
    return {
        apoapsis: a * (1 + e),
        periapsis: a * (1 - e),
    };
};
