import { km, KM_TO_M } from "../utils/orbitalMath";

type CelestialObject = "mun";

export interface CelestialObjectInfo {
    name: CelestialObject;
    displayName: string;
    radius: km;
    sphereOfInfluence: km;
    textures: {
        diffuse: () => Promise<string>;
        specular: () => Promise<string>;
    };
}

export const celestialObjects: Record<CelestialObject, CelestialObjectInfo> = {
    mun: {
        name: "mun",
        displayName: "Mun",
        radius: 200,
        sphereOfInfluence: 2429559.1 / KM_TO_M,
        textures: {
            diffuse: () =>
                import("../../assets/mun_diffuse.png").then((m) => m.default),
            specular: () =>
                import("../../assets/mun_specular.png").then((m) => m.default),
        },
    },
};
