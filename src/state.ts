import { Observable, Scene } from "@babylonjs/core";
import { Orbit } from "./objects/Orbit";

export class AppState {
    readonly orbits: Orbit[] = [];
    readonly onOrbitAdded = new Observable<Orbit>();
    readonly onOrbitRemoved = new Observable<Orbit>();

    scene: Scene | null = null;

    addOrbit = (orbit: Orbit) => {
        if (!this.scene) return;

        this.orbits.push(orbit);
        this.onOrbitAdded.notifyObservers(orbit);
    };
}
