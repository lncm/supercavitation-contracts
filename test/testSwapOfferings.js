let SwapOffering = artifacts.require("./SwapOffering.sol");

const bobURL = 'https:/bobs-url';
const fundContractAmount = web3.toBigNumber(web3.toWei(0.1, 'ether'));
const swapAmount = web3.toBigNumber(web3.toWei(0.03));
const swapReward = web3.toBigNumber(web3.toWei(0.02));
const swapBlocksBeforeCancelEnabled = 3;
const swapDepositAmount = web3.toBigNumber(web3.toWei(0.01));

const swapPreImage =        "0xabcdef1234567890123456789012345678901234567890123456789012345678";
const swapPreImageHash =    "0x1820c9f7fa5e2dfdd1abcf723321b7d8d94910ae74202df0fc35ec8d4ec71dfd";

contract('SwapOffering.  Testing that swap offering contacts can be created correctly. asdsa ', function(accounts) {
  const bobAddress = accounts[0];
  const aliceAddress = accounts[1];

  let swapOfferingInstance;
  beforeEach("should create new Swap Offering contract", async function() {
    swapOfferingInstance = await SwapOffering.new(bobURL, bobAddress);
  });

  it("should create url correctly ", async function() {
    assert.equal(await swapOfferingInstance.url.call(), bobURL, "owner's URL isn't correct");
  });

  it("should create contract with bob as owner ", async function() {
    assert.equal(await swapOfferingInstance.owner.call(), bobAddress, "bob isn't the owner of the contact");
  });

  it("should create contract with no locked funds initially", async function() {
    assert.equal(await swapOfferingInstance.lockedFunds.call(), 0, "locked funds isn't 0, when contract is created");
  });

  it("should create contract with no locked funds initially", async function() {
    assert.equal(await swapOfferingInstance.swaps.length, 0, "number of swaps isn't 0, when contract is created");
  });
});

contract('SwapOffering.  Before each of these tests: The contract has been created, and then it is also funded', function(accounts) {
  const bobAddress = accounts[0];
  const aliceAddress = accounts[1];

  let swapOfferingInstance;
  let fundContract;

  beforeEach("should create new Swap Offering contract.  Then fund the contract.", async function() {
    swapOfferingInstance = await SwapOffering.new(bobURL, bobAddress);
    fundContract = await swapOfferingInstance.fundContract({from : bobAddress, value : fundContractAmount});
  });

  it("fundContract, should create events correctly.", async function() {
    assert.equal(fundContract.logs.length, 1, "contractFunded should emit one event");
    assert.equal(fundContract.logs[0].event, "ContractFunded", "contractFunded event name is Incorrect");
    assert.isTrue(fundContract.logs[0].args.fundAmount.eq(fundContractAmount), "contractFunded event value is Incorrect");
  });

  it("fundContract, should increase availale funds in the contract.", async function() {
    assert.isTrue(web3.eth.getBalance(await swapOfferingInstance.address).eq(fundContractAmount),"incorrect contract balance");
  });

  it("fundContract, should not change locked funds in the contract.", async function() {
    assert.equal(await swapOfferingInstance.lockedFunds.call(),0,"incorrect locked funds");
  });

  it("withdrawAwailableFunds, should withdraw all funds on a funded contract with no locked funds.", async function() {
    await swapOfferingInstance.withdrawAvailableFunds({from : bobAddress});

    assert.isTrue(web3.eth.getBalance(await swapOfferingInstance.address).eq(0),"incorrect contract balance");
  });

  it("withdrawAwailableFunds, should make a correct payment to the owner.", async function() {
    const bobsBalanceBefore = await web3.eth.getBalance(bobAddress);

    const withdrawal = await swapOfferingInstance.withdrawAvailableFunds({from : bobAddress});

    const bobsBalanceAfter = await web3.eth.getBalance(bobAddress);

    const gasUsed = await withdrawal.receipt.gasUsed;
    const gasPrice = (web3.eth.getTransaction(await withdrawal.receipt.transactionHash)).gasPrice;

    const bobsExpectedBalanceChange = fundContractAmount.sub(gasPrice.mul(gasUsed));

    assert.equal(bobsBalanceAfter.sub(bobsBalanceBefore).sub(bobsExpectedBalanceChange), 0, "Bobs balance after the withdrawal was not correct");
  });

  it("withdrawAwailableFunds, should emit correct events when withdrawing from a funded contract.", async function() {
    const withdrawal = await swapOfferingInstance.withdrawAvailableFunds({from : bobAddress});

    assert.equal(withdrawal.logs.length, 1, "contractWithdrawn should emit one event");
    assert.equal(withdrawal.logs[0].event, "ContractWithdrawn", "contractWithdrawn event name is Incorrect");
    assert.isTrue(withdrawal.logs[0].args.balance.eq(0), "contractWithdrawn event value is Incorrect");
  });

  it("withdrawAvailableFunds, should prevent withdrawals not made by the contract owner.", async function() {
      try {
        const withdrawal = await swapOfferingInstance.withdrawAvailableFunds({from : aliceAddress});
      } catch (err) {
        return true;
      }

      assert(false, "withdrawAvailableFunds should fail");
  });

  it("createSwap, should prevent swaps where amount is 0", async function() {
    try {
      const swap = await swapOfferingInstance.createSwap(aliceAddress, 0, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);
    } catch (err) {
      return true;
    }

    assert(false, "createSwap should fail");
  });

  it("createSwap, should prevent swaps where blocksBeforeCancelEnabled is 0", async function() {
    try {
      const swap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, 0, swapDepositAmount);
    } catch (err) {
      return true;
    }

    assert(false, "createSwap should fail");
  });

  it("createSwap, should prevent swaps where msg.sender is not the owner.", async function() {
    try {
      const swap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, 0, {from : aliceAddress});
    } catch (err) {
      return true;
    }

    assert(false, "createSwap should fail");
  });

  it("createSwap, should allow swaps where there's no locked funds, and (amount + depositAmount + reward) = balance.", async function() {
    const maxPossibleAmount = fundContractAmount.sub(swapReward).sub(swapDepositAmount);
    const swap = await swapOfferingInstance.createSwap(aliceAddress, maxPossibleAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, 0);
  });

  it("createSwap, should prevent swaps where there's no locked funds, and (amount + depositAmount + reward) > balance.", async function() {
    try {
      const maxPossibleAmount = fundContractAmount.sub(swapReward).sub(swapDepositAmount);
      const invalidAmount = maxPossibleAmount.add(web3.toWei(0.0001));

      await swapOfferingInstance.createSwap(aliceAddress, invalidAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);
    } catch (err) {
      return true;
    }

  });

  it("createSwap, should not be able to create a swap with a duplicated preImageHash.", async function() {
    const swap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);
    try {
      const swapWithDuplicatedPreHashImage = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);
    } catch (err) {
      return true;
    }

    assert(false, "createSwap should fail");
  })

  it("createSwap, should be able to create a standard swap.", async function() {
    const createSwap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);

    const customerSwap = await swapOfferingInstance.getSwap.call(swapPreImageHash);

    const expectedCancelBlockHeight = createSwap.receipt.blockNumber + swapBlocksBeforeCancelEnabled;

    assert.equal(customerSwap[0], aliceAddress, "incorrect customer");
    assert.isTrue(customerSwap[1].eq(swapAmount), "incorrect amount");
    assert.isTrue(customerSwap[2].eq(swapReward), "incorrect reward");
    assert.equal(customerSwap[3], expectedCancelBlockHeight, "incorrect cancel block height");
    assert.equal(customerSwap[4], 1, "incorrect state");
  });

  it("createSwap, should be transfer deposit to customer.", async function() {
    const customerBalanceBefore = await web3.eth.getBalance(aliceAddress);

    await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);

    const customerBalanceAfter = await web3.eth.getBalance(aliceAddress);

    const customerExpectedBalanceChange = swapDepositAmount;

    assert.equal(customerBalanceAfter.sub(customerBalanceBefore).sub(customerExpectedBalanceChange), 0, "Incorrect balance for Customer.");
  });

  it("createSwap, should be able to create a swap with depositAmount = 0.", async function() {
    const createSwap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, 0);

    const customerSwap = await swapOfferingInstance.getSwap.call(swapPreImageHash);

    const expectedCancelBlockHeight = createSwap.receipt.blockNumber + swapBlocksBeforeCancelEnabled;

    assert.equal(customerSwap[0], aliceAddress, "incorrect customer");
    assert.isTrue(customerSwap[1].eq(swapAmount), "incorrect amount");
    assert.isTrue(customerSwap[2].eq(swapReward), "incorrect reward");
    assert.equal(customerSwap[3], expectedCancelBlockHeight, "incorrect cancel block height");
    assert.equal(customerSwap[4], 1, "incorrect state");
  });

  it("createSwap, should be able to create a swap with reward = 0.", async function() {
    const createSwap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, 0, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);

    const customerSwap = await swapOfferingInstance.getSwap.call(swapPreImageHash);

    const expectedCancelBlockHeight = createSwap.receipt.blockNumber + swapBlocksBeforeCancelEnabled;

    assert.equal(customerSwap[0], aliceAddress, "incorrect customer");
    assert.isTrue(customerSwap[1].eq(swapAmount), "incorrect amount");
    assert.equal(customerSwap[2], 0, "incorrect reward");
    assert.equal(customerSwap[3], expectedCancelBlockHeight, "incorrect cancel block height");
    assert.equal(customerSwap[4], 1, "incorrect state");
  });
});

contract('SwapOffering.  Before each of these tests: The contract has been created, and then it is funded, and the a customer swap is successfully created', function(accounts) {
  const bobAddress = accounts[0];
  const aliceAddress = accounts[1];

  let swapOfferingInstance;
  let fundContract;
  let createSwap;
  beforeEach("should create new Swap Offering contract.  Then fund the contract.  Then create a Swap.", async function() {
    swapOfferingInstance = await SwapOffering.new(bobURL, bobAddress);
    fundContract = await swapOfferingInstance.fundContract({from : bobAddress, value : fundContractAmount});
    createSwap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabled, swapDepositAmount);
  });

  it("createSwap, should lock funds correctly", async function() {
    assert.isTrue(swapAmount.add(swapReward).eq(await swapOfferingInstance.lockedFunds.call()), "incorrect locked funds.  lockedFunds != swapAmount + swapReward.");
  });

  it("createSwap, should emit correct events when creating a swap.", async function() {
    assert.equal(createSwap.logs.length, 1, "swapCreated should emit one event");
    assert.equal(createSwap.logs[0].event, "SwapCreated", "contractFunded event name is Incorrect");
    assert.equal(createSwap.logs[0].args.preImageHash, swapPreImageHash, "swapPreImageHash event value is Incorrect");
  });

  it("createSwap, should transfer depositAmount", async function() {
    assert.isTrue(swapAmount.add(swapReward).eq(await swapOfferingInstance.lockedFunds.call()), "incorrect locked funds.  lockedFunds != swapAmount + swapReward.");
  });

  it("withdrawAwailableFunds, should withdraw all unlocked funds.", async function() {
    await swapOfferingInstance.withdrawAvailableFunds({from : bobAddress});

    const lockedFunds = swapAmount.add(swapReward);

    assert.isTrue(web3.eth.getBalance(await swapOfferingInstance.address).eq(lockedFunds), "incorrect contract balance");
  });

  it("withdrawAwailableFunds, should make a correct payment to the owner, withdrawing everything except locked funds.", async function() {

    const bobsBalanceBefore = await web3.eth.getBalance(bobAddress);
    const contractBalanceBefore = web3.eth.getBalance(await swapOfferingInstance.address);

    const withdrawal = await swapOfferingInstance.withdrawAvailableFunds({from : bobAddress});

    const bobsBalanceAfter = await web3.eth.getBalance(bobAddress);
    const gasUsed = await withdrawal.receipt.gasUsed;
    const gasPrice = (web3.eth.getTransaction(await withdrawal.receipt.transactionHash)).gasPrice;
    const lockedFunds = swapAmount.add(swapReward);
    const bobsExpectedBalanceChange = contractBalanceBefore.sub(lockedFunds).sub(gasPrice.mul(gasUsed));

    assert.isTrue(bobsBalanceAfter.sub(bobsBalanceBefore).eq(bobsExpectedBalanceChange), "Bobs balance after the withdrawal was not correct");
  });

  it("withdrawAwailableFunds, should emit correct events when withdrawing from a funded contract, when there are locked funds.", async function() {
    const withdrawal = await swapOfferingInstance.withdrawAvailableFunds({from : bobAddress});

    const lockedFunds = swapAmount.add(swapReward);

    assert.equal(withdrawal.logs.length, 1, "contractWithdrawn should emit one event");
    assert.equal(withdrawal.logs[0].event, "ContractWithdrawn", "contractWithdrawn event name is Incorrect");
    assert.isTrue(withdrawal.logs[0].args.balance.eq(lockedFunds), "contractWithdrawn event value is Incorrect");
  });

  it("withdrawAvailableFunds, should prevent withdrawals not made by the contract owner, when there are locked funds.", async function() {
      try {
        const withdrawal = await swapOfferingInstance.withdrawAvailableFunds({from : aliceAddress});
      } catch (err) {
        return true;
      }

      assert(false, "withdrawAvailableFunds should fail");
  });

  it("cancelSwap, should prevent cancellations not made by the owner.", async function() {
    try {
      await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : aliceAddress});
    } catch (err) {
      return true;
    }

    assert(false, "cancelSwap should fail");
  });

  it("cancelSwap, should prevent cancellations if the cancellation block height has note been reached yet.", async function() {
    try {
      await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});
    } catch (err) {
      return true;
    }

    assert(false, "cancelSwap should fail");
  });

  it("cancelSwap, should prevent cancellations of completed swaps.", async function() {
    await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : bobAddress});

    try {
      await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});
    } catch (err) {
      return true;
    }

    assert(false, "cancelSwap should fail");
  });

  it("completeSwap, should complete the swap and change the swaps status, when called from owner's address.", async function() {
    await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : bobAddress});

    const customerSwap = await swapOfferingInstance.getSwap.call(swapPreImageHash);

    const expectedCancelBlockHeight = createSwap.receipt.blockNumber + swapBlocksBeforeCancelEnabled;

    assert.equal(customerSwap[0], aliceAddress, "incorrect customer");
    assert.isTrue(customerSwap[1].eq(swapAmount), "incorrect amount");
    assert.isTrue(customerSwap[2].eq(swapReward), "incorrect reward");
    assert.equal(customerSwap[3], expectedCancelBlockHeight, "incorrect cancel block height");
    assert.equal(customerSwap[4], 2, "incorrect state");
  });

  it("completeSwap, should complete the swap and change the swaps status, when called from customer's address.", async function() {
    await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});

    const customerSwap = await swapOfferingInstance.getSwap.call(swapPreImageHash);

    const expectedCancelBlockHeight = createSwap.receipt.blockNumber + swapBlocksBeforeCancelEnabled;

    assert.equal(customerSwap[0], aliceAddress, "incorrect customer");
    assert.isTrue(customerSwap[1].eq(swapAmount), "incorrect amount");
    assert.isTrue(customerSwap[2].eq(swapReward), "incorrect reward");
    assert.equal(customerSwap[3], expectedCancelBlockHeight, "incorrect cancel block height");
    assert.equal(customerSwap[4], 2, "incorrect state");
  });

  it("completeSwap, should prevent completed swaps, when preImage is incorrect.", async function() {
    try {
      const incorrectPreImage = "incorrectPreImage";
      await swapOfferingInstance.completeSwap(swapPreImageHash, incorrectPreImage, {from : aliceAddress});
    } catch (err) {
      return true;
    }

    assert(false, "completeSwap should fail");
  });

  it("completeSwap, should emit correct events when canceling a swap.", async function() {
    const completedSwap = await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});

    assert.equal(completedSwap.logs.length, 1, "swapComcompleteSwappleted should emit one event");
    assert.equal(completedSwap.logs[0].event, "SwapCompleted", "contractWithdrawn event name is Incorrect");
    assert.equal(completedSwap.logs[0].args.preImageHash, swapPreImageHash, "swapCompleted event value is Incorrect");
  });

  it("completeSwap, should not allow swaps to be completed multiple times.", async function() {
    await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});

    try {
      await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});
    } catch (err) {
      return true;
    }

    assert(false, "completeSwap should fail");
  });

  it("completeSwap, should reduce the balance correctly.", async function() {
    const contractBalanceBefore = web3.eth.getBalance(await swapOfferingInstance.address);
    await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});
    const contractBalanceAfter = web3.eth.getBalance(await swapOfferingInstance.address);

    const actualContracBalanceChange = contractBalanceBefore.sub(contractBalanceAfter);
    const expectedContractBalanceChange = swapAmount.add(swapReward);

    assert.isTrue(actualContracBalanceChange.eq(expectedContractBalanceChange), "Contract balance after the completed swap was incorrect");
  });

  it("completeSwap, should change the locked funds correctly.", async function() {
    const lockedFundsBefore = await swapOfferingInstance.lockedFunds.call();
    await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});
    const lockedFundsAfter = await swapOfferingInstance.lockedFunds.call();

    const actualLockedFundsChange = lockedFundsBefore.sub(lockedFundsAfter);
    const expectedLockedFundsChange = swapAmount.add(swapReward);

    assert.isTrue(actualLockedFundsChange.eq(expectedLockedFundsChange), "Contract locked funds, after the completed swap was incorrect");
  });

  it("completeSwap, should transfer to customer correctly, when called by the customer.", async function() {
    const customerBalanceBefore = web3.eth.getBalance(await aliceAddress);
    const completedSwap = await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : aliceAddress});
    const customerBalanceAfter = web3.eth.getBalance(await aliceAddress);

    const actualCustomerBalanceChange = customerBalanceAfter.sub(customerBalanceBefore);
    const gasUsed = await completedSwap.receipt.gasUsed;
    const gasPrice = (web3.eth.getTransaction(await completedSwap.receipt.transactionHash)).gasPrice;
    const expectedCustomerBalanceChange = swapAmount.add(swapReward).sub(gasPrice.mul(gasUsed));

    assert.isTrue(actualCustomerBalanceChange.eq(expectedCustomerBalanceChange), "Customer balance, after the completed swap was incorrect");
  });

  it("completeSwap, should transfer to reward to the owner correctly, when called by the owner.", async function() {
    const ownerBalanceBefore = web3.eth.getBalance(await bobAddress);
    const completedSwap = await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : bobAddress});
    const ownerBalanceAfter = web3.eth.getBalance(await bobAddress);

    const actualOwnerBalanceChange = ownerBalanceAfter.sub(ownerBalanceBefore);
    const gasUsed = await completedSwap.receipt.gasUsed;
    const gasPrice = (web3.eth.getTransaction(await completedSwap.receipt.transactionHash)).gasPrice;
    const expectedOwnerBalanceChange = swapReward.sub(gasPrice.mul(gasUsed));

    assert.isTrue(actualOwnerBalanceChange.eq(expectedOwnerBalanceChange), "Owner balance, after the completed swap was incorrect");
  });
});

contract('SwapOffering.  Before each of these tests: The contract has been created, and then it is funded, and the a customer swap is successfully created.  Cancellations are also allowed in the next block. ', function(accounts) {
  const bobAddress = accounts[0];
  const aliceAddress = accounts[1];
  const swapBlocksBeforeCancelEnabledSingleBlock = 1;

  let swapOfferingInstance;
  let fundContract;
  let createSwap;
  beforeEach("should create new Swap Offering contract.  Then fund the contract.  Then create a Swap.", async function() {
    swapOfferingInstance = await SwapOffering.new(bobURL, bobAddress);
    fundContract = await swapOfferingInstance.fundContract({from : bobAddress, value : fundContractAmount});
    createSwap = await swapOfferingInstance.createSwap(aliceAddress, swapAmount, swapReward, swapPreImageHash, swapBlocksBeforeCancelEnabledSingleBlock, swapDepositAmount);
  });

  it("cancelSwap, should emit correct events when canceling a swap.", async function() {
    const cancellation = await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});

    assert.equal(cancellation.logs.length, 1, "contractWithdrawn should emit one event");
    assert.equal(cancellation.logs[0].event, "SwapCanceled", "swapCanceled event name is Incorrect");
    assert.equal(cancellation.logs[0].args.preImageHash, swapPreImageHash, "contractWithdrawn event value is Incorrect");
  });

  it("cancelSwap, should not allow swaps to be canceled multiple times.", async function() {
    await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});
    try {
      await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});
    } catch (err) {
      return true;
    }

    assert(false, "cancelSwap should fail");
  });

  it("cancelSwap, should not accept a preImageHash that does not match an existing swap.", async function() {
    try {
      const invalidPreImageHash = "invalidHash";
      await swapOfferingInstance.cancelSwap(invalidPreImageHash, {from : bobAddress});
    } catch (err) {
      return true;
    }

    assert(false, "cancelSwap should fail");
  });

  it("cancelSwap, should cancel the swap and change the swaps status.", async function() {
    await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});

    const customerSwap = await swapOfferingInstance.getSwap.call(swapPreImageHash);

    const expectedCancelBlockHeight = createSwap.receipt.blockNumber + swapBlocksBeforeCancelEnabledSingleBlock;

    assert.equal(customerSwap[0], aliceAddress, "incorrect customer");
    assert.isTrue(customerSwap[1].eq(swapAmount), "incorrect amount");
    assert.isTrue(customerSwap[2].eq(swapReward), "incorrect reward");
    assert.equal(customerSwap[3], expectedCancelBlockHeight, "incorrect cancel block height");
    assert.equal(customerSwap[4], 3, "incorrect state");
  });

  it("cancelSwap, should unlock funds.", async function() {
    await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});

    assert.equal(await swapOfferingInstance.lockedFunds.call(), 0, "locked funds isn't 0, after contract is canceled");
  });

  it("completeSwap, should prevent canceled swaps to be completed.", async function() {
    await swapOfferingInstance.cancelSwap(swapPreImageHash, {from : bobAddress});
    try {
      await swapOfferingInstance.completeSwap(swapPreImageHash, swapPreImage, {from : bobAddress});
    } catch (err) {
      return true;
    }

    assert(false, "completeSwap should fail");
  });
});
