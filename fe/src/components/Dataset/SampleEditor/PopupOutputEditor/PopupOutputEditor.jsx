import React, { useContext } from "react"
import { icon } from "@fortawesome/fontawesome-svg-core/import.macro"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { HorizontalSeparator } from "../../../common/Separator"
import { DatasetContext } from "../../context"
import { doCopy } from "../../../../lib/utils"
import { PopupContext } from "../DndCard/context"
import { AutofitTextArea } from "../../../common/AutofitTextArea"
import "./style.css"

export const PopupOutputEditor = ({ outputIdx }) => {
    const { popupState, popupDispatch } = React.useContext(PopupContext)
    const { dispatch: datasetDispatch } = useContext(DatasetContext)
    const commentRef = React.useRef()

    const handleClickEditContent = (e) => {
        popupDispatch({ type: "CLICK_EDIT" })
        if (commentRef.current) {
            commentRef.current.select()
        }
    }

    const handleCancelEdit = (e) => {
        popupDispatch({ type: "CANCEL_EDIT" })
    }

    const handleConfirmEdit = (e) => {
        popupDispatch({ type: "CONFIRM_EDIT" })

        // dispatch action
        datasetDispatch({
            type: "CHANGE_OUTPUT",
            outputIdx,
            content: popupState.liveContent,
            generator: popupState.liveGenerator,
            comment: popupState.liveComment,
        })
    }

    const handleCopy = (e) => {
        doCopy(popupState.liveContent)
    }

    const handleRemoveOutput = (e) => {
        datasetDispatch({ type: "REMOVE_OUTPUT", outputIdx })
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
                    <AutofitTextArea
                        content={popupState.liveContent}
                        onEdit={popupState.onEdit}
                        onChange={(e) =>
                            popupDispatch({ type: "SET_LIVE_CONTENT", content: e.target.value })
                        }
                    />
                </div>
            </div>
            {true && (
                <>
                    <HorizontalSeparator height='10px' />
                    <div>
                        <span style={{ fontWeight: "bold", fontSize: "1.25em" }}>Comment</span>
                    </div>
                    <HorizontalSeparator height='10px' />
                    <div className='rounded-corner-container' style={{ padding: "10px" }}>
                        <AutofitTextArea
                            content={popupState.liveComment}
                            onEdit={popupState.onEdit}
                            onChange={(e) =>
                                popupDispatch({ type: "SET_LIVE_COMMENT", comment: e.target.value })
                            }
                            eRef={commentRef}
                        />
                    </div>
                </>
            )}
        </>
    )
}
