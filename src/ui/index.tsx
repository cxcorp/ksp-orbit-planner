import { createRoot } from "react-dom/client";
import Ui from "./Ui";
import { AppState } from "../state";

export const renderUi = (element: Element, appState: AppState) => {
    const root = createRoot(element);
    root.render(<Ui appState={appState} />);
};
