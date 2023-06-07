import { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import WalletButton from "./components/WalletButton";
import Form from "./components/Form";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  TLD,
  TWITTER_HANDLE,
  TWITTER_LINK,
} from "./util/constants";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import { ethers } from "ethers";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [network, setNetwork] = useState("");

  const [editing, setEditing] = useState(false);
  const [domain, setDomain] = useState("");
  // Add a stateful array at the top next to all the other useState calls
  const [mints, setMints] = useState<any[]>([]);

  // Add this function anywhere in your component (maybe after the mint function)
  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        // Get all the domain names from our contract
        const names = await contract.getAllNames();

        // For each name, get the record and the address
        const mintRecords = await Promise.all(
          names.map(async (name: string) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("MINTS FETCHED ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // This will run any time currentAccount or network are changed
  useEffect(() => {
    if (network === "Polygon Mumbai Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  const editRecord = (name: string) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <header>
            <div className="left">
              <p className="title">DreamsLAB Name Service</p>
              <p className="subtitle">Your immortal API on the blockchain!</p>
            </div>
            {/* Display a logo and wallet connection status*/}
            <div className="right">
              <img
                alt="Network logo"
                className="logo"
                src={network.includes("Polygon") ? polygonLogo : ethLogo}
              />
              {currentAccount ? (
                <p>
                  {" "}
                  Wallet: {currentAccount.slice(0, 6)}...
                  {currentAccount.slice(-4)}{" "}
                </p>
              ) : (
                <p> Not connected </p>
              )}
            </div>
          </header>
        </div>

        {currentAccount ? (
          <Form
            network={network}
            fetchMints={fetchMints}
            domain={domain}
            setDomain={setDomain}
            editing={editing}
            setEditing={setEditing}
          />
        ) : (
          <WalletButton
            setAccount={setCurrentAccount}
            setNetwork={setNetwork}
          />
        )}

        {mints && (
          <div className="mint-container">
            <p className="subtitle"> Recently minted domains!</p>
            <div className="mint-list">
              {mints.map((mint, index) => {
                return (
                  <div className="mint-item" key={index}>
                    <div className="mint-row">
                      <a
                        className="link"
                        href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <p className="underlined">
                          {" "}
                          {mint.name}
                          {TLD}{" "}
                        </p>
                      </a>
                      {/* If mint.owner is currentAccount, add an "edit" button*/}
                      {mint.owner.toLowerCase() ===
                      currentAccount.toLowerCase() ? (
                        <button
                          className="edit-button"
                          onClick={() => editRecord(mint.name)}
                        >
                          <img
                            className="edit-icon"
                            src="https://img.icons8.com/metro/26/000000/pencil.png"
                            alt="Edit button"
                          />
                        </button>
                      ) : null}
                    </div>
                    <p> {mint.record} </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built with @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
