import { promises as fsPromises } from 'fs'
import { setup } from "./startup.js";
import { RankingSampleCollection } from "./models/rankingSample.model.js";

setup().then(async () => {
    const docs = await RankingSampleCollection.find({}).limit(10)
    await fsPromises.writeFile("data/fakeData.json", JSON.stringify(docs, null ,4))
}).catch(e => console.log(e))