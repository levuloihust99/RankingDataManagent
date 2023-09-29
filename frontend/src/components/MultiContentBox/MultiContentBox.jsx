import React from 'react'
import { Icon, Button } from 'semantic-ui-react'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import "./style.css"

const LocalContext = React.createContext(null)

const LocalNavigator = ({ index, total }) => {
    const { setIndex } = React.useContext(LocalContext)

    const handleClickPrevious = (event) => {
        if (index > 1) setIndex(index - 1)
    }

    const handleClickNext = (event) => {
        if (index < total) setIndex(index + 1)
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexGrow: 0,
                    flexBasis: "50px"
                }}
            >
                <FontAwesomeIcon
                    className="navigate-icon"
                    icon={icon({name: "angle-left"})}
                    onClick={handleClickPrevious}
                    color={index === 1 ? "grey" : "black"}
                />
                <span>{`${index} / ${total}`}</span>
                <FontAwesomeIcon
                    className="navigate-icon"
                    icon={icon({name: "angle-right"})}
                    onClick={handleClickNext}
                    color={index === total ? "grey" : "black"}
                />
            </div>
            <div
                style={{
                    flexGrow: 4
                }}
            >
                <FontAwesomeIcon
                    className="edit-icon"
                    icon={icon({name: "pen-to-square"})}
                    style={{float: "right"}}
                />
            </div>
        </div>
    )
}

export const MultiContentBox = ({ contents }) => {
    const [index, setIndex] = React.useState(1)
    const content = contents[index - 1]

    return (
        <LocalContext.Provider value={{setIndex}}>
            <LocalNavigator index={index} total={contents.length} />
            <div
                className="response-content"
                style={{
                    textAlign: "justify"
                }}
            >
                {content}
            </div>
        </LocalContext.Provider>
    )
}