import { Fragment, h } from "preact";
import ControlFAB from "../../../components/control-fab";
import FAB from "../../../components/fab";
import CenterIcon from "../../../components/icons/center";
import CheckCircleIcon from "../../../components/icons/check-circle";
import {checkClose, sendMove} from "../../../helpers/api";
import { useAppState } from "../../../helpers/app-state";
import {hideClause, sendFactorize, showHiddenClauses} from "../../../helpers/resolution";
import * as style from "../../../routes/resolution/view/style.scss";
import {ResolutionCalculusType} from "../../../types/app";
import {SelectedClauses} from "../../../types/clause";
import {
    FOResolutionState,
    HyperResolutionMove, instanceOfPropResState,
    PropResolutionState
} from "../../../types/resolution";
import FactorizeIcon from "../../icons/factorize";
import HideIcon from "../../icons/hide";
import HyperIcon from "../../icons/hyper";
import SendIcon from "../../icons/send";
import ShowIcon from "../../icons/show";

interface Props {
    /**
     * Which calculus to use
     */
    calculus: ResolutionCalculusType;
    /**
     * The current calculus state
     */
    state: PropResolutionState | FOResolutionState;
    /**
     * Which node is currently selected
     */
    selectedClauseId?: number;
    /**
     * Set selected clauses
     */
    setSelectedClauses: (clauses: SelectedClauses) => void;
    /**
     * The hyper resolution move
     */
    hyperRes?: HyperResolutionMove;
    /**
     * Set the Hyper Resolution Move
     */
    setHyperRes: (move: HyperResolutionMove | undefined) => void;
    /**
     * Set the visibility of the factorize dialog
     */
    setShowFactorizeDialog: (b: boolean) => void;
}

const ResolutionFAB: preact.FunctionalComponent<Props> = ({
    calculus,
    state,
    selectedClauseId,
    setSelectedClauses,
    hyperRes,
    setHyperRes,
    setShowFactorizeDialog,
}) => {
    const {
        server,
        smallScreen,
        onChange,
        onError,
        onSuccess,
    } = useAppState();
    const apiInfo = { onChange, onError, server };

    return (
        <Fragment>
            <ControlFAB alwaysOpen={!smallScreen}>
                {selectedClauseId !== undefined ? (
                    <Fragment>
                        <FAB
                            mini={true}
                            extended={true}
                            label="Hyper Resolution"
                            showIconAtEnd={true}
                            icon={
                                <HyperIcon
                                    fill={hyperRes ? "#000" : undefined}
                                />
                            }
                            active={!!hyperRes}
                            onClick={() => {
                                if (hyperRes) {
                                    setHyperRes(undefined);
                                    return;
                                }
                                setHyperRes({
                                    type: "res-hyper",
                                    mainID: selectedClauseId!,
                                    atomMap: {},
                                });
                            }}
                        />
                        <FAB
                            mini={true}
                            extended={true}
                            label="Hide clause"
                            showIconAtEnd={true}
                            icon={<HideIcon />}
                            onClick={() => {
                                hideClause(selectedClauseId!, calculus, {...apiInfo, state,});
                                setSelectedClauses(undefined);
                            }}
                        />
    
                        {state.clauseSet.clauses[selectedClauseId].atoms.length > 0 ? (
                            <FAB
                                mini={true}
                                extended={true}
                                label="Factorize"
                                showIconAtEnd={true}
                                icon={<FactorizeIcon />}
                                onClick={() => {
                                    if (
                                        ! instanceOfPropResState(state, calculus) &&
                                        state.clauseSet.clauses[selectedClauseId].atoms.length !== 2
                                    ) {
                                        setShowFactorizeDialog(true);
                                        return;
                                    }
                                    sendFactorize(
                                        selectedClauseId!,
                                        new Set<number>([0,1]),
                                        calculus,
                                        {...apiInfo, state},
                                    );
                                    setSelectedClauses(undefined);
                                }}
                            />
                        ) : undefined}
                    </Fragment>
                ) : undefined}
                {state!.hiddenClauses.clauses.length > 0 ? (
                    <FAB
                        mini={true}
                        extended={true}
                        label="Show all"
                        showIconAtEnd={true}
                        icon={<ShowIcon />}
                        onClick={() => {
                            showHiddenClauses(calculus, {...apiInfo, state,});
                            setSelectedClauses(undefined);
                        }}
                    />
                ) : undefined}
                <FAB
                    mini={true}
                    extended={true}
                    label="Center"
                    showIconAtEnd={true}
                    icon={<CenterIcon />}
                    onClick={() => dispatchEvent(new CustomEvent("center"))}
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
            </ControlFAB>
            
            {hyperRes && hyperRes.atomMap && (
                <FAB
                    class={style.hyperFab}
                    label="Send"
                    icon={<SendIcon />}
                    extended={true}
                    mini={smallScreen}
                    onClick={() => {
                        sendMove(
                            server,
                            calculus,
                            state,
                            hyperRes,
                            onChange,
                            onError,
                        );
                        setHyperRes(undefined);
                        setSelectedClauses(undefined);
                    }}
                />
            )}
        </Fragment>
    );
};

export default ResolutionFAB;