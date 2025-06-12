// persistence/mempoolPersistence.js
//
// Handles the transaction mempool (simple JSON file).

const fs   = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'database', 'mempool.json');

// helper ────────────────────────────────────────────────────────────────────
function loadMempool() {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveMempool(arr) {
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

// API ───────────────────────────────────────────────────────────────────────
async function getAllTransactionsMempool() {
  return loadMempool();
}

async function addTransactionMempool(tx) {
  const mempool = loadMempool();
  mempool.push(tx);
  saveMempool(mempool);
}

// Remove a single tx by signature (legacy flow)
async function clearMempool({ signature }) {
  const mempool = loadMempool().filter(t => t.signature !== signature);
  saveMempool(mempool);
}

// Wipe everything (used after mining)
async function flushMempool() {
  saveMempool([]);
}

module.exports = {
  getAllTransactionsMempool,
  addTransactionMempool,
  loadMempool,
  saveMempool,
  clearMempool,
  flushMempool
};
