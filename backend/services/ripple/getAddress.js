let bip32 = require('ripple-bip32');
let dataUtils = require('../../data/utils');
let templates = require('../../data/templates');
let errorMessages = require('../../data/messages').generalErrors;

function generateAddresses(num, seed, addressIndex, change) {
	if (!seed) {
		return new Error(errorMessages.invalidInput);
	}

	if (typeof (change) !== dataUtils.serviceStings.number) {
		return new Error(errorMessages.invalidInput);
	}

	if (!num || typeof (num) !== dataUtils.serviceStings.number) {
		return new Error(errorMessages.invalidNumberAddresses);
	}

	if (typeof (addressIndex) !== dataUtils.serviceStings.number) {
		return new Error(errorMessages.invalidAddressIndex);
	}
	
	let addresses = [];
	let pubAddresses = [];
  
	let addressObj = Object.assign({}, dataUtils.addressObj);
	addressObj.coinType = dataUtils.coinType.Ripple;
	addressObj.change = change;

	let root = bip32.fromSeedHex(seed);
	let lastAddressIndex = addressIndex;
  
	let defaultPath = `m/${addressObj.purpose}'/${addressObj.coinType}'/${addressObj.account}'/${addressObj.change}/`;

	let path;
  
	for (let i = 0; i < num; i++) {
		path = defaultPath + (lastAddressIndex++);
		let node = root.derivePath(path);
  
		let address = node.getAddress();
		addresses.push({ 'address': address, 'WIF': node.keyPair.toWIF(), 'keyPairs': node.keyPair.getKeyPairs() });
		addresses[i].keyPairs.address = addresses[i].address;
      
		let addressBalance = Object.assign({}, templates.AddressBalance);
		addressBalance.address = address;
		pubAddresses.push(addressBalance);
	}
  
	return {
		addresses,
		pubAddresses,
		lastAddressIndex,
		derivationPath: path,
	};
}
  
module.exports = {
	generateAddresses
};