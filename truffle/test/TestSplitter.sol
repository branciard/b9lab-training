pragma solidity ^0.4.4;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Splitter.sol";

contract TestSplitter {



  function testOwnerReceiver1Receiver2() {
    Splitter meta = new Splitter(address(1),address(2));
    Assert.notEqual(meta.owner(), address(0), "owner of the contract must be assigned");
    Assert.equal(meta.receiver1(), address(1), "receiver1 must be assigned");
    Assert.equal(meta.receiver2(), address(2), "receiver2 must be assigned");
  }

  function testSplitCallWithoutValueFailed() {
    Splitter meta = new Splitter(address(1),address(2));
    Assert.isFalse(meta.split(), "Split Call Without Value must Failed");
  }


}
