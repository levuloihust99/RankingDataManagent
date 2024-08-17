import React from 'react'
import {
    createBrowserRouter,
    RouterProvider,
    redirect,
    Outlet,
    useNavigate,
    useLocation,
    useNavigation
} from "react-router-dom";
import { NavBar } from "./components/NavBar/NavBar"
import { AppContext } from './context'
import { TitleBar } from './components/TitleBar/TitleBar'
import { globalConfig } from './lib/config';
import { AlertProvider } from './components/Alert/AlertProvider';
import "./App.css"

const reducer = (state, action) => {
    switch (action.type) {
        case "TOGGLE_SIDEBAR":
            return { ...state, pushed: !state.pushed }
        case "SET_ACTIVE_ITEM":
            return { ...state, activeItem: action.activeItem }
    }
}

export const App = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [state, dispatch] = React.useReducer(reducer, { pushed: true, activeItem: "database" })
    const { pushed, activeItem } = state
    React.useEffect(() => {
        if (location.pathname === "/") {
            navigate("dataset/page/1")
        }
    }, [location.pathname])
    return (
        <AppContext.Provider value={{ dispatch, pushed }}>
            <AlertProvider>
                <div id="app"
                    style={{ width: pushed ? "100vw" : `calc(100vw + ${globalConfig.sideBarWidth})` }}
                >
                    <NavBar
                        activeItem={activeItem}
                        setActiveItem={(item) => dispatch({ type: "SET_ACTIVE_ITEM", activeItem: item })}
                    />
                    <div
                        id="main-content"
                        style={{
                            overflowX: 'auto',
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: "1000px",
                                maxHeight: "100%",
                                minHeight: "100%"
                            }}
                        >
                            <TitleBar />
                            <div
                                style={{
                                    flexGrow: 1,
                                    minHeight: 0,
                                    overflow: "auto",
                                }}
                            >
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </div>
            </AlertProvider>
        </AppContext.Provider>
    )
}
