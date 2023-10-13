export const datasetReducer = (state, action) => {
    switch (action.type) {
        case "MOVE_ITEM":
            return moveItem(state, action)
        case "MUTATE_INPUT":
            return mutateInput(state, action)
        case "MUTATE_OUTPUT":
            return mutateOutput(state, action)
        case "MUTATE_METADATA":
            return mutateMetadata(state, action)
        case "SET_ACTIVE_ROW":
            return { ...state, activeRow: action.activeRow }
        case "UPDATE_DATASET":
            return { ...state, dataset: action.dataset }
        default:
            return state
    }
}

function moveItem(state, action) {
    // params: rowIdx, aIdx, bIdx
    // move item from aIdx to bIdx
    const { rowIdx, aIdx, bIdx } = action
    const { outputs, ...other } = state.dataset[rowIdx]
    let nextOutputs = []
    if (aIdx < bIdx) {
        nextOutputs = [
            ...outputs.slice(0, aIdx),
            ...outputs.slice(aIdx + 1, bIdx + 1),
            outputs[aIdx],
            ...outputs.slice(bIdx + 1)
        ]
    } else {
        nextOutputs = [
            ...outputs.slice(0, bIdx),
            outputs[aIdx],
            ...outputs.slice(bIdx, aIdx),
            ...outputs.slice(aIdx + 1)
        ]
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