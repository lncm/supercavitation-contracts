const fs = require('fs');
const HDWalletProvider = require("truffle-hdwallet-provider");

const evmNode = process.env.RSK_NODE || 'https://public-node.testnet.rsk.co';

module.exports = {
  networks: {
    rsktestnet: {
      provider: function() {
        const mnemonic = fs.readFileSync('./creds/mnemonic').trim();
        if (!mnemonic) { throw "No mnemonic!"; }
        return new HDWalletProvider(mnemonic, evmNode, 0, 1, false, "m/44'/37310'/0'/0/");
      },
      gasPrice: 1,
      network_id: '31'
    },
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
    }
  }
};
