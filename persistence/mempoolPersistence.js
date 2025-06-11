// addTransactionMempool
// removeTransactionMempool
// getAllTransactionsMempool
// saveMempool
const pathDb = "database/mempool.json"
const fs = require("fs")
const getAllTransactionsMempool = async () => {
    try {
        let transactions = JSON.parse(await fs.promises.readFile(pathDb))
        return transactions;
    }
    catch (e) {
        throw e
    }
}
const saveMempool = async (mempool) => {
    try {
        await fs.promises.writeFile(pathDb, JSON.stringify(mempool, null, 3))
    } catch (error) {
        throw error
    }
}

const addTransactionMempool = async (transaction) => {
    try {
        const mempool = await getAllTransactionsMempool()
        mempool.push(transaction)
        await saveMempool(mempool)
    }
    catch (error) {
        throw error
    }
}

/*
const user = {name:"mehdi",age:32}
undefined
const hello = ({name})=>console.log(name)
undefined
hello(user)
VM1046:1 mehdi
 */
const removeTransactionMempool = async ({ signature }) => {
    try {
        let mempool = await getAllTransactionsMempool()
        mempool = mempool.filter(tx => tx.signature != signature)
        await saveMempool(mempool)
    }
    catch (error) {
        throw error
    }
}
module.exports = {
    addTransactionMempool, getAllTransactionsMempool,
    removeTransactionMempool, saveMempool
}