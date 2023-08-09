import { type Scene } from "@babylonjs/core/scene";
import {
    CreatePlane,
    type Mesh,
    TransformNode,
    StandardMaterial,
    Color3,
    type IInspectable,
    InspectableType,
} from "@babylonjs/core";
import { ToDegrees, ToRadians } from "../utils/trigonometry";

export class OrbitalPlane extends TransformNode {
    private debugPlane: Mesh;

    /**
     * The orbital inclination in degrees.
     */
    get inclination(): number {
        return ToDegrees(this.rotation.x);
    }
    set inclination(value: number) {
        this.rotation.x = ToRadians(value);
    }

    get ascendingNodeLongitude() {
        return ToDegrees(this.rotation.z);
    }
    set ascendingNodeLongitude(value: number) {
        this.rotation.z = ToRadians(value);
    }

    get debugPlaneEnabled(): boolean {
        return this.debugPlane.isEnabled(false);
    }
    set debugPlaneEnabled(enabled: boolean) {
        this.debugPlane.setEnabled(enabled);
    }

    inspectableCustomProperties: IInspectable[] = [
        {
            label: "Show debug plane",
            propertyName: "debugPlaneEnabled",
            type: InspectableType.Checkbox,
        },
    ];

    constructor(
        name: string,
        inclination = 0,
        ascendingNodeLongitude = 0,
        scene: Scene
    ) {
        super(name, scene);
        this.inclination = inclination;
        this.ascendingNodeLongitude = ascendingNodeLongitude;

        this.debugPlane = this.makeDebugPlane();
        this.debugPlane.setEnabled(false);
    }

    private makeDebugPlane() {
        const plane = CreatePlane(
            `${this.name}_debug_plane`,
            {
                width: 1000,
                height: 1000,
            },
            this.getScene()
        );
        plane.material = this.makeDebugMaterial();
        plane.rotation.x = ToRadians(90);
        plane.parent = this;
        return plane;
    }

    private makeDebugMaterial() {
        const material = new StandardMaterial("debug_plane", this.getScene());
        material.diffuseColor = new Color3(0, 30, 200);
        material.alpha = 0.2;
        return material;
    }
}
