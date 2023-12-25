import React from 'react'
import { Button } from "semantic-ui-react"
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { AlertContext } from "../Alert/context"

export const ActionBar = () => {
    const { dispatch } = React.useContext(AlertContext)

    const handleExport = async (e) => {
        // call API
        await new Promise((resolve, reject) => {
            setTimeout(() => resolve("Exported successfully!"), 500)
        }).then((msg) => {
            dispatch({
                type: 'ADD_MESSAGE',
                item: {
                    type: 'success',
                    message: msg
                }
            })
        }).catch((err) => {
            dispatch({
                type: 'ADD_MESSAGE',
                item: {
                    type: 'failed',
                    message: err.toString()
                }
            })
        })
    }

    const handleImport = async (e) => {
        // call API
        await new Promise((resolve, reject) => {
            setTimeout(() => reject("Failed to import!"), 500)
        }).then((msg) => {
            dispatch({
                type: 'ADD_MESSAGE',
                item: {
                    type: 'success',
                    message: msg
                }
            })
        }).catch((err) => {
            dispatch({
                type: 'ADD_MESSAGE',
                item: {
                    type: 'failed',
                    message: err.toString()
                }
            })
        })
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                columnGap: "20px",
                position: "absolute",
                top: 0,
                left: 0,
                margin: "10px 0 0 20px"
            }}
        >
            <Button
                color="teal"
                onClick={handleImport}
            >
                <FontAwesomeIcon icon={icon({name: "file-import"})} />
                <span>&nbsp;&nbsp;Import</span>
            </Button>
            <Button
                color="teal"
                onClick={handleExport}
            >
                <FontAwesomeIcon icon={icon({name: "download"})} />
                <span>&nbsp;&nbsp;Export</span>
            </Button>
        </div>
    )
}