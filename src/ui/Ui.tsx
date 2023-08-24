import { Orbit } from "../objects/Orbit";
import { AppState } from "../state";
import "./ui.css";

const Orbits = ({ orbits }: { orbits: Orbit[] }) => {
    return <p></p>;
};

interface UiProps {
    appState: AppState;
}

const Ui = ({ appState }: { appState: AppState }) => {
    return (
        <div className="ui">
            <p>Orbits</p>
        </div>
    );
};

export default Ui;
