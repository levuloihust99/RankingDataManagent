import { BACKEND_URL } from "../lib/constant"
import { urlJoin } from "../lib/utils"

export const diffTexts = async (data) => {
    const endpoint = urlJoin(BACKEND_URL, "/diff")
    return await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json",
        },
    })
}