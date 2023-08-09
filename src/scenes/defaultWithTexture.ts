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
    CreatePlane,
    CubeTexture,
    HemisphericLight,
    type Mesh,
    TransformNode,
} from "@babylonjs/core";
import { ToRadians } from "../utils/trigonometry";
import { OrbitalEllipse } from "../objects/OrbitalEllipse";
import { OrbitalPlane } from "../objects/OrbitalPlane";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";

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
        camera.radius = celestialInfo.radius * 1.2;
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
            const orbitalPlane = new OrbitalPlane(`orbit1`, 45, 0, scene);
            const orbit = new OrbitalEllipse(
                `orbit1__orbit`,
                300,
                30,
                { steps: 360 / 2 },
                scene
            );
            orbit.parent = orbitalPlane;
            const orbitalDebugPlane = CreatePlane(
                "orbit1__debug_plane",
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

            orbitalDebugPlane.rotation.x = ToRadians(90);
            orbitalDebugPlane.parent = orbitalPlane;

            const ui = AdvancedDynamicTexture.CreateFullscreenUI("ui");

            const makeTextBlockOn = (text: string, mesh: Mesh) => {
                const rect = new Rectangle();
                rect.width = "12px";
                rect.height = "12px";
                rect.cornerRadius = 1;
                rect.background = "blue";
                rect.color = "transparent";

                const label = new TextBlock();
                label.text = text;
                label.color = "#fff";
                label.fontFamily = "Arial";
                label.fontSizeInPixels = 9;
                rect.addControl(label);

                ui.addControl(rect);
                rect.linkWithMesh(mesh);
                rect.linkOffsetYInPixels = 12 / 2;
            };

            makeTextBlockOn("Pe", orbit.periapsisMarker);
            makeTextBlockOn("Ap", orbit.apoapsisMarker);
        }

        addSkybox(Math.hypot(CAMERA_MAX_Z, CAMERA_MAX_Z) - 1, scene);

        return scene;
    };
}

export default new DefaultSceneWithTexture();
