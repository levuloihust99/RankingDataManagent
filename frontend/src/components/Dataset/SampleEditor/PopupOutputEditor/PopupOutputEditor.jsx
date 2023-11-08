import React from 'react'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { CodeBlock, dracula, github } from "react-code-blocks";
import { HorizontalSeparator } from '../../../common/Separator';
import { DatasetContext } from '../../context';
import "./style.css"

export const PopupOutputEditor = ({ item, rowIdx, outputIdx }) => {
    const [onEditContent, setOnEditContent] = React.useState(false)
    const [contentHeight, setContentHeight] = React.useState("auto")
    const [liveContent, setLiveContent] = React.useState(item.content)
    const [prevLiveContent, setPrevLiveContent] = React.useState(item.content)
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
    }, [liveContent])

    React.useEffect(() => {
        setPrevLiveContent(item.content)
        setLiveContent(item.content)
    }, [item.content])

    const handleChangeContent = (e) => {
        setLiveContent(e.target.value)
    }

    const handleClickEditContent = (e) => {
        setOnEditContent(true)
        inputRef.current.select()
    }

    const handleCancelEdit = (e) => {
        console.log(prevLiveContent)
        console.log("Click canceled")
        setLiveContent(prevLiveContent)
        setOnEditContent(false)
    }

    const handleConfirmEdit = (e) => {
        setPrevLiveContent(liveContent)
        setOnEditContent(false)

        // dispatch action
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
                className="rounded-corner-container column-flex-container"
                style={{
                    marginBottom: "10px"
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
                    {!onEditContent ? (
                        <FontAwesomeIcon
                            className="action-icon"
                            icon={icon({ name: "pen-to-square" })}
                            style={{
                                marginRight: "8px"
                            }}
                            onClick={handleClickEditContent}
                        />
                    ) : (
                        <>
                            <FontAwesomeIcon
                                className="action-icon"
                                icon={icon({ name: "check" })}
                                style={{
                                    marginRight: "8px"
                                }}
                                onClick={handleConfirmEdit}
                            />
                            <FontAwesomeIcon
                                className="action-icon"
                                icon={icon({ name: "xmark" })}
                                style={{
                                    marginRight: "8px"
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
                            className="output-content-area"
                            ref={inputRef}
                            readOnly={!onEditContent}
                            value={liveContent}
                            onChange={handleChangeContent}
                            style={{
                                padding: 0,
                                overflow: "hidden"
                            }}
                        >
                        </textarea>
                    </div>
                </div>
            </div>
            <HorizontalSeparator width="10px" />
            <div>
                <CodeBlock
                    text={JSON.stringify(item.metadata, null, 4)}
                    language="json"
                    theme={github}
                />
            </div>
        </>
    )
}