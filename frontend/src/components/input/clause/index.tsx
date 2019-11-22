import { h } from "preact";
import { route } from "preact-router";
import { useState } from "preact/hooks";
import { AppState, AppStateUpdater } from "../../../types/app";
import * as style from "./style.css";

// Interface for properties
interface Props {
    calculus: keyof AppState;
    server: string;
    onChange: AppStateUpdater;
}

/**
 * Normalizes the user input. It replaces multiple newlines with just one,
 * replaces newlines by semicolon and removes whitespace
 * @param {string} input - The user input
 * @returns {string} - Normalized clause string
 */
const normalizeInput = (input: string) => {
    input = input.replace(/\n+/g, "\n");
    input = input.replace(/\n/g, ";");
    input = input.replace(/\s/g, "");
    return input;
};

// This component is used to display the content of the home subpage
const ClauseInput: preact.FunctionalComponent<Props> = ({
    calculus,
    server,
    onChange
}) => {
    const [userInput, setUserInput] = useState("");
    const url = `${server}/${calculus}/parse`;

    // Handle Submit event
    const onSubmit = async (event: Event) => {
        event.preventDefault();
        try {
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "text/plain"
                },
                method: "POST",
                body: `formula=${normalizeInput(userInput)}`
            });
            const parsed = await response.json();
            onChange(calculus, parsed);
            route(`/${calculus}/view`);
        } catch (e) {
            console.error(e);
        }
    };

    // Handle Input event
    const onInput = ({ target }: Event) => {
        const { value } = target as HTMLTextAreaElement;
        setUserInput(value);
    };

    // Handle KeyDown event
    const onKeyDown = (e: KeyboardEvent) => {
        // Prevent submit when hitting enter
        if (e.keyCode === 13 && !e.ctrlKey) {
            e.stopPropagation();
        }
        // Trigger submit when using ctrlKey
        // TODO: This should be done via event, don't know why it doesn't work
        if (e.keyCode === 13 && e.ctrlKey) {
            onSubmit(e);
        }
    };

    return (
        <div class="card">
            <h3>Bitte gebe eine Klauselmenge ein:</h3>
            <form onSubmit={onSubmit} onKeyDown={onKeyDown}>
                <textarea name="formula" value={userInput} onInput={onInput} />
                <button
                    class={style.send}
                    type="submit"
                    disabled={userInput.length === 0}
                >
                    Submit
                </button>
            </form>
        </div>
    );
};

export default ClauseInput;
