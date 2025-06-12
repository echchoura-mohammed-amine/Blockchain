// server.js
//
// Express back-end serving the UI, handling signed TXs, and mining blocks.

const express = require('express');
const bodyParser = require('body-parser');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const app  = express();
const PORT = 3000;

// ─── Persistence modules ───────────────────────────────────────────────────
const blockchainMetadata = require('./persistence/blockchainPersitence.js');
const mempoolPersistence = require('./persistence/mempoolPersistence.js');
const {
  getAllBlocks,
  saveBlock
} = require('./persistence/blockPersistence.js');
const walletPersistence = require('./persistence/walletPersistence.js');
const Block = require('./models/block.js');

// ─── Static front-end ───────────────────────────────────────────────────────
const webPath = path.join(__dirname, 'web');
app.use(express.static(webPath));
app.get('/', (_req, res) => res.sendFile(path.join(webPath, 'index.html')));

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(bodyParser.json());

// ─── Demo-only: expose private PEM for client-side signing ─────────────────
app.get('/keys/:wallet/private', (req, res) => {
  const wallet = req.params.wallet.toLowerCase();
  const file = path.join(__dirname, 'keys', `${wallet}_private.pem`);
  if (!fs.existsSync(file)) return res.sendStatus(404);
  res.type('application/x-pem-file').send(fs.readFileSync(file, 'utf8'));
});

// ─── Chain state endpoints ─────────────────────────────────────────────────
app.get('/blocks', async (_req, res) => {
  res.json(await getAllBlocks());
});

app.get('/wallets', async (_req, res) => {
  res.json(await walletPersistence.computeWalletBalancesFromBlocks());
});

app.get('/mempool', async (_req, res) => {
  res.json(await mempoolPersistence.getAllTransactionsMempool());
});

// ─── Submit signed transaction ─────────────────────────────────────────────
app.post('/transactions/new', async (req, res) => {
  const { sender, recipient, amount, fee, signature } = req.body;
  if (!sender || !recipient || amount == null || !signature)
    return res.status(400).json({ error: 'Missing fields' });

  // verify sig
  const unsigned = { sender, recipient, amount, fee };
  const hash = crypto.createHash('sha256').update(JSON.stringify(unsigned)).digest();
  const pubKeyPath = path.join(__dirname, 'keys', `${sender.toLowerCase()}.pem`);
  if (!fs.existsSync(pubKeyPath))
    return res.status(400).json({ error: 'Sender public key not found' });

  const valid = crypto
    .createVerify('RSA-SHA256')
    .update(hash)
    .verify(fs.readFileSync(pubKeyPath, 'utf8'), signature, 'hex');

  if (!valid) return res.status(400).json({ error: 'Invalid digital signature' });

  await mempoolPersistence.addTransactionMempool(req.body);
  res.json({ message: 'Transaction added to mempool', transaction: req.body });
});

// ─── Mine block (POST /mine) ───────────────────────────────────────────────
app.post('/mine', async (req, res) => {
  try {
    const mempool = await mempoolPersistence.getAllTransactionsMempool();
    if (mempool.length === 0)
      return res.status(400).json({ message: 'No transactions to mine' });

    const lastBlock = await blockchainMetadata.getLastBlock();
    const minerName = req.body.miner || 'Anonymous';

    const meta = blockchainMetadata.loadBlockchain();   // { difficulty, blockReward }
    const newBlock = Block.mineNewBlock(
      lastBlock,
      mempool,
      meta.difficulty,
      meta.blockReward,
      minerName
    );

    await saveBlock(newBlock);
    await mempoolPersistence.flushMempool();

    res.json({ message: 'Block mined', block: newBlock });
  } catch (err) {
    console.error('Mining error:', err);
    res.status(500).json({ error: 'Failed to mine block' });
  }
});

// ─── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
