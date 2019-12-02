import { Fragment, h } from "preact";
import { useState } from "preact/hooks";
import { AppStateUpdater } from "../../../types/app";
import { TableauxMove, TableauxState } from "../../../types/tableaux";
import * as style from "./style.css";

import ClauseList from "../../../components/clause-list";
import { D3Data } from "../../../components/tableaux/tree";
import TableauxTreeView from "../../../components/tableaux/tree";
import exampleState from "./example";

/**
 * A asynchronous function to send requested move to backend
 * Updates app state with response from backend
 * @param {string} url - The url of the backend endpoint
 * @param {TableauxState} state - The sate containing the clauseSet and nodes
 * @param {TableauxMove} move - The TableauxMove which shall be requested
 * @param {AppStateUpdater} stateChanger - A function to change app state
 * @returns {Promise<void>} - Promise that resolves after the request has been handled
 */
const sendMove = async (
    url: string,
    state: TableauxState,
    move: TableauxMove,
    stateChanger: AppStateUpdater<"prop-tableaux">
) => {
    try {
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain"
            },
            method: "POST",
            body: `move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`
        });
        const parsed = await res.json();

        // TODO: handle errors
        stateChanger("prop-tableaux", parsed);
    } catch (e) {
        console.log(e);
    }
};

/**
 * Wrapper to send close request
 * @param {string} url - URL of the move endpoint for the current calculus
 * @param {TableauxState} state - The current State
 * @param {AppStateUpdater} stateChanger - The state update function
 * @param {number} leaf - The selected leaf
 * @param {number} pred - The selected predecessor
 * @returns {Promise<void>} - Promise that resolves after the request has been handled
 */
const sendClose = (
    url: string,
    state: TableauxState,
    stateChanger: AppStateUpdater<"prop-tableaux">,
    leaf: number,
    pred: number
) => sendMove(url, state, { type: "c", id1: leaf, id2: pred }, stateChanger);

/**
 * Wrapper to send move request
 * @param {string} url - URL of the move endpoint for the current calculus
 * @param {TableauxState} state - The current State
 * @param {AppStateUpdater} stateChanger - The state update function
 * @param {number} leaf - The selected leaf
 * @param {number} clause - The selected clause
 * @returns {Promise<void>} - Promise that resolves after the request has been handled
 */
const sendExtend = (
    url: string,
    state: TableauxState,
    stateChanger: AppStateUpdater<"prop-tableaux">,
    leaf: number,
    clause: number
) => sendMove(url, state, { type: "e", id1: leaf, id2: clause }, stateChanger);

// Properties Interface for the TableauxView component
interface Props {
    server: string;
    state?: TableauxState;
    onChange: AppStateUpdater<"prop-tableaux">;
}

// Component displaying the content of the prop-tableaux route
const TableauxView: preact.FunctionalComponent<Props> = ({
    state,
    server,
    onChange
}) => {
    const [selectedClauseId, setSelectedClauseId] = useState<
        number | undefined
    >(undefined);
    const [selectedNodeId, setSelectedNodeId] = useState<number | undefined>(
        undefined
    );

    const url = `${server}/prop-tableaux/`;
    const moveUrl = url + "move";

    /**
     * The function to call, when the user selects a clause
     * @param {number} newClauseId - The id of the clause, which was clicked on
     * @returns {void}
     */
    const selectClauseCallback = (newClauseId: number) => {
        if (newClauseId === selectedClauseId) {
            // The same clause was selected again => deselect it
            setSelectedClauseId(undefined);
            setSelectedNodeId(undefined);
        } else {
            setSelectedClauseId(newClauseId);

            if (selectedNodeId !== undefined) {
                // The clause and node have been selected => send extend move request to backend
                sendExtend(
                    moveUrl,
                    state!,
                    onChange,
                    selectedNodeId,
                    newClauseId
                );
                setSelectedNodeId(undefined);
                setSelectedClauseId(undefined);
            }
        }
    };

    /**
     * The function to call, when the user selects a node
     * @param {D3Data} newNode - The id of the clause, which was clicked on
     * @returns {void}
     */
    const selectNodeCallback = (newNode: D3Data) => {
        if (newNode.id === selectedNodeId) {
            // The same node was selected again => deselect it
            setSelectedNodeId(undefined);
        } else if (newNode.isLeaf) {
            // If the newly selected node is a leaf => accept new node id
            setSelectedNodeId(newNode.id);

            if (selectedClauseId !== undefined) {
                // The clause and node have been selected => send extend move request to backend
                sendExtend(
                    moveUrl,
                    state!,
                    onChange,
                    newNode.id,
                    selectedClauseId
                );
                setSelectedNodeId(undefined);
                setSelectedClauseId(undefined);
            }
        } else if (selectedNodeId !== undefined) {
            // We already have a leaf node selected => Try close move
            // If we can't do it, let server handle it
            sendClose(moveUrl, state!, onChange, selectedNodeId, newNode.id);
            setSelectedNodeId(undefined);
        }
    };

    if (!state) {
        // return <p>Keine Daten vorhanden</p>;
        // Default state for easy testing
        state = exampleState;
    }

    return (
        <Fragment>
            <h2>Tableaux View</h2>
            <div class={style.view}>
                <ClauseList
                    clauseSet={state.clauseSet}
                    selectedClauseId={selectedClauseId}
                    selectClauseCallback={selectClauseCallback}
                />
                <TableauxTreeView
                    nodes={state.nodes}
                    selectedNodeId={selectedNodeId}
                    selectNodeCallback={selectNodeCallback}
                />
            </div>
        </Fragment>
    );
};

export default TableauxView;