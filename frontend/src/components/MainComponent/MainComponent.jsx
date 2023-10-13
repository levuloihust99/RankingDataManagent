import React from 'react'
import { v4 as uuidv4 } from 'uuid';
import { Modal, Loader } from "semantic-ui-react"
import { useLoaderData, defer, Await } from "react-router-dom"
import { BACKEND_URL, recordsPerPage } from "../../lib/constant"
import { urlJoin } from "../../lib/utils"
import { DataTable } from "../DataTable"
import { Pagination } from '../Pagination'
import { ErrorPage } from '../ErrorPage/ErrorPage'
import { SampleEditor } from '../SampleEditor'
import { DatasetContext } from './context'
import { datasetReducer } from './reducer';
import "./style.css"

async function queryData(pageId) {
    const queryArgs = new URLSearchParams({ pageNum: pageId, recordsPerPage })
    const endpoint = urlJoin(BACKEND_URL, "paginated_data", "?" + queryArgs.toString())
    try {
        const response = await fetch(endpoint)
        const { data } = await response.json()
        return data.map(item => ({ ...item, outputs: item.outputs.map((out) => ({ ...out, id: uuidv4() })) }))
    } catch (e) {
        throw new Response("", {
            status: 500,
            statusText: "Internal Server Error"
        })
    }
}

export async function dataLoader({ params }) {
    const pageId = parseInt(params.pageId)
    if (isNaN(pageId)) {
        throw new Response("", {
            status: 500,
            statusText: "Cannot parse pageId"
        })
    }
    return defer({ data: queryData(params.pageId), pageId })
}

export const MainComponent = () => {
    const { data, pageId } = useLoaderData()
    const [totalPageLoad, setTotalPageLoad] = React.useState(true)
    const [totalPage, setTotalPage] = React.useState(0)

    React.useEffect(() => {
        fetch(urlJoin(BACKEND_URL, "total_data"))
            .then(async (resp) => { return await resp.json() })
            .then(({ count }) => {
                const total = Math.ceil(count / recordsPerPage)
                setTotalPageLoad(false)
                setTotalPage(total)
            })
    }, [])

    if (totalPageLoad === true) return (
        <Modal dimmer="blurring" open={true} closeIcon={null}>
            <Loader active size="large">
                Loading
            </Loader>
        </Modal>
    )

    if (pageId > totalPage) {
        return <ErrorPage errorText="Page number exceeds maximum" />
    }

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", flexGrow: 1 }}>
            <Pagination pageId={pageId} totalPage={totalPage} />
            <React.Suspense
                fallback={(
                    <Modal dimmer="blurring" open={true} closeIcon={null}>
                        <Loader active size="large">
                            Loading
                        </Loader>
                    </Modal>
                )}
            >
                <Await
                    resolve={data}
                >
                    {(dataset) => <DataProvider dataset={dataset} />}
                </Await>
            </React.Suspense>
        </div>
    )
}

const DataProvider = ({ dataset }) => {
    const [state, dispatch] = React.useReducer(datasetReducer, { dataset, activeRow: -1 })
    return (
        <DatasetContext.Provider
            value={{
                state,
                dispatch
            }}
        >
            <div
                className="content-box"
                style={{
                    display: state.activeRow > -1 ? "none" : "block"
                }}
            >
                <DataTable />
            </div>
            {(state.activeRow > -1) && (
                <>
                    <Backdrop />
                    <SampleEditor
                        style={{
                            top: 0,
                            bottom: 0,
                            right: 0,
                            left: 0
                        }}
                    />
                </>
            )}
        </DatasetContext.Provider>
    )
}

const Backdrop = () => {
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white"
            }}
        >
        </div>
    )
}