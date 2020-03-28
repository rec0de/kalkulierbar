import { createContext, h } from "preact";
import { Reducer, useContext, useEffect, useReducer } from "preact/hooks";
import {
    AppState,
    AppStateAction,
    AppStateActionType,
    Calculus,
    CalculusType,
    DerivedAppState,
    NotificationHandler,
    NotificationType,
    Theme,
    TutorialMode,
} from "../types/app";
import { localStorageGet, localStorageSet } from "./local-storage";

const isDeployed = location.port !== "8080";

const INIT_APP_STATE: AppState = {
    smallScreen: false,
    savedFormulas: {
        [Calculus.propResolution]: "",
        [Calculus.foResolution]: "",
        [Calculus.propTableaux]: "",
        [Calculus.foTableaux]: "",
        [Calculus.ncTableaux]: "",
        [Calculus.dpll]: "",
    },
    server: isDeployed
        ? "https://kalkulierbar-api.herokuapp.com"
        : `http://${location.hostname}:7000`,
    theme: Theme.auto,
    tutorialMode: TutorialMode.HighlightAll,
};

/**
 * Takes the old state and an action and produces a new state
 * @param {AppState} state - the old state
 * @param {AppStateAction} action - the action to apply
 * @returns {AppState} - the new state
 */
const reducer: Reducer<AppState, AppStateAction> = (
    state,
    action,
): AppState => {
    switch (action.type) {
        case AppStateActionType.UPDATE_SCREEN_SIZE:
            return {
                ...state,
                smallScreen: action.smallScreen,
            };
        case AppStateActionType.ADD_NOTIFICATION:
            return { ...state, notification: action.value };
        case AppStateActionType.REMOVE_NOTIFICATION:
            return { ...state, notification: undefined };
        case AppStateActionType.UPDATE_CALCULUS_STATE:
            return {
                ...state,
                [action.calculus]: action.value,
                notification: undefined,
            };
        case AppStateActionType.SET_THEME:
            return { ...state, theme: action.value };
        case AppStateActionType.SET_SERVER:
            return { ...state, server: action.value, notification: undefined };
        case AppStateActionType.UPDATE_SAVED_FORMULA:
            return {
                ...state,
                savedFormulas: {
                    ...state.savedFormulas,
                    [action.calculus]: action.value,
                },
            };
        case AppStateActionType.SET_TUTORIAL_MODE:
            return { ...state, tutorialMode: action.value };
    }
};

/**
 * Creates a function to update calculus states
 * @param {Function} dispatch - dispatch function
 * @returns {Function} - calculus state setter
 */
export const updateCalculusState = <C extends CalculusType = CalculusType>(
    dispatch: (state: AppStateAction) => void,
) => (calculus: C, state: AppState[C]) => {
    dispatch({
        type: AppStateActionType.UPDATE_CALCULUS_STATE,
        calculus,
        value: state,
    });
};

/**
 * Creates a notification handler
 * @param {Function} dispatch - dispatch function
 * @returns {NotificationHandler} - the new notification handler
 */
const createNotificationHandler = (
    dispatch: (a: AppStateAction) => void,
): NotificationHandler => ({
    message: (type: NotificationType, message: string) =>
        dispatch({
            type: AppStateActionType.ADD_NOTIFICATION,
            value: { type, message },
        }),
    error: (message: string) =>
        dispatch({
            type: AppStateActionType.ADD_NOTIFICATION,
            value: { type: NotificationType.Error, message },
        }),
    success: (message: string) =>
        dispatch({
            type: AppStateActionType.ADD_NOTIFICATION,
            value: { type: NotificationType.Success, message },
        }),
    warning: (message: string) =>
        dispatch({
            type: AppStateActionType.ADD_NOTIFICATION,
            value: { type: NotificationType.Warning, message },
        }),
    remove: () => dispatch({ type: AppStateActionType.REMOVE_NOTIFICATION }),
});

/**
 * Creates a derived app state from an app state
 * @param {AppState} state - the original app state
 * @param {Function} dispatch - dispatch function
 * @returns {DerivedAppState} - the extended app state
 */
const derive = (
    state: AppState,
    dispatch: (a: AppStateAction) => void,
): DerivedAppState => ({
    ...state,
    notificationHandler: createNotificationHandler(dispatch),
    onChange: updateCalculusState(dispatch),
    dispatch,
});

export const AppStateCtx = createContext<DerivedAppState>(
    derive(INIT_APP_STATE, () => {}),
);

/**
 * Hook to use the app state
 * @returns {DerivedAppState} - the current app state
 */
export const useAppState = () => useContext(AppStateCtx);

export const AppStateProvider = (
    App: preact.FunctionalComponent,
): preact.FunctionalComponent => () => {
    const storedTheme = localStorageGet<Theme>("theme");
    const storedServer = localStorageGet<string>("server");
    const tutorialMode =
        localStorageGet<TutorialMode>("tutorial_mode") ??
        TutorialMode.HighlightAll;

    INIT_APP_STATE.theme = storedTheme || INIT_APP_STATE.theme;
    INIT_APP_STATE.server = storedServer || INIT_APP_STATE.server;
    INIT_APP_STATE.tutorialMode = tutorialMode;

    const [state, dispatch] = useReducer<AppState, AppStateAction>(
        reducer,
        INIT_APP_STATE,
    );
    const derived = derive(state, dispatch);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", derived.theme);
        localStorageSet("theme", derived.theme);
    }, [derived.theme]);
    useEffect(() => {
        localStorageSet("server", derived.server);
    }, [derived.server]);
    useEffect(() => {
        localStorageSet("tutorial_mode", derived.tutorialMode);
    }, [derived.tutorialMode]);

    return (
        <AppStateCtx.Provider value={derived}>
            <App />
        </AppStateCtx.Provider>
    );
};
