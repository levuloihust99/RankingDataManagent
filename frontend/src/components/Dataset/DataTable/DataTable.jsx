import React from "react"
import clsx from "clsx"
import { DatasetContext } from "../context"
import { MultiContentBox } from "../MultiContentBox"
import { RowContext } from "./context"
import "./style.css"

const TableRow = ({ rowIdx, item }) => {
    const [detail, setDetail] = React.useState(true)
    const { state, dispatch: datasetDispatch } = React.useContext(DatasetContext)

    const evenRow = rowIdx % 2 === 0

    const handleChangeScore = (e) => {
        datasetDispatch({
            type: 'CHANGE_SCORE',
            item: {
                ...item, score: parseInt(e.target.value)
            }
        })
    }

    return (
        <>
            <tr
                className={clsx(
                    "main-tr",
                    evenRow ? "even-row" : "odd-row",
                    detail && "on-hovering"
                )}
                onClick={() => setDetail(!detail)}
            >
                <td className='query-column'>
                    <div>{item.input}</div>
                </td>
                <td className='response-column'>
                    <div className='single-response-content'>{item.outputs[0].content}</div>
                </td>
            </tr>
            {detail && (
                <tr
                    className={clsx(
                        "score-slider",
                        evenRow ? "even-row" : "odd-row",
                        detail && "on-hovering"
                    )}
                    onClick={() => setDetail(!detail)}
                >
                    <td colSpan={2}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "columm",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "relative",
                            }}
                        >
                            <div
                                style={{ width: "50%", minWidth: "300px", position: "relative" }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <input
                                    type='range'
                                    min={1}
                                    max={5}
                                    className='slider'
                                    value={item.score}
                                    onChange={handleChangeScore}
                                />
                                <div className='label-container'>
                                    <div className='label-slider'>1</div>
                                    <div className='label-slider'>2</div>
                                    <div className='label-slider'>3</div>
                                    <div className='label-slider'>4</div>
                                    <div className='label-slider'>5</div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

export const DataTable = () => {
    const {
        state: { dataset },
    } = React.useContext(DatasetContext)
    return (
        <table className='data-table'>
            <thead className='table-header'>
                <tr>
                    <th className='query-column header'>Input</th>
                    <th className='response-column header'>Output</th>
                </tr>
            </thead>
            <tbody className='table-body'>
                {dataset.map((item, idx) => {
                    // const outputs = item.outputs.sort((a, b) => {
                    //     if (a.score === b.score) return 0
                    //     if (a.score > b.score) return 1
                    //     return -1 // a.score < b.score
                    // })
                    return (
                        <RowContext.Provider value={{}} key={item.sampleId}>
                            <TableRow rowIdx={idx} item={item} />
                        </RowContext.Provider>
                    )
                })}
            </tbody>
        </table>
    )
}
