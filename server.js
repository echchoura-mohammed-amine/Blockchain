const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto'); 
const fs = require('fs');
const app = express();
const PORT = 3000;

// === Load persistence modules ===
const blockchainMetadata = require('./persistence/blockchainPersitence.js');
const mempoolPersistence = require('./persistence/mempoolPersistence');
const walletPersistence = require('./persistence/walletPersistence');
const blockPersistence = require('./persistence/blockpersistence');
const Block = require('./models/block');

// === Middleware ===
app.use(bodyParser.json());
app.use(express.static('web'));

function calculateHash(height, previousHash, timestamp, transactions, difficulty, blockReward, nonce, miner) {
  const data = `${height}${previousHash}${timestamp}${JSON.stringify(transactions)}${difficulty}${blockReward}${nonce}${miner}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function mineBlock(height, previousHash, transactions, difficulty, blockReward, miner) {
  let nonce = 0;
  let timestamp;
  let hash;
  const target = '0'.repeat(difficulty);

  do {
    timestamp = Date.now();
    hash = calculateHash(height, previousHash, timestamp, transactions, difficulty, blockReward, nonce, miner);
    nonce++;
  } while (!hash.startsWith(target));

  return { hash, nonce: nonce - 1, timestamp };
}


// === Routes ===

// Get full blockchain (blocks list)
app.get('/blocks', async (req, res) => {
  try {
    const blocks = await blockPersistence.getAllBlocks();
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load blocks' });
  }
});

// Get current mempool
app.get('/mempool', async (req, res) => {
  try {
    const mempool = await mempoolPersistence.getAllTransactionsMempool();
    res.json(mempool);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load mempool' });
  }
});

// Submit a new transaction
app.post('/transactions/new', async (req, res) => {
  const tx = req.body;
  const { sender, recipient, amount, fee, signature } = tx;

  if (!sender || !recipient || !amount || !signature) {
    return res.status(400).json({ error: 'Missing transaction fields' });
  }

  // Begin signature verification
  try {
    // Rebuild original transaction (without signature)
    const unsignedTx = { sender, recipient, amount, fee };
    const txData = JSON.stringify(unsignedTx);
    const hash = crypto.createHash("sha256").update(txData).digest();

    // Load sender's public key
    const publicKeyPath = `keys/${sender}.pem`;
    if (!fs.existsSync(publicKeyPath)) {
      return res.status(400).json({ error: 'Sender public key not found' });
    }

    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(hash);
    const isValid = verify.verify(publicKey, signature, "hex");

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid digital signature' });
    }

    // Passed verification — add to mempool
    await mempoolPersistence.addTransactionMempool(tx);
    res.json({ message: 'Transaction added to mempool', transaction: tx });

  } catch (err) {
    console.error("Signature verification failed:", err);
    res.status(500).json({ error: 'Error verifying transaction signature' });
  }
});


// Mine a new block
app.post('/mine', async (req, res) => {
  try {
    const mempool = await mempoolPersistence.getAllTransactionsMempool();

    if (mempool.length === 0) {
      return res.status(400).json({ message: 'No transactions to mine' });
    }

    const blocks = await blockPersistence.getAllBlocks();
    const lastBlock = blocks[blocks.length - 1];
    const newHeight = lastBlock ? lastBlock.height + 1 : 1;

    const miner = req.body.miner || "UnknownMiner";

    const { hash, nonce, timestamp } = mineBlock(
      newHeight,
      lastBlock ? lastBlock.hash : "0",
      mempool,
      7,
      50,
      miner
    );

    const newBlock = new Block(
      newHeight,
      hash,
      lastBlock ? lastBlock.hash : "0",
      timestamp,
      7,
      50,
      nonce,
      miner
    );

    const coinbaseTx = {
      sender: "COINBASE",
      recipient: miner,
      amount: 50,
      fee: 0,
      signature: "COINBASE"
    };

    newBlock.transactions = [coinbaseTx, ...mempool];

    await blockPersistence.saveBlock(newBlock);
    await mempoolPersistence.saveMempool([]);

    res.json({ message: 'Block mined', block: newBlock });
  } catch (err) {
    console.error("Mining error:", err);
    res.status(500).json({ error: 'Failed to mine block' });
  }
});


// Wallet balances
app.get('/wallets', async (req, res) => {
  try {
    const balances = await walletPersistence.computeWalletBalancesFromBlocks();
    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute wallet balances' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
