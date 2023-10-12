import React from "react"
import { CodeBlock, dracula, github } from "react-code-blocks";
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MainComponentContext } from "../MainComponent/context";
import "./style.css"

export const SampleEditor = ({ input, outputs, metadata }) => {
    const { setRowOnEdit } = React.useContext(MainComponentContext)
    const [liveMetadata, setLiveMetadata] = React.useState(metadata)
    const [liveInput, setLiveInput] = React.useState(input)
    const [divHeight, setDivHeight] = React.useState("auto")
    const textareaRef = React.useRef()

    React.useEffect(() => {
        setLiveMetadata(JSON.stringify(metadata, null, 4))
    }, [metadata])

    React.useEffect(() => {
        setLiveInput(input)
        const fullScrollHeight = textareaRef.current.scrollHeight
        setDivHeight(`${fullScrollHeight + 20}px`)
    }, [input])

    const renderOutputContainer = () => {
        return (
            <div className="sample-editor-output-container">
                {outputs.map((item, idx) => {
                    return (
                        <div className="sample-editor-output-item">
                            {item.content}
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderInputArea = () => {
        return (
            <div
                className="sample-editor-input-container"
                style={{
                    padding: "10px 10px 10px 20px",
                    height: divHeight
                }}
            >
                <textarea
                    className="sample-editor-input-area"
                    value={`${liveInput}`}
                    ref={textareaRef}
                >
                </textarea>
            </div>
        )
    }

    const renderMetaData = () => {
        return (
            <CodeBlock
                text={liveMetadata}
                language="json"
                theme={github}
            />
        )
    }

    return (
        <div className="sample-editor-container">
            <div
                style={{display: "flex", flexDirection: "row"}}
            >
                <div
                    className="sample-editor-back-data"
                    onClick={(e) => setRowOnEdit(-1)}
                    style={{
                        paddingLeft: "20px",
                        fontSize: "1.25em"
                    }}
                >
                    <FontAwesomeIcon icon={icon({name: "angle-left"})} />
                    &nbsp;&nbsp;Data
                </div>
            </div>
            <HeaderBlock text="MAIN CONTENT" />
            <div className="sample-editor-main-area">
                {renderInputArea()}
                <Separator />
                {renderOutputContainer()}
            </div>
            <HeaderBlock text="METADATA" />
            <div>
                {renderMetaData()}
            </div>
        </div>
    )
}

const HeaderBlock = ({ text }) => {
    return (
        <div
            style={{
                backgroundColor: "rgb(86, 143, 150)",
                fontVariant: "small-caps",
                fontSize: "1.25em",
                padding: "8px",
                color: "white",
                lineHeight: 1.5,
                marginTop: "20px",
                fontWeight: "bold"
            }}
        >
            {text}
        </div>
    )
}

const Separator = () => {
    return (
        <div
            style={{
                width: "20px"
            }}
        >
        </div>
    )
}