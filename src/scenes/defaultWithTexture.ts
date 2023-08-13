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
    CubeTexture,
    HemisphericLight,
    Mesh,
    TransformNode,
    GizmoManager,
    Material,
    CreateCylinder,
    DirectionalLight,
    UtilityLayerRenderer,
    AxisDragGizmo,
    Curve3,
    MeshBuilder,
} from "@babylonjs/core";
import { OrbitalEllipse } from "../objects/OrbitalEllipse";
import { OrbitalPlane } from "../objects/OrbitalPlane";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";
import {
    CelestialObjectInfo,
    celestialObjects,
} from "../objects/CelestialObjects";
import {
    fromKspApsis,
    getApoapsisAndPeriapsis,
    type km,
} from "../utils/orbitalMath";
import { ToRadians, sphericalToCartesian } from "../utils/trigonometry";
import { TEST_KSP_ORBITS, parseKspOrbit } from "../utils/ksp";

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
        camera.speed = 20;
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
        camera.upperRadiusLimit = celestialInfo.sphereOfInfluence * 3;
        camera.radius = celestialInfo.sphereOfInfluence;
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

        makeSphereOfInfluenceCircle(celestialInfo, scene);

        const ui = AdvancedDynamicTexture.CreateFullscreenUI(
            "ui",
            true,
            scene,
            Texture.BILINEAR_SAMPLINGMODE,
            true
        );
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

        // const gizmoManager = new GizmoManager(scene);
        // gizmoManager.usePointerToAttachGizmos = false;
        // // gizmoManager.positionGizmoEnabled = true;
        // gizmoManager.rotationGizmoEnabled = true;
        // const { utilityLayerScene } = gizmoManager.utilityLayer;
        const utilityLayer = new UtilityLayerRenderer(scene);
        const { utilityLayerScene } = utilityLayer;
        new HemisphericLight("direct", new Vector3(0, 0, 1), utilityLayerScene);
        new HemisphericLight(
            "direct",
            new Vector3(0, 0, -1),
            utilityLayerScene
        );

        // const orbits = makeOrbits(celestialInfo, scene);
        const orbits = makeKspOrbits(scene);
        for (const { orbit, plane } of orbits) {
            makeTextBlockOn("Pe", orbit.periapsisMarker);
            makeTextBlockOn("Ap", orbit.apoapsisMarker);
        }

        // gizmoManager.attachToMesh(orbits[0].orbit.periapsisMarker);

        // const gizmoMaterial = new StandardMaterial("", utilityLayerScene);
        // gizmoMaterial.diffuseColor = Color3.Red().scale(0.5);
        // gizmoMaterial.specularColor = gizmoMaterial.diffuseColor.subtract(
        //     new Color3(0.1, 0.1, 0.1)
        // );

        // const arrow = CreateArrow(utilityLayerScene, gizmoMaterial);
        // arrow.scaling.scaleInPlace(0.5);
        // arrow.rotation.x = ToRadians(90);
        const gizmoY = new AxisDragGizmo(
            new Vector3(0, 1, 0),
            Color3.Green().scale(0.5),
            utilityLayer
        );

        gizmoY.attachedMesh = orbits[0].orbit.periapsisMarker;
        gizmoY.updateGizmoPositionToMatchAttachedMesh = true;
        // gizmoManager.gizmos.rotationGizmo?.xGizmo.setCustomMesh(arrow!);
        // gizmoManager.gizmos.rotationGizmo?.xGizmo.dragBehavior.onDragObservable

        addSkybox(Math.hypot(CAMERA_MAX_Z, CAMERA_MAX_Z) * 0.95, scene);

        return scene;
    };
}

const makeSphereOfInfluenceCircle = (
    orbitalInfo: CelestialObjectInfo,
    scene: Scene
) => {
    const { sphereOfInfluence } = orbitalInfo;

    const arc = Curve3.ArcThru3Points(
        new Vector3(sphereOfInfluence, 0, 0),
        new Vector3(-sphereOfInfluence, 0, 0),
        new Vector3(0, 0, sphereOfInfluence),
        64,
        false,
        true
    );
    const mat = new StandardMaterial("soi_circle", scene);
    mat.diffuseColor = Color3.Red();
    return MeshBuilder.CreateDashedLines(
        `${orbitalInfo.name}_soi_circle`,
        {
            points: arc.getPoints(),
            dashSize: 30,
            gapSize: 50,
            material: mat,
        },
        scene
    );
};

const makeKspOrbits = (scene: Scene) => {
    const infos = TEST_KSP_ORBITS.split("\n\n").map((l) =>
        parseKspOrbit(l.trim())
    );

    let i = 0;
    const output: Array<{ plane: OrbitalPlane; orbit: OrbitalEllipse }> = [];

    for (const {
        SMA: semiMajorAxis,
        ECC: eccentricity,
        INC: inclination,
        LPE: argPE,
        LAN: longitudeOfAN,
        MNA,
        EPH,
        REF,
    } of infos) {
        const { apoapsis, periapsis } = getApoapsisAndPeriapsis(
            eccentricity,
            semiMajorAxis
        );

        const plane = new OrbitalPlane(
            `${i}_plane`,
            inclination,
            longitudeOfAN,
            scene
        );
        const orbit = new OrbitalEllipse(
            `${i}_orbit`,
            apoapsis / 1000,
            periapsis / 1000,
            argPE,
            { steps: 180 },
            scene
        );
        orbit.parent = plane;

        output.push({ orbit, plane });
        i++;
    }

    return output;
};

export default new DefaultSceneWithTexture();
