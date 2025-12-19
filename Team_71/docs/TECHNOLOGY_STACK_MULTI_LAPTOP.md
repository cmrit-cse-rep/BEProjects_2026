# 🔌 Technology Stack for Multi-Laptop Connectivity & Data Transmission

**Complete technical explanation of how multiple laptops connect and transmit data to the SentinelIQ central server**

---

## 📡 **Core Communication Technology**

### **1. HTTP/HTTPS REST API (Primary Protocol)**

**Technology:** HTTP/1.1 over TCP/IP

**How it works:**

- **Client (Agent on Laptop):** Python `requests` library
- **Server (Backend):** FastAPI (ASGI) web framework
- **Protocol:** HTTP POST requests with JSON payloads
- **Port:** 8000 (configurable)

**Code Implementation:**

```python
# Agent Side (realtime_monitor.py)
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Create HTTP session with retry logic
session = requests.Session()
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("http://", adapter)

# Send activity data
url = f"{server_url}/api/activities/ingest"
response = session.post(url, json=activity_data, timeout=10)
```

```python
# Server Side (backend/main.py)
from fastapi import FastAPI
from pydantic import BaseModel

@app.post("/api/activities/ingest")
async def ingest_activity(activity: UserActivity):
    # Process activity, run ML detection, store in database
    return {"status": "ok", "its_score": 45.2}
```

---

## 🌐 **Network Architecture**

### **Client-Server Model**

```
┌─────────────────┐         HTTP POST         ┌──────────────────┐
│  Laptop 1       │ ──────────────────────────> │                  │
│  (U001)         │                             │  Backend Server  │
│  Agent          │                             │  (FastAPI)       │
└─────────────────┘                             │  Port: 8000      │
                                                │                  │
┌─────────────────┐         HTTP POST         │                  │
│  Laptop 2       │ ──────────────────────────> │                  │
│  (U002)         │                             │                  │
│  Agent          │                             │                  │
└─────────────────┘                             │                  │
                                                │                  │
┌─────────────────┐         HTTP POST         │                  │
│  Laptop 3       │ ──────────────────────────> │                  │
│  (U003)         │                             │                  │
│  Agent          │                             │                  │
└─────────────────┘                             └──────────────────┘
```

### **Network Stack:**

1. **Physical Layer:** Ethernet/Wi-Fi
2. **Network Layer:** IP (IPv4/IPv6)
3. **Transport Layer:** TCP (reliable, connection-oriented)
4. **Application Layer:** HTTP/1.1 (REST API)

---

## 🔄 **Data Transmission Flow**

### **Step-by-Step Process:**

1. **Activity Collection (Client Side)**

   - Agent monitors file system, processes, network, login events
   - Uses native OS APIs (FSEvents on macOS, Event Log on Windows, inotify on Linux)
   - Aggregates activities in memory

2. **Data Serialization**

   - Python dictionaries converted to JSON format
   - Includes: user_id, device_id, activity_type, timestamp, details

3. **HTTP POST Request**

   - Agent sends JSON payload to `http://SERVER_IP:8000/api/activities/ingest`
   - Uses `requests.post()` with JSON encoding
   - Includes timeout and retry logic

4. **Server Reception (Backend)**

   - FastAPI receives HTTP POST request
   - Pydantic validates JSON structure
   - Async processing for scalability

5. **ML Processing**

   - Backend runs ML anomaly detection
   - Calculates Insider Threat Score (ITS)
   - Generates alerts if anomalies detected

6. **Database Storage**

   - PostgreSQL stores activity logs
   - Stores alerts, threats, incidents
   - Maintains historical ITS scores

7. **Response to Agent**
   - Backend returns JSON response
   - Includes: status, its_score, alert_id (if alert generated)
   - Agent displays results in terminal

---

## 🛠️ **Technology Components**

### **1. Python Requests Library**

**Purpose:** HTTP client for sending data from agent to server

**Features Used:**

- `requests.Session()` - Persistent connection pool
- `HTTPAdapter` - Custom retry logic
- `Retry` strategy - Automatic retry on failures
- JSON encoding - Automatic serialization
- Timeout handling - Prevents hanging connections

**Code:**

```python
# Agent creates session with retry logic
session = requests.Session()
retry_strategy = Retry(
    total=3,                    # Max 3 retries
    backoff_factor=1,          # Wait 1s, 2s, 4s between retries
    status_forcelist=[500, 502, 503, 504]  # Retry on server errors
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("http://", adapter)
```

### **2. FastAPI (Backend Framework)**

**Purpose:** High-performance async web framework for receiving data

**Features Used:**

- Async/await - Non-blocking request handling
- Pydantic models - Automatic JSON validation
- CORS middleware - Cross-origin requests
- Automatic API documentation - Swagger UI at `/docs`

**Code:**

```python
# Backend endpoint
@app.post("/api/activities/ingest")
async def ingest_activity(activity: UserActivity):
    # FastAPI automatically:
    # 1. Parses JSON from request body
    # 2. Validates against UserActivity model
    # 3. Converts to Python object
    # 4. Returns JSON response
    return {"status": "ok"}
```

### **3. JSON (Data Format)**

**Purpose:** Lightweight, human-readable data interchange format

**Structure:**

```json
{
  "user_id": "U001",
  "device_id": "LAPTOP-001_LAPTOP-001",
  "activity_type": "file_access",
  "timestamp": "2025-12-13T10:30:00",
  "details": {
    "file_path": "/Users/abhinav/Documents/secret.pdf",
    "action": "read",
    "size_mb": 2.5,
    "sensitive": true,
    "activity_hour": 10
  }
}
```

### **4. TCP/IP (Transport Protocol)**

**Purpose:** Reliable, connection-oriented data transmission

**Characteristics:**

- **Reliable:** Guarantees delivery (retransmits lost packets)
- **Ordered:** Data arrives in correct sequence
- **Connection-oriented:** Establishes connection before data transfer
- **Flow control:** Prevents overwhelming receiver

**How it works:**

1. Agent opens TCP connection to server (3-way handshake)
2. Sends HTTP POST request over TCP
3. Server responds with HTTP response
4. Connection closed (or kept alive for reuse)

---

## 🔐 **Security & Reliability Features**

### **1. Retry Logic**

**Purpose:** Handle temporary network failures

**Implementation:**

- Automatic retry on connection errors
- Exponential backoff (1s, 2s, 4s delays)
- Max 3 retries before giving up
- Retries on HTTP 500, 502, 503, 504 errors

**Code:**

```python
retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504]
)
```

### **2. Offline Queue**

**Purpose:** Store activities when connection unavailable

**Implementation:**

- Local queue in agent memory
- Stores activities when connection fails
- Auto-retries when connection restored
- Prevents data loss

**Code:**

```python
# Agent stores activities locally if connection fails
if not connection_available:
    self.local_queue.append(activity)
    # Retry later when connection restored
```

### **3. Connection Testing**

**Purpose:** Verify server connectivity before sending data

**Implementation:**

- Health check endpoint: `GET /api/health`
- Tests connection on agent startup
- Validates user exists in backend
- Clear error messages if connection fails

**Code:**

```python
# Test connection before starting
response = requests.get(f"{server_url}/api/health", timeout=5)
if response.status_code == 200:
    print("✅ Backend connection: SUCCESS")
```

### **4. Timeout Handling**

**Purpose:** Prevent hanging connections

**Implementation:**

- 10-second timeout for requests
- Fails fast if server unresponsive
- Prevents agent from blocking

**Code:**

```python
response = session.post(url, json=data, timeout=10)
```

---

## 📊 **Data Transmission Details**

### **Request Format (Agent → Server)**

**HTTP Method:** POST

**URL:** `http://SERVER_IP:8000/api/activities/ingest`

**Headers:**

```
Content-Type: application/json
```

**Body (JSON):**

```json
{
  "user_id": "U001",
  "device_id": "LAPTOP-001_LAPTOP-001",
  "device_name": "Abhinav's MacBook",
  "activity_type": "file_access",
  "timestamp": "2025-12-13T10:30:00Z",
  "details": {
    "file_path": "/path/to/file.pdf",
    "action": "read",
    "size_mb": 2.5,
    "sensitive": false,
    "activity_hour": 10
  }
}
```

### **Response Format (Server → Agent)**

**Status Code:** 200 OK

**Body (JSON):**

```json
{
  "status": "alert_generated",
  "its_score": 65.5,
  "alert": {
    "alert_id": "ALT-20251213-001",
    "ml_score": 0.75,
    "risk_level": "high",
    "anomalies": ["off_hours", "large_file"],
    "explanation": "Off-hours activity (22:00) with large file access"
  }
}
```

---

## 🔄 **Real-Time Transmission**

### **Transmission Frequency**

- **Activities:** Sent every 5 seconds (configurable)
- **Alerts:** Aggregated and sent every 20 seconds (configurable)
- **Connection:** Persistent HTTP session (connection reuse)

### **Batching**

- Multiple activities collected in memory
- Sent in single HTTP POST request
- Reduces network overhead
- Improves efficiency

---

## 🌍 **Network Requirements**

### **Client (Laptop) Requirements:**

1. **Network Access:**

   - Internet connection OR local network access
   - Ability to reach server IP:8000

2. **Firewall:**

   - Outbound HTTP (port 80) or HTTPS (port 443)
   - If using custom port: Outbound TCP port 8000

3. **DNS/IP:**
   - Server IP address or hostname
   - Example: `http://192.168.1.100:8000`

### **Server Requirements:**

1. **Network Access:**

   - Inbound TCP port 8000 (or configured port)
   - Firewall rules to allow connections

2. **CORS Configuration:**
   - Allows requests from frontend (localhost:3000)
   - Allows requests from agents (any origin)

---

## 📱 **Multi-Laptop Support**

### **How Multiple Laptops Connect:**

1. **Same Server, Different Users:**

   ```
   Laptop 1: python realtime_monitor.py --user-id U001 --server http://192.168.1.100:8000
   Laptop 2: python realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
   Laptop 3: python realtime_monitor.py --user-id U003 --server http://192.168.1.100:8000
   ```

2. **Unique Device Identification:**

   - Each laptop has unique `device_id`
   - Format: `{hostname}_{hostname}`
   - Backend distinguishes activities by device_id

3. **Concurrent Connections:**
   - FastAPI handles multiple concurrent requests
   - Async/await allows handling many clients simultaneously
   - No connection limit (scales with server resources)

---

## 🚀 **Performance Characteristics**

### **Latency:**

- **Local Network:** < 50ms
- **Internet:** 100-500ms (depends on connection)
- **Timeout:** 10 seconds (configurable)

### **Throughput:**

- **Activities per second:** 10-100 (depends on server)
- **Concurrent clients:** 100+ (FastAPI async)
- **Data size:** ~1-5 KB per activity

### **Reliability:**

- **Retry attempts:** 3 automatic retries
- **Offline support:** Local queue with auto-retry
- **Error handling:** Graceful degradation

---

## 🔍 **Troubleshooting Network Issues**

### **Common Issues:**

1. **Connection Refused (WinError 10061)**

   - **Cause:** Server not running or firewall blocking
   - **Fix:** Check server is running, check firewall rules

2. **Invalid Address (WinError 10049)**

   - **Cause:** Wrong IP address or port
   - **Fix:** Verify server IP and port

3. **Timeout**

   - **Cause:** Network slow or server overloaded
   - **Fix:** Increase timeout, check network speed

4. **User Not Found (404)**
   - **Cause:** User doesn't exist in backend database
   - **Fix:** Create user in backend first

---

## 📚 **Summary**

**Technology Stack:**

- **Protocol:** HTTP/1.1 over TCP/IP
- **Client Library:** Python `requests`
- **Server Framework:** FastAPI (async)
- **Data Format:** JSON
- **Transport:** TCP (reliable, ordered)
- **Network:** IP (IPv4/IPv6)

**Key Features:**

- ✅ Automatic retry on failures
- ✅ Offline queue support
- ✅ Connection pooling
- ✅ Timeout handling
- ✅ Multi-laptop support
- ✅ Real-time transmission
- ✅ Scalable architecture

**This architecture ensures reliable, efficient, and scalable data transmission from multiple laptops to the central SentinelIQ server.**

