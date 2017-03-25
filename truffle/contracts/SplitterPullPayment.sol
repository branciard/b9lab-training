pragma solidity ^0.4.4;
import 'zeppelin/payment/PullPayment.sol';
import './Splitter.sol';
import './Mutex.sol';
contract SplitterPullPayment is Splitter,PullPayment, Mutex {

  function SplitterPullPayment ( address _receiver1, address _receiver2) Splitter (_receiver1,_receiver2) {

  }

  function split() payable onlyOwner onlySplittableValue(msg.value / 2) returns (bool)  {

    if(msg.value > 0){
      splittedValue = msg.value / 2;
      asyncSend(receiver1,splittedValue);
      asyncSend(receiver2,splittedValue);
      LogSplit(owner,receiver1,receiver2,splittedValue);
      return true;
    }
    else{
      return false;
    }
  }

  function withdrawPayments() noReentrancy {
    super.withdrawPayments();
  }

}
