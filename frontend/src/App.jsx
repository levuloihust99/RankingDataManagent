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
            <div id="app"
                style={{ width: pushed ? "100vw" : "calc(100vw + 250px)" }}
            >
                <NavBar
                    activeItem={activeItem}
                    setActiveItem={(item) => dispatch({ type: "SET_ACTIVE_ITEM", activeItem: item })}
                />
                <div
                    id="main-content"
                >
                    <TitleBar />
                    <Outlet />
                </div>
            </div>
        </AppContext.Provider>
    )
}
