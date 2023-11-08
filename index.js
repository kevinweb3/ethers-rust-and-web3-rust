const { Web3 } = require("web3");
const fs = require("fs");
const contractFile = require("./compile");

const gasLimit = 5000000;
const gasPrice = "20000000000";
let contractAddress;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// 获取bytcode 和 Abi
const byteCode = contractFile.evm.bytecode.object;
const abi = contractFile.abi;

// 部署合约
async function deploy() {
  // 创建合约实例
  const accounts = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(abi);

  // 创建部署 Tx
  const tx = contract.deploy({
    data: byteCode,
    arguments: [0],
  });

  try {
    const contractInstance = await tx.send({
      from: accounts[0],
      gas: gasLimit,
      gasPrice,
    });

    await tx.methods
      .transfer("0xf0B78bB2BD6ed2e02BE2A0D7407c44F69Bdde626", "0x1")
      .send({
        from: accounts[0]?.address,
        gas: "1000000",
      });
    contractAddress = contractInstance.options.address;

    console.log("合约部署地址: " + contractAddress);

    const deployedAddressPath = path.join(
      `${__dirname}/compileFiles`,
      "ContractAddress.bin"
    );
    fs.writeFileSync(deployedAddressPath, contractAddress);
  } catch (error) {
    console.error(error);
  }
}

// 调用合约的方法
async function callContractMethods() {
  // 调用非交易类型的方法：
  const contractInstance = new web3.eth.Contract(abi, contractAddress);
  const currentValue = await contractInstance.methods().call();

  // 调用交易类型的方法：
  const getAccounts = await web3.eth.getAccounts();
  const contractInstance1 = new web3.eth.Contract(abi, contractAddress);
  const tx = contractInstance1.methods.descrement(1);
  await tx
    .send({
      from: getAccounts[0],
      gas: gasLimit,
      gasPrice,
    })
    .on("receipt", async (recepit) => {
      currentValue = await contractInstance.methods.currentValue().call();
      console.log("Incrementer Contract currentValue:", currentValue);
    });
}

// 查询event事件
async function queryByWeb3() {
  const contractInstance = new web3.eth.Contract(abi, contractAddress);
  const logs = await contractInstance.getPastEvents("Descrement", {
    filter: {},
    fromBlock: 0,
  });
  logs.forEach((item) => {
    console.log("Descrement Event:", item); // same results as the optional callback above
  });
}

// 订阅event事件
async function subWeb3() {
  async function subByWeb3() {
    const contractInstance = new web3.eth.Contract(abi, contractAddress);
    contractInstance.events
      .Descrement({
        fromBlock: 0,
      })
      .on("data", (event) => {
        console.log("Descrement Event:", event); // same results as the optional callback above
      })
      .on("error", function (error, receipt) {
        console.error("Descrement Event error:", error);
      });
  }
  subByWeb3();
  const server = http.createServer(() => {});
  server.listen(8002);
}

// 合约签名验证
async function contractSignature() {
  // 获取签名账户, 用的本地localhost的第一个账户以及私钥
  const privateKey =
    0x966630dd606d68094c5380aec2979b15908df0b14e1a8ad530cdbda0666be476n;

  // 创建合约实例
  const contract = new web3.eth.Contract(abi);

  // 创建部署 Tx
  const deployTx = contract.deploy({
    data: byteCode,
    arguments: [0],
  });

  // 签名 Tx
  const createTransaction = await web3.eth.accounts.signTransaction(
    {
      data: deployTx.encodeABI(),
      gas: 6000000,
    },
    privateKey
  );

  // 发送已签名的交易
  const sendSignedTransaction = await web3.eth.sendSignedTransaction(
    createTransaction.rawTransaction
  );
  console.log("合约部署地址：", sendSignedTransaction.contractAddress);
  const deployedBlockNumber = sendSignedTransaction.blockNumber;
  console.log("合约部署区块号：", deployedBlockNumber);

  // 获取合约number
  const incrementer = new web3.eth.Contract(
    abi,
    sendSignedTransaction.contractAddress
  );
  const number = await incrementer.methods.getNumber().call();
  console.log(`The current number stored is: ${number}`);

  // 调用合约接口
  const _value = 3;
  const incrementTx = incrementer.methods.increment(_value);

  const incrementTransaction = await web3.eth.accounts.signTransaction(
    {
      to: sendSignedTransaction.contractAddress,
      data: incrementTx.encodeABI(),
      gas: 8000000,
    },
    privateKey
  );

  // 获取交易hash
  const incrementReceipt = await web3.eth.sendSignedTransaction(
    incrementTransaction.rawTransaction
  );
  console.log(`Tx successful with hash: ${incrementReceipt.transactionHash}`);

  number = await incrementer.methods.getNumber().call();
  console.log(`After increment, the current number stored is: ${number}`);

  // Call Contract Interface reset
  const resetTx = incrementer.methods.reset();

  const resetTransaction = await web3.eth.accounts.signTransaction(
    {
      to: sendSignedTransaction.contractAddress,
      data: resetTx.encodeABI(),
      gas: 8000000,
    },
    privateKey
  );

  const resetcReceipt = await web3.eth.sendSignedTransaction(
    resetTransaction.rawTransaction
  );
  console.log(`Tx successful with hash: ${resetcReceipt.transactionHash}`);
  number = await incrementer.methods.getNumber().call();
  console.log(`After reset, the current number stored is: ${number}`);

  // 事件查询
  const pastEvents = await incrementer.getPastEvents("Increment", {
    fromBlock: deployedBlockNumber,
    toBlock: "latest",
  });

  pastEvents.map((event) => {
    console.log(event);
  });

  // 错误检查
  incrementTx = incrementer.methods.increment(0);
  incrementTransaction = await web3.eth.accounts.signTransaction(
    {
      to: sendSignedTransaction.contractAddress,
      data: incrementTx.encodeABI(),
      gas: 8000000,
    },
    privateKey
  );

  await web3.eth
    .sendSignedTransaction(incrementTransaction.rawTransaction)
    .on("error", console.error);
}

(async () => {
  await deploy();
  await callContractMethods();
  await queryByWeb3();
  await subWeb3();
  await contractSignature();
})();
