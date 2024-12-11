import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';
import EscrowBC from './artifacts/contracts/Escrow.sol/Escrow.json';
const { Alchemy, Network } = require('alchemy-sdk');

// Configurazione
const settings = {
  //apiKey: process.env.API_KEY,
  apiKey: 'tofill',
  //network: process.env.SEPOLIA_RPC_URL,
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(settings);


const provider = new ethers.providers.Web3Provider(window.ethereum);

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  // Initialize escrows at start page to keep track of created escrows
  useEffect(() => {
    if (!account) return;
    async function getEscrows() {
            
       // Using Alchemy core we get all txs from the depositor address which created some contracts
        const transfers = await alchemy.core.getAssetTransfers({
            fromAddress: account,
            toAddress: undefined,
            category: ["external"],
            toBlock: "0x00",
            toBlock: "latest", 
        });

        const existingEscrows = await Promise.all(
          transfers.transfers.map(async (transfer) => {
            const txReceipt = await provider.getTransactionReceipt(transfer.hash);
            console.log(transfer);
            const EscrowContract = new ethers.Contract(txReceipt.contractAddress, EscrowBC.abi, provider);
        
            const isApproved = await EscrowContract.isApproved();
        
            return {
              address: EscrowContract.address,
              arbiter: await EscrowContract.arbiter(),
              beneficiary: await EscrowContract.beneficiary(),
              value: transfer.value.toString(),
              approved: isApproved,
              handleApprove: async () => {
                if (isApproved) {
                  const element = document.getElementById(EscrowContract.address);
                  if (element) {
                    element.className = 'complete';
                    element.innerText = "✓ It's been approved!";
                  }
                } else {
                  EscrowContract.on('Approved', () => {
                    const element = document.getElementById(EscrowContract.address);
                    if (element) {
                      element.className = 'complete';
                      element.innerText = "✓ It's been approved!";
                    }
                  });
        
                  await approve(EscrowContract, signer);
                }
              },
            };
          })
        );


        //console.log("existing ", existingEscrows );
        setEscrows( (prevEscrows) => [...prevEscrows, ...existingEscrows] );
      }
      getEscrows();
  }, [account]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = ethers.utils.parseUnits((document.getElementById('eth').value), 'ether');
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);


    const escrow = {
      address: escrowContract.address,
      arbiter,
      beneficiary,
      value: value.toString(),
      approved: false,
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };

    setEscrows([...escrows, escrow]);
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Eth)
          <input type="text" id="eth" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
