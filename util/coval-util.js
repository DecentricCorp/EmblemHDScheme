const Coval = require('coval.js').Coval

function createAgentUser() {
    const coval = new Coval()
    return new coval.Agent(coval.User.Server).user
}

module.exports.createAgentUser = createAgentUser
