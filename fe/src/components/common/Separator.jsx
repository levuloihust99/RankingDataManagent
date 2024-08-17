export const VerticalSeparator = ({ width, style }) => {
    return (
        <div
            style={{
                ...style,
                width: width,
            }}
        ></div>
    )
}

export const HorizontalSeparator = ({ height, style }) => {
    return (
        <div
            style={{
                ...style,
                height: height,
            }}
        ></div>
    )
}
