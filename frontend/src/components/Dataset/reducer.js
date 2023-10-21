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
    const newState = JSON.parse(JSON.stringify(state))
    const { rowIdx, aIdx, bIdx } = action
    const { outputs, ...other } = newState.dataset[rowIdx]
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
    newState.dataset[rowIdx].outputs = nextOutputs
    return newState
}

function mutateInput(state, action) {
    // params: rowIdx, input
    const newState = JSON.parse(JSON.stringify(state))
    newState.dataset[action.rowIdx].input = action.input
    return newState
}

function mutateOutput(state, action) {
    // params: rowIdx, outputIdx, output
    const newState = JSON.parse(JSON.stringify(state))
    newState.dataset[action.rowIdx].outputs[action.outputIdx].content = action.output
    return newState
}

function mutateMetadata(state, action) {
    // params: rowIdx, metadata
    const newState = JSON.parse(JSON.stringify(state))
    newState.dataset[action.rowIdx].metadata = action.metadata
    return newState
}
