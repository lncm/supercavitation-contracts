var SwapOffering = artifacts.require("SwapOffering");

const url = process.env.URL || 'http://localhost:8080';
const satoshis = 1000;
const wei = satoshis * 1e10;

 module.exports = (deployer, network, [owner]) => {
  console.log(`  Creating contract for ${url} with owner ${owner}...`)
  deployer.deploy(SwapOffering, url, owner)
  .then(() => SwapOffering.deployed())
  .then(c => {
    console.log(`  Funding SwapOffering with ${wei} wei...`)
    return c.fundContract({ value: wei });
  });
};
