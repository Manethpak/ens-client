import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { CONTRACT_ABI, CONTRACT_ADDRESS, TLD } from "../util/constants";

const Form = ({
  network,
  fetchMints,
  domain,
  setDomain,
  editing,
  setEditing,
}: {
  network: string;
  fetchMints: () => void;
  domain: string;
  setDomain: (domain: string) => void;
  editing: boolean;
  setEditing: (editing: boolean) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState("");

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) {
      return;
    }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price =
      domain.length === 3 ? "0.5" : domain.length === 4 ? "0.3" : "0.1";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }], // Check networks.js for hexadecimal network ids
        });
      } catch (error: any) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        const tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  if (network !== "Polygon Mumbai Testnet") {
    return (
      <div className="connect-wallet-container">
        <h2>Please switch to Polygon Mumbai Testnet</h2>
        {/* This button will call our switch network function */}
        <button className="cta-button mint-button" onClick={switchNetwork}>
          Click here to switch
        </button>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="first-row">
        <input
          type="text"
          value={domain}
          placeholder="domain"
          onChange={(e) => setDomain(e.target.value)}
        />
        <p className="tld"> {TLD} </p>
      </div>

      <input
        type="text"
        value={record}
        placeholder="whats ur ninja power?"
        onChange={(e) => setRecord(e.target.value)}
      />
      {/* If the editing variable is true, return the "Set record" and "Cancel" button */}
      {editing ? (
        <div className="button-container">
          {/* This will call the updateDomain function we just made */}
          <button
            className="cta-button mint-button"
            disabled={loading}
            onClick={updateDomain}
          >
            Set record
          </button>
          {/* This will let us get out of editing mode by setting editing to false */}
          <button
            className="cta-button mint-button"
            onClick={() => {
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        // If editing is not true, the mint button will be returned instead
        <button
          className="cta-button mint-button"
          disabled={loading}
          onClick={mintDomain}
        >
          Mint
        </button>
      )}
    </div>
  );
};

export default Form;
