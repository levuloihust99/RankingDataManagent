import React from 'react'
import { Modal, Header } from 'semantic-ui-react'
import { PopupOutputEditor } from '../PopupOutputEditor';
import { DatasetContext } from '../../context'
import "./style.css"

const CardContext = React.createContext(null)

const cardReducer = (state, action) => {
    switch (action.type) {
        case "SET_PLACEHOLDER_IDX":
            return {
                ...state,
                placeholderIdx: action.placeholderIdx,
            }
        case "SET_PLACEHOLDER_HEIGHT":
            return {
                ...state,
                placeholderHeight: action.placeholderHeight
            }
        case "SET_PLACEHOLDER":
            return {
                ...state,
                placeholderIdx: action.placeholderIdx,
                placeholderHeight: action.placeholderHeight
            }
    }
}

export const DndCard = () => {
    const ref = React.useRef()
    const [
        { placeholderIdx, placeholderHeight}, dispatch
    ] = React.useReducer(cardReducer, { placeholderIdx: -1, placeholderHeight: "auto" })
    const { state: { dataset, activeRow } } = React.useContext(DatasetContext)
    const { outputs: items } = dataset[activeRow]
    return (
        <CardContext.Provider value={{ containerRef: ref, state: { placeholderIdx }, dispatch }}>
            <div
                ref={ref}
                className="dnd-card-container"
            >
                {items.map((item, idx) => {
                    if (idx === placeholderIdx) {
                        return <PlaceholderCardItem key={item.id} height={placeholderHeight} />
                    }
                    return (
                        <CardItem
                            metadata={item.metadata}
                            score={item.score}
                            content={item.content}
                            key={item.id}
                            idx={idx}
                        />
                    )
                })}
            </div>
        </CardContext.Provider>
    )
}

const CardItem = ({ metadata, score, content, idx }) => {
    const { dispatch } = React.useContext(DatasetContext)
    const [onEdit, setOnEdit] = React.useState(false)
    const ref = React.useRef()

    const {
        containerRef, state: { placeholderIdx } , dispatch: cardDispatch
    } = React.useContext(CardContext)
    const { state: { activeRow }, dispatch: datasetDispatch } = React.useContext(DatasetContext)

    React.useEffect(() => {
        const element = ref.current
        let holdTimeout = null
        const HOLD_DELAY = 100 // 100 miliseconds

        element.onmousedown = function (event) {
            function clearTimeoutOnMouseUp() {
                clearTimeout(holdTimeout)
                element.removeEventListener('mouseup', clearTimeoutOnMouseUp)
            }
            element.addEventListener('mouseup', clearTimeoutOnMouseUp)

            holdTimeout = setTimeout(function() {
                const elementRect = element.getBoundingClientRect()
                element.style.position = 'fixed';
                element.style.zIndex = 1000;
                element.style.width = elementRect.width + "px"
                element.style.transform = "rotate(3deg)"
                const deltaX = event.pageX - elementRect.x
                const deltaY = event.pageY - elementRect.y
    
                document.body.append(element);
                const placeholder = document.createElement("div")
                placeholder.className = "dnd-card-item place-holder"
                placeholder.style.height = elementRect.height + "px"
                if (idx === containerRef.current.children.length) {
                    containerRef.current.append(placeholder)
                } else {
                    containerRef.current.insertBefore(placeholder, containerRef.current.children[idx])
                }
    
                function moveAt(pageX, pageY) {
                    element.style.left = pageX - deltaX + 'px';
                    element.style.top = pageY - deltaY + 'px';
                }
    
                moveAt(event.pageX, event.pageY);
    
                let placeholderIdx = idx
                function swapChild(aIdx, bIdx) {
                    const container = containerRef.current
                    const aNode = container.children[aIdx]
                    const bNode = container.children[bIdx]
                    const anchor = document.createTextNode('');
                    container.insertBefore(anchor, bNode)
                    container.insertBefore(bNode, aNode)
                    container.replaceChild(aNode, anchor)
                }
    
                function onMouseMove(event) {
                    moveAt(event.pageX, event.pageY);
                    let childIdx = 0
                    for (const child of containerRef.current.children) {
                        const childRect = child.getBoundingClientRect()
                        const dragCenter = element.getBoundingClientRect().y + element.getBoundingClientRect().height / 2
                        if (dragCenter > childRect.y && dragCenter < childRect.y + childRect.height) {
                            if (placeholderIdx !== childIdx) {
                                if (
                                    (placeholderIdx < childIdx && dragCenter > childRect.y + childRect.height / 2) ||
                                    (placeholderIdx > childIdx && dragCenter < childRect.y + childRect.height / 2)
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
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('keydown', onEscDown)

                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('keydown', onEscDown)
                    containerRef.current.replaceChild(ref.current, containerRef.current.children[placeholderIdx])
                    ref.current.style.position = "static"
                    ref.current.style.width = "auto"
                    ref.current.style.transform = "none"
                    element.removeEventListener('mouseup', onMouseUp)
                    if (idx !== placeholderIdx) {
                        datasetDispatch({
                            type: "MOVE_ITEM",
                            rowIdx: activeRow,
                            aIdx: idx,
                            bIdx: placeholderIdx
                        })
                    }
                }
                element.addEventListener('mouseup', onMouseUp)
    
            }, HOLD_DELAY)

        };
    }, [idx])

    return (
        <div
            className="dnd-card-item"
            ref={ref}
            onClick={(e) => setOnEdit(true)}
        >
            <div>
                {content}
            </div>
            <Modal
                open={onEdit}
                onClose={(e) => setOnEdit(false)}
            >
                <Header>{metadata.generator}</Header>
                <Modal.Content>
                    <PopupOutputEditor
                        item={{
                            metadata,
                            score,
                            content
                        }}
                    />
                </Modal.Content>
            </Modal>
        </div>
    )
}

const PlaceholderCardItem = ({ height }) => {
    return (
        <div
            className="dnd-card-item place-holder"
            style={{
                height
            }}
        >
        </div>
    )
}