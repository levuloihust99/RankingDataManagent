import React from 'react'
import { Modal, Loader } from "semantic-ui-react"
import { useLoaderData, defer, Await } from "react-router-dom"
import { BACKEND_URL, recordsPerPage } from "../../lib/constant"
import { urlJoin } from "../../lib/utils"
import { DataTable } from "../DataTable"
import { Pagination } from '../Pagination'
import "./style.css"
import { ErrorPage } from '../ErrorPage/ErrorPage'

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
    const [isLoading, setIsLoading] = React.useState(true)
    const [totalPage, setTotalPage] = React.useState(0)

    React.useEffect(() => {
        fetch(urlJoin(BACKEND_URL, "total_data"))
            .then(async (resp) => { return await resp.json() })
            .then(({ count }) => {
                setIsLoading(false)
                setTotalPage(count)
            })
    }, [])

    if (isLoading === true) return (
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
        <>
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
                            <div
                                className="content-box"
                            >
                                <DataTable dataset={dataset} />
                            </div>
                        )
                    }}
                </Await>
            </React.Suspense>
        </>
    )
}