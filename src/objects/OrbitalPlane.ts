import { type Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core";
import { ToDegrees, ToRadians } from "../utils/trigonometry";

export class OrbitalPlane extends TransformNode {
    constructor(
        name: string,
        inclination = 0,
        ascendingNodeLongitude = 0,
        scene: Scene
    ) {
        super(name, scene);
        this.inclination = inclination;
        this.ascendingNodeLongitude = ascendingNodeLongitude;
    }

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
}
