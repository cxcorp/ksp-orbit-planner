import { type Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import {
    CreateLines,
    type LinesMesh,
    Observable,
    TransformNode,
    Mesh,
} from "@babylonjs/core";
import { ToRadians, sphericalToCartesian } from "../utils/trigonometry";
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

    onPeriapsisChange = new Observable<number>();
    onApoapsisChange = new Observable<number>();

    constructor(
        name: string,
        apoapsis: number,
        periapsis: number,
        meshOptions: OrbitalEllipseMeshOptions,
        scene: Scene
    ) {
        super(name, scene);
        this._apoapsis = apoapsis;
        this._periapsis = periapsis;

        this.meshOptions = meshOptions;
        const { orbit, start, halfway } = this.createMesh();
        this.mesh = orbit;

        this.periapsisMarker = halfway;
        this.apoapsisMarker = start;
    }

    private createMesh() {
        const { points, startPoint, halfwayPoint } = this.createMeshPoints();

        const orbit = CreateLines(
            `${this.name}_orbit_line`,
            { points },
            this.getScene()
        );
        orbit.parent = this;

        const start = CreateSphere(
            `${this.name}_orbit_start`,
            { diameter: 5 },
            this.getScene()
        );
        start.parent = this;
        start.position = startPoint;

        const halfway = CreateSphere(
            `${this.name}_orbit_halfway`,
            { diameter: 1 },
            this.getScene()
        );
        halfway.parent = this;
        halfway.position = halfwayPoint;

        return {
            orbit,
            start,
            halfway,
        };
    }

    private createMeshPoints(): {
        points: Vector3[];
        startPoint: Vector3;
        halfwayPoint: Vector3;
    } {
        const increment = 360 / this.meshOptions.steps;
        const points: Vector3[] = [];

        const zeroDegPoint: Vector3 = this.createOrbitPoint(0);
        points.push(zeroDegPoint);

        let deg = increment;
        for (; deg < 180; deg += increment) {
            points.push(this.createOrbitPoint(deg));
        }

        const halfwayPoint: Vector3 = this.createOrbitPoint(180);
        points.push(halfwayPoint);
        if (deg === 180) {
            // just handled
            deg += increment;
        }
        for (; deg < 360; deg += increment) {
            points.push(this.createOrbitPoint(deg));
        }

        // close line
        points.push(points[0].clone());

        return {
            points,
            startPoint: zeroDegPoint,
            halfwayPoint: halfwayPoint,
        };
    }

    private createOrbitPoint(angleDeg: number) {
        const angleRad = ToRadians(angleDeg);
        const r = orbitalRadius(angleRad, this._apoapsis, this._periapsis);
        const phi = 0;
        const theta = angleRad;
        return sphericalToCartesian(r, phi, theta);
    }
}
