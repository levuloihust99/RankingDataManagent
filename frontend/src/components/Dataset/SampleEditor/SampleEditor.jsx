import React from "react"
import { v4 as uuidv4 } from 'uuid'
import { Button } from "semantic-ui-react"
import { CodeBlock, dracula, github } from "react-code-blocks"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DatasetContext } from "../context"
import { DndCard } from "./DndCard"
import { VerticalSeparator } from "../../common/Separator"
import "./style.css"

export const SampleEditor = () => {
    const {
        state: { dataset, activeRow },
        dispatch: datasetDispatch
    } = React.useContext(DatasetContext)
    const { input, metadata } = dataset[activeRow]
    const [liveMetadata, setLiveMetadata] = React.useState(metadata)

    const [liveInput, setLiveInput] = React.useState(input)
    const [prevLiveInput, setPrevLiveInput] = React.useState(input)
    const [onEditInput, setOnEditInput] = React.useState(false)

    const [textAreaHeight, setTextAreaHeight] = React.useState("auto")
    const textareaRef = React.useRef()

    const [dndCardUID, setDndCardUID] = React.useState(uuidv4())

    const remountDndCard = () => {
        setDndCardUID(uuidv4())
    }

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

    const handleSwitchView = (e) => {
        datasetDispatch({
            type: "SWITCH_COMPARE_VIEW",
        })
    }

    const handleCopy = (e) => {
        navigator.clipboard.writeText(liveInput)
    }

    const handleGeneratePrompt = (e) => {
        const prompt = `Viết một đoạn văn dài tối đa 3 câu để tóm tắt văn bản sau đây:\n"""\n${liveInput}\n"""`
        navigator.clipboard.writeText(prompt)
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
                <DndCard key={dndCardUID} remountDndCard={remountDndCard} />
            </div>
        )
    }

    const renderInputArea = () => {
        return (
            <div
                className='rounded-corner-container column-flex-container'
                style={{
                    marginBottom: "10px",
                    flexGrow: 1,
                    margin: "10px 10px 10px 20px",
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
                        borderBottom: "solid 1px rgb(222, 222, 223)",
                    }}
                >
                    {!onEditInput ? (
                        <>
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "pen-to-square" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleClickEditInput}
                            />
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "copy", style: "regular" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleCopy}
                            />
                            <svg
                                fill='currentColor'
                                width='1em'
                                height='1em'
                                viewBox='0 0 24 24'
                                role='img'
                                xmlns='http://www.w3.org/2000/svg'
                                className='action-icon'
                                onClick={handleGeneratePrompt}
                            >
                                <title>OpenAI icon</title>
                                <path d='M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z' />
                            </svg>
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "check" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleClickConfirmEditInput}
                            />
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "xmark" })}
                                style={{
                                    marginRight: "8px",
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
                            className='sample-editor-input-area'
                            ref={textareaRef}
                            readOnly={!onEditInput}
                            value={liveInput}
                            onChange={handleOnChangeInput}
                        ></textarea>
                    </div>
                </div>
            </div>
        )
    }

    const renderMetaData = () => {
        return <CodeBlock text={liveMetadata} language="json" theme={github} />
    }

    return (
        <div id='sample-editor' className='sample-editor-container'>
            <div
                style={{
                    padding: "10px 0",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    backgroundColor: "white",
                    boxShadow: "rgba(0, 0, 0, 0.15) 0px 0px 5px 3px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <div
                        className='sample-editor-back-data'
                        onClick={(e) =>
                            datasetDispatch({
                                type: "SET_TABLE_VIEW",
                            })
                        }
                        style={{
                            paddingLeft: "20px",
                            fontSize: "1.25em",
                        }}
                    >
                        <FontAwesomeIcon icon={icon({ name: "angle-left" })} />
                        <span style={{ marginLeft: "5px" }}>Data</span>
                    </div>
                    <div
                        style={{
                            marginRight: "20px",
                            display: "flex",
                            flexDirection: "row-reverse",
                            justifyContent: "flex-end",
                            columnGap: "10px",
                        }}
                    >
                        <Button color='teal' onClick={handleSwitchView}>
                            <FontAwesomeIcon icon={icon({ name: "sliders" })} />
                            <span style={{ marginLeft: "5px" }}>Switch</span>
                        </Button>
                    </div>
                </div>
            </div>
            <div className='header-block'>MAIN CONTENT</div>
            <div className='sample-editor-main-area'>
                {renderInputArea()}
                <VerticalSeparator width='20px' />
                {renderOutputContainer()}
            </div>
            <div className='header-block' style={{ marginTop: "20px" }}>
                METADATA
            </div>
            <div>{renderMetaData()}</div>
        </div>
    )
}
