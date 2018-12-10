var SwapOffering = artifacts.require("SwapOffering");

const url = 'https://bob.lncm.io';
const owner = '0x0f18cd0f5b7cce9d6dcc246f80b0fcdd7a2af150';
const satoshis = 1 * 1e8; // 1 btc
const wei = satoshis * 1e10;

 module.exports = (deployer) => {
  deployer.deploy(SwapOffering, url, owner)
  .then(() => SwapOffering.deployed())
  .then(c => {
    console.log(`  Funding SwapOffering with ${wei} wei...`)
    return c.fundContract({ value: wei });
  });
};
