import { setup } from './startup.js'
import './server/setupREST.js'
import './server/api.js'
import { server } from './server/appInstance.js'

setup().then(() => {
    const port = process.env.PORT || 8888
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
})