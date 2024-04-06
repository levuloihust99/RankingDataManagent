import React from "react"
import { clsx } from "clsx"
import { Button } from "semantic-ui-react"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { DatasetContext } from "../context"
import { AlertContext } from "../../Alert/context"
import { updateComparisons } from "../../../api/crud"
import { doCopy } from "../../../lib/utils"
import "./style.css"

const Card = ({ idx, content, generator, cardType, cloneFn, updateItemFn, deleteFn }) => {
    const [liveContent, setLiveContent] = React.useState(content)
    const [prevLiveContent, setPrevLiveContent] = React.useState(content)
    const [liveGenerator, setLiveGenerator] = React.useState(generator)
    const [prevLiveGenerator, setPrevLiveGenerator] = React.useState(generator)
    const [onEdit, setOnEdit] = React.useState(false)
    const textareaRef = React.useRef()
    const [textAreaHeight, setTextAreaHeight] = React.useState("auto")
    const [showActions, setShowActions] = React.useState(false)
    const actionsRef = React.useRef()

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

    const fitTextArea = () => {
        textareaRef.current.style.height = "auto"
        const fullScrollHeight = textareaRef.current.scrollHeight
        textareaRef.current.style.height = fullScrollHeight + "px"
        setTextAreaHeight(fullScrollHeight)
    }

    React.useEffect(() => {
        setLiveContent(content)
        setPrevLiveContent(content)
    }, [content])

    React.useEffect(() => {
        setLiveGenerator(generator)
        setPrevLiveGenerator(generator)
    }, [generator])

    React.useEffect(() => {
        fitTextArea()
    }, [liveContent])

    const handleOnChangeContent = (e) => {
        setLiveContent(e.target.value)
    }

    const handleOnChangeGenerator = (e) => {
        setLiveGenerator(e.target.value)
    }

    const handleClickConfirmEdit = (e) => {
        setOnEdit(false)
        setPrevLiveContent(liveContent)
        setPrevLiveGenerator(liveGenerator)
        updateItemFn({
            generator: liveGenerator,
            content: liveContent,
            type: cardType,
            cardIdx: idx,
        })
    }

    const handleClickCancelEdit = (e) => {
        setOnEdit(false)
        setLiveContent(prevLiveContent)
        setLiveGenerator(prevLiveGenerator)
        updateItemFn({
            generator: prevLiveGenerator,
            content: prevLiveContent,
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
        e.stopPropagation()
        const closeHandler = (event) => {
            let element = event.target
            do {
                if (actionsRef.current && element === actionsRef.current) return
                element = element.parentNode
            } while (element)
            document.removeEventListener("click", closeHandler)
            setShowActions(false)
        }
        document.addEventListener("click", closeHandler)
    }

    const handleClickDelete = (e) => {
        setShowActions(false)
        deleteFn({
            type: cardType,
            cardIdx: idx,
        })
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
                    {onEdit ? (
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
                                onClick={(e) => setOnEdit(true)}
                            />
                            {cardType === "positive" ? (
                                <FontAwesomeIcon
                                    className='action-icon'
                                    icon={icon({ name: "arrow-right" })}
                                    onClick={(e) => cloneFn({ content: liveContent })}
                                />
                            ) : (
                                <FontAwesomeIcon
                                    className='action-icon'
                                    icon={icon({ name: "arrow-left" })}
                                    onClick={(e) => cloneFn({ content: liveContent })}
                                />
                            )}
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
                        title={liveGenerator}
                        className={clsx(!onEdit && "overflow-ellipsis")}
                        style={{
                            width: "100%",
                            border: 0,
                            outline: "none",
                            textAlign: "center",
                            fontFamily: "inherit",
                        }}
                        readOnly={!onEdit}
                        value={liveGenerator}
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
                        readOnly={!onEdit}
                        value={liveContent}
                        onChange={handleOnChangeContent}
                    ></textarea>
                </div>
            </div>
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

    const handleUpdateCompareItem = ({ generator, content, type, cardIdx }) => {
        datasetDispatch({
            type: "UPDATE_COMPARE_ITEM",
            itemType: type,
            generator,
            content,
            cardIdx,
            comparisonIdx: idx,
            rowIdx: state.activeRow,
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
        e.stopPropagation()
        const closeHandler = (event) => {
            let element = event.target
            do {
                if (menuRef.current && element === menuRef.current) return
                element = element.parentNode
            } while (element)
            document.removeEventListener("click", closeHandler)
            setShow(false)
        }
        document.addEventListener("click", closeHandler)
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
                        {positives.map((pos, idx) => (
                            <Card
                                key={idx}
                                idx={idx}
                                content={pos.content}
                                generator={pos.metadata.generator}
                                cardType='positive'
                                cloneFn={handleClonePosToNeg}
                                updateItemFn={handleUpdateCompareItem}
                                deleteFn={handleDeleteCompareItem}
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
                        {negatives.map((neg, idx) => (
                            <Card
                                key={idx}
                                idx={idx}
                                content={neg.content}
                                generator={neg.metadata.generator}
                                cardType='negative'
                                cloneFn={handleCloneNegToPos}
                                updateItemFn={handleUpdateCompareItem}
                                deleteFn={handleDeleteCompareItem}
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

export const Comparisons = ({ comparisons }) => {
    const { dispatch: alertDispatch } = React.useContext(AlertContext)
    const { state, dispatch: datasetDispatch } = React.useContext(DatasetContext)

    const handleSwitchView = (e) => {
        datasetDispatch({
            type: "SWITCH_RANK_VIEW",
        })
    }

    const handleSave = (e) => {
        updateComparisons({ sampleId: state.dataset[state.activeRow].sampleId, comparisons }).then(
            async (r) => {
                if (r.status === 200) {
                    alertDispatch({
                        type: "ADD_MESSAGE",
                        item: {
                            type: "success",
                            message: "Saved successfully!",
                        },
                    })
                } else {
                    const err = await r.text()
                    alertDispatch({
                        type: "ADD_MESSAGE",
                        item: {
                            type: "failed",
                            message: err,
                        },
                    })
                }
            }
        )
    }

    const handleRevealID = (e) => {
        doCopy(state.dataset[state.activeRow].sampleId)
    }

    const handleCreateTemplate = (e) => {
        datasetDispatch({
            type: "TEMPLATE_COMPARISONS",
            rowIdx: state.activeRow,
            templateComparisons: [
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
            ],
        })
    }

    return (
        <div className='comparisons-container'>
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
                        <span style={{ marginLeft: "5px" }}> Data</span>
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
                        <Button color='teal' onClick={handleSave}>
                            <FontAwesomeIcon icon={icon({ name: "floppy-disk" })} />
                            <span style={{ marginLeft: "5px" }}>Save</span>
                        </Button>
                        <Button color='teal' onClick={handleRevealID}>
                            <span>Reveal ID</span>
                        </Button>
                        <Button color='teal' onClick={handleCreateTemplate}>
                            <span>Template</span>
                        </Button>
                    </div>
                </div>
                <div className='header-block'>COMPARISONS</div>
            </div>
            <CompareTable comparisons={comparisons} />
        </div>
    )
}
