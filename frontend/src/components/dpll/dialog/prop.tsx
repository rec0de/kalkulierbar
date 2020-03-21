import { h } from "preact";
import { ClauseSet, SelectedClauses } from "../../../types/clause";
import { DPLLState } from "../../../types/dpll";
import { useAppState } from "../../../util/app-state";
import { stringArrayToStringMap } from "../../../util/array-to-map";
import { atomToString } from "../../../util/clause";
import { sendProp } from "../../../util/dpll";
import Dialog from "../../dialog";
import OptionList from "../../input/option-list";

interface Props {
    open: boolean;
    state: DPLLState;
    branch: number;
    clauseSet: ClauseSet;
    setBranch: (n: number) => void;
    selectedClauses: SelectedClauses;
    setSelectedClauses: (s: SelectedClauses) => void;
}

const DPLLPropLitDialog: preact.FunctionalComponent<Props> = ({
    open,
    setSelectedClauses,
    selectedClauses,
    state,
    clauseSet,
    branch,
    setBranch,
}) => {
    const { server, onChange, onError, onWarning } = useAppState();

    const propOptions =
        selectedClauses !== undefined && selectedClauses.length > 1
            ? stringArrayToStringMap(
                  clauseSet.clauses[selectedClauses[1]!].atoms.map(
                      atomToString,
                  ),
              )
            : new Map<number, string>();

    const handlePropLitSelect = (keyValuePair: [number, string]) => {
        if (selectedClauses === undefined || selectedClauses.length < 2) {
            return;
        }
        sendProp(
            server,
            state,
            branch,
            selectedClauses[0],
            selectedClauses[1]!,
            keyValuePair[0],
            setBranch,
            onChange,
            onError,
            onWarning,
        );
        setSelectedClauses(undefined);
    };

    return (
        <Dialog
            label="Choose Literal"
            open={open}
            onClose={() => setSelectedClauses([selectedClauses![0]])}
        >
            <OptionList
                options={propOptions}
                selectOptionCallback={handlePropLitSelect}
            />
        </Dialog>
    );
};

export default DPLLPropLitDialog;
