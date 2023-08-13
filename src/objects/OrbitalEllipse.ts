import { type Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import {
    CreateLines,
    type LinesMesh,
    Observable,
    TransformNode,
    Mesh,
    IInspectable,
    InspectableType,
} from "@babylonjs/core";
import {
    ToDegrees,
    ToRadians,
    sphericalToCartesian,
} from "../utils/trigonometry";
import { orbitalRadius } from "../utils/orbitalMath";

interface OrbitalEllipseMeshOptions {
    /** How many points to create on the orbit. 1 to 360. */
    steps: number;
}

export class OrbitalEllipse extends TransformNode {
    readonly mesh: LinesMesh;
    readonly apoapsisMarker: Mesh;
    readonly periapsisMarker: Mesh;

    private readonly meshOptions: OrbitalEllipseMeshOptions;
    /** Apoapsis as measured from the center of the celestial object (a focal point of the ellipse) */
    private _apoapsis: number;
    /** Periapsis as measured from the center of the celestial object (a focal point of the ellipse) */
    private _periapsis: number;

    /** Apoapsis as measured from the center of the celestial object (a focal point of the ellipse) */
    get apoapsis(): number {
        return this._apoapsis;
    }
    set apoapsis(value: number) {
        this._apoapsis = value;

        this.onApoapsisChange.notifyObservers(this._apoapsis);
    }
    /** Periapsis as measured from the center of the celestial object (a focal point of the ellipse) */
    get periapsis(): number {
        return this._periapsis;
    }
    set periapsis(value: number) {
        this._periapsis = value;
        this.onPeriapsisChange.notifyObservers(this._periapsis);
    }

    get argumentOfPeriapsis(): number {
        return ToDegrees(this.rotation.y);
    }
    set argumentOfPeriapsis(valueDeg: number) {
        this.rotation.y = ToRadians(valueDeg);
    }

    onPeriapsisChange = new Observable<number>();
    onApoapsisChange = new Observable<number>();

    inspectableCustomProperties: IInspectable[] = [
        {
            label: "Apoapsis",
            propertyName: "apoapsis",
            type: InspectableType.String,
        },
        {
            label: "Periapsis",
            propertyName: "periapsis",
            type: InspectableType.String,
        },
        {
            label: "Argument of periapsis",
            propertyName: "argumentOfPeriapsis",
            type: InspectableType.Slider,
            min: 0,
            max: 360,
            step: 1,
        },
    ];

    constructor(
        name: string,
        apoapsis: number,
        periapsis: number,
        argumentOfPeriapsis: number,
        meshOptions: OrbitalEllipseMeshOptions,
        scene: Scene
    ) {
        super(name, scene);
        this._apoapsis = apoapsis;
        this._periapsis = periapsis;
        this.argumentOfPeriapsis = argumentOfPeriapsis;

        this.meshOptions = meshOptions;
        const orbit = this.createMesh();
        this.mesh = orbit;

        this.periapsisMarker = CreateSphere(
            `${this.name}_orbit_periapsis`,
            { diameter: 20 },
            this.getScene()
        );
        this.periapsisMarker.parent = this;
        this.periapsisMarker.position.z = -periapsis;

        this.apoapsisMarker = CreateSphere(
            `${this.name}_orbit_apoapsis`,
            { diameter: 20 },
            this.getScene()
        );
        this.apoapsisMarker.parent = this;
        this.apoapsisMarker.position.z = apoapsis;
    }

    dispose(): void {
        this.onApoapsisChange.clear();
        this.onPeriapsisChange.clear();

        this.apoapsisMarker.dispose();
        this.periapsisMarker.dispose();

        this.mesh.dispose();

        super.dispose();
    }

    private createMesh() {
        const points = this.createMeshPoints();

        const orbit = CreateLines(
            `${this.name}_orbit_line`,
            { points },
            this.getScene()
        );
        orbit.parent = this;

        return orbit;
    }

    private createMeshPoints(): Vector3[] {
        const increment = 360 / this.meshOptions.steps;
        const points: Vector3[] = [];

        for (let deg = 0; deg < 360; deg += increment) {
            points.push(this.createOrbitPoint(deg));
        }

        // close line
        points.push(points[0].clone());

        return points;
    }

    private createOrbitPoint(angleDeg: number) {
        const angleRad = ToRadians(angleDeg);
        const r = orbitalRadius(angleRad, this._apoapsis, this._periapsis);
        const phi = 0;
        const theta = angleRad;
        return sphericalToCartesian(r, phi, theta);
    }
}
