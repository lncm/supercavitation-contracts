const fs = require('fs');
const path = require('path');
const HDWalletProvider = require("truffle-hdwallet-provider");

const evmNode = process.env.RSK_NODE || 'https://public-node.testnet.rsk.co';

const mnemonic = fs.readFileSync('./creds/mnemonic').toString().trim();

module.exports = {
  networks: {
    rsktestnet: {
      provider: function() {
        if (!mnemonic) { throw "No mnemonic!"; }
        return new HDWalletProvider(mnemonic, evmNode, 0, 1, false, "m/44'/37310'/0'/0/");
      },
      gasPrice: 1,
      gas: 6000000,
      network_id: '31'
    },
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
    }
  }
};
