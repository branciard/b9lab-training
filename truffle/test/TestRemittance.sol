pragma solidity ^0.4.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Remittance.sol";

contract TestRemittance {

  function testInitialStateOfTheContract() {
    Remittance meta = new Remittance(address(1));
    Assert.equal(meta.giver(), address(1), "giver must be assigned");
    Assert.equal(meta.receiver(), 0, "receiver not unassigned yet");
  }


}
