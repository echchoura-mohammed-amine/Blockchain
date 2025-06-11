class Transaction {
    constructor(signature, fees, amount, receiver, sender) {
        this.signature = signature
        this.fees = fees
        this.amount = amount
        this.mempool = null;
        this.block = null
        this.sender = receiver
        this.receiver = sender 
    }
}