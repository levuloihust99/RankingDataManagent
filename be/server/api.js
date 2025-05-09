import archiver from "archiver"
import stream, { Readable, pipeline } from "stream"
import axios from "axios"
import moment from "moment"
import { app } from "../server/appInstance.js"
import { RankingSampleCollection } from "../models/rankingSample.model.js"
import { getRNG } from "../lib/seedRandom.js"
import { AISERVICE_URL } from "../env.js"
import { urlJoin } from "../lib/utils.js"

/**
 * Format entities for FE display
 */
function feFormat(content, entities) {
    const portions = []
    let pointer = 0
    for (const entity of entities) {
        if (entity.start > pointer) {
            portions.push({
                type: "outside",
                text: content.slice(pointer, entity.start)
            })
        }
        portions.push({ type: "entity", text: entity.value })
        pointer = entity.end
    }
    if (pointer < content.length) {
        portions.push({ type: "outside", text: content.slice(pointer) })
    }
    return portions
}

/**
 * Convert back from FE display entities to backend storage entities
 */
function beFormat(content, entities) {
    let pointer = 0
    const beEntities = []
    for (const entity of entities) {
        if (entity.type === "entity") {
            beEntities.push({
                value: entity.text,
                start: pointer,
                end: pointer + entity.text.length
            })
        }
        pointer += entity.text.length
    }
    return beEntities
}

app.get("/paginated_data", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} GET /paginated_data`)
    const query = req.query
    const pageNum = parseInt(query.pageNum)
    if (isNaN(pageNum) || pageNum <= 0) {
        res.status(400).send({ data: [] })
        return
    }
    const recordsPerPage = parseInt(query.recordsPerPage)
    const offset = (pageNum - 1) * recordsPerPage
    const docs = await RankingSampleCollection.find({})
        .sort({ createdAt: 1 })
        .skip(offset)
        .limit(recordsPerPage)
        .lean()
    for (const doc of docs) {
        if (doc.comparisons && doc.comparisons.length > 0) {
            for (const comp of doc.comparisons) {
                const { negatives = [], positives = [] } = comp
                for (const neg of negatives) {
                    if (neg.entities && neg.entities.length > 0) {
                        neg.entities = feFormat(neg.content, neg.entities)
                    }
                }
                for (const pos of positives) {
                    if (pos.entities && pos.entities.length > 0) {
                        pos.entities = feFormat(pos.content, pos.entities)
                    }
                }
            }
        }
    }
    res.send({ data: docs })
})

app.post("/update_comparisons", async (req, res) => {
    console.log(
        `${moment().format("YYYY-MM-DD HH:mm:ss")} POST /update_comparisons`
    )
    const { sampleId, comparisons } = req.body
    if (comparisons && comparisons.length > 0) {
        for (const comp of comparisons) {
            const { negatives = [], positives = [] } = comp
            for (const neg of negatives) {
                if (neg.entities && neg.entities.length > 0) {
                    neg.entities = beFormat(neg.content, neg.entities)
                }
            }
            for (const pos of positives) {
                if (pos.entities && pos.entities.length > 0) {
                    pos.entities = beFormat(pos.content, pos.entities)
                }
            }
        }
    }
    try {
        await RankingSampleCollection.findOneAndUpdate(
            { sampleId },
            {
                $set: {
                    comparisons
                }
            }
        )
        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err)
    }
})

app.post("/update_outputs", async (req, res) => {
    console.log(
        `${moment().format("YYYY-MM-DD HH:mm:ss")} POST /update_outputs`
    )
    const { sampleId, outputs } = req.body
    try {
        await RankingSampleCollection.findOneAndUpdate(
            { sampleId },
            {
                $set: {
                    outputs
                }
            }
        )
        res.sendStatus(200)
    } catch (err) {
        res.status(500).send(err)
    }
})

app.get("/total_data", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} GET /total_data`)
    const count = await RankingSampleCollection.count({})
    res.send({ count })
})

app.post("/export_data", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} POST /export_data`)
    const { size, shuffle, seed } = req.body
    const inputReadableStream = new Readable({
        read() {}
    })
    const archive = archiver("zip", {
        zlib: { level: 9 }
    })
    archive.pipe(res)
    res.setHeader("Content-Type", "application/zip")
    res.setHeader("Content-Disposition", "attachment; filename=data.zip")

    if (!shuffle) {
        const cursor = RankingSampleCollection.find({}).sort({ createdAt: 1 })
        if (size > 0) {
            cursor.limit(size)
        }
        for await (const doc of cursor) {
            inputReadableStream.push(JSON.stringify(doc) + "\n")
        }
        inputReadableStream.push(null)
    } else {
        const rng = getRNG(seed || "seed")
        const consistentSeed = rng().toString()
        const aggregation = [
            {
                $set: {
                    seed: consistentSeed
                }
            },
            {
                $set: {
                    seededHashCode: {
                        $function: {
                            body: function (seed, sampleId) {
                                return hex_md5(seed + sampleId)
                            },
                            args: ["$seed", "$sampleId"],
                            lang: "js"
                        }
                    }
                }
            },
            {
                $sort: {
                    seededHashCode: 1
                }
            },
            {
                $unset: ["seed", "seededHashCode"]
            }
        ]
        if (size > 0) {
            aggregation.push({
                $limit: size
            })
        }
        const docs = await RankingSampleCollection.aggregate(aggregation)
        for (const doc of docs) {
            inputReadableStream.push(JSON.stringify(doc) + "\n")
        }
        inputReadableStream.push(null)
    }
    archive.append(inputReadableStream, { name: "data.jsonl" })
    archive.finalize()
})

app.post("/diff", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} POST /diff`)
    const endpoint = urlJoin(AISERVICE_URL, "diff")
    let resp
    try {
        resp = await axios.request({
            method: "POST",
            url: endpoint,
            headers: req.headers,
            data: req.rawBody
        })
    } catch (err) {
        console.log(err)
        const { response: { data: errorObj = null } = {} } = err
        if (errorObj) {
            res.status(e.response.status).send(errorObj)
        } else {
            res.sendStatus(500)
        }
        return
    }
    res.send(resp.data)
})

app.post("/annotate", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} POST /annotate`)
    try {
        await RankingSampleCollection.findOneAndUpdate(
            {
                sampleId: req.body.sampleId
            },
            { $set: { annotated: true, outputs: req.body.outputs } }
        )
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.post("/unannotate", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} POST /annotate`)
    try {
        await RankingSampleCollection.findOneAndUpdate(
            {
                sampleId: req.body.sampleId
            },
            { $set: { annotated: false } }
        )
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.post("/call_cortex", async (req, res) => {
    console.log(`${moment().format("YYYY-MM-DD HH:mm:ss")} POST /call_cortex`)
    const endpoint = "http://localhost:1337/v1/chat/completions"
    let resp
    try {
        resp = await axios.request({
            method: "POST",
            url: endpoint,
            headers: {
                "Content-Type": "application/json"
            },
            data: {
                model: "bartowski/gemma-2-2b-it-GGUF",
                messages: [
                    {
                        role: "user",
                        content: req.body.text
                    }
                ]
            }
        })
        const respData = resp.data
        const completion = respData.choices[0].message.content
        res.send(completion)
    } catch (err) {
        console.log(err)
        const { response: { data: errorObj = null } = {} } = err
        if (errorObj) {
            res.status(e.response.status).send(errorObj)
        } else {
            res.sendStatus(500)
        }
        return
    }
})
