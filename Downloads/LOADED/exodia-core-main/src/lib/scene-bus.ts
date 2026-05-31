// Shared imperative API for the 3D Earth scene.
// The EarthScene component registers handlers; the terminal dispatches actions.

export type SceneAction =
  | { type: "rotate"; speed: number }
  | { type: "marker"; lat: number; lng: number; label: string; color?: string }
  | { type: "focus"; lat: number; lng: number }
  | { type: "layer"; mode: "day" | "night" | "wireframe" }
  | { type: "satellite"; name: string }
  | { type: "clear" }
  | { type: "zoom"; distance: number };

export type SceneHandler = (action: SceneAction) => void;

let handler: SceneHandler | null = null;

export function registerScene(h: SceneHandler) {
  handler = h;
  return () => {
    if (handler === h) handler = null;
  };
}

export function dispatchScene(action: SceneAction) {
  handler?.(action);
}
