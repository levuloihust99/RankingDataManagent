import React from "react"
import clsx from "clsx"
import { v4 as uuidv4 } from "uuid"
import { Modal, Loader } from "semantic-ui-react"
import { useLoaderData, defer, Await, useNavigate } from "react-router-dom"
import { BACKEND_URL, recordsPerPage } from "../../lib/constant"
import { urlJoin } from "../../lib/utils"
import { DataTable } from "./DataTable"
import { Pagination } from "./Pagination"
import { ErrorPage } from "../ErrorPage/ErrorPage"
import { SampleEditor } from "./SampleEditor"
import { Comparisons } from "./Comparison"
import { DatasetContext, WorkingModeContext } from "./context"
import { datasetReducer, workingModeReducer } from "./reducer"
import { SaveButton } from "./SaveButton"
import { ActionBar } from "./ActionBar"
import { AlertContext } from "../Alert/context"
import { diffTexts } from "../../api/diff"
import "./style.css"

async function queryData(pageId) {
    const queryArgs = new URLSearchParams({ pageNum: pageId, recordsPerPage })
    const endpoint = urlJoin(BACKEND_URL, "paginated_data", "?" + queryArgs.toString())
    try {
        const response = await fetch(endpoint)
        if (response.status !== 200) return []
        const { data } = await response.json()
        return data.map((item) => ({
            ...item,
            outputs: item.outputs.map((out) => ({ ...out, id: uuidv4() })),
        }))
    } catch (e) {
        throw new Response("", {
            status: 500,
            statusText: "Internal Server Error",
        })
    }
}

export async function dataLoader({ params }) {
    const pageId = parseInt(params.pageId)
    return defer({ data: queryData(params.pageId), pageId })
}

export const Dataset = () => {
    const { data, pageId } = useLoaderData()
    const [totalPageLoad, setTotalPageLoad] = React.useState(true)
    const [totalPage, setTotalPage] = React.useState(0)
    const isMounted = React.useRef(true)

    React.useEffect(() => {
        fetch(urlJoin(BACKEND_URL, "total_data"))
            .then(async (resp) => {
                return await resp.json()
            })
            .then(({ count }) => {
                const total = Math.ceil(count / recordsPerPage)
                if (isMounted.current === true) {
                    setTotalPageLoad(false)
                    setTotalPage(total)
                }
            })
        return () => {
            isMounted.current = false
        }
    }, [])

    if (totalPageLoad === true)
        return (
            <Modal dimmer='blurring' open={true} closeIcon={null}>
                <Loader active size='large'>
                    Loading
                </Loader>
            </Modal>
        )

    if (isNaN(pageId)) {
        return <ErrorPage errorText='Cannot parse page number' />
    } else if (pageId <= 0) {
        return <ErrorPage errorText='Page number cannot be less than or equal to 0' />
    } else if (pageId > totalPage) {
        return <ErrorPage errorText='Page number exceeds maximum' />
    }

    return (
        <>
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    flexGrow: 1,
                }}
            >
                <div
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                        backgroundColor: "#f5f5f5",
                        boxShadow: "0px 0px 5px 3px rgba(0, 0, 0, 0.15)",
                        marginBottom: "20px",
                    }}
                >
                    <Pagination pageId={pageId} totalPage={totalPage} />
                    <SaveButton />
                    <ActionBar />
                </div>
                <React.Suspense
                    fallback={
                        <Modal dimmer='blurring' open={true} closeIcon={null}>
                            <Loader active size='large'>
                                Loading
                            </Loader>
                        </Modal>
                    }
                >
                    <Await resolve={data}>{(dataset) => <DataProvider dataset={dataset} />}</Await>
                </React.Suspense>
            </div>
        </>
    )
}

const DataProvider = ({ dataset }) => {
    const navigate = useNavigate()
    const { dispatch: alertDispatch } = React.useContext(AlertContext)
    const [state, dispatch] = React.useReducer(datasetReducer, {
        dataset,
        activeRow: -1,
        view: "table",
    })
    const [workingModeState, workingModeDispatch] = React.useReducer(workingModeReducer, {
        workingMode: "normal",
        showWorkingMode: false,
        onCalculation: false,
    })
    const stateRef = React.useRef()
    const { pageId } = useLoaderData()
    const pageIdRef = React.useRef(pageId)
    const isMounted = React.useRef(true)

    React.useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    React.useEffect(() => {
        if (workingModeState.showWorkingMode === false && state.view !== "table") {
            if (workingModeState.workingMode === "diff") {
                const alignedRequestData = []
                const alignedLocators = []
                const comparisons = state.dataset[state.activeRow].comparisons
                for (let compIdx = 0; compIdx < comparisons.length; compIdx++) {
                    // support postives[0] only
                    const comp = comparisons[compIdx]
                    const positive = comp.positives.length > 0 ? comp.positives[0] : null
                    if (positive) {
                        for (let negIdx = 0; negIdx < comp.negatives.length; negIdx++) {
                            const negative = comp.negatives[negIdx]
                            if (!negative.diff) {
                                alignedRequestData.push({
                                    diffTo: positive.content,
                                    diffOn: negative.content,
                                })
                                alignedLocators.push({ compIdx, negIdx })
                            }
                        }
                        if (alignedRequestData.length > 0) {
                            workingModeDispatch({ type: "CALCULATION_ON" })
                            diffTexts(alignedRequestData).then(async (resp) => {
                                if (resp.status === 200) {
                                    const alignedDiffs = await resp.json()
                                    dispatch({
                                        type: "UPDATE_DIFF",
                                        diffs: alignedDiffs,
                                        locators: alignedLocators,
                                    })
                                } else {
                                    const err = await resp.text()
                                    alertDispatch({
                                        type: "ADD_MESSAGE",
                                        item: {
                                            type: "failed",
                                            message: err,
                                        },
                                    })
                                }
                                workingModeDispatch({
                                    type: "CALCULATION_OFF",
                                })
                            })
                        }
                    }
                }
            }
        }
    }, [workingModeState.showWorkingMode])

    React.useEffect(() => {
        pageIdRef.current = pageId
    }, [pageId])

    React.useEffect(() => {
        stateRef.current = state
    }, [state])

    React.useEffect(() => {
        dispatch({
            type: "UPDATE_DATASET",
            dataset,
        })
    }, [dataset])

    React.useEffect(() => {
        const handler = (e) => {
            if (stateRef.current.view !== "table") {
                if (
                    e.target.tagName === "INPUT" ||
                    e.target.tagName === "TEXTAREA" ||
                    e.target.className === "inserted-span"
                ) {
                    return
                }
                if (e.keyCode == "39") {
                    if (stateRef.current.activeRow < stateRef.current.dataset.length - 1) {
                        dispatch({
                            type: "NEXT_EXAMPLE",
                        })
                    } else {
                        navigate(`/dataset/page/${pageIdRef.current + 1}`)
                        dispatch({
                            type: "ZERO_ACTIVE_ROW",
                        })
                    }
                } else if (e.keyCode == "37") {
                    if (stateRef.current.activeRow > 0) {
                        dispatch({
                            type: "PREVIOUS_EXAMPLE",
                        })
                    } else {
                        navigate(`/dataset/page/${pageIdRef.current - 1}`)
                        dispatch({
                            type: "MAX_ACTIVE_ROW",
                        })
                    }
                } else if (e.keyCode == "32") {
                    if (stateRef.current.view === "rank") {
                        e.preventDefault()
                        dispatch({
                            type: "SWITCH_COMPARE_VIEW",
                        })
                    } else if (stateRef.current.view === "compare") {
                        e.preventDefault()
                        dispatch({
                            type: "SWITCH_RANK_VIEW",
                        })
                    }
                }
            }
        }
        document.addEventListener("keydown", handler)
        return () => {
            document.removeEventListener("keydown", handler)
        }
    }, [])

    React.useEffect(() => {
        const timeoutTask = { current: null }
        const handler = (e) => {
            if (stateRef.current.view === "compare" && (e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault()
                clearTimeout(timeoutTask.current)
                workingModeDispatch({ type: "CHANGE_WORKING_MODE" })
                timeoutTask.current = setTimeout(() => {
                    if (isMounted.current === true) workingModeDispatch({ type: "WORKING_MODE_OFF" })
                }, 1000)
            }
        }
        document.addEventListener("keydown", handler)
        return () => {
            document.removeEventListener("keydown", handler)
        }
    }, [])

    const renderLoading = () => {
        if (workingModeState.onCalculation === false) return null
        return (
            <Modal dimmer='blurring' open={true} closeIcon={null}>
                <Loader active size='large'>
                    Loading
                </Loader>
            </Modal>
        )
    }

    const renderWorkingMode = () => {
        if (workingModeState.showWorkingMode === false) return null
        return (
            <div
                style={{
                    minWidth: "250px",
                    backgroundColor: "white",
                    color: "initial",
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0px 0px 20px rgba(34, 36, 38, 0.15)",
                    borderRadius: "8px",
                    overflow: "hidden",
                    fontWeight: "bold",
                    fontSize: "1.5em",
                    zIndex: 5,
                }}
            >
                <div
                    className={clsx("d-flex-center py-20 actions-menu-item teal", {
                        active: workingModeState.workingMode === "normal",
                    })}
                >
                    <span>Normal</span>
                </div>
                <div
                    className={clsx("d-flex-center py-20 actions-menu-item teal", {
                        active: workingModeState.workingMode === "entity",
                    })}
                >
                    <span>Entity</span>
                </div>
                <div
                    className={clsx("d-flex-center py-20 actions-menu-item teal", {
                        active: workingModeState.workingMode === "diff",
                    })}
                >
                    <span>Diff</span>
                </div>
            </div>
        )
    }

    return (
        <WorkingModeContext.Provider
            value={{ state: workingModeState, dispatch: workingModeDispatch }}
        >
            <DatasetContext.Provider
                value={{
                    state,
                    dispatch,
                }}
            >
                <div
                    className="content-box"
                    style={{
                        display: state.activeRow > -1 ? "none" : "block",
                    }}
                >
                    <DataTable />
                </div>
                {state.activeRow > -1 && (
                    <>
                        <SampleEditor visible={state.view === "rank"} />
                        <Comparisons
                            visible={state.view === "compare"}
                            comparisons={
                                state.dataset[state.activeRow].comparisons || []
                            }
                        />
                        <Backdrop />
                    </>
                )}
                {renderLoading()}
                {renderWorkingMode()}
            </DatasetContext.Provider>
        </WorkingModeContext.Provider>
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
                backgroundColor: "white",
                zIndex: 2,
            }}
        ></div>
    )
}
