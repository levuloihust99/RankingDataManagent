import { Header, Menu, Icon } from 'semantic-ui-react'
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useNavigate } from 'react-router-dom'
import "./style.css"

export const NavBar = ({ activeItem, setActiveItem }) => {
    const navigate = useNavigate()
    const handleOnClick = (e, { name }) => {
        setActiveItem(name)
        if (name === "export") {
            navigate("/export")
        } else if (name === "database") {
            navigate("/dataset/page/1")
        } else if (name === "import") {
            navigate("/import")
        }
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
                Navigator
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
                {/* <Menu.Item
                    name="playground"
                    active={activeItem === "playground"}
                    onClick={handleOnClick}
                >
                    <Icon name="comment" />
                    Playground
                </Menu.Item> */}
                <Menu.Item
                    name="export"
                    active={activeItem === "export"}
                    onClick={handleOnClick}
                >
                    <FontAwesomeIcon
                        style={{
                            float: "right",
                            width: "1.18em"
                        }}
                        icon={icon({name: "download"})}
                    />
                    Export
                </Menu.Item>
                <Menu.Item
                    name="import"
                    active={activeItem === "import"}
                    onClick={handleOnClick}
                >
                    <FontAwesomeIcon
                        style={{
                            float: "right",
                            width: "1.18em"
                        }}
                        icon={icon({name: "file-import"})}
                    />
                    Import
                </Menu.Item>
            </Menu>
        </div>
    )
}