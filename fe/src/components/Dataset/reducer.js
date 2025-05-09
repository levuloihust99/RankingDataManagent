import { produce } from "immer"
import { v4 as uuidv4 } from "uuid"

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
        case "ADD_OUTPUT":
            return addOutput(state, action)
        case "ADD_OUTPUT_WITH_CONTENT":
            return addOutputWithContent(state, action)
        case "REMOVE_OUTPUT":
            return removeOutput(state, action)
        case "CHANGE_OUTPUT":
            return changeOutput(state, action)
        case "UPDATE_SCORE":
            return updateScore(state, action)
        case "ANNOTATE":
            return doAnnotate(state, action)
        case "UNANNOTATE":
            return doUnAnnotate(state, action)
        case "SET_TABLE_VIEW":
            return { ...state, activeRow: -1, view: "table" }
        case "SET_RANK_VIEW":
            return { ...state, activeRow: action.activeRow, view: "rank" }
        case "SET_COMPARE_VIEW":
            return { ...state, activeRow: action.activeRow, view: "compare" }
        case "SWITCH_RANK_VIEW":
            return { ...state, view: "rank" }
        case "SWITCH_COMPARE_VIEW":
            return { ...state, view: "compare" }
        case "CREATE_COMPARISON":
            return createComparison(state, action)
        case "CREATE_POSITIVE":
            return createPositive(state, action)
        case "CREATE_NEGATIVE":
            return createNegative(state, action)
        case "CLONE_POS_TO_NEG":
            return clonePosToNeg(state, action)
        case "CLONE_NEG_TO_POS":
            return cloneNegToPos(state, action)
        case "UPDATE_COMPARE_ITEM":
            return updateCompareItem(state, action)
        case "DELETE_COMPARE_ITEM":
            return deleteCompareItem(state, action)
        case "DELETE_COMPARE_ROW":
            return deleteCompareRow(state, action)
        case "TEMPLATE_COMPARISONS":
            return templateComparison(state, action)
        case "FORMAT_NEGATIVES":
            return formatNegatives(state, action)
        case "NEXT_EXAMPLE":
            return { ...state, activeRow: state.activeRow + 1 }
        case "PREVIOUS_EXAMPLE":
            return { ...state, activeRow: state.activeRow - 1 }
        case "ZERO_ACTIVE_ROW":
            return { ...state, activeRow: 0 }
        case "MAX_ACTIVE_ROW":
            return { ...state, activeRow: state.dataset.length - 1 }
        case "UPDATE_DIFF":
            return updateDiff(state, action)
        case "UPDATE_DIFF_OP":
            return updateDiffOp(state, action)
        case "UPDATE_ENTITY":
            return updateEntity(state, action)
        case "REMOVE_ENTITY":
            return removeEntity(state, action)
        case "TAG_ENTITY":
            return tagEntity(state, action)
        default:
            return state
    }
}

function moveItem(state, action) {
    // params: rowIdx, aIdx, bIdx
    // move item from aIdx to bIdx
    const { rowIdx, aIdx, bIdx } = action
    const nextState = produce(state, (draft) => {
        const { outputs } = draft.dataset[rowIdx]
        let nextOutputs = []
        if (aIdx < bIdx) {
            nextOutputs = [
                ...outputs.slice(0, aIdx),
                ...outputs.slice(aIdx + 1, bIdx + 1),
                outputs[aIdx],
                ...outputs.slice(bIdx + 1),
            ]
        } else {
            nextOutputs = [
                ...outputs.slice(0, bIdx),
                outputs[aIdx],
                ...outputs.slice(bIdx, aIdx),
                ...outputs.slice(aIdx + 1),
            ]
        }
        draft.dataset[rowIdx].outputs = nextOutputs
    })
    return nextState
}

function mutateInput(state, action) {
    // params: rowIdx, input
    const nextState = produce(state, (draft) => {
        draft.dataset[action.rowIdx].input = action.input
    })
    return nextState
}

function mutateOutput(state, action) {
    // params: rowIdx, outputIdx, output
    const nextState = produce(state, (draft) => {
        draft.dataset[action.rowIdx].outputs[action.outputIdx].content = action.output
    })
    return nextState
}

function mutateMetadata(state, action) {
    // params: rowIdx, metadata
    const nextState = produce(state, (draft) => {
        draft.dataset[action.rowIdx].metadata = action.metadata
    })
    return nextState
}

function addOutput(state, action) {
    const nextState = produce(state, (draft) => {
        draft.dataset[draft.activeRow].outputs.push({
            content: "",
            metadata: {
                generator: "placeholder",
            },
            id: uuidv4(),
        })
    })
    return nextState
}

function addOutputWithContent(state, action) {
    const nextState = produce(state, (draft) => {
        if (action.sampleId !== draft.dataset[draft.activeRow].sampleId) {
            return
        }
        draft.dataset[draft.activeRow].outputs.push({
            content: action.content,
            metadata: {
                generator: "gemma-2-2b-it-Q4_K_M-gguf",
            },
            id: uuidv4(),
        })
    })
    return nextState
}

function changeOutput(state, action) {
    const nextState = produce(state, (draft) => {
        const output = draft.dataset[draft.activeRow].outputs[action.outputIdx]
        output.content = action.content
        output.metadata.generator = action.generator
        output.metadata.comment = action.comment
    })
    return nextState
}

function updateScore(state, action) {
    const nextState = produce(state, (draft) => {
        const output = draft.dataset[draft.activeRow].outputs[action.outputIdx]
        output.score = action.score
    })
    return nextState
}

function removeOutput(state, action) {
    const nextState = produce(state, (draft) => {
        let outputs = draft.dataset[draft.activeRow].outputs
        outputs = [...outputs.slice(0, action.outputIdx), ...outputs.slice(action.outputIdx + 1)]
        draft.dataset[draft.activeRow].outputs = outputs
    })
    return nextState
}

function doAnnotate(state, action) {
    const nextState = produce(state, (draft) => {
        const item = draft.dataset[draft.activeRow]
        if (item.sampleId !== action.sampleId) {
            for (const loopItem of draft.dataset) {
                if (loopItem.sampleId === action.sampleId) {
                    loopItem.annotated = true
                }
            }
        } else {
            item.annotated = true
        }
    })
    return nextState
}

function doUnAnnotate(state, action) {
    const nextState = produce(state, (draft) => {
        const item = draft.dataset[draft.activeRow]
        if (item.sampleId !== action.sampleId) {
            for (const loopItem of draft.dataset) {
                if (loopItem.sampleId === action.sampleId) {
                    loopItem.annotated = false
                }
            }
        } else {
            item.annotated = false
        }
    })
    return nextState
}

function createComparison(state, action) {
    const nextState = produce(state, (draft) => {
        const row = draft.dataset[action.rowIdx]
        if (!row.hasOwnProperty("comparisons")) {
            row.comparisons = []
        }
        row.comparisons.push({ positives: [], negatives: [] })
    })
    return nextState
}

function createPositive(state, action) {
    const nextState = produce(state, (draft) => {
        draft.dataset[action.rowIdx].comparisons[action.comparisonIdx].positives.push({
            content: "",
            metadata: {
                generator: uuidv4(),
            },
        })
    })
    return nextState
}

function createNegative(state, action) {
    const nextState = produce(state, (draft) => {
        draft.dataset[action.rowIdx].comparisons[action.comparisonIdx].negatives.push({
            content: "",
            metadata: {
                generator: uuidv4(),
            },
        })
    })
    return nextState
}

function clonePosToNeg(state, action) {
    const nextState = produce(state, (draft) => {
        const comp = draft.dataset[action.rowIdx].comparisons[action.comparisonIdx]
        comp.negatives = [
            {
                content: action.content,
                entities: action.entities,
                metadata: { generator: uuidv4() },
            },
            ...comp.negatives,
        ]
    })
    return nextState
}

function cloneNegToPos(state, action) {
    const nextState = produce(state, (draft) => {
        const comp = draft.dataset[action.rowIdx].comparisons[action.comparisonIdx]
        comp.positives = [
            {
                content: action.content,
                entities: action.entities,
                metadata: { generator: uuidv4() },
            },
            ...comp.positives,
        ]
    })
    return nextState
}

function updateCompareItem(state, action) {
    const { itemType, generator, content, cardIdx, comparisonIdx, rowIdx, invalidateDiff } = action
    const nextState = produce(state, (draft) => {
        const comparison = draft.dataset[rowIdx].comparisons[comparisonIdx]
        const items = itemType === "positive" ? comparison.positives : comparison.negatives
        items[cardIdx].content = content
        items[cardIdx].metadata.generator = generator
        if (invalidateDiff) {
            items[cardIdx].diff = null
        }
    })
    return nextState
}

function deleteCompareItem(state, action) {
    const { itemType, cardIdx, comparisonIdx, rowIdx } = action
    const nextState = produce(state, (draft) => {
        const comparison = draft.dataset[rowIdx].comparisons[comparisonIdx]
        const key = itemType === "positive" ? "positives" : "negatives"
        comparison[key] = [
            ...comparison[key].slice(0, cardIdx),
            ...comparison[key].slice(cardIdx + 1),
        ]
    })
    return nextState
}

function deleteCompareRow(state, action) {
    const { rowIdx, comparisonIdx } = action
    const nextState = produce(state, (draft) => {
        const comparisons = draft.dataset[rowIdx].comparisons
        const nextComparisons = [
            ...comparisons.slice(0, comparisonIdx),
            ...comparisons.slice(comparisonIdx + 1),
        ]
        draft.dataset[rowIdx].comparisons = nextComparisons
    })
    return nextState
}

function templateComparison(state, action) {
    const nextState = produce(state, (draft) => {
        const comparisons = draft.dataset[action.rowIdx].comparisons
        if (comparisons == null || comparisons.length === 0) {
            draft.dataset[action.rowIdx].comparisons = action.templateComparisons
        }
    })
    return nextState
}

function formatNegatives(state, action) {
    const { rowIdx, comparisonIdx, criterion } = action
    const nextState = produce(state, (draft) => {
        const comparison = draft.dataset[rowIdx].comparisons[comparisonIdx]
        let i = comparison.negatives.length
        for (const item of comparison.negatives) {
            if (criterion === "incorrectness") {
                item.metadata.generator = `Incorrectness-${i}`
            } else {
                item.metadata.generator = `Non-${criterion}-${i}`
            }
            i -= 1
        }
    })
    return nextState
}

function updateDiff(state, action) {
    if (state.dataset[state.activeRow].sampleId !== action.sampleId) return state
    const nextState = produce(state, (draft) => {
        for (let i = 0; i < action.diffs.length; i++) {
            const { compIdx, negIdx } = action.locators[i]
            const negative = draft.dataset[draft.activeRow].comparisons[compIdx].negatives[negIdx]
            negative.diff = action.diffs[i]
        }
    })
    return nextState
}

function updateDiffOp(state, action) {
    const nextState = produce(state, (draft) => {
        const negative =
            draft.dataset[draft.activeRow].comparisons[action.compIdx].negatives[action.cardIdx]
        const diff = negative.diff
        if (JSON.stringify(diff[action.opIdx]) !== JSON.stringify(action.op)) {
            diff[action.opIdx] = action.op
            const tokens = []
            diff.forEach((op) => {
                if (op.op === "insert" || op.op === "equal") tokens.push(op.text)
                if (op.op === "replace") tokens.push(op.by)
            })
            negative.content = tokens.join("")
        }
    })
    return nextState
}

function updateEntity(state, action) {
    const nextState = produce(state, (draft) => {
        const item =
            draft.dataset[draft.activeRow].comparisons[action.compIdx][
                action.itemType === "positive" ? "positives" : "negatives"
            ][action.cardIdx]
        const entities = item.entities
        if (entities[action.entityIdx].text !== action.text) {
            entities[action.entityIdx].text = action.text
            const portions = []
            entities.forEach((entity) => {
                portions.push(entity.text)
            })
            item.content = portions.join("")
        }
    })
    return nextState
}

function removeEntity(state, action) {
    const nextState = produce(state, (draft) => {
        const item =
            draft.dataset[draft.activeRow].comparisons[action.compIdx][
                action.itemType === "positive" ? "positives" : "negatives"
            ][action.cardIdx]
        const entities = item.entities
        entities[action.entityIdx].type = "outside"
        const updatedEntities = []
        let prevPortion = null
        for (let i = 0; i < entities.length; i++) {
            if (entities[i].type === "outside" && prevPortion === "outside") {
                updatedEntities[updatedEntities.length - 1].text += entities[i].text
            } else {
                updatedEntities.push({ ...entities[i] })
            }
            prevPortion = entities[i].type
        }
        item.entities = updatedEntities
    })
    return nextState
}

function tagEntity(state, action) {
    const nextState = produce(state, (draft) => {
        const item =
            draft.dataset[draft.activeRow].comparisons[action.compIdx][
                action.itemType === "positive" ? "positives" : "negatives"
            ][action.cardIdx]
        let entities = item.entities
        if (!entities || entities.length === 0) {
            entities = [{ type: "outside", text: item.content }]
        }
        const updatedEntities = []
        for (let i = 0; i < entities.length; i++) {
            if (i === action.entityIdx) {
                if (action.start > 0) {
                    updatedEntities.push({
                        type: "outside",
                        text: entities[i].text.slice(0, action.start),
                    })
                }
                updatedEntities.push({
                    type: "entity",
                    text: entities[i].text.slice(action.start, action.end),
                })
                if (action.end < entities[i].text.length) {
                    updatedEntities.push({
                        type: "outside",
                        text: entities[i].text.slice(action.end),
                    })
                }
            } else {
                updatedEntities.push({ ...entities[i] })
            }
        }
        item.entities = updatedEntities
    })
    return nextState
}

export const workingModeReducer = (state, action) => {
    switch (action.type) {
        case "SWITCH_SHOW_WORKING_MODE":
            return { ...state, showWorkingMode: !state.showWorkingMode }
        case "CHANGE_WORKING_MODE":
            return changeWorkingMode(state, action)
        case "WORKING_MODE_OFF":
            return workingModeOff(state, action)
        case "CALCULATION_ON":
            return { ...state, onCalculation: true }
        case "CALCULATION_OFF":
            return { ...state, onCalculation: false }
        default:
            return state
    }
}

const nextWorkingModeMapping = {
    normal: "entity",
    entity: "diff",
    diff: "normal",
}

function changeWorkingMode(state, action) {
    const nextState = produce(state, (draft) => {
        const currentWorkingMode = draft.workingMode
        draft.workingMode = nextWorkingModeMapping[currentWorkingMode]
        if (draft.showWorkingMode === false) {
            draft.showWorkingMode = true
        }
    })
    return nextState
}

function workingModeOff(state, action) {
    const nextState = produce(state, (draft) => {
        if (draft.showWorkingMode === true) {
            draft.showWorkingMode = false
        }
    })
    return nextState
}
