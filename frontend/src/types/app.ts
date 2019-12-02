import { TableauxState } from "./tableaux";

/**
 * State of all calculi
 */
export interface AppState {
    "prop-tableaux"?: TableauxState;
}

export type AppStateUpdater<K extends keyof AppState = keyof AppState> = (
    id: K,
    newState: AppState[K]
) => void;