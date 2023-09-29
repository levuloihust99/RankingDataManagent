import axios from 'axios'
import { app } from "../server/appInstance.js"
import { RankingSampleCollection } from '../models/rankingSample.model.js'

app.get("/paginated_data", async (req, res) => {
    const query = req.query
    const pageNum = parseInt(query.pageNum)
    const recordsPerPage = parseInt(query.recordsPerPage)
    const offset = (pageNum - 1) * recordsPerPage
    const docs = await RankingSampleCollection.find({}).skip(offset).limit(recordsPerPage).lean()
    res.send({ data: docs })
})

app.get("/total_data", async (req, res) => {
    const count = await RankingSampleCollection.count({})
    res.send({ count })
})