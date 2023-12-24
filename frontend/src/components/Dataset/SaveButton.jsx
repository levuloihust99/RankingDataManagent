import React from 'react'
import { Button } from "semantic-ui-react"
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { AlertContext } from "../Alert/context"

export const SaveButton = () => {
    const { dispatch } = React.useContext(AlertContext)

    const handleSave = async () => {
        // call API
        await new Promise((resolve, reject) => {
            setTimeout(() => resolve("Saved successfully!"), 500)
            // setTimeout(() => reject("Failed to save!"), 0)
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
        <Button
            id="save-button"
            color="teal"
            style={{
                position: "absolute",
                top: 0,
                right: 0,
                marginTop: "10px",
                marginRight: "20px"
            }}
            onClick={handleSave}
        >
            <FontAwesomeIcon icon={icon({name: "floppy-disk"})} />
            <span>&nbsp;&nbsp;&nbsp;Save</span>
        </Button>
    )
}