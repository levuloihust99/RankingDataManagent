import fs from "fs"
import parseArgs from "minimist"
import readline from "readline"
import ProgressBar from "progress"

import { setup } from "../startup.js"
process.env.API_KEY = process.env.GEMINI_API_KEY

import { RankingSampleCollection } from "../models/rankingSample.model.js"
import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory
} from "@google/generative-ai"

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE
    }
]

const getPrompt = (content) => {
    return `Viết một đoạn văn dài tối đa 3 câu để tóm tắt văn bản sau đây:\n"""\n${content}\n"""`
}

const sampleTask = (sample, count) => {

}

async function main() {
    console.log(process.argv[0])
    const argv = parseArgs(process.argv.slice(2), {
        string: "dataPath"
    })
    if (!argv.dataPath) {
        throw new Error("`dataPath` param is required")
    }
    const rl = { value: undefined }
    const fileStream = { value: undefined }
    const counter = { value: undefined }
    const numLines = await new Promise((resolve, reject) => {
        counter.value = 0
        fileStream.value = fs.createReadStream(argv.dataPath)
        rl.value = readline.createInterface({
            input: fileStream.value,
            crlfDelay: Infinity
        })
        rl.value.on("line", (line) => {
            counter.value++
        })
        rl.value.on("close", () => {
            resolve(counter.value)
        })
    })

    const bar = new ProgressBar(":bar :current/:total", { total: numLines })
    counter.value = 0
    const genAI = new GoogleGenerativeAI(process.env.API_KEY)
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro",
        safetySettings
    })

    await new Promise(async (resolve, reject) => {
        fileStream.value = fs.createReadStream(argv.dataPath)
        rl.value = readline.createInterface({
            input: fileStream.value,
            crlfDelay: Infinity
        })
        for await (const line of rl.value) {
            try {
                counter.value++
                const sample = JSON.parse(line)
                const dbRecord = await RankingSampleCollection.findOne({
                    sampleId: sample.sampleId
                }).lean()
                const { comparisons: [{ positives = [] } = {}, ..._] = [] } =
                    dbRecord
                if (positives.length > 0) {
                    console.log(`Skip sample #${counter.value}`)
                    continue
                }
                const prompt = getPrompt(sample.input)
                const result = await model.generateContent(prompt)
                const summ = result.response.text()
                await RankingSampleCollection.findOneAndUpdate(
                    { sampleId: dbRecord.sampleId },
                    {
                        $set: {
                            comparisons: [
                                {
                                    positives: [
                                        {
                                            content: summ,
                                            metadata: {
                                                generator: "gemini-1.5-pro"
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                )
                console.log(`Done sample #${counter.value} - ${sample.sampleId}`)
            } catch (err) {
                console.log(`Encounter error #${counter.value}`)
                console.log(err)
            }
        }
        console.log("Done processing file.")
        resolve()
    })
}

setup().then(() => main())
