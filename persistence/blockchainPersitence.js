// persistence/blockchainPersitence.js
//
// Stores the global chain parameters (difficulty, reward, …).
// Also exposes getLastBlock() so other modules don’t have to reach
// into blockPersistence directly.

const fs   = require('fs');
const path = require('path');
const {
  getAllBlocks            // from persistence/blockPersistence.js
} = require('./blockPersistence.js');

const file = path.join(__dirname, '..', 'database', 'blockchain.json');

// ────────────────────────────────────────────────────────────────────────────
const defaultMeta = { difficulty: 7, blockReward: 50 };

function loadBlockchain() {
  if (!fs.existsSync(file)) return { ...defaultMeta };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveBlockchain(meta) {
  fs.writeFileSync(file, JSON.stringify(meta, null, 2));
}

// Convenience: fetch the tail block if it exists
async function getLastBlock() {
  const all = await getAllBlocks();
  return all.length ? all[all.length - 1] : null;
}

module.exports = {
  loadBlockchain,
  saveBlockchain,
  getLastBlock
};
