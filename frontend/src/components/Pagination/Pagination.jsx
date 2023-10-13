import { useNavigate } from "react-router-dom"
import { icon } from '@fortawesome/fontawesome-svg-core/import.macro'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button } from "semantic-ui-react"
import "./style.css"

export const Pagination = ({ pageId, totalPage }) => {
    const navigate = useNavigate()

    const handleClickPrevious = (e) => {
        if (pageId > 1) {
            navigate(`/page/${pageId - 1}`)
        }
    }

    const handleClickNext = (e) => {
        if (pageId < totalPage) {
            navigate(`/page/${pageId + 1}`)
        }
    }

    const render = () => {
        let prePart = []
        let postPart = []
        if (pageId <= 4) {
            for (let i = 1; i <= pageId - 1; i++) {
                prePart.push({ num: i, active: false })
            }
        } else {
            prePart = [{ num: 1, active: false}, { num: "dots", activate: false }, { num: pageId - 1, active: false }]
        }
        if (pageId >= totalPage - 3) {
            for (let i = pageId + 1; i <= totalPage; i++) {
                postPart.push({ num: i, activate: false })
            }
        } else {
            postPart = [{ num: pageId + 1, active: false }, { num: "dots", active: false }, { num: totalPage, active: false }]
        }
        const totalEntries = totalPage <= 7 ? totalPage : 7
        if (prePart.length + postPart.length < totalEntries - 1) {
            const preHasDots = !prePart.every(item => item.num !== "dots")
            const postHasDots = !postPart.every(item => item.num !== "dots")
            if (preHasDots) {
                const expectedPreLen = totalEntries - (totalPage - pageId + 1)
                if (pageId - 1 === expectedPreLen) {
                    prePart = []
                    for (let i = 1; i <= pageId - 1; i++) {
                        prePart.push({ num: i, active: false })
                    }
                } else { // greater than
                    prePart = []
                    for (let i = 0; i < expectedPreLen - 2; i++) {
                        prePart.push({ num: pageId - expectedPreLen + i + 2 })
                    }
                    prePart = [
                        { num: 1, active: false },
                        { num: "dots", active: false },
                        ...prePart
                    ]
                }
            }
            if (postHasDots) {
                const expectedPostLen = totalEntries - pageId
                if (totalPage - pageId + 1 === expectedPostLen) {
                    postPart = []
                    for (let i = pageId + 1; i <= totalPage; i++) {
                        postPart.push({ num: i, active: false })
                    }
                } else { // greater than
                    postPart = []
                    for (let i = 1; i <= expectedPostLen - 2; i++) {
                        postPart.push({ num: pageId + i, active: false })
                    }
                    postPart.push({ num: "dots", active: false })
                    postPart.push({ num: totalPage, active: false })
                }
            }
        }
        const parts = [...prePart, { num: pageId, active: true }, ...postPart]
        const elements = parts.map((item, idx) => {
            if (item.num === "dots") {
                return <span key={idx}>. . .</span>
            }
            return (
                <Button
                    key={idx}
                    onClick={() => navigate(`/page/${item.num}`)}
                    className={item.active === true ? "pagination-button active" : "pagination-button"}
                >
                    {item.num}
                </Button>
            )
        })
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: "10px"
                }}
            >
                <Button
                    className="pagination-button"
                    onClick={handleClickPrevious}
                >
                    <FontAwesomeIcon icon={icon({name: "angle-left"})} />
                </Button>
                {elements}
                <Button
                    className="pagination-button"
                    onClick={handleClickNext}
                >
                    <FontAwesomeIcon icon={icon({name: "angle-right"})} />
                </Button>
            </div>
        )
    }
    return render()
}