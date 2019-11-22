import { h } from "preact";
import { TableauxState } from "../../../types/tableaux";
import * as style from "./style.css";

interface Props {
    state?: TableauxState;
}

const TableauxView: preact.FunctionalComponent<Props> = ({ state }) => {
    console.log(state);
    return <div class={style.view}>Tableaux View</div>;
};

export default TableauxView;
