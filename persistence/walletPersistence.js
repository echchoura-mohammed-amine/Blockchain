const fs = require("fs");
const path = require("path");

const pathDb = "database/wallet.json";
const blockDir = "database/blocks";

const saveWallet = async (wallet) => {
  const { pkey, solde, sentTransactions, receivedTransactions, minedTransactions } = wallet;

  try {
    await fs.promises.writeFile(pathDb, JSON.stringify({
      pkey,
      solde,
      sentTransactions,
      receivedTransactions,
      minedTransactions
    }, null, 3));
    return true;
  } catch (e) {
    console.error("Failed to save wallet:", e);
    throw e;
  }
};

const loadWallets = () => {
  return new Promise((resolve, reject) => {
    fs.promises.readFile(pathDb)
      .then(data => {
        data = JSON.parse(data);
        resolve(data);
      })
      .catch(e => {
        console.error("Failed to load wallet.json:", e);
        reject(null);
      });
  });
};

//  Compute wallet balances from block files
const computeWalletBalancesFromBlocks = async () => {
  const balances = {}; // Format: { publicKey: balance }

  try {
    const files = await fs.promises.readdir(blockDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const blockPath = path.join(blockDir, file);
      const blockData = await fs.promises.readFile(blockPath, 'utf-8');
      const block = JSON.parse(blockData);

      for (const tx of block.transactions) {
        const { sender, recipient, amount } = tx;

        if (!sender || !recipient || typeof amount !== 'number') continue;

        // Handle coinbase transactions
        if (sender === "COINBASE") {
          balances[recipient] = (balances[recipient] || 0) + amount;
        } else {
          // Normal transaction
          balances[sender] = (balances[sender] || 0) - amount;
          balances[recipient] = (balances[recipient] || 0) + amount;
        }
      }
    }

    return balances;
  } catch (err) {
    console.error("Error computing balances:", err);
    return {};
  }
};

module.exports = {
  saveWallet,
  loadWallets,
  computeWalletBalancesFromBlocks
};
