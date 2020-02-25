import { Fragment, h } from "preact";
import { useEffect, useState } from "preact/hooks";
import {Calculus, TableauxCalculusType} from "../../../types/app";
import {
    instanceOfFOTabState,
    instanceOfPropTabState,
    SelectNodeOptions,
    TableauxTreeLayoutNode,
    VarAssign
} from "../../../types/tableaux";
import * as style from "./style.scss";

import ControlFAB from "../../../components/control-fab";
import Dialog from "../../../components/dialog";
import FAB from "../../../components/fab";
import AddIcon from "../../../components/icons/add";
import CenterIcon from "../../../components/icons/center";
import CheckCircleIcon from "../../../components/icons/check-circle";
import ExploreIcon from "../../../components/icons/explore";
import LemmaIcon from "../../../components/icons/lemma";
import UndoIcon from "../../../components/icons/undo";
import OptionList from "../../../components/input/option-list";
import VarAssignList from "../../../components/input/var-assign-list";
import TableauxTreeView from "../../../components/tableaux/tree";
import { checkClose } from "../../../helpers/api";
import { useAppState } from "../../../helpers/app-state";
import { clauseSetToStringArray } from "../../../helpers/clause";
import {
    nextOpenLeaf,
    sendBacktrack,
    sendClose,
    sendExtend,
    sendLemma
} from "../../../helpers/tableaux";
import { FOArgument, FOArgumentType } from "../../../types/clause";
import { foExample, propExample } from "./example";

interface Props {
    /**
     * Which calculus to use
     */
    calculus: TableauxCalculusType;
}

const TableauxView: preact.FunctionalComponent<Props> = ({ calculus }) => {
    const {
        server,
        [calculus]: cState,
        smallScreen,
        onError,
        onChange,
        onSuccess
    } = useAppState();

    let state = cState;
    if (!state) {
        // return <p>Keine Daten vorhanden</p>;
        // Default state for easy testing
        state = calculus === Calculus.propTableaux ? propExample :
            calculus === Calculus.foTableaux ? foExample :
                undefined;
        onChange(calculus, state);
    }
    const clauseOptions =  state !== undefined ? clauseSetToStringArray(state!.clauseSet) : [];

    const [selectedClauseId, setSelectedClauseId] = useState<
        number | undefined
    >(undefined);
    const [selectedNodeId, setSelectedNodeId] = useState<
        number | undefined
    >(undefined);
    const [varAssignSecondNodeId, setVarAssignSecondNodeId] = useState<
        number | undefined
    >(undefined);
    const [showClauseDialog, setShowClauseDialog] = useState(false);
    const [showVarAssignDialog, setShowVarAssignDialog] = useState(false);
    const [varsToAssign, setVarsToAssign] = useState<string[]>([]);
    const [lemmaMode, setLemmaMode] = useState(false);

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
        } else if (selectedNodeId !== undefined) {
            // The clause and node have been selected => send extend move request to backend
            sendExtend(
                calculus,
                server,
                state!,
                onChange,
                onError,
                selectedNodeId,
                newClauseId
            );
            setSelectedNodeId(undefined);
            setSelectedClauseId(undefined);
        } else {
            setSelectedClauseId(newClauseId);
        }
    };

    /**
     * The function to call, when the user selects a node
     * @param {TableauxTreeLayoutNode} newNode - The node which was clicked on
     * @param {boolean} ignoreClause - Whether to ignore the clause if one is selected
     * @returns {void}
     */
    const selectNodeCallback = (
        newNode: TableauxTreeLayoutNode,
        { ignoreClause = false }: SelectNodeOptions = {}
    ) => {
        const newNodeIsLeaf = newNode.children.length === 0;

        if (newNode.id === selectedNodeId) {
            // The same node was selected again => deselect it
            setSelectedNodeId(undefined);
        } else if (selectedNodeId === undefined) {
            setSelectedNodeId(newNode.id);
            if (ignoreClause) {
                setSelectedClauseId(undefined);
            } else if (selectedClauseId !== undefined && newNodeIsLeaf) {
                // The clause and node have been selected => send extend move request to backend
                sendExtend(
                    calculus,
                    server,
                    state!,
                    onChange,
                    onError,
                    newNode.id,
                    selectedClauseId
                );
                setSelectedNodeId(undefined);
                setSelectedClauseId(undefined);
            }
        } else {
            const selectedNode = state!.nodes[selectedNodeId];
            const selectedNodeIsLeaf = selectedNode.children.length === 0;

            if (
                lemmaMode &&
                selectedNodeIsLeaf &&
                !selectedNode.isClosed &&
                newNode.isClosed
            ) {
                // Open leaf and a closed Node are selected => Try Lemma move
                sendLemma(
                    calculus,
                    server,
                    state!,
                    onChange,
                    onError,
                    selectedNodeId,
                    newNode.id
                );
                setSelectedNodeId(undefined);
                setLemmaMode(false);
            } else if (
                // Don't select two leafs or two nodes at the same time
                (selectedNodeIsLeaf && newNodeIsLeaf) ||
                (!selectedNodeIsLeaf && !newNodeIsLeaf)
            ) {
                setSelectedNodeId(newNode.id);
            } else if (instanceOfPropTabState(state, calculus)) {
                // Now we have a leaf and a predecessor => Try close move
                // If we can't do it, let server handle it
                sendClose(
                    calculus,
                    server,
                    state!,
                    onChange,
                    onError,
                    newNodeIsLeaf ? newNode.id : selectedNodeId,
                    newNodeIsLeaf ? selectedNodeId : newNode.id
                );
                setSelectedNodeId(undefined);
            } else if (instanceOfFOTabState(state, calculus)) {
                // Prepare dialog for automatic/manual unification
                setVarAssignSecondNodeId(newNode.id);
                const vars: string[] = [];
                const checkArgumentForVar = (argument: FOArgument) => {
                    if (argument.type === FOArgumentType.quantifiedVariable) {
                        vars.push(argument.spelling);
                    }
                    if(argument.arguments) {
                        argument.arguments.forEach(checkArgumentForVar);
                    }
                };
                selectedNode.relation!.arguments.forEach(checkArgumentForVar);
                newNode.relation!.arguments.forEach(checkArgumentForVar);
                if (vars.length <= 0) {
                    if (selectedNodeIsLeaf) {
                        submitVarAssignWithNodeIds(false, {}, selectedNodeId, newNode.id);
                    }
                    else {
                        submitVarAssignWithNodeIds(false, {}, newNode.id, selectedNodeId);
                    }
                    return;
                }
                setVarsToAssign(vars);
                setShowVarAssignDialog(true);
            }
        }
        setLemmaMode(false);
    };

    /**
     * Submit a close move containing variable assignment rules
     * in the FO Tableaux calculus
     * @param {boolean} autoAssign - Automatically assign variables if this is set to true
     * @param {VarAssign} varAssign - Variable assignments by the user
     * @returns {void | Error} - Error if the two nodes for the close move can't be identified
     */
    const submitVarAssign = (autoAssign: boolean, varAssign: VarAssign = {}) => {
        if (
            selectedNodeId === undefined ||
            varAssignSecondNodeId === undefined
        ) {
            // Error for debugging
            throw new Error(
                "Close move went wrong, since selected nodes could not be identified."
            );
        }
        if (state!.nodes[selectedNodeId].children.length === 0) {
            submitVarAssignWithNodeIds(autoAssign, varAssign, selectedNodeId, varAssignSecondNodeId);
        }
        else {
            submitVarAssignWithNodeIds(autoAssign, varAssign, varAssignSecondNodeId, selectedNodeId);
        }
    };

    /**
     * Submit a close move containing variable assignment rules
     * in the FO Tableaux calculus
     * @param {boolean} autoAssign - Automatically assign variables if this is set to true
     * @param {VarAssign} varAssign - Variable assignments by the user
     * @param {number} leafNodeId - The id of the leaf node
     * @param {number} predNodeId - The id of the leaf's predecessor
     * @returns {void}
     */
    const submitVarAssignWithNodeIds = (autoAssign: boolean, varAssign: VarAssign, leafNodeId: number, predNodeId: number) => {
        sendClose(
            calculus,
            server,
            state!,
            onChange,
            onError,
            leafNodeId,
            predNodeId,
            varAssign,
            autoAssign
        );
        setSelectedNodeId(undefined);
        setVarAssignSecondNodeId(undefined);
        setShowVarAssignDialog(false);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle (Crtl + Z)
            if (!e.ctrlKey || e.shiftKey || e.metaKey || e.keyCode !== 90) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            sendBacktrack(calculus, server, state!, onChange, onError);
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [state, server, onChange, onError]);

    return (
        <Fragment>
            <h2>Tableaux View</h2>

            <div class={style.view}>
                {!smallScreen && (
                    <div>
                        <OptionList
                            options={clauseOptions}
                            selectedOptionId={selectedClauseId}
                            selectOptionCallback={selectClauseCallback}
                        />
                    </div>
                )}

                <TableauxTreeView
                    nodes={state!.nodes}
                    smallScreen={smallScreen}
                    selectedNodeId={selectedNodeId}
                    selectNodeCallback={selectNodeCallback}
                    lemmaNodesSelectable={lemmaMode}
                />
            </div>

            <Dialog
                open={showClauseDialog}
                label="Choose Clause"
                onClose={() => setShowClauseDialog(false)}
            >
                <OptionList
                    options={clauseOptions}
                    selectOptionCallback={(id: number) => {
                        setShowClauseDialog(false);
                        selectClauseCallback(id);
                    }}
                />
            </Dialog>

            {instanceOfFOTabState(state, calculus) ? (
                <Dialog
                    open={showVarAssignDialog}
                    label="Choose variable assignments or leave them blank"
                    onClose={() => setShowVarAssignDialog(false)}
                >
                    <VarAssignList
                        vars={varsToAssign}
                        manualVarAssignOnly={state.manualVarAssign}
                        submitVarAssignCallback={submitVarAssign}
                        submitLabel="Assign variables"
                        secondSubmitEvent={submitVarAssign}
                        secondSubmitLabel="Automatic assignment"
                    />
                </Dialog>
            ) : undefined}

            <ControlFAB alwaysOpen={!smallScreen}>
                {selectedNodeId === undefined ? (
                    <Fragment>
                        {state!.nodes.filter(node => !node.isClosed).length >
                        0 ? (
                            <FAB
                                icon={<ExploreIcon />}
                                label="Next Leaf"
                                mini={true}
                                extended={true}
                                showIconAtEnd={true}
                                onClick={() => {
                                    const node = nextOpenLeaf(state!.nodes);
                                    if (node === undefined) {
                                        return;
                                    }
                                    dispatchEvent(
                                        new CustomEvent("go-to", {
                                            detail: { node }
                                        })
                                    );
                                }}
                            />
                        ) : undefined}
                        <FAB
                            icon={<CenterIcon />}
                            label="Center"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={() => {
                                dispatchEvent(new CustomEvent("center"));
                            }}
                        />
                        <FAB
                            icon={<CheckCircleIcon />}
                            label="Check"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={() =>
                                checkClose(
                                    server,
                                    onError,
                                    onSuccess,
                                    calculus,
                                    state
                                )
                            }
                        />
                        {state!.backtracking ? (
                            <FAB
                                icon={<UndoIcon />}
                                label="Undo"
                                mini={true}
                                extended={true}
                                showIconAtEnd={true}
                                onClick={() => {
                                    sendBacktrack(
                                        calculus,
                                        server,
                                        state!,
                                        onChange,
                                        onError
                                    );
                                }}
                            />
                        ) : undefined}
                    </Fragment>
                ) : (
                    <Fragment>
                        <FAB
                            icon={<CenterIcon />}
                            label="Center"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={() => {
                                dispatchEvent(new CustomEvent("center"));
                            }}
                        />
                        <FAB
                            icon={<AddIcon />}
                            label="Expand"
                            mini={true}
                            extended={true}
                            showIconAtEnd={true}
                            onClick={() => {
                                setShowClauseDialog(!showClauseDialog);
                            }}
                        />
                        {lemmaMode ? (
                            <FAB
                                icon={<LemmaIcon fill="#000" />}
                                label="Lemma"
                                mini={true}
                                extended={true}
                                showIconAtEnd={true}
                                onClick={() => {
                                    setLemmaMode(!lemmaMode);
                                }}
                                active={true}
                            />
                        ) : (
                            state!.nodes[selectedNodeId].children.length === 0 &&
                            state!.nodes.filter(node => node.isClosed).length > 0
                        ) ? (
                            <FAB
                                icon={<LemmaIcon />}
                                label="Lemma"
                                mini={true}
                                extended={true}
                                showIconAtEnd={true}
                                onClick={() => {
                                    setLemmaMode(!lemmaMode);
                                }}
                            />
                        ) : undefined}
                    </Fragment>
                )}
            </ControlFAB>
        </Fragment>
    );
};

export default TableauxView;
