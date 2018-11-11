// We use custom path builder because we cannot use electron-api this.
const path = require('path');
let homeDirectory = process.env.HOME;
let winDirectory = process.env.APPDATA;


function getPath() {
	let newPath = '';

	switch (process.platform) {
	case 'darwin':
		newPath = path.join(`${homeDirectory}`, 'Library', 'Application Support');
		break;

	case 'linux':
		newPath = path.join(`${homeDirectory}`, '.config');
		break;

	case 'win32':
		newPath = path.join(`${winDirectory}`, 'AppData');
		break;

	default:
		throw new Error('Unknown platform', process.platform);
	}

	return newPath;
}

module.exports = {
	getPath
};