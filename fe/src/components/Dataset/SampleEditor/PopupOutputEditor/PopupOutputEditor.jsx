import React, { useContext } from "react"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { CodeBlock, dracula, github } from "react-code-blocks"
import { HorizontalSeparator } from "../../../common/Separator"
import { DatasetContext } from "../../context"
import { doCopy } from "../../../../lib/utils"
import { PopupContext } from "../DndCard/context"
import "./style.css"

export const PopupOutputEditor = ({ outputIdx }) => {
    const [contentHeight, setContentHeight] = React.useState("auto")
    const { popupState, popupDispatch } = React.useContext(PopupContext)
    const { dispatch } = useContext(DatasetContext)
    const inputRef = React.useRef()

    React.useEffect(() => {
        const task = { current: null }
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === inputRef.current) {
                    clearTimeout(task.current)
                    task.current = setTimeout(() => {
                        fitTextArea()
                    }, 100)
                }
            }
        })
        observer.observe(inputRef.current)
        return () => {
            if (inputRef.current) {
                observer.unobserve(inputRef.current)
            }
        }
    }, [])

    React.useEffect(() => {
        fitTextArea()
    }, [popupState.liveContent])

    const handleChangeContent = (e) => {
        popupDispatch({ type: "SET_LIVE_CONTENT", content: e.target.value })
    }

    const handleClickEditContent = (e) => {
        popupDispatch({ type: "CLICK_EDIT" })
        inputRef.current.select()
    }

    const handleCancelEdit = (e) => {
        popupDispatch({ type: "CANCEL_EDIT" })
    }

    const handleConfirmEdit = (e) => {
        popupDispatch({ type: "CONFIRM_EDIT" })

        // dispatch action
        dispatch({
            type: "CHANGE_OUTPUT",
            outputIdx,
            content: popupState.liveContent,
            generator: popupState.liveGenerator,
        })
    }

    const handleCopy = (e) => {
        doCopy(popupState.liveContent)
    }

    const handleRemoveOutput = (e) => {
        dispatch({ type: "REMOVE_OUTPUT", outputIdx })
    }

    const fitTextArea = () => {
        inputRef.current.style.height = "auto"
        const fullScrollHeight = inputRef.current.scrollHeight
        inputRef.current.style.height = fullScrollHeight + "px"
        setContentHeight(fullScrollHeight)
    }

    return (
        <>
            <div
                className='rounded-corner-container column-flex-container'
                style={{
                    marginBottom: "10px",
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
                    {!popupState.onEdit ? (
                        <>
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "pen-to-square" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleClickEditContent}
                            />
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "copy", style: "regular" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleCopy}
                            />
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "trash-can", style: "regular" })}
                                onClick={handleRemoveOutput}
                            />
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "check" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleConfirmEdit}
                            />
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "xmark" })}
                                style={{
                                    marginRight: "8px",
                                }}
                                onClick={handleCancelEdit}
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
                            height: `${contentHeight}px`,
                        }}
                    >
                        <textarea
                            className='output-content-area'
                            ref={inputRef}
                            readOnly={!popupState.onEdit}
                            value={popupState.liveContent}
                            onChange={handleChangeContent}
                            style={{
                                padding: 0,
                                overflow: "hidden",
                                color: "initial"
                            }}
                        ></textarea>
                    </div>
                </div>
            </div>
            <HorizontalSeparator width='10px' />
            <div>
                <CodeBlock
                    text={JSON.stringify({ generator: popupState.liveGenerator }, null, 4)}
                    language='json'
                    theme={github}
                />
            </div>
        </>
    )
}
