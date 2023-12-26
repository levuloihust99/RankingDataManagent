import React from 'react'
import clsx from 'clsx'
import { DatasetContext } from "../context"
import { MultiContentBox } from "../MultiContentBox"
import { RowContext } from "./context"
import "./style.css"

const TableRow = ({ rowIdx, item }) => {
    const [detail, setDetail] = React.useState(false)
    return (
        <tr className={clsx(detail && "on-hovering")} onClick={() => setDetail(!detail)}>
            <td className="query-column">
                <div
                    className={clsx(!detail && "multiline-ellipsis")}
                >{item.input}</div>
            </td>
            <td className="response-column">
                <MultiContentBox detail={detail} outputs={item.outputs} />
            </td>
        </tr>
    )
}

export const DataTable = () => {
    const { state: { dataset } } = React.useContext(DatasetContext)
    return (
        <table
            className="data-table"
        >
            <thead className="table-header">
                <tr>
                    <th className="query-column header">Query</th>
                    <th className="response-column header">Responses</th>
                </tr>
            </thead>
            <tbody
                className="table-body"
            >
                {dataset.map((item, idx) => {
                    const outputs = item.outputs.sort((a, b) => {
                        if (a.score === b.score) return 0
                        if (a.score > b.score) return 1
                        return -1 // a.score < b.score
                    })
                    return (
                        <RowContext.Provider value={{ rowIdx: idx }} key={item.sampleId}>
                            <TableRow rowIdx={idx} item={item} />
                        </RowContext.Provider>
                    )
                })}
            </tbody>
        </table>
    )
}