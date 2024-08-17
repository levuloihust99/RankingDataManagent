import React from 'react'

export const AppContext = React.createContext({
    dispatch({ type }) {
        console.log(`Default dispatcher received action of type ${type}`)
    }
})