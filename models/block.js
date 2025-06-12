// models/block.js
//
// Minimal Block class with an embedded proof-of-work miner.

const crypto = require('crypto');

class Block {
  constructor(
    height,
    hash,
    previousHash,
    timestamp,
    difficulty,
    reward,
    nonce,
    miner
  ) {
    this.height       = height;
    this.hash         = hash;
    this.previousHash = previousHash;
    this.timestamp    = timestamp;
    this.difficulty   = difficulty;
    this.reward       = reward;
    this.nonce        = nonce;
    this.miner        = miner;
    this.transactions = [];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Very simple PoW loop: SHA-256 until `difficulty` leading zeros.
  static mineNewBlock(
    prevBlock,
    transactions,
    difficulty = 7,
    reward     = 50,
    miner      = 'Anonymous'
  ) {
    const height     = prevBlock ? prevBlock.height + 1 : 1;
    const prevHash   = prevBlock ? prevBlock.hash : '0'.repeat(64);
    const prefix     = '0'.repeat(difficulty);
    let nonce = 0, timestamp, hash;

    do {
      timestamp = Date.now();
      const payload = prevHash + timestamp + JSON.stringify(transactions) + nonce;
      hash = crypto.createHash('sha256').update(payload).digest('hex');
      nonce++;
    } while (!hash.startsWith(prefix));

    // nonce was incremented one step too far in the loop
    nonce--;

    const block = new Block(
      height,
      hash,
      prevHash,
      timestamp,
      difficulty,
      reward,
      nonce,
      miner
    );

    // prepend coinbase reward
    const coinbase = {
      sender:    'COINBASE',
      recipient: miner,
      amount:    reward,
      fee:       0,
      signature: 'COINBASE'
    };

    block.transactions = [coinbase, ...transactions];
    return block;
  }
}

module.exports = Block;
