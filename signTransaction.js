const crypto = require('crypto');
const fs = require('fs');

const tx = {
  sender: "Mehdi",
  recipient: "Sh4d0w",
  amount: 25,
  fee: 3
};

const privateKey = fs.readFileSync("./keys/mehdi_private.pem", "utf8");
const txData = JSON.stringify(tx);
const hash = crypto.createHash("sha256").update(txData).digest();

const sign = crypto.createSign("RSA-SHA256");
sign.update(hash);
const signature = sign.sign(privateKey, "hex");

const signedTx = { ...tx, signature };
console.log(JSON.stringify(signedTx, null, 2));
