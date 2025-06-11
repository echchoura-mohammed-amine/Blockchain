class Block {
    constructor(height, hash, previousHash, 
        timestamp, difficulty, blockReward,nonce,miner) {
        this.height=height
        this.hash=hash
        this.previousHash=previousHash
        this.timestamp=timestamp
        this.difficulty=difficulty
        this.blockReward=blockReward
        this.nonce=nonce
        this.blockchain = null
        this.transactions = []
        this.miner = miner
        this.previousBlock = null
    }
}

module.exports = Block