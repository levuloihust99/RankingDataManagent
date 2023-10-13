export const datasetReducer = (state, action) => {
    switch (action.type) {
        case "SWAP_OUTPUTS":
            return swapOutputs(state, action)
        case "MUTATE_INPUT":
            return mutateInput(state, action)
        case "MUTATE_OUTPUT":
            return mutateOutput(state, action)
        case "MUTATE_METADATA":
            return mutateMetadata(state, action)
        case "SET_ACTIVE_ROW":
            return { ...state, activeRow: action.activeRow }
        default:
            return state
    }
}

function swapOutputs(state, action) {
    // params: rowIdx, aIdx, bIdx
    const { outputs, ...other } = state.dataset[action.rowIdx]
    const nextOutputs = []
    for (let i = 0; i < outputs.length; i++) {
        if (i === action.aIdx) {
            nextOutputs.push(outputs[action.bIdx])
        } else if (i === action.bIdx) {
            nextOutputs.push(outputs[action.aIdx])
        } else {
            nextOutputs.push(outputs[i])
        }
    }
    return {
        ...state,
        dataset: [
            ...state.dataset.slice(0, action.rowIdx),
            { ...other, outputs: nextOutputs },
            ...state.dataset.slice(action.rowIdx + 1)
        ]
    }
}

function mutateInput(state, action) {
    // params: rowIdx, input
    return {
        ...state,
        dataset: [
            ...state.dataset.slice(0, action.rowIdx),
            { ...state.dataset[action.rowIdx], input: action.input },
            ...state.dataset.slice(action.rowIdx + 1)
        ]
    }
}

function mutateOutput(state, action) {
    // params: rowIdx, outputIdx, output
    const { outputs, ...other } = state.dataset[action.rowIdx]
    const { content, ...remain } = outputs[action.outputIdx]
    return {
        ...state,
        dataset: [
            ...state.dataset.slice(0, action.rowIdx),
            {
                ...other,
                outputs: [
                    ...outputs.slice(0, action.outputIdx),
                    { ...remain, content: action.output }
                ]
            },
            ...state.dataset.slice(action.rowIdx + 1)
        ]
    }
}

function mutateMetadata(state, action) {
    // params: rowIdx, metadata
    const { metadata, ...other } = state.dataset[action.rowIdx]
    return {
        ...state,
        dataset: [
            ...state.dataset.slice(0, action.rowIdx),
            { ...other, metadata: action.metadata },
            ...state.dataset.slice(action.rowIdx + 1)
        ]
    }
}