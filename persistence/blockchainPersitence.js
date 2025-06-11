const fs = require("fs")
const { resolve } = require("path")
const pathDb = "database/blockchain.json"
const saveBlockchain = async (blockchain) => {
    const { name, difficulty, miningInterval,
        blockReward, denom, head } = blockchain

    if (head != null) {
        head = head.hash
    }
    try {
        await fs.promises.writeFile(pathDb, JSON.stringify(
            {
                name, difficulty, miningInterval, blockReward, denom, head
            }, null, 3
        ))
        return true;
    }
    catch (e) {
        console.error(e)
        throw e
    }
}
const loadBlockchain = () => {
    return new Promise((resolve, reject) => {
        fs.promises.readFile(pathDb)
            .then(data => {
                data = JSON.parse(data)
                resolve(data)
            })
            .catch(e => {
                console.error(e)
                reject(null)
            })
    })
}
module.exports = {
    loadBlockchain, saveBlockchain
}