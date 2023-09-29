import { setup } from "./startup.js";
import { RankingSampleCollection } from "./models/rankingSample.model.js";

setup().then(async () => {
    const r = new RankingSampleCollection({
        input: "Hôm nay thời tiết thế nào?",
        outputs: [
            {
                content: "Hơi đẹp bạn ạ",
                metadata: {
                    generator: "GPT-4"
                }
            },
            {
                content: "Hơi xấu bạn ạ",
                metadata: {
                    generator: "GPT-3.5"
                }
            }
        ],
        metadata: {
            dataset: "vietnews"
        }
    })
    await r.save()
    const s = new RankingSampleCollection({
        input: "Thế còn thời tiết ngày mai thì sao ạ?",
        outputs: [
            {
                content: "Ai biết =))",
                metadata: {
                    generator: "Lê Vũ Lợi"
                }
            },
            {
                content: "Chịu :))",
                metadata: {
                    generator: "Lê Vũ Lợi"
                }
            }
        ],
        metadata: {
            dataset: "dummy"
        }
    })
    await s.save()
    const t = new RankingSampleCollection({
        input: "Very nice",
        outputs: [
            {
                content: "Yes I know",
                metadata: {
                    generator: "Loi Le"
                }
            },
            {
                content: "I don't know",
                metadata: {
                    generator: "Loi Le"
                }
            }
        ],
        metadata: {
            dataset: "dummy"
        }
    })
    await t.save()
}).catch(e => console.log(e))
