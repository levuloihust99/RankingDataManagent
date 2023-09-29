import typeis from 'type-is'

// retrain raw body of the request
export function rawBodyParser(req, res, next) {
    const buffer = []
    req.on('data', (chunk) => {
        buffer.push(chunk)
    })
    req.on('end', () => {
        req.rawBody = Buffer.concat(buffer)
        next()
    })
}

// application/json parser
export function jsonParser(req, res, next) {
    if (typeis(req, 'application/json')) {
        req.body = JSON.parse(req.rawBody.toString())
    }
    next()
}

// application/x-www-form-urlencoded parser
export function urlFormParser(req, res, next) {
    if (typeis(req, 'application/x-www-form-urlencoded')) {
        req.body = urlEncodedParser(
            req.rawBody.toString(), {
                allowPrototypes: true,
                depth: Infinity
            }
        )
    }
    next()
}