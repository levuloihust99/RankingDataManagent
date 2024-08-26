export const AISERVICE_URL = (function () {
    return `http://${process.env.AISERVICE_HOST}:${process.env.AISERVICE_PORT}`
})()
