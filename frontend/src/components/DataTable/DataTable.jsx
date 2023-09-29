import { MultiContentBox } from "../MultiContentBox"
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

export const DataTable = ({ dataset }) => {
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
                {dataset.map((item) => {
                    return <TableRow input={item.input} outputs={item.outputs} />
                })}
            </tbody>
        </table>
    )
}