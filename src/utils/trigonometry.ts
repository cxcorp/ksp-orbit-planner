import { Vector3 } from "@babylonjs/core";

const DEG_TO_RAD = Math.PI / 180.0;

export const ToRadians = (deg: number): number => deg * DEG_TO_RAD;
export const ToDegrees = (rad: number): number => rad / DEG_TO_RAD;

/**
 * @param r Radius
 * @param phi φ
 * @param theta θ
 * @returns
 */
export const sphericalToCartesian = (
    r: number,
    phi: number,
    theta: number
): Vector3 => {
    const x = r * Math.cos(phi) * Math.sin(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(theta);
    return new Vector3(x, y, z);
};
