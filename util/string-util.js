function hexToAscii(num) {
    const hex = num.toString()
    let ascii = ''
    for (let i = 0; i < hex.length; i += 2)
        ascii += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return ascii
}

module.exports.hexToAscii = hexToAscii
