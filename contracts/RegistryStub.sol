pragma solidity ^0.4.24;

import './SwapOffering.sol';
import './SafeMath.sol';

contract RegistryStub {

  using SafeMath for uint256;

  address[] public swapOfferings;

  event newOfferingCreated(address newSwapOffering);

  function createNewOffering(string url) public {
      address newSwapOffering = new SwapOffering(url, msg.sender);
      swapOfferings.push(newSwapOffering);

      emit newOfferingCreated(newSwapOffering);
  }

  function paginateSwapOfferings(uint256 fromIndex, uint256 numberOfSwapOfferings) external view returns (address[]) {
    require(numberOfSwapOfferings > 0, "numberOfSwapOfferings must be greater than 0.");

    uint256 toIndex = fromIndex.add(numberOfSwapOfferings);
    address[] memory result = new address[](numberOfSwapOfferings);
    for (uint i = fromIndex; i < toIndex; i++) {
      result[i] = swapOfferings[i];
    }

    return result;
  }
}
