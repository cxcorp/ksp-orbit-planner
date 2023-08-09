import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import sceneModule from "./scenes/defaultWithTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.uniformBuffer";
import { SceneOptimizer, SceneOptimizerOptions } from "@babylonjs/core";

export const babylonInit = async (): Promise<void> => {
    // Get the canvas element
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    // Generate the BABYLON 3D engine
    let engine: Engine;

    const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
    if (webGPUSupported) {
        const webgpu = (engine = new WebGPUEngine(canvas, {
            adaptToDeviceRatio: true,
            antialias: true,
        }));
        await webgpu.initAsync();
        engine = webgpu;
    } else {
        engine = new Engine(canvas, true);
    }

    // Create the scene
    const scene = await sceneModule.createScene(engine, canvas);

    const optimizationOptions = SceneOptimizerOptions.LowDegradationAllowed(30);
    optimizationOptions.trackerDuration = 500;
    SceneOptimizer.OptimizeAsync(scene, optimizationOptions);

    // JUST FOR TESTING. Not needed for anything else
    (window as any).scene = scene;

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
};

babylonInit().then(() => {
    // scene started rendering, everything is initialized
});
