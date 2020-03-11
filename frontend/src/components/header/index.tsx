import { Fragment, h } from "preact";
import { Link } from "preact-router";
import { useCallback, useState } from "preact/hooks";
import { AppStateActionType, Calculus, Theme } from "../../types/app";
import { useAppState } from "../../util/app-state";
import { classMap } from "../../util/class-map";
import Btn from "../btn";
import Dialog from "../dialog";
import FAB from "../fab";
import SaveIcon from "../icons/save";
import SettingsIcon from "../icons/settings";
import ThemeAuto from "../icons/theme-auto";
import ThemeDark from "../icons/theme-dark";
import ThemeLight from "../icons/theme-light";
import TextInput from "../input/text";
import * as style from "./style.scss";

interface HeaderProps {
    currentUrl: string;
}

const Header: preact.FunctionalComponent<HeaderProps> = ({ currentUrl }) => {
    const { hamburger } = useAppState();
    const [open, setOpen] = useState(false);
    const toggle = useCallback(() => setOpen(!open), [open]);
    const setClosed = useCallback(() => setOpen(false), [open]);

    const right = hamburger ? (
        <Hamburger open={open} onClick={toggle} />
    ) : (
        <Fragment>
            <Nav
                hamburger={false}
                onLinkClick={setClosed}
                currentUrl={currentUrl}
            />
            <Btn class={style.settingsBtn} onClick={toggle}>
                <SettingsIcon />
            </Btn>
        </Fragment>
    );

    return (
        <header class={classMap({ [style.header]: true, [style.open]: open })}>
            <a href="/" class={style.mainLink}>
                <img
                    class={style.logo}
                    src="/assets/icons/logo-plain.svg"
                    alt="KalkulierbaR logo"
                />
                <h1>KalkulierbaR</h1>
            </a>
            <div class={style.spacer} />
            {right}
            <Drawer
                open={open}
                onLinkClick={setClosed}
                currentUrl={currentUrl}
            />
            <Dialog
                class={style.dialog}
                open={!hamburger && open}
                label="Settings"
                onClose={setClosed}
            >
                <Settings />
            </Dialog>
        </header>
    );
};

interface HamburgerProps {
    open: boolean;
    onClick?: () => void;
}

const Hamburger: preact.FunctionalComponent<HamburgerProps> = ({
    open,
    onClick,
}) => (
    <div
        onClick={onClick}
        class={classMap({ [style.hamburgler]: true, [style.open]: open })}
    >
        <div class={style.hb1} />
        <div class={style.hb2} />
        <div class={style.hb3} />
    </div>
);

interface NavProps {
    hamburger: boolean;
    onLinkClick: CallableFunction;
    currentUrl: string;
}

const Nav: preact.FunctionalComponent<NavProps> = ({
    hamburger,
    onLinkClick,
    currentUrl,
}) => {
    const links = {
        "Propositional Tableaux": Calculus.propTableaux,
        "FO Tableaux": Calculus.foTableaux,
        "Propositional Resolution": Calculus.propResolution,
        "FO Resolution": Calculus.foResolution,
        "DPLL": Calculus.dpll,
    };
    return(
        <nav
            class={classMap({
                [style.nav]: true,
                [style.hamburgerLink]: hamburger,
            })}
        >
            {Object.entries(links).map(([linkName, calculus]) =>
                <Link
                    key={linkName}
                    onClick={() => onLinkClick()}
                    class={
                        currentUrl.includes(calculus)
                            ? style.current
                            : undefined
                    }
                    href={"/" + calculus}
                >
                    {linkName}
                </Link>
            )}
        </nav>
    );
};

const Settings: preact.FunctionalComponent = () => {
    return (
        <div class={style.settings}>
            <ThemeSwitcher />
            <ServerInput />
        </div>
    );
};

interface ServerInputProps {
    showLabel?: boolean;
    close?: () => void;
}

const ServerInput: preact.FunctionalComponent<ServerInputProps> = ({
    showLabel = true,
    close,
}) => {
    const { dispatch, server } = useAppState();
    const [newServer, setServer] = useState(server);

    const dispatchServer = useCallback(() => {
        dispatch({
            type: AppStateActionType.SET_SERVER,
            value: newServer,
        });
    }, [newServer]);

    const onSubmit = useCallback(() => {
        dispatchServer();
        if (document.activeElement) {
            (document.activeElement as HTMLElement).blur();
        }
        if (close) {
            close();
        }
    }, [dispatchServer]);

    const handleEnter = useCallback(
        (e: KeyboardEvent) => {
            if (e.keyCode === 13) {
                onSubmit();
            }
        },
        [dispatchServer],
    );

    return (
        <div class={style.serverInputWrapper}>
            <div class={style.overlay} />
            <TextInput
                class={style.serverInput}
                label={showLabel ? "Server" : undefined}
                onChange={setServer}
                value={server}
                type="url"
                autoComplete={true}
                onKeyDown={handleEnter}
                submitButton={
                    <FAB
                        icon={<SaveIcon />}
                        label="Save Server URL"
                        mini={true}
                        onClick={onSubmit}
                    />
                }
            />
        </div>
    );
};

const ThemeSwitcher: preact.FunctionalComponent = () => {
    const { theme, dispatch } = useAppState();

    const onClick = () => {
        let newTheme: Theme;
        switch (theme) {
            case Theme.light:
                newTheme = Theme.auto;
                break;
            case Theme.dark:
                newTheme = Theme.light;
                break;
            case Theme.auto:
                newTheme = Theme.dark;
                break;
        }
        dispatch({ type: AppStateActionType.SET_THEME, value: newTheme });
    };

    const themeSwitcherIcon = () => {
        switch (theme) {
            case Theme.light:
                return <ThemeLight />;
            case Theme.dark:
                return <ThemeDark />;
            case Theme.auto:
                return <ThemeAuto />;
        }
    };

    return (
        <div onClick={onClick} class={style.themeContainer}>
            <Btn
                class={style.themeSwitcher}
                title="Change color theme"
                id="theme-switcher"
            >
                {themeSwitcherIcon()}
            </Btn>
            <label for="theme-switcher">Current theme: {theme}</label>
        </div>
    );
};

interface DrawerProps {
    open: boolean;
    onLinkClick: CallableFunction;
    currentUrl: string;
}

const Drawer: preact.FunctionalComponent<DrawerProps> = ({
    open,
    onLinkClick,
    currentUrl,
}) => (
    <div class={classMap({ [style.drawer]: true, [style.open]: open })}>
        <div class={style.inner}>
            <h3>Calculi</h3>
            <Nav
                hamburger={true}
                onLinkClick={onLinkClick}
                currentUrl={currentUrl}
            />
            <h3>Settings</h3>
            <Settings />
        </div>
    </div>
);

export default Header;
