import React from "react"
import { Button, Icon } from "semantic-ui-react"
import { AppContext } from "../../context"

export const TitleBar = () => {
    const { dispatch } = React.useContext(AppContext)
    return (
        <div
            style={{
                backgroundColor: "#419197",
                padding: "10px",
                display: "flex",
                flexDirection: "row",
            }}
            className="min-width-1000px"
        >
            <Button
                id="nav-button"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    backgroundColor: "transparent",
                    zIndex: 1000,
                    color: "white"
                }}
                icon
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            >
                <Icon name="bars"></Icon>
            </Button>
            <div
                style={{
                    flexGrow: 1,
                    textAlign: "center",
                    fontSize: "32px",
                    lineHeight: "1",
                    fontVariant: "small-caps",
                    fontWeight: 700,
                    color: "white"
                }}
            >
                Ranking Data Management
            </div>
        </div>
    )
}