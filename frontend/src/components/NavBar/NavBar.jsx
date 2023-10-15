import { Header, Menu, Icon } from 'semantic-ui-react'
import "./style.css"

export const NavBar = ({ activeItem, setActiveItem }) => {
    const handleOnClick = (e, { name }) => {
        setActiveItem(name)
    }
    return (
        <div
            id="nav-bar"
        >
            <Header
                style={{
                    fontVariant: "small-caps",
                    fontSize: "2.0em",
                    marginTop: "20px"
                }}
            >
                Master Thesis
            </Header>
            <Menu
                vertical
                inverted
                borderless
                color="teal"
                style={{ margin: "auto" }}
            >
                <Menu.Item
                    name="database"
                    active={activeItem === "database"}
                    onClick={handleOnClick}
                >
                    <Icon name="database" />
                    Database
                </Menu.Item>
                <Menu.Item
                    name="playground"
                    active={activeItem === "playground"}
                    onClick={handleOnClick}
                >
                    <Icon name="comment" />
                    Playground
                </Menu.Item>
            </Menu>
        </div>
    )
}