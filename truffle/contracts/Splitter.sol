pragma solidity ^0.4.4;
import 'zeppelin/lifecycle/Killable.sol';
import './Mutex.sol';

contract Splitter is Killable, Mutex{

  address public receiver1;
  address public receiver2;
  uint internal splittedValue;
  event LogSplit(address indexed sender,address indexed receiver1, address indexed receiver2,uint256 amountReceive);

  modifier onlySplittableValue(uint splittedValueToCheck) {
    if (! (( splittedValueToCheck + splittedValueToCheck ) == msg.value )){
      //value sent is not splittable... (remaining amount will stay in contract. so throw...)
     throw;
    }
    _;
  }

  function Splitter ( address _receiver1, address _receiver2){
    //check _receiver1 or _receiver1 are not the owner
    if (_receiver1 == owner){
      throw;
    }
    if (_receiver2 == owner){
      throw;
    }
     //check not null address
     if (_receiver1 == address(0)){
       throw;
     }
     if (_receiver2 == address(0)){
       throw;
     }
     //check that receiver1 =! receiver2
     if (_receiver2 == _receiver1){
       throw;
     }
     receiver1 = _receiver1;
     receiver2 = _receiver2;
  }

  function split() payable onlyOwner noReentrancy onlySplittableValue(msg.value / 2) returns (bool)  {
    if(msg.value > 0){

      splittedValue = msg.value / 2;

      if (! receiver1.send(splittedValue)){
        throw;
      }
      if (! receiver2.send(splittedValue)){
        throw;
      }
      LogSplit(owner,receiver1,receiver2,splittedValue);
      return true;
    }
    else{
      return false;
    }
  }
}
