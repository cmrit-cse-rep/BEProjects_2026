## 📦 Pretrained Model Weights

Due to GitHub file size limitations, the pretrained model weight files are hosted externally on Google Drive.

### 🔗 Download Links
- **Hybrid Model Weights (`.pth`)**  
  👉 [https://drive.google.com/hybrid_model_state.pth](https://drive.google.com/file/d/1E9P83eqVfQjdpEz6rEvge-YjXpKtI78E/view?usp=sharing)  
- **Transformer Model Weights (`.safetensors`)**  
  👉 [https://drive.google.com/model.safetensors](https://drive.google.com/file/d/1lfFLiETZMg2XncCThv-iZBdV8hsT0qpn/view?usp=sharing)


---

## 📥 How to Download and Use the Model Files

Follow the steps below to run the project successfully.

### Step 1: Download the model files
1. Open the Google Drive links provided above.
2. Download the following files:
   - `hybrid_model_state.pth`
   - `model.safetensors`
   
---

### Step 2: Place the files in the project directory
After downloading, copy the files into the **model/** folder as shown below:

```text
model/
├── hybrid_model_state.pth
├── model.safetensors
└── other model-related files
```
---

### Step 3: Verify folder structure
Ensure your project structure looks like this:
```text
Team_38/
├── app.py
├── llm_agents.py
├── requirements.txt
├── Dockerfile
├── .dockerignore
├── sentiment_model.py
├── instance/
├── templates/
├── static/
├── model/
│ ├── hybrid_model_state.pth
│ ├── model.safetensors
│ └── other model-related files
```

---

### Step 4: Run the application
Install dependencies and start the application:

```bash
pip install -r requirements.txt
python app.py
```
