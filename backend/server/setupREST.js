import cors from "cors"
import { app } from './appInstance.js'
import {
    rawBodyParser, jsonParser, urlFormParser
} from './middleWare.js'

app.use(cors())
app.use(rawBodyParser)
app.use(jsonParser)
app.use(urlFormParser)