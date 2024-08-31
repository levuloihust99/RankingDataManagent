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
    if (pointer < content.length - 1) {
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
