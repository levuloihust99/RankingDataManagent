import React from 'react'
import { DatasetContext } from "../context"
import { MultiContentBox } from "../MultiContentBox"
import { RowContext } from "./context"
import "./style.css"

const TableRow = ({ input, outputs }) => {
    return (
        <tr>
            <td className="query-column">
                <div>
                    {input}
                </div>
            </td>
            <td className="response-column">
                <MultiContentBox contents={outputs.map(item => item.content)} />
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
                            <TableRow input={item.input} outputs={outputs} rowIdx={idx} />
                        </RowContext.Provider>
                    )
                })}
            </tbody>
        </table>
    )
}