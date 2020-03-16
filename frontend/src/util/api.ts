import {
    AppState,
    AppStateUpdater,
    CalculusType,
    CheckCloseResponse, Config, Example,
    Move,
} from "../types/app";
import SHA3 from "sha3";
import {useAppState} from "./app-state";

export type checkCloseFn<C extends CalculusType = CalculusType> = (
    calculus: C,
    state: AppState[C],
) => Promise<void>;

/**
 * Sends a request to the server to check, if the tree is closed and
 * shows the result to the user
 *
 * @param {string} server - Server
 * @param {Function} onError - Error handler
 * @param {Function} onSuccess - Success handler
 * @param {C} calculus - Calculus endpoint
 * @param {any} state - Current state for the calculus
 * @returns {Promise<void>} - Resolves when the request is done
 */
export const checkClose = async <C extends CalculusType = CalculusType>(
    server: string,
    onError: (msg: string) => void,
    onSuccess: (msg: string) => void,
    calculus: C,
    state: AppState[C],
) => {
    const url = `${server}/${calculus}/close`;
    try {
        const response = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "POST",
            body: `state=${encodeURIComponent(JSON.stringify(state))}`,
        });
        if (response.status !== 200) {
            onError(await response.text());
        } else {
            const {
                closed,
                msg,
            } = (await response.json()) as CheckCloseResponse;
            if (closed) {
                onSuccess(msg);
                dispatchEvent(new CustomEvent("kbar-confetti"));
            } else {
                onError(msg);
            }
        }
    } catch (e) {
        onError((e as Error).message);
    }
};

/**
 * A asynchronous function to send requested move to backend
 * Updates app state with response from backend
 * @param {string} server - URL of the server
 * @param {C} calculus - Calculus endpoint
 * @param {any} state - Current state for the calculus
 * @param {any} move - Move to send
 * @param {AppStateUpdater} stateChanger - Function to update the state
 * @param {Function} onError - error handler
 * @returns {Promise<void>} - Promise that resolves after the request has been handled
 */
export const sendMove = async <C extends CalculusType = CalculusType>(
    server: string,
    calculus: C,
    state: AppState[C],
    move: Move[C],
    stateChanger: AppStateUpdater,
    onError: (msg: string) => void,
): Promise<AppState[C]> => {
    const url = `${server}/${calculus}/move`;
    try {
        // console.log(`move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`);
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "POST",
            body: `move=${encodeURIComponent(
                JSON.stringify(move),
            )}&state=${encodeURIComponent(JSON.stringify(state))}`,
        });
        if (res.status !== 200) {
            onError(await res.text());
            return state;
        }  {
            const parsed = await res.json();
            stateChanger(calculus, parsed);
            return parsed;
        }
    } catch (e) {
        onError((e as Error).message);
        return state;
    }
};

//ToDo: JSDoc getConfig
export const getConfig = async(
    server: string,
    changeConfig: (cfg: Config) => void,
    onError: (msg: string) => void,
) => {
    const url = `${server}/cobfig`;
    try {
        // console.log(`move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`);
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "GET",

        });
        if (res.status !== 200) {
            onError(await res.text());
        }  {
            const parsed = await res.json();
            changeConfig(parsed);
        }
    } catch (e) {
        onError((e as Error).message);
    }
};

//ToDo: JSDoc checkCredentials
export const checkCredentials = async(
    server: string,
    onError: (msg: string) => void,
) => {
    const url = `${server}/admin/checkCredentials`;
    const newDate = new Date();
    const date = "" + newDate.getFullYear() + newDate.getMonth() + newDate.getDay()
    const mac = new SHA3(256);
    console.log(date);
    mac.update(`kbcc|${date}|${useAppState().adminKey}`);
    try {
        // console.log(`move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`);
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "POST",
            body: `mac=${encodeURIComponent(JSON.stringify(mac.digest("hex")))}`
        });
        if (res.status !== 200) {
            onError(await res.text());
            //Todo: is Admin auf false setzen.
        }  {
            //Todo: is Admin auf true setzen.
        }
    } catch (e) {
        onError((e as Error).message);
    }
};

//ToDo: JSDoc setCalculusState
export const setCalculusState = async <C extends CalculusType = CalculusType>(
    server: string,
    calculus: C,
    value: boolean,
    onError: (msg: string) => void,
) => {
    const url = `${server}/admin/setCalculusState`;
    const newDate = new Date();
    const date = "" + newDate.getFullYear() + newDate.getMonth() + newDate.getDay()
    const mac = new SHA3(256);
    console.log(date);
    mac.update(`kbsc|${calculus}|${value}|${date}|${useAppState().adminKey}`);
    try {
        // console.log(`move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`);
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "POST",
            body:
                `calculus=${encodeURIComponent(JSON.stringify(calculus))}
                &enable=${encodeURIComponent(JSON.stringify(value))}
                &mac=${encodeURIComponent(JSON.stringify(mac.digest("hex")))}`
        });
        if (res.status !== 200) {
            onError(await res.text());
        }  {
            //Todo: neue config holen
        }
    } catch (e) {
        onError((e as Error).message);
    }
};

//ToDo: JSDoc addExample
export const addExample = async (
    server: string,
    example: Example,
    onError: (msg: string) => void,
) => {
    const url = `${server}/admin/addExample`;
    const newDate = new Date();
    const date = "" + newDate.getFullYear() + newDate.getMonth() + newDate.getDay()
    const mac = new SHA3(256);
    console.log(date);
    mac.update(`kbae|${example}|${date}|${useAppState().adminKey}`);
    try {
        // console.log(`move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`);
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "POST",
            body: `example=${encodeURIComponent(JSON.stringify(example))}
                &mac=${encodeURIComponent(JSON.stringify(mac.digest("hex")))}`
        });
        if (res.status !== 200) {
            onError(await res.text());
        }  {
            //Todo: neue config holen
        }
    } catch (e) {
        onError((e as Error).message);
    }
};

//ToDo: JSDoc delExample
export const delExample = async (
    server: string,
    exampleID: number,
    onError: (msg: string) => void,
) => {
    const url = `${server}/admin/addExample`;
    const newDate = new Date();
    const date = "" + newDate.getFullYear() + newDate.getMonth() + newDate.getDay()
    const mac = new SHA3(256);
    console.log(date);
    mac.update(`kbde|${exampleID}|${date}|${useAppState().adminKey}`);
    try {
        // console.log(`move=${JSON.stringify(move)}&state=${JSON.stringify(state)}`);
        const res = await fetch(url, {
            headers: {
                "Content-Type": "text/plain",
            },
            method: "POST",
            body: `exampleID=${encodeURIComponent(JSON.stringify(exampleID))}
                &mac=${encodeURIComponent(JSON.stringify(mac.digest("hex")))}`
        });
        if (res.status !== 200) {
            onError(await res.text());
        }  {
            //Todo: neue config holen
        }
    } catch (e) {
        onError((e as Error).message);
    }
};