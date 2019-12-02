import { h } from "preact";
import * as style from "./style.css";

/**
 * Properties Interface for the Home component
 */
interface Props {}

/*
 * The component displaying the content of the home route
 */
const Home: preact.FunctionalComponent<Props> = () => {
    return (
        <div class={style.home}>
            <div className="card">
                <h3>Wähle ein Kalkül</h3>
                <ul>
                    <li>
                        <a href="/prop-tableaux">Tableaux</a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Home;