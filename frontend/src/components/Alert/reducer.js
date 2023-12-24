import { v4 as uuidv4 } from 'uuid'

export const alertReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_MESSAGE':
            return { ...state, messages: [ ...state.messages, { ...action.item, uid: uuidv4() } ] }
        case 'REMOVE_ALERT':
            return removeAlert(state, action)
        default:
            return state
    }
}

const removeAlert = (state, action) => {
    const updatedMessages = []
    for (const item of state.messages) {
        if (item.uid !== action.itemId) {
            updatedMessages.push(item)
        }
    }
    return { ...state, messages: updatedMessages }
}