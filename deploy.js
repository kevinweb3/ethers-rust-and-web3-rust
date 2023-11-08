const { Web3 } = require("web3");
const path = require("path");
const fs = require("fs");

const gasLimit = 5000000;
const gasPrice = "20000000000";

const web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
web3.eth.Contract.handRevert = true;

const byteCodePath = path.join(
  `${__dirname}/compileFiles`,
  "ContractBytecode.bin"
);
const byteCode = fs.readFileSync(byteCodePath, "utf8");

const abi = require("./compileFiles/ContractAbi.json");

async function deploy() {
  const accounts = await web3.eth.getAccounts();
  const contract = new web3.eth.Contract(abi);

  const tx = contract.deploy({
    data: byteCode,
    arguments: [0],
  });

  const gas = await tx.estimateGas({
    from: accounts[0],
  });

  console.log("estimated gas:", gas);

  try {
    const contractInstance = await tx.send({
      from: accounts[0],
      gas: gasLimit,
      gasPrice,
    });

    console.log("合约部署地址: " + contractInstance.options.address);

    const deployedAddressPath = path.join(
      `${__dirname}/compileFiles`,
      "ContractAddress.bin"
    );
    fs.writeFileSync(deployedAddressPath, contractInstance.options.address);
  } catch (error) {
    console.error(error);
  }
}

deploy();
