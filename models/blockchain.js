class Blockchain {
    constructor(name = "uemfBlockchain", difficulty = 6,
        miningInterval = 600, blockReward = 50, denom = "uemfCoin"
    ) {
        this.name = name
        this.difficulty = difficulty
        this.miningInterval = miningInterval
        this.blockReward = blockReward
        this.denom = denom
        this.head = null
    }
}
module.exports = Blockchain