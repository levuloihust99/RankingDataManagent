import React from "react"
import { Modal, Header, Input } from "semantic-ui-react"
import { PopupOutputEditor } from "../PopupOutputEditor"
import { DatasetContext } from "../../context"
import { PopupContext } from "./context"
import "./style.css"

const DndCardContext = React.createContext(null)

const dndCardReducer = (state, action) => {
    switch (action.type) {
        case "SET_PLACEHOLDER_IDX":
            return {
                ...state,
                placeholderIdx: action.placeholderIdx,
            }
        case "SET_PLACEHOLDER_HEIGHT":
            return {
                ...state,
                placeholderHeight: action.placeholderHeight,
            }
        case "SET_PLACEHOLDER":
            return {
                ...state,
                placeholderIdx: action.placeholderIdx,
                placeholderHeight: action.placeholderHeight,
            }
        default:
            return state
    }
}

export const DndCard = ({ remountDndCard }) => {
    const ref = React.useRef()
    const {
        state: { dataset, activeRow },
    } = React.useContext(DatasetContext)
    const { outputs: items } = dataset[activeRow]

    const [{ placeholderIdx, placeholderHeight }, dispatch] = React.useReducer(dndCardReducer, {
        placeholderIdx: -1,
        placeholderHeight: "auto",
    })

    return (
        <DndCardContext.Provider
            value={{ containerRef: ref, state: { placeholderIdx }, dispatch, remountDndCard }}
        >
            <div ref={ref} className='dnd-card-container'>
                {items.map((item, idx) => {
                    if (idx === placeholderIdx) {
                        return <PlaceholderCardItem key={item.id} height={placeholderHeight} />
                    }
                    return (
                        <CardItem
                            metadata={item.metadata}
                            content={item.content}
                            score={item.score}
                            key={item.id}
                            uniqueId={item.id}
                            idx={idx}
                        />
                    )
                })}
            </div>
        </DndCardContext.Provider>
    )
}

const popupReducer = (state, action) => {
    switch (action.type) {
        case "NEW_CONTENT":
            return { ...state, liveContent: action.content, prevLiveContent: action.content }
        case "NEW_COMMENT":
            return { ...state, liveComment: action.comment }
        case "NEW_GENERATOR":
            return {
                ...state,
                liveGenerator: action.generator,
                prevLiveGenerator: action.generator,
            }
        case "NEW_SCORE":
            return { ...state, liveScore: action.score }
        case "SET_LIVE_CONTENT":
            return { ...state, liveContent: action.content }
        case "SET_LIVE_GENERATOR":
            return { ...state, liveGenerator: action.generator }
        case "SET_LIVE_COMMENT":
            return { ...state, liveComment: action.comment }
        case "SET_LIVE_SCORE":
            return { ...state, liveScore: action.score }
        case "CLICK_EDIT":
            return { ...state, onEdit: true }
        case "CANCEL_EDIT":
            return {
                ...state,
                liveContent: state.prevLiveContent,
                liveGenerator: state.prevLiveGenerator,
                liveComment: state.prevLiveComment,
                onEdit: false,
            }
        case "CONFIRM_EDIT":
            return {
                ...state,
                prevLiveContent: state.liveContent,
                prevLiveGenerator: state.liveGenerator,
                prevLiveComment: state.liveComment,
                onEdit: false,
            }
        default:
            return state
    }
}

const CardItem = ({ uniqueId, metadata, score, content, idx }) => {
    const [onEdit, setOnEdit] = React.useState(false)
    const ref = React.useRef()
    const sliderRef = React.useRef()

    const {
        containerRef,
        state: { placeholderIdx },
        dispatch: cardDispatch,
        remountDndCard,
    } = React.useContext(DndCardContext)
    const {
        state: { activeRow },
        dispatch: datasetDispatch,
    } = React.useContext(DatasetContext)

    const [popupState, popupDispatch] = React.useReducer(popupReducer, {
        onEdit: false,
        liveContent: content,
        prevLiveContent: content,
        liveGenerator: metadata.generator,
        prevLiveGenerator: metadata.generator,
        liveComment: metadata.comment || "",
        prevLiveComment: metadata.comment || "",
        liveScore: score,
    })

    React.useEffect(() => {
        popupDispatch({ type: "NEW_CONTENT", content })
    }, [content])

    React.useEffect(() => {
        popupDispatch({ type: "NEW_GENERATOR", generator: metadata.generator })
    }, [metadata.generator])

    React.useEffect(() => {
        popupDispatch({ type: "NEW_COMMENT", comment: metadata.comment })
    }, [metadata.comment])

    React.useEffect(() => {
        popupDispatch({ type: "NEW_SCORE", score })
    }, [score])

    React.useEffect(() => {
        sliderRef.current.onmousedown = function (e) {
            e.stopPropagation()
        }
    }, [])

    const handleChangeGenerator = (e) => {
        popupDispatch({ type: "SET_LIVE_GENERATOR", generator: e.target.value })
    }

    const handleChangeScore = (e) => {
        datasetDispatch({ type: "UPDATE_SCORE", score: parseInt(e.target.value), outputIdx: idx })
    }

    React.useEffect(() => {
        const element = ref.current
        let holdTimeout = null
        const HOLD_DELAY = 150 // 150 miliseconds

        element.onmousedown = function (event) {
            function clearTimeoutOnMouseUp() {
                clearTimeout(holdTimeout)
                element.removeEventListener("mouseup", clearTimeoutOnMouseUp)
            }
            element.addEventListener("mouseup", clearTimeoutOnMouseUp)

            holdTimeout = setTimeout(function () {
                const elementRect = element.getBoundingClientRect()
                element.style.position = "fixed"
                element.style.zIndex = 1000
                element.style.width = elementRect.width + "px"
                element.style.transform = "rotate(3deg)"
                const deltaX = event.pageX - elementRect.x
                const deltaY = event.pageY - elementRect.y

                document.body.append(element)
                const placeholder = document.createElement("div")
                placeholder.className = "dnd-card-item place-holder"
                placeholder.style.height = elementRect.height + "px"
                if (idx === containerRef.current.children.length) {
                    containerRef.current.append(placeholder)
                } else {
                    containerRef.current.insertBefore(
                        placeholder,
                        containerRef.current.children[idx]
                    )
                }

                function moveAt(pageX, pageY) {
                    element.style.left = pageX - deltaX + "px"
                    element.style.top = pageY - deltaY + "px"
                }

                moveAt(event.pageX, event.pageY)

                let placeholderIdx = idx
                function swapChild(aIdx, bIdx) {
                    // should change to shiftChild
                    const container = containerRef.current
                    const aNode = container.children[aIdx]
                    const bNode = container.children[bIdx]
                    const anchor = document.createTextNode("")
                    container.insertBefore(anchor, bNode)
                    container.insertBefore(bNode, aNode)
                    container.replaceChild(aNode, anchor)
                }

                const scrollTask = { current: null }
                function onMouseMove(event) {
                    moveAt(event.pageX, event.pageY)
                    let childIdx = 0
                    for (const child of containerRef.current.children) {
                        const childRect = child.getBoundingClientRect()
                        const dragCenter =
                            element.getBoundingClientRect().y +
                            element.getBoundingClientRect().height / 2
                        if (
                            dragCenter > childRect.y &&
                            dragCenter < childRect.y + childRect.height
                        ) {
                            if (placeholderIdx !== childIdx) {
                                if (
                                    (placeholderIdx < childIdx &&
                                        dragCenter > childRect.y + childRect.height / 2) ||
                                    (placeholderIdx > childIdx &&
                                        dragCenter < childRect.y + childRect.height / 2)
                                ) {
                                    swapChild(placeholderIdx, childIdx)
                                    placeholderIdx = childIdx
                                }
                            }
                            break
                        } else {
                            childIdx += 1
                        }
                    }
                }

                function onEscDown(event) {
                    if (event.key === "Escape") {
                        onMouseUp()
                    }
                }
                document.addEventListener("mousemove", onMouseMove)
                document.addEventListener("keydown", onEscDown)

                function onMouseUp() {
                    document.removeEventListener("mousemove", onMouseMove)
                    document.removeEventListener("keydown", onEscDown)
                    containerRef.current.replaceChild(
                        ref.current,
                        containerRef.current.children[placeholderIdx]
                    )
                    ref.current.style.position = "static"
                    ref.current.style.width = "auto"
                    ref.current.style.transform = "none"
                    element.removeEventListener("mouseup", onMouseUp)
                    if (idx !== placeholderIdx) {
                        datasetDispatch({
                            type: "MOVE_ITEM",
                            rowIdx: activeRow,
                            aIdx: idx,
                            bIdx: placeholderIdx,
                        })
                        remountDndCard()
                    }
                }
                element.addEventListener("mouseup", onMouseUp)
            }, HOLD_DELAY)
        }
    }, [idx])

    return (
        <div
            className='dnd-card-item column-flex-container'
            ref={ref}
            onClick={(e) => setOnEdit(true)}
        >
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    padding: "4px 10px 4px 10px",
                    borderBottom: "solid 1px rgb(222, 222, 223)",
                    backgroundColor: "rgb(222, 222, 222)",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                }}
            >
                <span
                    title={metadata.generator | uniqueId || "default"}
                    style={{
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    {metadata.generator || uniqueId || "default"}
                </span>
            </div>
            <div
                style={{
                    padding: "10px",
                    width: "100%",
                    userSelect: "none",
                }}
            >
                {content}
            </div>
            <div
                className='score-slider'
                style={{ position: "relative", width: "80%", minWidth: "300px" }}
                onClick={(e) => e.stopPropagation()}
                ref={sliderRef}
            >
                <input
                    type='range'
                    min={1}
                    max={10}
                    className='slider'
                    value={score}
                    onChange={handleChangeScore}
                />
                <div className='label-container'>
                    <div className='label-slider'>1</div>
                    <div className='label-slider'>2</div>
                    <div className='label-slider'>3</div>
                    <div className='label-slider'>4</div>
                    <div className='label-slider'>5</div>
                    <div className='label-slider'>6</div>
                    <div className='label-slider'>7</div>
                    <div className='label-slider'>8</div>
                    <div className='label-slider'>9</div>
                    <div className='label-slider'>10</div>
                </div>
            </div>
            <PopupContext.Provider value={{ popupState, popupDispatch }}>
                <Modal open={onEdit} onClose={(e) => setOnEdit(false)}>
                    <Header>
                        {false ? (
                            <Input
                                value={uniqueId}
                                readOnly={!popupState.onEdit}
                                onChange={handleChangeGenerator}
                                style={{ width: "100%" }}
                            />
                        ) : (
                            <span>{uniqueId}</span>
                        )}
                    </Header>
                    <Modal.Content>
                        <PopupOutputEditor outputIdx={idx} />
                    </Modal.Content>
                </Modal>
            </PopupContext.Provider>
        </div>
    )
}

const PlaceholderCardItem = ({ height }) => {
    return (
        <div
            className='dnd-card-item place-holder'
            style={{
                height,
            }}
        ></div>
    )
}
