let providers = require('../../providers/index');
let utils = require("../../helpers/utils");
let dataUtils = require('../../data/utils');

let providerFunctions = {
	overhold: getOverholdInsightTransactions,
	blockcypher: getBlockcypherTransactions
};

async function getOverholdInsightTransactions(obj, addresses, pName) {
    let requestBody;

    if(pName !== 'overhold') {
        requestBody = {addrs: addresses.join()};
    } else {
        requestBody = {addresses: addresses};
    }
    let results =  providers.requests.postRequest(requestBody, providers.dogecoin[pName].getTx);

    return results.then(resultArrayRaw => {
        let resultArray = JSON.parse(resultArrayRaw);
        let result;
        if (resultArray) {
            for (let i = 0; i < resultArray.length; i++) {
                result = resultArray[i];
                if(result && result.txs) {
                    let items = result.txs;
                    for (let j = 0; j < items.length; j++) {
                        let item = items[j];
                        let transaction = utils.findAndUpdateDogecoinTransaction(obj.transactions, item);
                        if (!transaction) {
                            for (let k = 0; k < item.vout.length; k++) {
                                if (item.vout[k].scriptPubKey.addresses) {
                                    for (let index in addresses) {
                                        if (item.vout[k].scriptPubKey.addresses[0] === addresses[index]) {
                                            let transactionObj = {
                                                transactionHash: item.txid,
                                                from: item.vin[0].addr,
                                                to: item.vout[k].scriptPubKey.addresses[0],
                                                amount: utils.convertToSatoshis(item.vout[k].value),
                                                fees: item.fees ? utils.convertToSatoshis(item.fees) : 0,
                                                confirmations: item.confirmations,
                                                transactionDate: (item.time * 1000) + ''
                                            };
                                            obj.transactions.push(transactionObj);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return Promise.resolve(true);
    });
}

async function getBlockcypherTransactions(obj, addresses, pName) {
    let promises = providers.requests.getRequestParam(addresses, providers.litecoin.blockcypher.transactions, 'full');
    
    return promises.then(resultArrayRaw => {
        let resultArray = resultArrayRaw;
        let result;
        if (resultArray) {
            for (let i = 0; i < resultArray.length; i++) {
                result = resultArray[i];
                let items = result.txs;
                for (let j = 0; j < items.length; j++) {
                    let item = items[j];
                    let transaction = utils.findAndUpdateTransactionBlockcypher(obj.transactions, item);
                    if (!transaction) {
                        for (let k = 0; k < item.outputs.length; k++) {
                            if (item.outputs[k].addresses) {
                                for (let index in addresses) {
                                    if (item.outputs[k].addresses[0] === addresses[index]) {
                                        let transactionObj = {
                                            transactionHash: item.hash,
                                            from: item.inputs[0].addresses[0],
                                            to: item.outputs[k].addresses[0],
                                            amount: item.outputs[k].value,
                                            fees: item.fees,
                                            confirmations: item.confirmations,
                                            transactionDate: new Date(item.confirmed).getTime() + ''
                                        };
                                        obj.transactions.push(transactionObj);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return Promise.resolve(true);
    });
}

async function getTransactions(userCoin) {
	let resultObj = {};
	resultObj.internal = JSON.parse(JSON.stringify(userCoin.internal));
	resultObj.change = JSON.parse(JSON.stringify(userCoin.change));
	let internalTransactionsReceived = false;
	let changeTransactionsReceived = false;
	let providerNames = Object.keys(providerFunctions);
	let internalAddresses = utils.getAddresses(resultObj.internal.addresses);
	let changeAddresses = utils.getAddresses(resultObj.change.addresses);
	for (let i = 0; i < providerNames.length; i++) {

		let pName = providerNames[i];
		if (!internalTransactionsReceived) {
			await providerFunctions[pName](resultObj.internal, internalAddresses, pName).then(result => {
				internalTransactionsReceived = true;
				return Promise.resolve(true);
			}, err => {
				return Promise.resolve(true);
			});
		}
		if (!changeTransactionsReceived && userCoin.change.addresses.length > 0) {
			await providerFunctions[pName](resultObj.change, changeAddresses, pName).then(result => {
				changeTransactionsReceived = true;
				return Promise.resolve(true);
			}, err => {
				return Promise.resolve(true);
			});
		}
	}
	return Promise.resolve(resultObj);
};

module.exports = {
	getTransactions
};