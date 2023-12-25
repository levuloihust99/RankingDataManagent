import React from 'react'
import { Button } from "semantic-ui-react"
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { globalConfig } from '../../lib/config'

export const SaveButton = () => {
    const handleSave = async () => {
        const saveButton = document.getElementById(globalConfig.saveDataButtonId)
        if (saveButton) {
            saveButton.click()
        }
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