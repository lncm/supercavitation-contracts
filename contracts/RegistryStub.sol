pragma solidity ^0.4.24;

import './SwapOffering.sol';

contract RegistryStub {

  address[] swapOfferings;

  event newOfferingCreated(address newSwapOffering);

  function createNewOffering(string httpEndpoint) public payable {
      address newSwapOffering = new SwapOffering(httpEndpoint);
      swapOfferings.push(newSwapOffering);

      emit newOfferingCreated(newSwapOffering);
  }
}
