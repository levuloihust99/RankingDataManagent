import React from 'react'
import { Modal, Loader, Button, Checkbox, Input, Label } from 'semantic-ui-react'
import { saveAs } from 'file-saver'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BACKEND_URL } from '../../lib/constant'
import { urlJoin } from '../../lib/utils'
import "./style.css"

const Separator = () => {
    return (
        <div
            style={{
                height: "20px"
            }}
        >
        </div>
    )
}

export const Exporter = () => {
    const [isShuffle, setIsShuffle] = React.useState(false)
    const [exporting, setExporting] = React.useState(false)
    const [value, setValue] = React.useState(-1)
    const [seed, setSeed] = React.useState(12345)

    const handleChangeValue = (e) => {
        setValue(e.target.value)
    }

    const handleChangeSeed = (e) => {
        setSeed(e.target.value)
    }

    const handleExportData = async (e) => {
        setExporting(true)
        const endpoint = urlJoin(BACKEND_URL, "export_data")
        const response = await fetch(endpoint, {
            method: "POST",
            body: JSON.stringify({
                size: parseInt(value),
                shuffle: isShuffle
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        const blob = await response.blob()
        saveAs(blob, "data.zip")
        setExporting(false)
    }

    return (
        <div className="exporter">
            <Checkbox
                label="Shuffle"
                checked={isShuffle}
                onClick={(e) => { setIsShuffle(!isShuffle) }}
            />
            <Separator />
            <label>
                <span style={{marginRight: "10px"}}>Size</span>
                <Input type="number" value={value} onChange={handleChangeValue} />
            </label>
            <Separator />
            <label>
                <span style={{marginRight: "10px"}}>Seed</span>
                <Input type="number" value={seed} onChange={handleChangeSeed} />
            </label>
            <Separator />
            <Button
                color="teal"
                onClick={handleExportData}
            >
                <FontAwesomeIcon
                    icon={icon({name: "download"})}
                    style={{
                        float: "right",
                        marginLeft: "10px"
                    }}
                />
                Export data
            </Button>
            {exporting && (
                <Modal dimmer="blurring" open={true} closeIcon={null}>
                    <Loader active size="large">
                        Loading
                    </Loader>
                </Modal>
            )}
        </div>
    )
}