import React from 'react'
import { Modal, Loader } from "semantic-ui-react"
import { useLoaderData, defer, Await } from "react-router-dom"
import { BACKEND_URL, recordsPerPage } from "../../lib/constant"
import { urlJoin } from "../../lib/utils"
import { DataTable } from "../DataTable"
import { Pagination } from '../Pagination'
import "./style.css"
import { ErrorPage } from '../ErrorPage/ErrorPage'
import { SampleEditor } from '../SampleEditor'
import { AppContext } from '../../context'
import { MainComponentContext } from './context'

async function queryData(pageId) {
    const queryArgs = new URLSearchParams({ pageNum: pageId, recordsPerPage })
    const endpoint = urlJoin(BACKEND_URL, "paginated_data", "?" + queryArgs.toString())
    try {
        const response = await fetch(endpoint)
        const { data } = await response.json()
        return data
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

export const MainComponent = ({ children }) => {
    const { data, pageId } = useLoaderData()
    const [totalPageLoad, setTotalPageLoad] = React.useState(true)
    const [totalPage, setTotalPage] = React.useState(0)
    const { pushed } = React.useContext(AppContext)
    const [onEdit, setOnEdit] = React.useState(-1)

    React.useEffect(() => {
        console.log("Effect total_data runs")
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
        <div style={{position: "relative", display: "flex", flexDirection: "column", height: "100%", flexGrow: 1}}>
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
                    {(dataset) => {
                        return (
                            <MainComponentContext.Provider value={{setRowOnEdit: setOnEdit}}>
                                <div
                                    className="content-box"
                                    style={{
                                        display: onEdit > -1 ? "none" : "block"
                                    }}
                                >
                                    <DataTable dataset={dataset} />
                                </div>
                                {(onEdit > -1) && (
                                    <>
                                        <Backdrop />
                                        <SampleEditor
                                            style={{
                                                top: 0,
                                                bottom: 0,
                                                right: 0,
                                                left: 0
                                            }}
                                            input={dataset[onEdit].input}
                                            outputs={dataset[onEdit].outputs}
                                            metadata={dataset[onEdit].metadata}
                                        />
                                    </>
                                )}
                            </MainComponentContext.Provider>
                        )
                    }}
                </Await>
            </React.Suspense>
        </div>
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