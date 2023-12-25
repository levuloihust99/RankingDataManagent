import React from "react"
import axios from "axios"
import { Button, Modal, Loader } from "semantic-ui-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { AlertContext } from "../Alert/context"
import { BACKEND_URL } from "../../lib/constant"
import { urlJoin } from "../../lib/utils"
import "./style.css"

const importData = async (data) => {
    const endpoint = urlJoin(BACKEND_URL, "import_data")
    await axios.request({
        method: "POST",
        url: endpoint,
        data: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export const Importer = () => {
    const ref = React.useRef()
    const [openModal, setOpenModal] = React.useState(false)
    const { dispatch } = React.useContext(AlertContext)

    const importLogic = (e) => {
        return new Promise((resolve, reject) => {
            if (e.target.files.length === 0) resolve({})
            const file = e.target.files[0]

            const reader = new FileReader()
            reader.addEventListener("load", (event) => {
                const content = event.target.result
                let data = null
                try {
                    data = JSON.parse(content)
                } catch (err) {
                    reject({ message: "Invalid file content" })
                    return
                }
                if (data.length === 0) return
                const dataItem = data[0]
                if (
                    !dataItem.hasOwnProperty("input") ||
                    !dataItem.hasOwnProperty("output") ||
                    !dataItem.hasOwnProperty("score")
                ) {
                    reject({ message: "Invalid file content" })
                    return
                }
                importData(data)
                    .then(() => {
                        resolve({ message: "Imported data successfully!" })
                    })
                    .catch((err) => {
                        reject({ message: err.toString() })
                    })
            })
            reader.readAsText(file)
            setTimeout(() => reject({ message: "Timeout importing data" }), 10000)
        })
    }

    const handleImport = (e) => {
        setOpenModal(true)
        importLogic(e).then(({ message }) => {
            dispatch({
                type: 'ADD_MESSAGE',
                item: {
                    type: 'success',
                    message
                }
            })
        }).catch(({ message }) => {
            dispatch({
                type: 'ADD_MESSAGE',
                item: {
                    type: 'failed',
                    message
                }
            })
        }).finally(() => {
            setOpenModal(false)
            ref.current.value = ""
        })
    }

    return (
        <div id='import-container'>
            <div>
                <Button
                    color='teal'
                    onClick={() => {
                        ref.current.click()
                    }}
                >
                    <FontAwesomeIcon icon={icon({ name: "file-import" })} />
                    <span>&nbsp;&nbsp;Import</span>
                </Button>
                <input ref={ref} type='file' hidden onChange={handleImport}></input>
                <Modal dimmer='blurring' open={openModal} closeIcon={null}>
                    <Loader active size='large'>
                        Loading
                    </Loader>
                </Modal>
            </div>
        </div>
    )
}
