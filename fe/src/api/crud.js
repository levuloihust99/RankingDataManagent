import { BACKEND_URL } from "../lib/constant"
import { urlJoin } from "../lib/utils"

export const updateComparisons = async ({ sampleId, comparisons }) => {
    const endpoint = urlJoin(BACKEND_URL, "/update_comparisons")
    return await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ sampleId, comparisons }),
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export const updateOutputs = async ({ sampleId, outputs }) => {
    const endpoint = urlJoin(BACKEND_URL, "/update_outputs")
    return await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ sampleId, outputs }),
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export const annotate = async ({ sampleId }) => {
    const endpoint = urlJoin(BACKEND_URL, "/annotate")
    return await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ sampleId }),
        headers: {
            "Content-Type": "application/json",
        },
    })
}

export const unannotate = async ({ sampleId }) => {
    const endpoint = urlJoin(BACKEND_URL, "/unannotate")
    return await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ sampleId }),
        headers: {
            "Content-Type": "application/json",
        },
    })
}
