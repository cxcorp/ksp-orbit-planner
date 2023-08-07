import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
    Color3,
    CreateBox,
    CreateLines,
    CreatePlane,
    CubeTexture,
    HemisphericLight,
    TransformNode,
} from "@babylonjs/core";
import { map, triangleWave } from "./util";

type CelestialObject = "mun";

type km = number;

interface CelestialObjectInfo {
    name: CelestialObject;
    displayName: string;
    radius: km;
    sphereOfInfluence: km;
    textures: {
        diffuse: () => Promise<string>;
        specular: () => Promise<string>;
    };
}

const KM_TO_M = 1000;

const celestialObjects: Record<CelestialObject, CelestialObjectInfo> = {
    mun: {
        name: "mun",
        displayName: "Mun",
        radius: 10,
        sphereOfInfluence: 2429559.1 / KM_TO_M,
        textures: {
            diffuse: () =>
                import("../../assets/mun_diffuse.png").then((m) => m.default),
            specular: () =>
                import("../../assets/mun_specular.png").then((m) => m.default),
        },
    },
};

const makeCelestialObjectBodyMaterial = async (
    { name, textures }: CelestialObjectInfo,
    scene: Scene
) => {
    const material = new StandardMaterial(`${name}_surface`, scene);
    material.diffuseTexture = new Texture(await textures.diffuse(), scene);
    material.specularTexture = new Texture(await textures.specular(), scene);
    return material;
};

const makeCelestialObjectBody = async (
    { radius, name }: CelestialObjectInfo,
    scene: Scene
) => {
    const diameter = radius * 2;
    const celestialBody = CreateSphere(
        `${name}_body`,
        { diameter, segments: 256, updatable: true },
        scene
    );
    // transform relative to the center of the sphere
    celestialBody.setPivotPoint(new Vector3(0, diameter / 2, 0));
    return celestialBody;
};

const makeCelestialObject = async (info: CelestialObjectInfo, scene: Scene) => {
    const celestialBody = await makeCelestialObjectBody(info, scene);
    celestialBody.material = await makeCelestialObjectBodyMaterial(info, scene);
    return celestialBody;
};

const DEG_TO_RAD = Math.PI / 180.0;

class OrbitalPlane extends TransformNode {
    constructor(
        name: string,
        scene: Scene,
        inclination = 0,
        ascendingNodeLongitude = 0
    ) {
        super(name, scene);

        this.inclination = inclination;
        this.ascendingNodeLongitude = ascendingNodeLongitude;
    }

    /**
     * The orbital inclination in degrees.
     */
    get inclination(): number {
        return this.rotation.x / DEG_TO_RAD;
    }
    set inclination(value: number) {
        this.rotation.x = value * DEG_TO_RAD;
    }

    get ascendingNodeLongitude() {
        return this.rotation.z / DEG_TO_RAD;
    }
    set ascendingNodeLongitude(value: number) {
        this.rotation.z = value * DEG_TO_RAD;
    }
}

const addSkybox = (size: km, scene: Scene) => {
    const skybox = CreateBox("skybox", { size }, scene);
    const skyboxMaterial = new StandardMaterial("skybox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture(
        "/img/deepstarmap/map",
        scene,
        ["_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png"]
    );
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
};

export class DefaultSceneWithTexture {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        const scene = new Scene(engine);

        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then(() => {
            scene.debugLayer.show({
                handleResize: true,
                overlay: true,
                globalRoot: document.getElementById("#root") || undefined,
            });
        });

        const camera = new ArcRotateCamera(
            "my first camera",
            0,
            Math.PI / 3,
            100,
            new Vector3(0, 0, 0),
            scene
        );

        camera.setTarget(Vector3.Zero());
        camera.allowUpsideDown = false;
        camera.inertia = 0;
        const CAMERA_MAX_Z = 10_000_000;
        camera.maxZ = CAMERA_MAX_Z;
        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        const celestialName = "mun";
        const celestialInfo = celestialObjects[celestialName];
        const celestialPlane = new TransformNode(
            `${celestialName}_celestial_plane`,
            scene
        );
        const celestialBody = await makeCelestialObject(celestialInfo, scene);
        celestialBody.parent = celestialPlane;

        // camera.setTarget(celestialBody);
        camera.lowerRadiusLimit = celestialInfo.radius + 5;
        camera.upperRadiusLimit = celestialInfo.sphereOfInfluence * 1.2;
        camera.radius = celestialInfo.sphereOfInfluence / 2;
        camera.wheelDeltaPercentage = 0.05;

        const light = new HemisphericLight(
            "light",
            new Vector3(1, 0, 0),
            scene
        );
        light.intensity = 0.7;

        const skybox = CreateBox("skybox", { size: 7_000_000 }, scene);
        const skyboxMaterial = new StandardMaterial("skybox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture(
            "/img/deepstarmap/map",
            scene,
            ["_px.png", "_py.png", "_pz.png", "_nx.png", "_ny.png", "_nz.png"]
        );
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        {
            const orbitalPlane = new OrbitalPlane("orbit1", scene, 45, 0);

            const orbitalRadius = (
                angleRad: number,
                apoapsis: number,
                periapsis: number
            ) =>
                2 *
                ((apoapsis * periapsis) /
                    (apoapsis +
                        periapsis -
                        (apoapsis - periapsis) * Math.cos(angleRad)));

            /**
             *
             * @param r Radius
             * @param phi φ
             * @param theta θ
             * @returns
             */
            const sphericalCoordsToCartesian = (
                r: number,
                phi: number,
                theta: number
            ): Vector3 => {
                const x = r * Math.cos(phi) * Math.sin(theta);
                const y = r * Math.sin(phi) * Math.sin(theta);
                const z = r * Math.cos(theta);
                return new Vector3(x, y, z);
            };

            const makePoint = (
                angleDeg: number,
                apoapsis: number,
                periapsis: number
            ): Vector3 => {
                const angleRad = (angleDeg * Math.PI) / 180;
                const r = orbitalRadius(angleRad, apoapsis, periapsis);
                const phi = 0;
                const theta = angleRad;
                return sphericalCoordsToCartesian(r, phi, theta);
            };

            // draw thing
            const apoapsis = 30;
            const periapsis = 100;
            const points: Vector3[] = [];

            for (let deg = 0; deg < 360; ) {
                points.push(makePoint(deg, apoapsis, periapsis));

                // render a vertex at 0.25 degree intervals near the apoapsis and periapsis (semi-major axes),
                // and at 0.5 degree intervals near the semi-minor axes since that's squished out
                const degreeIncrement = map(triangleWave(deg), 0, 90, 0.25, 5);
                deg += degreeIncrement;
            }
            // close arc
            points.push(points[0].clone());
            const arcLine = CreateLines("orbit", { points: points }, scene);

            const orbitalDebugPlane = CreatePlane(
                "orbit_debug_plane",
                {
                    width: 150,
                    height: 150,
                },
                scene
            );
            const debugPlaneMaterial = new StandardMaterial(
                "debug_plane",
                scene
            );
            debugPlaneMaterial.diffuseColor = new Color3(0, 30, 200);
            debugPlaneMaterial.backFaceCulling = true;
            debugPlaneMaterial.alpha = 0.2;
            orbitalDebugPlane.material = debugPlaneMaterial;

            orbitalDebugPlane.rotation.x = 90 * DEG_TO_RAD;
            orbitalDebugPlane.parent = orbitalPlane;
            arcLine.parent = orbitalPlane;
        }

        addSkybox(Math.hypot(CAMERA_MAX_Z, CAMERA_MAX_Z) - 1, scene);

        return scene;
    };
}

export default new DefaultSceneWithTexture();
