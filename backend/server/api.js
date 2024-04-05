import archiver from 'archiver'
import stream, { Readable, pipeline } from 'stream'
import moment from 'moment'
import { app } from "../server/appInstance.js"
import { RankingSampleCollection } from '../models/rankingSample.model.js'
import { getRNG } from '../lib/seedRandom.js'

app.get("/paginated_data", async (req, res) => {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} GET /paginated_data`)
    const query = req.query
    const pageNum = parseInt(query.pageNum)
    const recordsPerPage = parseInt(query.recordsPerPage)
    const offset = (pageNum - 1) * recordsPerPage
    const docs = await RankingSampleCollection
                        .find({})
                        .sort({ createdAt: 1 })
                        .skip(offset)
                        .limit(recordsPerPage)
                        .lean()
    res.send({ data: docs })
})

app.post("/update_comparisons", async (req, res) => {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} POST /update_comparisons`)
    const { sampleId, comparisons } = req.body
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
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} GET /total_data`)
    const count = await RankingSampleCollection.count({})
    res.send({ count })
})

app.post("/export_data", async (req, res) => {
    console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} POST /export_data`)
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