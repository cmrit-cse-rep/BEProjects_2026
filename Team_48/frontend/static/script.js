const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update after deployment

const contractABI = [
  {
    "inputs": [],
    "name": "getLatestThreat",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "_description", "type": "string" }],
    "name": "reportThreat",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let provider, signer, contract;

async function connect() {
  if (!window.ethereum) return showToast("Please install MetaMask!");

  // Create new provider and wait for MetaMask to connect
  provider = new ethers.providers.Web3Provider(window.ethereum, "any"); // 👈 Important: "any" here prevents the error
  await provider.send("eth_requestAccounts", []);

  // Detect network after connecting
  const network = await provider.getNetwork();
  console.log("Connected to network:", network);

  signer = provider.getSigner();
  contract = new ethers.Contract(contractAddress, contractABI, signer);

  const address = await signer.getAddress();
  document.getElementById("currentAccount").innerText = `🧾 Account: ${address}`;
}

async function getAlert() {
  try {
    const [desc, time] = await contract.getLatestThreat();
    document.getElementById("currentAlert").innerText = `🛡️ Threat: ${desc}`;
    document.getElementById("lastUpdated").innerText = `🕒 ${new Date(time * 1000).toLocaleString()}`;
  } catch (err) {
    showToast("⚠️ Error fetching alert");
    console.error(err);
  }
}

async function classifyThreat(threatText) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description: threatText }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("Server responded with:", response.status);
      return "Unknown";
    }

    const data = await response.json();
    return data.severity;

  } catch (error) {
    console.error("AI Error:", error.message);
    return "Unknown";
  }
}



async function reportAlert() {
  const text = document.getElementById("alertInput").value.trim();
  if (!text) return showToast("⚠️ Enter a threat!");

  const severity = await classifyThreat(text);
  alert(`Predicted Severity: ${severity}`);

  try {
    const tx = await contract.reportThreat(text);
    await tx.wait();
    showToast("✅ Threat reported!");
    getAlert();
    document.getElementById("alertInput").value = "";
  } catch (err) {
    showToast("❌ Failed to report");
    console.error(err);
  }
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}

function toggleMode() {
  document.body.classList.toggle("light-mode");
}

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
}

connect().then(getAlert);
setInterval(getAlert, 10000);