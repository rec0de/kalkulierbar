import { Fragment, h } from "preact";
import DPLLTree from "../../../components/dpll/tree";
import { useAppState } from "../../../helpers/app-state";

import { useCallback, useState } from "preact/hooks";
import ControlFAB from "../../../components/control-fab";
import Dialog from "../../../components/dialog";
import FAB from "../../../components/fab";
import CheckCircleIcon from "../../../components/icons/check-circle";
import DeleteIcon from "../../../components/icons/delete";
import SplitIcon from "../../../components/icons/split";
import SwitchIcon from "../../../components/icons/switch";
import OptionList from "../../../components/input/option-list";
import { checkClose } from "../../../helpers/api";
import { classMap } from "../../../helpers/class-map";
import { atomToString, clauseSetToStringArray } from "../../../helpers/clause";
import {
    calculateClauseSet,
    getAllLits,
    getPropCandidates,
    sendProp,
    sendPrune,
    sendSplit,
} from "../../../helpers/dpll";
import dpllExampleState from "./example";
import * as style from "./style.scss";

interface Props {}

type SelectedClauses = undefined | [number] | [number, number];

const DPLLView: preact.FunctionalComponent<Props> = () => {
    const {
        dpll: cState,
        smallScreen,
        server,
        onChange,
        onError,
        onSuccess,
    } = useAppState();

    const [showTree, setShowTree] = useState(false);
    const toggleShowTree = useCallback(() => setShowTree(!showTree), [
        showTree,
    ]);

    const [selectedNode, setSelectedNode] = useState<number>(0);

    const [selectedClauses, setSelectedClauses] = useState<SelectedClauses>(
        undefined,
    );

    const showPropDialog = selectedClauses?.length === 2;
    const [showSplitDialog, setShowSplitDialog] = useState(false);

    const state = cState || dpllExampleState;

    const clauseSet = calculateClauseSet(state, selectedNode);

    const handleNodeSelect = (newNode: number) => {
        if (newNode === selectedNode) {
            return;
        }
        setSelectedNode(newNode);
    };

    const handleClauseSelect = (newClause: number) => {
        if (selectedClauses === undefined) {
            setSelectedClauses([newClause]);
            return;
        }
        if (selectedClauses[0] === newClause) {
            setSelectedClauses(undefined);
            return;
        }
        const candidates = getPropCandidates(
            clauseSet.clauses[selectedClauses[0]],
            clauseSet.clauses[newClause],
        );
        if (candidates.length === 1) {
            sendProp(
                server,
                state,
                selectedNode,
                selectedClauses[0],
                newClause,
                candidates[0],
                setSelectedNode,
                onChange,
                onError,
            );
            setSelectedClauses(undefined);
            return;
        }
        setSelectedClauses([selectedClauses[0], newClause]);
    };

    const propOptions: string[] =
        selectedClauses === undefined || selectedClauses.length < 2
            ? []
            : clauseSet.clauses[selectedClauses[1]!].atoms.map(atomToString);

    const handlePropLitSelect = (lId: number) => {
        if (selectedClauses === undefined || selectedClauses.length < 2) {
            return;
        }
        sendProp(
            server,
            state,
            selectedNode,
            selectedClauses[0],
            selectedClauses[1]!,
            lId,
            setSelectedNode,
            onChange,
            onError,
        );
        setSelectedClauses(undefined);
    };

    const allLits = showSplitDialog ? getAllLits(clauseSet) : [];

    const handleSplitLitSelect = (id: number) => {
        sendSplit(server, state, selectedNode, allLits[id], onChange, onError);
        setShowSplitDialog(false);
    };

    return (
        <Fragment>
            <h2>DPLL View</h2>
            <div
                class={classMap({
                    [style.dpllView]: true,
                    [style.showTree]: showTree,
                })}
            >
                <div class={style.list}>
                    <OptionList
                        options={clauseSetToStringArray(clauseSet)}
                        selectOptionCallback={handleClauseSelect}
                        selectedOptionId={selectedClauses?.[0]}
                    />
                </div>
                <div class={style.tree}>
                    <DPLLTree
                        nodes={state.tree}
                        selectedNode={selectedNode}
                        onSelect={handleNodeSelect}
                    />
                </div>
            </div>
            <Dialog
                label="Choose Literal"
                open={showPropDialog}
                onClose={() => setSelectedClauses([selectedClauses![0]])}
            >
                <OptionList
                    options={propOptions}
                    selectOptionCallback={handlePropLitSelect}
                />
            </Dialog>
            <Dialog
                label="Select Literal"
                open={showSplitDialog}
                onClose={() => setShowSplitDialog(false)}
            >
                <OptionList
                    options={allLits}
                    selectOptionCallback={handleSplitLitSelect}
                />
            </Dialog>
            <ControlFAB alwaysOpen={!smallScreen}>
                {smallScreen && (
                    <FAB
                        label="Switch"
                        icon={<SwitchIcon />}
                        mini={true}
                        extended={true}
                        onClick={toggleShowTree}
                    />
                )}
                <FAB
                    icon={<CheckCircleIcon />}
                    label="Check"
                    mini={true}
                    extended={true}
                    showIconAtEnd={true}
                    onClick={() =>
                        checkClose(server, onError, onSuccess, "dpll", state)
                    }
                />
                <FAB
                    label="Prune"
                    icon={<DeleteIcon />}
                    mini={true}
                    extended={true}
                    showIconAtEnd={true}
                    onClick={() =>
                        sendPrune(
                            server,
                            state,
                            selectedNode,
                            onChange,
                            onError,
                        )
                    }
                />
                <FAB
                    label="Split"
                    icon={<SplitIcon />}
                    mini={true}
                    extended={true}
                    showIconAtEnd={true}
                    onClick={() => setShowSplitDialog(true)}
                />
            </ControlFAB>
        </Fragment>
    );
};

export default DPLLView;
