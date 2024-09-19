import React from "react"

export const AutofitTextArea = ({ content, onChange, onEdit, eRef }) => {
    const inputRef = React.useRef()
    const ref = eRef || inputRef
    const [contentHeight, setContentHeight] = React.useState("auto")

    React.useEffect(() => {
        const task = { current: null }
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === ref.current) {
                    clearTimeout(task.current)
                    task.current = setTimeout(() => {
                        fitTextArea()
                    }, 100)
                }
            }
        })
        observer.observe(ref.current)
        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [])

    React.useEffect(() => {
        fitTextArea()
    }, [content])

    const fitTextArea = () => {
        ref.current.style.height = "auto"
        const fullScrollHeight = ref.current.scrollHeight
        ref.current.style.height = fullScrollHeight + "px"
        setContentHeight(fullScrollHeight)
    }

    return (
        <div style={{ height: `${contentHeight}` }}>
            <textarea
                className='output-content-area'
                ref={ref}
                readOnly={!onEdit}
                value={content}
                onChange={onChange}
                style={{
                    padding: 0,
                    overflow: "hidden",
                    color: "initial",
                }}
            ></textarea>
        </div>
    )
}
