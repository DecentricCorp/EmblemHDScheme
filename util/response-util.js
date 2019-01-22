function responseNodeback(callback, payload) { // TODO migrate all calls of this function to use 'response' instead
    return callback(200, payload, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    })
}

function response(body, status = 200) {
    return {
        status: status,
        body: JSON.stringify(body, null, 4),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    }
}

module.exports.responseNodeback = responseNodeback
module.exports.response = response
