pragma solidity ^0.4.24;

import './SafeMath.sol';

contract SwapOffering {

  using SafeMath for uint256;

  enum SwapState { Empty, Created, Completed, Canceled }

  struct Swap {
    address customer;
    bytes32 preImageHash;
    uint256 amount;
    uint256 supercavitationGas;
    uint256 reward;
    uint256 cancelBlockHeight;
    SwapState state;
  }

  address public owner;
  string public url;
  uint256 public lockedFunds;
  mapping(bytes32 => Swap) public swaps;

  event ContractFunded(uint256 fundAmount);
  event ContractWithdrawn(uint256 balance);

  event SwapCreated(bytes32 preImageHash);
  event SwapCompleted(bytes32 preImageHash);
  event SwapCanceled(bytes32 preImageHash);

  modifier onlyOwner() {
    require(msg.sender == owner, "Only the contract owner is authorized to call this function.");
    _;
  }

  constructor(string _url, address _owner) public {
    owner = _owner;
    url = _url;
  }

  function fundContract() public payable {
    emit ContractFunded(msg.value);
  }

  function withdrawAvailableFunds() public onlyOwner {
    owner.transfer(address(this).balance.sub(lockedFunds));

    emit ContractWithdrawn(address(this).balance);
  }

  function createSwap(address customer, uint256 amount, uint256 reward, bytes32 preImageHash, uint256 blocksBeforeCancelEnabled, uint256 supercavitationGas) public onlyOwner {
    Swap storage swap = swaps[preImageHash];

    require(swap.state == SwapState.Empty, "Swap already exists.");
    require(amount > 0, "Swap amount must be greater that 0.");
    require(blocksBeforeCancelEnabled > 0, "blocksBeforeCancelEnabled must be greater that 0.");
    require(amount.add(supercavitationGas) <= address(this).balance.sub(lockedFunds), "Amount is greater than availble funds.");

    swap.customer = customer;
    swap.amount = amount;
    swap.supercavitationGas = supercavitationGas;
    swap.reward = reward;
    swap.preImageHash = preImageHash;
    swap.cancelBlockHeight =  blocksBeforeCancelEnabled.add(block.number);
    swap.state = SwapState.Created;

    lockedFunds = lockedFunds.add(amount).add(reward);
    swap.customer.transfer(swap.supercavitationGas);

    emit SwapCreated(preImageHash);
  }

  function completeSwap(bytes32 preImageHash, bytes32 preImage) public {
    Swap storage swap = swaps[preImageHash];

    require(swap.state == SwapState.Created, "Incorrect state. Order can not be completed.");
    require(sha256(abi.encodePacked(preImage)) == preImageHash, "Incorrect preImage.");
    require(block.number < swap.cancelBlockHeight, "Swap has expired.");

    swap.state = SwapState.Completed;
    lockedFunds = lockedFunds.sub(swap.amount).sub(swap.reward);

    if (swap.reward > 0) {
      msg.sender.transfer(swap.reward);
    }
    swap.customer.transfer(swap.amount);

    emit SwapCompleted(preImageHash);
  }

  function cancelSwap(bytes32 preImageHash) public onlyOwner {
    Swap storage swap = swaps[preImageHash];

    require(swap.state == SwapState.Created, "Incorrect state. Order can not be Canceled.");
    require(block.number >= swap.cancelBlockHeight, "Cancel swap block height has not been reached yet.");

    swap.state = SwapState.Canceled;
    lockedFunds = lockedFunds.sub(swap.amount).sub(swap.reward);

    emit SwapCanceled(preImageHash);
  }

  function getSwap(bytes32 preImageHash) public view returns (
    address customer, uint256 amount, uint256 reward, uint256 cancelBlockHeight, SwapState state) {

    Swap storage swap = swaps[preImageHash];

    return (swap.customer, swap.amount, swap.reward, swap.cancelBlockHeight, swap.state);
  }
}
