const characterPool = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function getRandomString (len = 16) {
    const randCharacters = []
    for (let i = 0; i < len; i++) {
        const idx = Math.floor(Math.random() * characterPool.length)
        randCharacters.push(characterPool[idx])
    }
    return randCharacters.join('')
}

