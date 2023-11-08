const solc = require("solc");
const path = require("path");
const fs = require("fs");

const fileName = "Incrementer.sol";
const contractName = "Incrementer";

// 读取合约文件
const contractPath = path.join(__dirname, fileName);
const sourceCode = fs.readFileSync(contractPath, "utf-8");

// solc配置
const input = {
  language: "Solidity",
  sources: {
    [fileName]: {
      content: sourceCode,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};

// 使用solc编译合约
const compileCode = JSON.parse(solc.compile(JSON.stringify(input)));

// 要编译的合约文件临时变量
const contractFile = compileCode.contracts[fileName][contractName];

// 编译合约获得bytecode
const byteCode = contractFile.evm.bytecode.object;

// 设置写入bytecode的path
const byteCodePath = path.join(
  `${__dirname}/compileFiles`,
  "ContractBytecode.bin"
);

// 写入bytecode
fs.writeFileSync(byteCodePath, byteCode);

// 编译合约获得abi
const abi = contractFile.abi;

// 设置写入bytecode的path
const abiPath = path.join(`${__dirname}/compileFiles`, "ContractAbi.json");

// 写入abi
fs.writeFileSync(abiPath, JSON.stringify(abi, null, "\t"));

console.log("Contract ABI:\n", abi);

module.exports = contractFile;
