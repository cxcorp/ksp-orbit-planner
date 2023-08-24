import { Mesh, Scene } from "@babylonjs/core";
import { OrbitalEllipse } from "./OrbitalEllipse";
import { OrbitalPlane } from "./OrbitalPlane";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "@babylonjs/gui";

interface OrbitParameters {
    apoapsis: number;
    periapsis: number;
    argumentOfPeriapsis: number;
    inclination: number;
    ascendingNodeLongitude: number;
}

export class Orbit {
    plane: OrbitalPlane;
    ellipse: OrbitalEllipse;
    gui: AdvancedDynamicTexture;

    private periapsisText: Rectangle;
    private apoapsisText: Rectangle;
    private _showApsisMarkers = true;

    set showApsisMarkers(value: boolean) {
        this._showApsisMarkers = value;
        this.periapsisText.isVisible = value;
        this.apoapsisText.isVisible = value;
    }

    get showApsisMarkers(): boolean {
        return this._showApsisMarkers;
    }

    constructor(
        name: string,
        {
            apoapsis,
            periapsis,
            argumentOfPeriapsis,
            inclination,
            ascendingNodeLongitude,
        }: OrbitParameters,
        gui: AdvancedDynamicTexture,
        scene: Scene
    ) {
        this.gui = gui;
        this.plane = new OrbitalPlane(
            `${name}_plane`,
            inclination,
            ascendingNodeLongitude,
            scene
        );
        this.ellipse = new OrbitalEllipse(
            `${name}_ellipse`,
            apoapsis,
            periapsis,
            argumentOfPeriapsis,
            { steps: 180 },
            scene
        );

        this.ellipse.parent = this.plane;

        this.apoapsisText = this.createApsisGuiText(
            "Pe",
            this.ellipse.periapsisMarker
        );
        this.periapsisText = this.createApsisGuiText(
            "Ap",
            this.ellipse.apoapsisMarker
        );
    }

    createApsisGuiText = (text: string, mesh: Mesh): Rectangle => {
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

        this.gui.addControl(rect);
        rect.linkWithMesh(mesh);
        rect.linkOffsetYInPixels = 12 / 2;

        return rect;
    };

    dispose = () => {
        this.periapsisText.dispose();
        this.apoapsisText.dispose();
        this.ellipse.dispose();
        this.plane.dispose();
    };
}
