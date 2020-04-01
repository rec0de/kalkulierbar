import { Fragment, h } from "preact";
import { DPLLNodeType, DPLLState } from "../../../../types/calculus/dpll";
import { useAppState } from "../../../../util/app-state";
import { sendPrune, stateIsClosed } from "../../../../util/dpll";
import DownloadFAB from "../../../input/btn/download";
import ControlFAB from "../../../input/control-fab";
import FAB from "../../../input/fab";
import CheckCircleFilledIcon from "../../../icons/check-circle-filled";
import DeleteIcon from "../../../icons/delete";
import SplitIcon from "../../../icons/split";
import SwitchIcon from "../../../icons/switch";
import { Calculus } from "../../../../types/calculus";
import CheckCloseFAB from "../../../input/fab/check-close";

interface Props {
    /**
     * The current dpll state
     */
    state: DPLLState;
    /**
     * The branch
     */
    branch: number;
    /**
     * Whether to show the tree
     */
    showTree: boolean;
    /**
     * Function to toggle visibility of tree
     */
    toggleShowTree: () => void;
    /**
     * Function to set visibility of model dialog
     */
    setShowModelDialog: (v: boolean) => void;
    /**
     * Function to set visibility of split dialog
     */
    setShowSplitDialog: (v: boolean) => void;
}

const DPLLControlFAB: preact.FunctionalComponent<Props> = ({
    state,
    branch,
    showTree,
    toggleShowTree,
    setShowModelDialog,
    setShowSplitDialog,
}) => {
    const {
        smallScreen,
        server,
        onChange,
        notificationHandler,
    } = useAppState();

    const couldShowCheckCloseHint = stateIsClosed(state.tree);

    return (
        <Fragment>
            <ControlFAB
                alwaysOpen={!smallScreen}
                couldShowCheckCloseHint={couldShowCheckCloseHint}
                checkFABPositionFromBottom={3}
            >
                {smallScreen && (
                    <FAB
                        label={showTree ? "Clause View" : "Tree View"}
                        icon={<SwitchIcon />}
                        mini={true}
                        extended={true}
                        onClick={toggleShowTree}
                    />
                )}
                {state.tree[branch].type === DPLLNodeType.MODEL && (
                    <FAB
                        icon={<CheckCircleFilledIcon />}
                        label="Model Check"
                        mini={true}
                        extended={true}
                        showIconAtEnd={true}
                        onClick={() => setShowModelDialog(true)}
                    />
                )}
                <DownloadFAB state={state} name="dpll" type={Calculus.dpll} />
                <CheckCloseFAB calculus={Calculus.dpll}/>
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
                            branch,
                            onChange,
                            notificationHandler,
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

export default DPLLControlFAB;
