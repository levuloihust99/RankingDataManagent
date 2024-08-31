import React from "react"
import { clsx } from "clsx"
import { produce } from "immer"
import { Button } from "semantic-ui-react"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DatasetContext, WorkingModeContext } from "../context"
import { AlertContext } from "../../Alert/context"
import { updateComparisons } from "../../../api/crud"
import { doCopy } from "../../../lib/utils"
import { diffTexts } from "../../../api/diff"
import { ON_REQUEST_LOCK } from "../../../lib/lock"
import "./style.css"

const CardTextAreaContent = () => {
    const { state, dispatch } = React.useContext(CardContext)
    const [textAreaHeight, setTextAreaHeight] = React.useState("auto")
    const textareaRef = React.useRef()

    React.useEffect(() => {
        const task = { current: null }
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === textareaRef.current) {
                    clearTimeout(task.current)
                    task.current = setTimeout(() => {
                        // after 100ms timeout, textareaRef.current can be null
                        if (textareaRef.current != null) fitTextArea()
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

    const fitTextArea = () => {
        textareaRef.current.style.height = "auto"
        const fullScrollHeight = textareaRef.current.scrollHeight
        textareaRef.current.style.height = fullScrollHeight + "px"
        setTextAreaHeight(fullScrollHeight)
    }

    const handleOnChangeContent = (e) => {
        dispatch({
            type: "SET_LIVE_CONTENT",
            content: e.target.value,
        })
    }

    React.useEffect(() => {
        fitTextArea()
    }, [state.liveContent])

    return (
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
                    className='card-input-textarea'
                    ref={textareaRef}
                    readOnly={!state.onEdit}
                    value={state.liveContent}
                    onChange={handleOnChangeContent}
                ></textarea>
            </div>
        </div>
    )
}

const EditableSpan = ({ op, idx }) => {
    const [onEdit, setOnEdit] = React.useState(false)
    const [liveOp, setLiveOp] = React.useState(op)
    const eRef = React.useRef()
    const mountIndicator = React.useRef("initial")
    const { dispatch: datasetDispatch } = React.useContext(DatasetContext)
    const {
        state: { cardIdx, compIdx },
    } = React.useContext(CardContext)

    React.useEffect(() => {
        setLiveOp(op)
    }, [op])

    React.useEffect(() => {
        if (onEdit === false && mountIndicator.current !== "initial") {
            // save dataset change
            datasetDispatch({
                type: "UPDATE_DIFF_OP",
                cardIdx,
                compIdx,
                opIdx: idx,
                op: liveOp,
            })
        }
    }, [onEdit])

    React.useEffect(() => {
        mountIndicator.current = "subsequent"
    }, [])

    React.useEffect(() => {
        if (onEdit === true) {
            if (eRef.current) {
                eRef.current.select()
            }
        }
    }, [onEdit])

    const handleDoubleClick = (e) => {
        if (onEdit === true) return

        setOnEdit(true)

        const clickCloseHandler = (e) => {
            let element = e.target
            do {
                if (eRef.current && element === eRef.current)
                    // if click on this span, do nothing
                    return
                element = element.parentNode
            } while (element)

            // if click elsewhere, unfocus this span, remove the event handler
            setOnEdit(false)
            document.removeEventListener("click", clickCloseHandler)
            document.removeEventListener("dblclick", dbclickCloseHandler)
        }
        const dbclickCloseHandler = (e) => {
            let element = e.target
            do {
                if (eRef.current && element === eRef.current)
                    // if dbclick on this span, do nothing
                    return
                element = element.parentNode
            } while (element)

            // if dbclick elsewhere, unfocus this span, remove the event handler
            setOnEdit(false)
            document.removeEventListener("click", clickCloseHandler)
            document.removeEventListener("dblclick", dbclickCloseHandler)
        }

        setTimeout(() => {
            document.addEventListener("click", clickCloseHandler)
            document.addEventListener("dblclick", dbclickCloseHandler)
        }, 0)
    }

    const handleChange = (e) => {
        if (liveOp.op === "replace") {
            setLiveOp({ ...liveOp, by: e.target.value })
        } else if (liveOp.op === "insert") {
            setLiveOp({ ...liveOp, text: e.target.value })
        }
    }

    const renderInsertion = () => {
        if (onEdit)
            return (
                <input
                    ref={eRef}
                    className='inserted-span'
                    style={{
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                    value={liveOp.op === "replace" ? liveOp.by : liveOp.text}
                    onChange={handleChange}
                    onDoubleClick={handleDoubleClick}
                />
            )
        return (
            <span
                ref={eRef}
                className='inserted-span'
                onDoubleClick={handleDoubleClick}
                onChange={handleChange}
            >{`${liveOp.op === "replace" ? liveOp.by : liveOp.text}`}</span>
        )
    }

    if (liveOp.op === "insert") return renderInsertion()
    if (liveOp.op === "replace")
        return (
            <>
                <span className='deleted-span'>{`${liveOp.text}`}</span>
                {renderInsertion()}
            </>
        )
}

const CardDiffContent = ({ diff }) => {
    return (
        <div
            style={{
                padding: "10px",
                width: "100%",
            }}
        >
            <div>
                {diff.map((op, idx) => {
                    if (op.op === "equal") return <span key={idx}>{op.text}</span>
                    if (op.op === "insert") return <EditableSpan key={idx} op={op} idx={idx} />
                    if (op.op === "delete")
                        return <span key={idx} className='deleted-span'>{`${op.text}`}</span>
                    if (op.op === "replace") return <EditableSpan key={idx} op={op} idx={idx} />
                })}
            </div>
        </div>
    )
}

const EntitySpan = ({ text, idx }) => {
    const [onEdit, setOnEdit] = React.useState(false)
    const [liveText, setLiveText] = React.useState(text)
    const eRef = React.useRef()
    const mountIndicator = React.useRef("initial")
    const { dispatch: datasetDispatch } = React.useContext(DatasetContext)
    const {
        state: { cardIdx, compIdx },
    } = React.useContext(CardContext)

    React.useEffect(() => {
        setLiveText(text)
    }, [text])

    React.useEffect(() => {
        if (onEdit === false && mountIndicator.current !== "initial") {
            // save dataset change
            datasetDispatch({
                type: "UPDATE_ENTITY",
                entityIdx: idx,
                cardIdx,
                compIdx,
                text: liveText,
            })
        }
    }, [onEdit])

    React.useEffect(() => {
        mountIndicator.current = "subsequent"
    }, [])

    React.useEffect(() => {
        if (onEdit === true) {
            if (eRef.current) {
                eRef.current.select()
            }
        }
    }, [onEdit])

    const handleDoubleClick = (e) => {
        if (onEdit === true) return

        setOnEdit(true)

        const clickCloseHandler = (e) => {
            let element = e.target
            do {
                if (eRef.current && element === eRef.current)
                    // if click on this span, do nothing
                    return
                element = element.parentNode
            } while (element)

            // if click elsewhere, unfocus this span, remove the event handler
            setOnEdit(false)
            document.removeEventListener("click", clickCloseHandler)
            document.removeEventListener("dblclick", dbclickCloseHandler)
        }
        const dbclickCloseHandler = (e) => {
            let element = e.target
            do {
                if (eRef.current && element === eRef.current)
                    // if dbclick on this span, do nothing
                    return
                element = element.parentNode
            } while (element)

            // if dbclick elsewhere, unfocus this span, remove the event handler
            setOnEdit(false)
            document.removeEventListener("click", clickCloseHandler)
            document.removeEventListener("dblclick", dbclickCloseHandler)
        }

        setTimeout(() => {
            document.addEventListener("click", clickCloseHandler)
            document.addEventListener("dblclick", dbclickCloseHandler)
        }, 0)
    }

    const handleChange = (e) => {
        setLiveText(e.target.value)
    }

    const renderEntity = () => {
        if (onEdit) {
            return (
                <input
                    ref={eRef}
                    className='inserted-span'
                    style={{
                        outline: "none",
                        fontFamily: "inherit",
                    }}
                    value={liveText}
                    onChange={handleChange}
                    onDoubleClick={handleDoubleClick}
                />
            )
        }
        return (
            <span
                ref={eRef}
                className='inserted-span'
                onDoubleClick={handleDoubleClick}
                onChange={handleChange}
            >
                {liveText}
            </span>
        )
    }

    return renderEntity()
}

const CardEntityContent = ({ entities }) => {
    return (
        <div
            style={{
                padding: "10px",
                width: "100%",
            }}
        >
            <div>
                {entities.map((entity, idx) => {
                    debugger
                    if (entity.type === "outside") return <span key={idx}>{entity.text}</span>
                    return <EntitySpan key={idx} text={entity.text} idx={idx} />
                })}
            </div>
        </div>
    )
}

const cardReducer = (state, action) => {
    switch (action.type) {
        case "SET_LIVE_GENERATOR":
            return { ...state, liveGenerator: action.content }
        case "SET_PREV_LIVE_GENERATOR":
            return { ...state, prevLiveGenerator: action.content }
        case "SET_LIVE_CONTENT":
            return { ...state, liveContent: action.content }
        case "SET_PREV_LIVE_CONTENT":
            return { ...state, prevLiveContent: action.content }
        case "ON_EDIT_TRUE":
            return { ...state, onEdit: true }
        case "ON_EDIT_FALSE":
            return { ...state, onEdit: false }
        case "CONFIRM_EDIT": {
            return {
                ...state,
                onEdit: false,
                prevLiveContent: state.liveContent,
                prevLiveGenerator: state.liveGenerator,
            }
        }
        case "CANCEL_EDIT":
            return {
                ...state,
                onEdit: false,
                liveContent: state.prevLiveContent,
                liveGenerator: state.prevLiveGenerator,
            }
        default:
            return state
    }
}

const CardContext = React.createContext(null)

const Card = ({
    idx,
    compIdx,
    content,
    generator,
    cardType,
    cloneFn,
    updateItemFn,
    deleteFn,
    negative,
    metadata,
}) => {
    const [state, dispatch] = React.useReducer(cardReducer, {
        liveContent: content,
        prevLiveContent: content,
        liveGenerator: generator,
        prevLiveGenerator: generator,
        onEdit: false,
    })
    const { state: workingModeState } = React.useContext(WorkingModeContext)
    const [showActions, setShowActions] = React.useState(false)
    const actionsRef = React.useRef()

    React.useEffect(() => {
        dispatch({ type: "SET_LIVE_GENERATOR", content: generator })
        dispatch({ type: "SET_PREV_LIVE_GENERATOR", content: generator })
    }, [generator])

    React.useEffect(() => {
        dispatch({ type: "SET_LIVE_CONTENT", content })
        dispatch({ type: "SET_PREV_LIVE_CONTENT", content })
    }, [content])

    const handleOnChangeGenerator = (e) => {
        dispatch({ type: "SET_LIVE_GENERATOR", content: e.target.value })
    }

    const handleClickConfirmEdit = (e) => {
        dispatch({ type: "CONFIRM_EDIT" })
        updateItemFn({
            generator: state.liveGenerator,
            content: state.liveContent,
            type: cardType,
            cardIdx: idx,
            invalidateDiff: state.prevLiveContent !== state.liveContent,
        })
    }

    const handleClickCancelEdit = (e) => {
        dispatch({ type: "CANCEL_EDIT" })
        updateItemFn({
            generator: state.prevLiveGenerator,
            content: state.prevLiveContent,
            type: cardType,
            cardIdx: idx,
        })
    }

    const handleClickEllipsis = (e) => {
        if (showActions) {
            setShowActions(false)
            return
        }
        setShowActions(true)
        const closeHandler = (event) => {
            document.removeEventListener("click", closeHandler)
            let element = event.target
            do {
                if (actionsRef.current && element === actionsRef.current) return
                element = element.parentNode
            } while (element)
            setShowActions(false)
        }
        setTimeout(() => document.addEventListener("click", closeHandler), 0)
    }

    const handleClickDelete = (e) => {
        setShowActions(false)
        deleteFn({
            type: cardType,
            cardIdx: idx,
        })
    }

    const handleCopy = (e) => {
        doCopy(state.liveContent)
    }

    const renderCardContent = () => {
        if (workingModeState.workingMode === "normal") return <CardTextAreaContent />
        if (workingModeState.workingMode === "diff") {
            const { diff = null } = metadata || {}
            if (!diff) return <CardDiffContent diff={[{ op: "equal", text: state.liveContent }]} />
            return <CardDiffContent diff={diff} />
        }
        if (workingModeState.workingMode === "entity") {
            const { entities = null } = metadata || {}
            if (!entities) {
                return (
                    <CardEntityContent entities={[{ type: "outside", text: state.liveContent }]} />
                )
            }
            return <CardEntityContent entities={entities} />
        }
    }

    return (
        <div
            className='rounded-corner-container column-flex-container'
            style={{ margin: "20px 0" }}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "5px 10px 5px 10px",
                    borderBottom: "solid 1px rgb(222, 222, 223)",
                    position: "relative",
                }}
            >
                <div className='card-toolbar'>
                    {state.onEdit ? (
                        <>
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "check" })}
                                onClick={handleClickConfirmEdit}
                            />
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "xmark" })}
                                onClick={handleClickCancelEdit}
                            />
                        </>
                    ) : (
                        <>
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "pen-to-square" })}
                                onClick={(e) => dispatch({ type: "ON_EDIT_TRUE" })}
                            />
                            {cardType === "positive" ? (
                                <FontAwesomeIcon
                                    className='action-icon'
                                    icon={icon({ name: "arrow-right" })}
                                    onClick={(e) => cloneFn({ content: state.liveContent })}
                                />
                            ) : (
                                <FontAwesomeIcon
                                    className='action-icon'
                                    icon={icon({ name: "arrow-left" })}
                                    onClick={(e) => cloneFn({ content: state.liveContent })}
                                />
                            )}
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "copy", style: "regular" })}
                                onClick={handleCopy}
                            />
                        </>
                    )}
                </div>
                <div
                    style={{
                        flexGrow: 1,
                        maxWidth: "80%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <input
                        title={state.liveGenerator}
                        className={clsx(!state.onEdit && "overflow-ellipsis")}
                        style={{
                            width: "100%",
                            border: 0,
                            outline: "none",
                            textAlign: "center",
                            fontFamily: "inherit",
                        }}
                        readOnly={!state.onEdit}
                        value={state.liveGenerator}
                        onChange={handleOnChangeGenerator}
                    />
                </div>
                <div className='card-actions'>
                    <FontAwesomeIcon
                        className='action-icon'
                        icon={icon({ name: "ellipsis" })}
                        onClick={handleClickEllipsis}
                    />
                    {showActions && (
                        <div
                            ref={actionsRef}
                            style={{
                                minWidth: "100px",
                                backgroundColor: "white",
                                position: "absolute",
                                right: "-5px",
                                top: "25px",
                                boxShadow: "0px 0px 20px rgba(34, 36, 38, 0.15)",
                                borderRadius: "8px",
                            }}
                        >
                            <div
                                className='actions-menu-item'
                                style={{
                                    padding: "8px",
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    columnGap: "5px",
                                }}
                                onClick={handleClickDelete}
                            >
                                <FontAwesomeIcon
                                    icon={icon({ name: "trash-can", style: "regular" })}
                                />
                                <span>Delete</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <CardContext.Provider
                value={{
                    state: {
                        ...state,
                        cardIdx: idx,
                        compIdx,
                        type: negative === true ? "negative" : "positive",
                    },
                    dispatch,
                }}
            >
                {renderCardContent()}
            </CardContext.Provider>
        </div>
    )
}

const ComparisonRow = ({ positives, negatives, idx }) => {
    const { state, dispatch: datasetDispatch } = React.useContext(DatasetContext)
    const [show, setShow] = React.useState(false)
    const [showCriterion, setShowCriterion] = React.useState(false)
    const [criterion, setCriterion] = React.useState("conciseness")
    const menuRef = React.useRef()

    const handleCreatePositive = () => {
        datasetDispatch({
            type: "CREATE_POSITIVE",
            comparisonIdx: idx,
            rowIdx: state.activeRow,
        })
    }

    const handleCreateNegative = () => {
        datasetDispatch({
            type: "CREATE_NEGATIVE",
            comparisonIdx: idx,
            rowIdx: state.activeRow,
        })
    }

    const handleClonePosToNeg = ({ content }) => {
        datasetDispatch({
            type: "CLONE_POS_TO_NEG",
            content,
            comparisonIdx: idx,
            rowIdx: state.activeRow,
        })
    }

    const handleCloneNegToPos = ({ content }) => {
        datasetDispatch({
            type: "CLONE_NEG_TO_POS",
            content,
            comparisonIdx: idx,
            rowIdx: state.activeRow,
        })
    }

    const handleUpdateCompareItem = ({ generator, content, type, cardIdx, invalidateDiff }) => {
        datasetDispatch({
            type: "UPDATE_COMPARE_ITEM",
            itemType: type,
            generator,
            content,
            cardIdx,
            comparisonIdx: idx,
            rowIdx: state.activeRow,
            invalidateDiff,
        })
    }

    const handleDeleteCompareItem = ({ type, cardIdx }) => {
        datasetDispatch({
            type: "DELETE_COMPARE_ITEM",
            itemType: type,
            cardIdx,
            comparisonIdx: idx,
            rowIdx: state.activeRow,
        })
    }

    const handleClickShow = (e) => {
        if (show) {
            setShow(false)
            return
        }
        setShow(true)
        const closeHandler = (event) => {
            document.removeEventListener("click", closeHandler)
            let element = event.target
            do {
                if (menuRef.current && element === menuRef.current) return
                element = element.parentNode
            } while (element)
            setShow(false)
        }
        setTimeout(() => document.addEventListener("click", closeHandler), 0)
    }

    const handleDeleteRow = (e) => {
        setShow(false)
        datasetDispatch({
            type: "DELETE_COMPARE_ROW",
            rowIdx: state.activeRow,
            comparisonIdx: idx,
        })
    }

    const handleFormat = (e) => {
        datasetDispatch({
            type: "FORMAT_NEGATIVES",
            criterion,
            rowIdx: state.activeRow,
            comparisonIdx: idx,
        })
    }

    return (
        <>
            <tr>
                <td style={{ padding: "0 10px 0 20px", verticalAlign: "top" }}>
                    <div>
                        {positives.map((pos, cardIdx) => (
                            <Card
                                key={cardIdx}
                                idx={cardIdx}
                                compIdx={idx}
                                content={pos.content}
                                generator={pos.metadata.generator}
                                cardType='positive'
                                cloneFn={handleClonePosToNeg}
                                updateItemFn={handleUpdateCompareItem}
                                deleteFn={handleDeleteCompareItem}
                                negative={false}
                                metadata={{ entities: pos.entities }}
                            />
                        ))}
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "20px 0",
                            }}
                        >
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "plus" })}
                                onClick={(e) => handleCreatePositive()}
                            />
                        </div>
                    </div>
                </td>
                <td style={{ padding: "0 20px 0 10px", verticalAlign: "top" }}>
                    <div>
                        {negatives.map((neg, cardIdx) => (
                            <Card
                                key={cardIdx}
                                idx={cardIdx}
                                compIdx={idx}
                                content={neg.content}
                                generator={neg.metadata.generator}
                                cardType='negative'
                                cloneFn={handleCloneNegToPos}
                                updateItemFn={handleUpdateCompareItem}
                                deleteFn={handleDeleteCompareItem}
                                negative={true}
                                metadata={{ diff: neg.diff, entities: neg.entities }}
                            />
                        ))}
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "20px 0",
                            }}
                        >
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "plus" })}
                                onClick={(e) => handleCreateNegative()}
                            />
                        </div>
                    </div>
                </td>
            </tr>
            <tr style={{ borderBottom: "solid 1px rgb(222, 222, 223)" }}>
                <td colSpan={2}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <div style={{ position: "relative" }}>
                            <FontAwesomeIcon
                                className='action-icon'
                                style={{ fontSize: "1.5em" }}
                                icon={icon({ name: "ellipsis" })}
                                onClick={handleClickShow}
                            />
                            {show && (
                                <div
                                    ref={menuRef}
                                    style={{
                                        minWidth: "150px",
                                        backgroundColor: "white",
                                        position: "absolute",
                                        right: "-5px",
                                        bottom: "25px",
                                        boxShadow: "0px 0px 20px rgba(34, 36, 38, 0.15)",
                                        borderRadius: "8px",
                                        fontSize: "1.1em",
                                    }}
                                >
                                    <div className='actions-menu-item' onClick={handleDeleteRow}>
                                        <FontAwesomeIcon
                                            icon={icon({ name: "trash-can", style: "regular" })}
                                        />
                                        <span>Delete</span>
                                    </div>
                                    <div
                                        className='actions-menu-item'
                                        onMouseEnter={(e) => setShowCriterion(true)}
                                        onMouseLeave={(e) => setShowCriterion(false)}
                                        onClick={handleFormat}
                                    >
                                        <FontAwesomeIcon icon={icon({ name: "check-double" })} />
                                        <span>Format</span>
                                        {showCriterion && (
                                            <div
                                                style={{
                                                    minWidth: "160px",
                                                    backgroundColor: "white",
                                                    color: "initial",
                                                    position: "absolute",
                                                    left: "calc(100% - 8px)",
                                                    boxShadow:
                                                        "0px 0px 20px rgba(34, 36, 38, 0.15)",
                                                    borderRadius: "8px",
                                                    fontSize: "0.95em",
                                                }}
                                            >
                                                <div
                                                    className='actions-menu-item'
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setCriterion("conciseness")
                                                    }}
                                                >
                                                    <span>Conciseness</span>
                                                    {criterion === "conciseness" && (
                                                        <div
                                                            style={{
                                                                flexGrow: 1,
                                                                paddingRight: "10px",
                                                            }}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={icon({ name: "check" })}
                                                                style={{
                                                                    float: "right",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div
                                                    className='actions-menu-item'
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setCriterion("coverage")
                                                    }}
                                                >
                                                    <span>Coverage</span>
                                                    {criterion === "coverage" && (
                                                        <div
                                                            style={{
                                                                flexGrow: 1,
                                                                paddingRight: "10px",
                                                            }}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={icon({ name: "check" })}
                                                                style={{
                                                                    float: "right",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div
                                                    className='actions-menu-item'
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setCriterion("coherence")
                                                    }}
                                                >
                                                    <span>Coherence</span>
                                                    {criterion === "coherence" && (
                                                        <div
                                                            style={{
                                                                flexGrow: 1,
                                                                paddingRight: "10px",
                                                            }}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={icon({ name: "check" })}
                                                                style={{
                                                                    float: "right",
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>
        </>
    )
}

const CompareTable = ({ comparisons }) => {
    const { state, dispatch: datasetDispatch } = React.useContext(DatasetContext)
    const handleCreateComparison = () => {
        datasetDispatch({
            type: "CREATE_COMPARISON",
            rowIdx: state.activeRow,
        })
    }

    return (
        <table className='compare-table'>
            <thead>
                <tr>
                    <th className='compare-table-header'>Positives</th>
                    <th className='compare-table-header'>Negatives</th>
                </tr>
            </thead>
            <tbody>
                {comparisons.map((comp, idx) => (
                    <ComparisonRow
                        key={idx}
                        positives={comp.positives}
                        negatives={comp.negatives}
                        idx={idx}
                    />
                ))}
                <tr>
                    <td colSpan={2}>
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5em",
                                margin: "20px 0",
                            }}
                        >
                            <FontAwesomeIcon
                                className='action-icon'
                                icon={icon({ name: "circle-plus" })}
                                onClick={(e) => handleCreateComparison()}
                            />
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

const templateComparisons = [
    // {
    //     positives: [
    //         {
    //             content: "",
    //             metadata: {
    //                 generator: "ChatGPT-Plus",
    //             },
    //         },
    //     ],
    //     negatives: [],
    // },
    // {
    //     positives: [
    //         {
    //             content: "",
    //             metadata: {
    //                 generator: "claude-3-haiku",
    //             },
    //         },
    //     ],
    //     negatives: [],
    // },
    {
        positives: [
            {
                content: "",
                metadata: {
                    generator: "gemini-1.5-pro",
                },
            },
        ],
        negatives: [],
    },
]

export const Comparisons = ({ comparisons, visible = true }) => {
    const { dispatch: alertDispatch } = React.useContext(AlertContext)
    const { state, dispatch: datasetDispatch } = React.useContext(DatasetContext)
    const { state: workingModeState, dispatch: workingModeDispatch } =
        React.useContext(WorkingModeContext)
    const stateRef = React.useRef(state)
    const [showActionsMenu, setShowActionsMenu] = React.useState(false)
    const actionsMenuRef = React.useRef()
    const saveRef = React.useRef()

    React.useEffect(() => {
        stateRef.current = state
    }, [state])

    const handleSwitchView = (e) => {
        datasetDispatch({
            type: "SWITCH_RANK_VIEW",
        })
    }

    const save = ({ sampleId, comparisons }) => {
        updateComparisons({ sampleId, comparisons }).then(async (resp) => {
            if (resp.status === 200) {
                alertDispatch({
                    type: "ADD_MESSAGE",
                    item: {
                        type: "success",
                        message: "Saved successfully!",
                    },
                })
            } else {
                const err = await resp.text()
                alertDispatch({
                    type: "ADD_MESSAGE",
                    item: {
                        type: "failed",
                        message: err,
                    },
                })
            }
        })
    }

    const handleSave = (e) => {
        const ex = state.dataset[state.activeRow]
        save({
            sampleId: ex.sampleId,
            comparisons: ex.comparisons,
        })
    }

    React.useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault()
                const ex = stateRef.current.dataset[stateRef.current.activeRow]
                save({
                    sampleId: ex.sampleId,
                    comparisons: ex.comparisons,
                })
            } else if (e.key === "a") {
                const currentComparisons =
                    stateRef.current.dataset[stateRef.current.activeRow].comparisons
                if (currentComparisons == null || currentComparisons.length === 0) {
                    e.preventDefault()
                    datasetDispatch({
                        type: "TEMPLATE_COMPARISONS",
                        rowIdx: stateRef.current.activeRow,
                        templateComparisons,
                    })
                }
            }
        }
        document.addEventListener("keydown", handler)
        return () => {
            document.removeEventListener("keydown", handler)
        }
    }, [])

    React.useEffect(() => {
        // trigger diff calculation on switching to another sample
        if (workingModeState.workingMode === "diff") {
            const alignedRequestData = []
            const alignedLocators = []
            for (let compIdx = 0; compIdx < comparisons.length; compIdx++) {
                // support postives[0] only
                const comp = comparisons[compIdx]
                const positive = comp.positives.length > 0 ? comp.positives[0] : null
                if (positive) {
                    for (let negIdx = 0; negIdx < comp.negatives.length; negIdx++) {
                        const negative = comp.negatives[negIdx]
                        if (!negative.diff) {
                            alignedRequestData.push({
                                diffTo: positive.content,
                                diffOn: negative.content,
                            })
                            alignedLocators.push({ compIdx, negIdx })
                        }
                    }
                    if (alignedRequestData.length > 0) {
                        ON_REQUEST_LOCK.value = true
                        workingModeDispatch({ type: "CALCULATION_ON" })
                        diffTexts(alignedRequestData).then(async (resp) => {
                            ON_REQUEST_LOCK.value = false
                            if (resp.status === 200) {
                                const alignedDiffs = await resp.json()
                                datasetDispatch({
                                    type: "UPDATE_DIFF",
                                    sampleId: state.dataset[state.activeRow].sampleId,
                                    diffs: alignedDiffs,
                                    locators: alignedLocators,
                                })
                            } else {
                                const err = await resp.text()
                                alertDispatch({
                                    type: "ADD_MESSAGE",
                                    item: {
                                        type: "failed",
                                        message: err,
                                    },
                                })
                            }
                            workingModeDispatch({
                                type: "CALCULATION_OFF",
                            })
                        })
                    }
                }
            }
        }
    }, [state.activeRow])

    const handleRevealID = (e) => {
        doCopy(state.dataset[state.activeRow].sampleId)
    }

    const handleCreateTemplate = (e) => {
        datasetDispatch({
            type: "TEMPLATE_COMPARISONS",
            rowIdx: state.activeRow,
            templateComparisons,
        })
    }

    const handleClickActionsMenu = (e) => {
        if (showActionsMenu) {
            setShowActionsMenu(false)
            return
        }
        setShowActionsMenu(true)
        const closeHandler = (event) => {
            document.removeEventListener("click", closeHandler)
            let element = event.target
            do {
                if (actionsMenuRef.current && element === actionsMenuRef.current) return
                element = element.parentNode
            } while (element)
            setShowActionsMenu(false)
        }
        setTimeout(() => document.addEventListener("click", closeHandler), 0)
    }

    return (
        <div
            className='comparisons-container'
            style={{ ...(visible ? { zIndex: 3 } : { zIndex: 1 }) }}
        >
            <div
                style={{
                    position: "sticky",
                    zIndex: 1,
                    top: 0,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        backgroundColor: "white",
                        padding: "10px 0",
                    }}
                >
                    <div
                        className='comparisons-back-data'
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
                            alignItems: "center",
                            columnGap: "10px",
                        }}
                    >
                        <div style={{ position: "relative" }} onClick={handleClickActionsMenu}>
                            <FontAwesomeIcon
                                icon={icon({ name: "ellipsis-vertical" })}
                                className='action-icon'
                            />
                            <div
                                ref={actionsMenuRef}
                                style={{
                                    ...{
                                        minWidth: "160px",
                                        backgroundColor: "white",
                                        color: "initial",
                                        position: "absolute",
                                        right: "calc(100% + 8px)",
                                        top: 0,
                                        boxShadow: "0px 0px 20px rgba(34, 36, 38, 0.15)",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        fontWeight: "bold",
                                    },
                                    ...(showActionsMenu ? {} : { display: "none" }),
                                }}
                            >
                                <div className='actions-menu-item teal' onClick={handleSave}>
                                    <FontAwesomeIcon icon={icon({ name: "floppy-disk" })} />
                                    <span ref={saveRef} style={{ marginLeft: "5px" }}>
                                        Save
                                    </span>
                                </div>
                                <div className='actions-menu-item teal' onClick={handleSwitchView}>
                                    <FontAwesomeIcon icon={icon({ name: "sliders" })} />
                                    <span style={{ marginLeft: "5px" }}>Switch</span>
                                </div>
                                <div className='actions-menu-item teal' onClick={handleRevealID}>
                                    <FontAwesomeIcon icon={icon({ name: "key" })} />
                                    <span style={{ marginLeft: "5px" }}>Reveal ID</span>
                                </div>
                            </div>
                        </div>
                        <Button color='teal' onClick={handleCreateTemplate}>
                            <FontAwesomeIcon icon={icon({ name: "code" })} />
                            <span style={{ marginLeft: "5px" }}>Template</span>
                        </Button>
                    </div>
                </div>
                <div className='header-block'>COMPARISONS</div>
            </div>
            <CompareTable comparisons={comparisons} />
        </div>
    )
}
