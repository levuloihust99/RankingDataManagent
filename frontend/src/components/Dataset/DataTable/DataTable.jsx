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
                    return (
                        <RowContext.Provider value={{ rowIdx: idx }}>
                            <TableRow input={item.input} outputs={item.outputs} rowIdx={idx} />
                        </RowContext.Provider>
                    )
                })}
            </tbody>
        </table>
    )
}