import React from 'react'
import clsx from 'clsx'
import { Icon, Button } from 'semantic-ui-react'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { DatasetContext } from '../context'
import { RowContext } from '../DataTable/context'
import "./style.css"

const LocalNavigator = ({ index, total, setIndex, generator }) => {
    const { dispatch } = React.useContext(DatasetContext)
    const { rowIdx } = React.useContext(RowContext)

    const handleClickPrevious = (event) => {
        event.stopPropagation()
        if (index > 1) setIndex(index - 1)
    }

    const handleClickNext = (event) => {
        event.stopPropagation()
        if (index < total) setIndex(index + 1)
    }

    const handleClickEdit = (event) => {
        event.stopPropagation()
        dispatch({
            type: "SET_RANK_VIEW",
            activeRow: rowIdx
        })
    }

    const handleClickCompare = (event) => {
        event.stopPropagation()
        dispatch({
            type: "SET_COMPARE_VIEW",
            activeRow: rowIdx
        })
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgb(222, 222, 222)",
                paddingBottom: "5px"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexGrow: 0,
                    flexBasis: "50px"
                }}
            >
                <FontAwesomeIcon
                    className="navigate-icon"
                    icon={icon({name: "angle-left"})}
                    onClick={handleClickPrevious}
                    color={index === 1 ? "grey" : "black"}
                />
                <span>{`${index} / ${total}`}</span>
                <FontAwesomeIcon
                    className="navigate-icon"
                    icon={icon({name: "angle-right"})}
                    onClick={handleClickNext}
                    color={index === total ? "grey" : "black"}
                />
            </div>
            <div
                style={{ flexGrow: 1, display: "flex", justifyContent: "center" }}
            >
                {generator}
            </div>
            <div
                style={{
                    flexGrow: 0,
                    display: "flex",
                    justifyContent: "flex-end",
                    columnGap: "5px",
                }}
            >
                <FontAwesomeIcon
                    className="action-icon"
                    icon={icon({name: "code-compare"})}
                    style={{float: "right"}}
                    onClick={handleClickCompare}
                />
                <FontAwesomeIcon
                    className="action-icon"
                    icon={icon({name: "pen-to-square"})}
                    style={{float: "right"}}
                    onClick={handleClickEdit}
                />
            </div>
        </div>
    )
}

export const MultiContentBox = ({ outputs, detail }) => {
    const [index, setIndex] = React.useState(1)
    const content = outputs[index - 1].content
    const generator = outputs[index - 1].metadata.generator

    return (
        <>
            <LocalNavigator setIndex={setIndex} index={index} total={outputs.length} generator={generator} />
            <div
                className={clsx("response-content",
                    !detail && "multiline-ellipsis"
                )}
                style={{
                    textAlign: "justify",
                    paddingTop: "5px"
                }}
            >
                {content}
            </div>
        </>
    )
}