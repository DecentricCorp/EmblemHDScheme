function fatalStatusCodeError(code = 200, message) {
    throw new Error(`StatusCodeError: ${code} - ${message}`)
    // 200, {error: '${message}'}, {'Content-Type': 'application/json'})
}

module.exports.fatalStatusCodeError = fatalStatusCodeError
