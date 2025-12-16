import streamlit as st

st.set_page_config(
    page_title="AI Pothole Detection System",
    page_icon="🛣️",
    layout="wide"
)

st.title("🛣️ AI-Powered Pothole Detection System")
st.markdown("### Complete Road Damage Assessment & City Planning Platform")

st.markdown("---")

col1, col2 = st.columns(2)

with col1:
    st.header("🔍 Detection & Analysis")
    st.markdown("""
    **Advanced Computer Vision Analysis:**
    - 📸 Upload road images or videos
    - 🤖 Real-time pothole detection with YOLOv11
    - 🗺️ 3D depth mapping with MiDaS
    - 💰 Economic impact & ROI analysis
    - 📈 Growth prediction modeling
    - 📍 GPS tracking & mapping
    - 🎯 Danger scoring system
    
    **Perfect for:**
    - Analyzing specific road segments
    - Processing road survey videos
    - Getting detailed repair cost estimates
    - Calculating return on investment
    - Prioritizing maintenance work
    """)
    st.info("👈 Select **🔍 Detection Analysis** from the sidebar to start")

with col2:
    st.header("🗺️ City-Wide Map & Route Planning")
    st.markdown("""
    **Comprehensive City-Level Intelligence:**
    - 🌍 View 15,000+ BBMP pothole records
    - 🗺️ Interactive map with all potholes
    - 🚗 Smart route planning (avoid potholes!)
    - 🔍 Filter by zone, ward, status
    - 📊 Timeline & trend analysis
    - 💵 Cost analytics by region
    - 🛣️ Compare multiple route options
    
    **Perfect for:**
    - Planning safest routes in Bengaluru
    - Viewing city-wide pothole distribution
    - Analyzing maintenance trends
    - Budget allocation planning
    - Finding pothole-free navigation
    """)
    st.info("👈 Select **🗺️ City Wide Map** from the sidebar")

st.markdown("---")

st.subheader("📊 System Capabilities")

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("### 🤖 AI Detection")
    st.markdown("""
    - **YOLOv11m** trained model
    - **MiDaS DPT** depth estimation
    - Real-time processing
    - Multi-pothole tracking
    - Severity classification
    - 3D surface modeling
    """)

with col2:
    st.markdown("### 💰 Economic Analysis")
    st.markdown("""
    - Repair cost estimation
    - ROI calculations
    - Vehicle damage predictions
    - Payback period analysis
    - Growth forecasting
    - Priority ranking
    """)

with col3:
    st.markdown("### 🗺️ City Intelligence")
    st.markdown("""
    - 20,000+ BBMP records
    - Live route planning
    - Safety score calculation
    - Multi-route comparison
    - Ward-level analytics
    - Timeline visualization
    """)

st.markdown("---")

st.subheader("🎯 Quick Stats")

metrics_col1, metrics_col2, metrics_col3, metrics_col4 = st.columns(4)

with metrics_col1:
    st.metric("Detection Model", "YOLOv11m", help="Custom trained on pothole dataset")
with metrics_col2:
    st.metric("Depth Estimation", "MiDaS DPT", help="Meta's depth prediction transformer")
with metrics_col3:
    st.metric("City Coverage", "Bengaluru", help="BBMP jurisdiction area")
with metrics_col4:
    st.metric("Database Size", "20,000+", help="Historical pothole records")

st.markdown("---")

st.subheader("🚀 How to Use")

tab1, tab2 = st.tabs(["Detection & Analysis", "City-Wide Map"])

with tab1:
    st.markdown("""
    ### Image Analysis
    1. Navigate to **🔍 Detection Analysis** page (sidebar)
    2. Select **Image Analysis** mode
    3. Upload a road image (JPG, PNG)
    4. Adjust detection parameters if needed
    5. View results: detections, 3D models, economic analysis
    6. Download detailed CSV report
    
    ### Video Analysis
    1. Select **Video Analysis** mode
    2. Upload road video (MP4, AVI, MOV)
    3. Set vehicle speed and frame skip rate
    4. Process video (may take a few minutes)
    5. View timeline analysis and route map
    6. Download comprehensive analysis report
    """)

with tab2:
    st.markdown("""
    ### Exploring the City Map
    1. Navigate to **🗺️ City Wide Map** page (sidebar)
    2. Use filters to narrow down potholes (zone, ward, status)
    3. Click on map markers for detailed pothole info
    4. View analytics and trends
    
    ### Smart Route Planning
    1. Enter **Source** location (e.g., "Koramangala")
    2. Enter **Destination** location (e.g., "Whitefield")
    3. Adjust pothole detection range (buffer distance)
    4. Click **"Find Safest Route"**
    5. Compare multiple route options
    6. View pothole counts and safety scores
    7. Choose the best route based on your priorities
    """)

st.markdown("---")

st.subheader("⚙️ Technical Stack")

tech_col1, tech_col2, tech_col3 = st.columns(3)

with tech_col1:
    st.markdown("""
    **Computer Vision:**
    - Ultralytics YOLOv11
    - Intel MiDaS
    - OpenCV
    - PyTorch
    """)

with tech_col2:
    st.markdown("""
    **Data Analysis:**
    - Pandas
    - NumPy
    - SciPy
    - Plotly
    """)

with tech_col3:
    st.markdown("""
    **Mapping & Routes:**
    - Folium
    - OSRM Routing
    - OpenStreetMap
    - Streamlit
    """)

st.markdown("---")

# Footer
st.markdown("""
<div style='text-align: center; padding: 20px; background-color: #f0f2f6; border-radius: 10px;'>
    <h3>🤖 AI-Powered Infrastructure Management</h3>
    <p style='color: gray; margin-top: 10px;'>
        Powered by YOLOv11, MiDaS & OSRM | Built with Streamlit & Deployed on Hugging Face Spaces<br>
        💡 Integrated System: Detection + 3D Modeling + Economic Analysis + Route Planning<br>
        📧 For support or feedback, use the feedback button in the sidebar
    </p>
</div>
""", unsafe_allow_html=True)

# Sidebar info
with st.sidebar:
    st.markdown("---")
    st.markdown("### 📖 Quick Guide")
    st.markdown("""
    **Navigation:**
    - Use the pages above to switch between features
    - Each page has its own controls and settings
    
    **For Best Results:**
    - Use clear, well-lit road images
    - Videos should be stable (dashcam recommended)
    - Adjust confidence threshold if too many/few detections
    
    **Need Help?**
    - Check the How to Use section on this page
    - Each page has tooltips and help text
    """)