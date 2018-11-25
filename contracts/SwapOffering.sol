pragma solidity ^0.4.24;

import './SafeMath.sol';

contract SwapOffering {

  using SafeMath for uint256;

  address public owner;
  string public httpEndpoint;
  uint256 public lockedFunds;

  enum SwapState { Created, Completed, Canceled }

  struct Swap {
    address customer;
    bytes32 preImageHash;
    uint256 amount;
    uint256 reward;
    uint256 cancelBlockHeight;
    SwapState state;
  }

  mapping(bytes32 => Swap) public swaps;

  event contractFunded();
  event contractWithdrawn();

  event swapCreated(bytes32 preImageHash);
  event swapCompleted(bytes32 preImageHash);
  event swapCanceled(bytes32 preImageHash);

  constructor(string _httpEndpoint) public payable {
    owner = msg.sender;

    httpEndpoint = _httpEndpoint;
  }

  function fundContract() public payable {

    // TODO

    emit contractFunded();
  }

  function withdrawFunds() public {

    // TODO

    emit contractWithdrawn();
  }

  function createSwap(address customer, uint256 amount, uint256 reward, bytes32 preImageHash, uint256 blocksBeforeCancelEnabled) public {
    Swap storage swap = swaps[preImageHash];

    require(swap.amount == 0, "Swap already exists.");
    require(swap.amount > 0, "Swap amount must be greater that 0.");
    require(msg.sender == owner, "Only owner can create the swap.");
    require(amount <= owner.balance.sub(lockedFunds), "Amount is greater than availble funds.");

    // TODO

    swap.customer = customer;
    swap.amount = amount;
    swap.reward = reward;
    swap.preImageHash = preImageHash;
    swap.cancelBlockHeight =  blocksBeforeCancelEnabled.add(block.number);
    swap.state = SwapState.Created;

    lockedFunds = lockedFunds.add(amount).add(reward);

    emit swapCreated(preImageHash);
  }

  function completeSwap(bytes32 preImageHash, bytes32 preImage) public {
    Swap storage swap = swaps[preImageHash];

    require(sha256(abi.encodePacked(preImage)) == preImageHash, "Incorrect preImage.");
    require(swap.state == SwapState.Created, "Incorrect state. Order can not be completed.");

    msg.sender.transfer(swap.reward);
    swap.customer.transfer(swap.amount);

    swap.state = SwapState.Completed;

    lockedFunds = lockedFunds.sub(swap.amount).sub(swap.reward);

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
