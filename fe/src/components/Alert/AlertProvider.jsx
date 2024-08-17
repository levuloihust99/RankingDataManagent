import React from "react"
import clsx from "clsx"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import { AlertContext } from "./context"
import { alertReducer } from "./reducer"
import "./style.css"

const AlertItem = ({ item, itemId }) => {
    const { dispatch } = React.useContext(AlertContext)

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            dispatch({
                type: 'REMOVE_ALERT',
                itemId
            })
        }, 2500)
        return () => clearTimeout(timeoutId)
    }, [])

    const handleCloseAlert = (e) => {
        dispatch({
            type: "REMOVE_ALERT",
            itemId,
        })
    }

    return (
        <div className={clsx("alert-item", item.type === "success" ? "success" : "failed")}>
            <div>
                {item.type === "success" ? (
                    <FontAwesomeIcon icon={icon({ name: "circle-check", style: "regular" })} />
                ) : (
                    <FontAwesomeIcon icon={icon({ name: "circle-exclamation" })} />
                )}
                <span>&nbsp;&nbsp;</span>
                <span>{item.message}</span>
            </div>
            <div
                className={clsx("close-alert-icon", item.type === "success" ? "success" : "failed")}
                onClick={handleCloseAlert}
            >
                <FontAwesomeIcon icon={icon({ name: "xmark" })} />
            </div>
        </div>
    )
}

export const AlertProvider = ({ children }) => {
    const [state, dispatch] = React.useReducer(alertReducer, { messages: [] })

    return (
        <AlertContext.Provider value={{ state, dispatch }}>
            <div id='alert-container'>
                {state.messages.map((item) => {
                    return <AlertItem item={item} key={item.uid} itemId={item.uid} />
                })}
            </div>
            {children}
        </AlertContext.Provider>
    )
}
