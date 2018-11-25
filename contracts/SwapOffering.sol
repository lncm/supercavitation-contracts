pragma solidity ^0.4.24;

import './SafeMath.sol';

contract SwapOffering {

  using SafeMath for uint256;

  address public owner;
  string public url;
  uint256 public lockedFunds;

  enum SwapState { Created, Completed, Canceled }

  struct Swap {
    address customer;
    bytes32 preImageHash;
    uint256 amount;
    uint256 depositAmount;
    uint256 reward;
    uint256 cancelBlockHeight;
    SwapState state;
  }

  mapping(bytes32 => Swap) public swaps;

  event contractFunded(uint256 fundAmount);
  event contractWithdrawn(uint256 balance);

  event swapCreated(bytes32 preImageHash);
  event swapCompleted(bytes32 preImageHash);
  event swapCanceled(bytes32 preImageHash);

  constructor(string _url, address _owner) public {
    owner = _owner;
    url = _url;
  }

  function fundContract() public payable {
    emit contractFunded(msg.value);
  }

  function withdrawAvailableFunds() public {

    require(msg.sender == owner, "Only owner can withdraw the funds.");

    owner.transfer(address(this).balance.sub(lockedFunds));

    emit contractWithdrawn(address(this).balance);
  }

  function getSwap(bytes32 preImageHash) public constant returns (
    address customer, uint256 amount, uint256 reward, uint256 cancelBlockHeight, SwapState state) {

    Swap storage swap = swaps[preImageHash];

    return (swap.customer, swap.amount, swap.reward, swap.cancelBlockHeight, swap.state);
  }

  function createSwap(address customer, uint256 amount, uint256 reward, bytes32 preImageHash, uint256 blocksBeforeCancelEnabled, uint256 depositAmount) public {
    Swap storage swap = swaps[preImageHash];

    require(swap.amount == 0, "Swap already exists.");
    require(amount > 0, "Swap amount must be greater that 0.");
    require(blocksBeforeCancelEnabled > 0, "blocksBeforeCancelEnabled must be greater that 0.");
    require(msg.sender == owner, "Only owner can create the swap.");
    require(amount.add(depositAmount) <= address(this).balance.sub(lockedFunds), "Amount is greater than availble funds.");

    swap.customer = customer;
    swap.amount = amount;
    swap.depositAmount = depositAmount;
    swap.reward = reward;
    swap.preImageHash = preImageHash;
    swap.cancelBlockHeight =  blocksBeforeCancelEnabled.add(block.number);
    swap.state = SwapState.Created;

    lockedFunds = lockedFunds.add(amount).add(reward);
    swap.customer.transfer(swap.depositAmount);

    emit swapCreated(preImageHash);
  }

  function completeSwap(bytes32 preImageHash, bytes32 preImage) public {
    Swap storage swap = swaps[preImageHash];

    require(sha256(abi.encodePacked(preImage)) == preImageHash, "Incorrect preImage.");
    require(swap.state == SwapState.Created, "Incorrect state. Order can not be completed.");

    swap.state = SwapState.Completed;
    lockedFunds = lockedFunds.sub(swap.amount).sub(swap.reward);

    if (swap.reward > 0) {
      msg.sender.transfer(swap.reward);
    }
    swap.customer.transfer(swap.amount);

    emit swapCompleted(preImageHash);
  }

  function cancelSwap(bytes32 preImageHash) public {
    Swap storage swap = swaps[preImageHash];

    require(msg.sender == owner, "Only owner can cancel the swap.");
    require(block.number >= swap.cancelBlockHeight, "Cancel swap block height has not been reached yet.");
    require(swap.state == SwapState.Created, "Incorrect state. Order can not be Canceled.");

    swap.state = SwapState.Canceled;
    lockedFunds = lockedFunds.sub(swap.amount).sub(swap.reward);

    emit swapCanceled(preImageHash);
  }
}
