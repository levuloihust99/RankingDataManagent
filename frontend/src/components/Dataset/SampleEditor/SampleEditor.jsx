import React from "react"
import { CodeBlock, dracula, github } from "react-code-blocks";
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { DatasetContext } from "../context";
import { DndCard } from "./DndCard";
import { VerticalSeparator } from "../../common/Separator";
import "./style.css"

export const SampleEditor = () => {
    const { state: { dataset, activeRow }, dispatch } = React.useContext(DatasetContext)
    const { input, metadata } = dataset[activeRow]
    const [liveMetadata, setLiveMetadata] = React.useState(metadata)

    const [liveInput, setLiveInput] = React.useState(input)
    const [prevLiveInput, setPrevLiveInput] = React.useState(input)
    const [onEditInput, setOnEditInput] = React.useState(false)

    const [textAreaHeight, setTextAreaHeight] = React.useState("auto")
    const textareaRef = React.useRef()

    React.useEffect(() => {
        const task = { current: null }
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === textareaRef.current) {
                    clearTimeout(task.current)
                    task.current = setTimeout(() => {
                        fitTextArea()
                    }, 100)
                }
            }
        })
        observer.observe(textareaRef.current)
        return () => {
            if (textareaRef.current) {
                observer.unobserve(textareaRef.current)
            }
        }
    }, [])

    React.useEffect(() => {
        setLiveMetadata(JSON.stringify(metadata, null, 4))
    }, [metadata])

    React.useEffect(() => {
        fitTextArea()
    }, [liveInput])

    const handleOnChangeInput = (e) => {
        setLiveInput(e.target.value)
    }

    const handleClickConfirmEditInput = (e) => {
        setOnEditInput(false)
        setPrevLiveInput(liveInput)
    }

    const handleClickCancelEditInput = (e) => {
        setOnEditInput(false)
        setLiveInput(prevLiveInput)
    }

    const handleClickEditInput = (e) => {
        setOnEditInput(true)
        textareaRef.current.select()
    }

    const fitTextArea = () => {
        textareaRef.current.style.height = "auto"
        const fullScrollHeight = textareaRef.current.scrollHeight
        textareaRef.current.style.height = fullScrollHeight + "px"
        setTextAreaHeight(fullScrollHeight)
    }

    const renderOutputContainer = () => {
        return (
            <div className="sample-editor-output-container">
                <DndCard />
            </div>
        )
    }

    const renderInputArea = () => {
        return (
            <div
                className="rounded-corner-container column-flex-container"
                style={{
                    marginBottom: "10px",
                    flexGrow: 1,
                    margin: "10px 10px 10px 20px"
                }}
            >
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        padding: "10px",
                        borderBottom: "solid 1px rgb(222, 222, 223)"
                    }}
                >
                    {!onEditInput ? (
                        <FontAwesomeIcon
                            className="action-icon"
                            icon={icon({ name: "pen-to-square" })}
                            style={{
                                marginRight: "8px"
                            }}
                            onClick={handleClickEditInput}
                        />
                    ) : (
                        <>
                            <FontAwesomeIcon
                                className="action-icon"
                                icon={icon({ name: "check" })}
                                style={{
                                    marginRight: "8px"
                                }}
                                onClick={handleClickConfirmEditInput}
                            />
                            <FontAwesomeIcon
                                className="action-icon"
                                icon={icon({ name: "xmark" })}
                                style={{
                                    marginRight: "8px"
                                }}
                                onClick={handleClickCancelEditInput}
                            />
                        </>
                    )}
                </div>
                <div
                    style={{
                        padding: "10px",
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            height: `${textAreaHeight}px`,
                        }}
                    >
                        <textarea
                            className="sample-editor-input-area"
                            ref={textareaRef}
                            readOnly={!onEditInput}
                            value={liveInput}
                            onChange={handleOnChangeInput}
                        >
                        </textarea>
                    </div>
                </div>
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
                style={{ display: "flex", flexDirection: "row" }}
            >
                <div
                    className="sample-editor-back-data"
                    onClick={(e) => dispatch({
                        type: "SET_ACTIVE_ROW",
                        activeRow: -1
                    })}
                    style={{
                        paddingLeft: "20px",
                        fontSize: "1.25em"
                    }}
                >
                    <FontAwesomeIcon icon={icon({ name: "angle-left" })} />
                    &nbsp;&nbsp;Data
                </div>
            </div>
            <HeaderBlock text="MAIN CONTENT" />
            <div className="sample-editor-main-area">
                {renderInputArea()}
                <VerticalSeparator width="20px" />
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
