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

    private _inclination = 0;
    private _ascendingNodeLongitude = 0;

    /**
     * The orbital inclination in degrees.
     */
    get inclination(): number {
        return ToDegrees(this.rotation.z);
    }
    set inclination(value: number) {
        this._inclination = value;
        this.applyRotation();
    }

    get ascendingNodeLongitude() {
        // This needs to be inverted. I think our spherical->cartesian conversion
        // might be using the wrong coordinate or angle conventions. Anyways
        // this seems to fix it without having to change any other axii.
        return ToDegrees(-this.rotation.y);
    }
    set ascendingNodeLongitude(value: number) {
        this._ascendingNodeLongitude = value;
        this.applyRotation();
    }

    get debugPlaneEnabled(): boolean {
        return this.debugPlane.isEnabled(false);
    }
    set debugPlaneEnabled(enabled: boolean) {
        this.debugPlane.setEnabled(enabled);
    }

    inspectableCustomProperties: IInspectable[] = [
        {
            label: "Inclination",
            propertyName: "inclination",
            type: InspectableType.Slider,
            min: 0,
            max: 180,
            step: 1,
        },
        {
            label: "Longitude of AN",
            propertyName: "ascendingNodeLongitude",
            type: InspectableType.Slider,
            min: 0,
            max: 360,
            step: 1,
        },
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

    dispose() {
        this.debugPlane.dispose();
        super.dispose();
    }

    private applyRotation() {
        this.rotation.y = ToRadians(-this._ascendingNodeLongitude);
        this.rotation.z = ToRadians(this._inclination);
        this.rotation.x = 0;
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
