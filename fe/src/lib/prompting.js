export function formatNumber(number, len) {
    const numStr = number.toString()
    let formattedNumber = numStr
    if (numStr.length < len) {
        for (let i = 0; i < len - numStr.length; i++) {
            formattedNumber = '0' + formattedNumber
        }
    }
    return formattedNumber
}

export function getRankingPrompt(article, summaries) {
    const summList = ["-------------\n"]
    const count = { value: 0 }
    for (const summary of summaries) {
        count.value++
        summList.push(`[S-${formatNumber(count.value, 3)}] ` + summary.content.trim() + "\n")
        summList.push("-------------\n")
    }
    const summInput = summList.join("")
    const prompt = "I have a list of summaries for a news article. I want you to sort these summaries from the best to the worst.\n" +
                    "\nArticle\n\"\"\"\n" +
                    article.trim() + "\n\"\"\"\n\n" +
                    "Summaries\n" +
                    summInput
    console.log(prompt)
    return prompt
}
