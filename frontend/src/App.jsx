import React from 'react'
import {
    createBrowserRouter,
    RouterProvider,
    redirect
} from "react-router-dom";
import { NavBar } from "./components/NavBar"
import { AppContext } from './context'
import { TitleBar } from './components/TitleBar'
import { MainComponent } from './components/MainComponent'
import { dataLoader } from './components/MainComponent/MainComponent';
import { ErrorPage } from './components/ErrorPage/ErrorPage';
import "./App.css"

function redirectLoader({ request }) {
    return redirect("/page/1")
}

const router = createBrowserRouter([
    {
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/",
                loader: redirectLoader,
            },
            {
                path: "/page/:pageId",
                loader: dataLoader,
                element: <MainComponent />
            }
        ]
    }
]);

const reducer = (state, action) => {
    switch (action.type) {
        case "TOGGLE_SIDEBAR":
            return { ...state, pushed: !state.pushed }
        case "SET_ACTIVE_ITEM":
            return { ...state, activeItem: action.activeItem }
    }
}

export const App = () => {
    const [state, dispatch] = React.useReducer(reducer, { pushed: true, activeItem: "database" })
    const { pushed, activeItem } = state
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
                    <RouterProvider router={router}>
                    </RouterProvider>
                </div>
            </div>
        </AppContext.Provider>
    )
}