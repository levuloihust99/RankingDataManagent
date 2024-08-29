export const BACKEND_URL = (function () {
    const value = process.env.REACT_APP_BACKEND_URL
    if (value == null) return "/api"
    return value
})()

export const RECORDS_PER_PAGE = (function () {
    const value = parseInt(process.env.REACT_APP_RECORDS_PER_PAGE)
    if (isNaN(value)) return 10
    return value
})()
