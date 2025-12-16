import streamlit as st
import cv2
import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont
from torchvision.transforms import Compose, Resize, ToTensor, Normalize
from ultralytics import YOLO
import pandas as pd
import tempfile
import os
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
# ---------------------------
# GPS EXTRACTION FUNCTION
# ---------------------------
from PIL import Image, ExifTags

if "pothole_locations" not in st.session_state:
    st.session_state.pothole_locations = []

def normalize_spline_image(spline):
    try:
        img = spline

        # Convert lists → numpy
        if isinstance(img, list):
            img = np.array(img)

        # Replace NaNs/Infs
        img = np.nan_to_num(img, nan=0.0, posinf=0.0, neginf=0.0).astype(np.float32)

        # Scale to 0–1 if out of range
        min_val, max_val = img.min(), img.max()
        if max_val - min_val > 0:
            img = (img - min_val) / (max_val - min_val)
        else:
            img = np.zeros_like(img)

        # Convert to uint8 RGB
        img = (img * 255).astype(np.uint8)

        # If grayscale → convert to RGB
        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

        return img

    except Exception as e:
        print("Spline normalization error:", e)
        return np.zeros((200, 200, 3), dtype=np.uint8)  # fallback


def extract_gps(image):
    try:
        exif = image._getexif()
        if not exif:
            return None

        gps_info = {}
        for tag, value in exif.items():
            tag_name = ExifTags.TAGS.get(tag)
            if tag_name == "GPSInfo":
                for key in value.keys():
                    name = ExifTags.GPSTAGS.get(key)
                    gps_info[name] = value[key]

        def convert_to_degrees(value):
            d = value[0][0] / value[0][1]
            m = value[1][0] / value[1][1]
            s = value[2][0] / value[2][1]
            return d + (m / 60.0) + (s / 3600.0)

        if ("GPSLatitude" in gps_info) and ("GPSLongitude" in gps_info):
            lat = convert_to_degrees(gps_info["GPSLatitude"])
            lon = convert_to_degrees(gps_info["GPSLongitude"])

            if gps_info.get("GPSLatitudeRef") == "S":
                lat = -lat
            if gps_info.get("GPSLongitudeRef") == "W":
                lon = -lon

            return lat, lon

    except Exception as e:
        print("GPS extraction error:", e)
        return None

try:
    import folium
    from streamlit_folium import folium_static
    FOLIUM_AVAILABLE = True
except ImportError:
    FOLIUM_AVAILABLE = False


st.set_page_config(page_title="AI Pothole Analyzer Pro", page_icon="🛣️", layout="wide")

st.title("🛣️ AI-Powered Comprehensive Pothole Detection System")
st.markdown("*Complete road damage assessment with Computer Vision, Economic Analysis & Growth Forecasting*")

# ==================== MODEL LOADING ====================
@st.cache_resource
def load_models():
    yolo_model = YOLO("best.pt")
    midas = torch.hub.load("intel-isl/MiDaS", "DPT_Large")
    midas.eval()
    midas.to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))
    return yolo_model, midas

with st.spinner("🔄 Loading AI models..."):
    yolo_model, midas = load_models()

midas_transform = Compose([
    Resize((384, 384)),
    ToTensor(),
    Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

# ==================== SIDEBAR CONFIGURATION ====================
st.sidebar.header("⚙️ Configuration")

# Analysis Mode
analysis_mode = st.sidebar.radio("📊 Analysis Mode:", ["Image Analysis", "Video Analysis"], horizontal=True)

# Visual Options
st.sidebar.markdown("### 🎨 Visual Features")
show_depth_map = st.sidebar.checkbox("Show Depth Map", value=False)
show_heatmap = st.sidebar.checkbox("Show Severity Heatmap", value=True)
show_3d_model = st.sidebar.checkbox("Generate 3D Models", value=True)

# Detection Parameters
st.sidebar.markdown("### 🔍 Detection Parameters")
confidence_threshold = st.sidebar.slider("Detection Confidence", 0.1, 1.0, 0.5, 0.05)
pixel_to_cm = st.sidebar.number_input("Pixel to CM Ratio", 0.1, 2.0, 0.5, 0.1)
cost_per_m2 = st.sidebar.number_input("Repair Cost per m² (₹)", 500, 5000, 1942, 50)

# Economic Analysis
st.sidebar.markdown("### 💰 Economic Parameters")
show_economic_impact = st.sidebar.checkbox("Show Economic Impact", value=True)
show_growth_prediction = st.sidebar.checkbox("Show Growth Prediction", value=True)
avg_traffic_per_day = st.sidebar.number_input("Avg Daily Traffic", 100, 10000, 1000, 100)
avg_vehicle_repair = st.sidebar.number_input("Avg Vehicle Repair Cost (₹)", 1000, 10000, 3000, 500)

# Weather factors for improved growth prediction
st.sidebar.markdown("### 🌦️ Environmental Factors")
rainfall_intensity = st.sidebar.selectbox("Rainfall Pattern",
    ["Low (< 500mm)", "Moderate (500-1000mm)", "High (> 1000mm)"], index=1)
temperature_range = st.sidebar.selectbox("Temperature Variation",
    ["Stable", "Moderate Variation", "High Variation"], index=1)
traffic_load = st.sidebar.selectbox("Traffic Load",
    ["Light", "Moderate", "Heavy"], index=1)

# ---------- Danger score config (add to sidebar near other params) ----------
st.sidebar.markdown("### ⚠️ Danger Score Settings")
severity_weight = st.sidebar.number_input("Severity weight", 0.5, 5.0, 2.0, 0.1)
area_weight = st.sidebar.number_input("Area (m²) weight", 0.1, 50.0, 5.0, 0.1)
depth_weight = st.sidebar.number_input("Depth (cm) weight", 0.1, 20.0, 2.0, 0.1)
traffic_weight = st.sidebar.number_input("Traffic factor weight", 0.1, 10.0, 1.0, 0.1)

# thresholds for advisory
danger_threshold_high = st.sidebar.number_input("High danger threshold", 10, 500, 80, 1)
danger_threshold_medium = st.sidebar.number_input("Medium danger threshold", 5, 400, 35, 1)


# GPS Settings (for both image and video)
if FOLIUM_AVAILABLE:
    st.sidebar.markdown("### 📍 GPS Settings")
    use_gps = st.sidebar.checkbox("Enable GPS Tracking", value=False)
    if use_gps:
        default_lat = st.sidebar.number_input("Starting Latitude", value=12.9716, format="%.6f")
        default_lon = st.sidebar.number_input("Starting Longitude", value=77.5946, format="%.6f")
    else:
        default_lat, default_lon = 12.9716, 77.5946
else:
    use_gps = False
    default_lat, default_lon = 12.9716, 77.5946

# Video-specific settings
if analysis_mode == "Video Analysis":
    st.sidebar.markdown("### 🎬 Video Settings")
    assumed_speed = st.sidebar.slider("Vehicle Speed (km/h)", 10, 80, 40, 5)
    frame_skip = st.sidebar.slider("Process Every N Frames", 5, 30, 10, 5)

st.sidebar.markdown("---")
prioritize_by = st.sidebar.selectbox("Prioritize Repairs By:", ["ROI", "Cost", "Severity", "Area", "Growth Rate"])

# ==================== IMPROVED GROWTH PREDICTION ====================
def calculate_environmental_multiplier(rainfall, temperature, traffic):
    """Calculate combined environmental impact on pothole growth"""

    # Rainfall impact (most significant factor)
    rainfall_factors = {
        "Low (< 500mm)": 0.8,
        "Moderate (500-1000mm)": 1.2,
        "High (> 1000mm)": 1.8
    }

    # Temperature cycling impact
    temp_factors = {
        "Stable": 0.9,
        "Moderate Variation": 1.1,
        "High Variation": 1.4
    }

    # Traffic load impact
    traffic_factors = {
        "Light": 0.85,
        "Moderate": 1.0,
        "Heavy": 1.3
    }

    combined = (rainfall_factors[rainfall] *
                temp_factors[temperature] *
                traffic_factors[traffic])

    return combined

def predict_pothole_growth_advanced(area_cm2, depth_cm, severity, env_multiplier, perimeter_cm=0):
    """
    Advanced growth prediction using empirical models
    Based on research: growth is non-linear and accelerates over time
    """

    # Base monthly growth rates (calibrated from literature)
    if severity == "Severe":
        area_base_rate = 0.18  # 18% monthly
        depth_base_rate = 0.15  # 15% monthly
        acceleration = 1.05  # Growth accelerates by 5% each month
    elif severity == "Moderate":
        area_base_rate = 0.12
        depth_base_rate = 0.10
        acceleration = 1.03
    else:
        area_base_rate = 0.06
        depth_base_rate = 0.05
        acceleration = 1.02

    # Size factor: larger potholes grow faster (edge effects)
    size_factor = 1.0 + (area_cm2 / 1000) * 0.1  # 10% increase per 1000 cm²
    size_factor = min(size_factor, 1.5)  # Cap at 150%

    # Depth factor: deeper potholes collect more water
    depth_factor = 1.0 + (depth_cm / 20) * 0.15
    depth_factor = min(depth_factor, 1.4)

    predictions = []
    current_area = area_cm2
    current_depth = depth_cm

    # Predict for: current, 1, 2, 3, 6, 12, 18 months
    for month in [0, 1, 2, 3, 6, 12, 18]:
        if month == 0:
            predictions.append({
                'month': 0,
                'area': current_area,
                'depth': current_depth,
                'label': 'Current',
                'growth_rate': 0
            })
        else:
            # Compound growth with acceleration
            effective_area_rate = area_base_rate * env_multiplier * size_factor * (acceleration ** (month/6))
            effective_depth_rate = depth_base_rate * env_multiplier * depth_factor * (acceleration ** (month/6))

            # Apply growth
            new_area = area_cm2 * ((1 + effective_area_rate) ** month)
            new_depth = depth_cm * ((1 + effective_depth_rate) ** month)

            # Calculate instantaneous growth rate
            if month > 1:
                prev_area = predictions[-1]['area']
                growth_rate = ((new_area - prev_area) / prev_area) * 100
            else:
                growth_rate = effective_area_rate * 100

            predictions.append({
                'month': month,
                'area': new_area,
                'depth': new_depth,
                'label': f'{month}M',
                'growth_rate': growth_rate
            })

    return predictions

# ==================== ECONOMIC ANALYSIS ====================
def calculate_economic_impact(area_cm2, depth_cm, severity, traffic_daily, repair_cost):
    """Enhanced economic impact calculation"""

    # Damage probability matrix (refined)
    damage_probs = {
        "Severe": {"base": 0.45, "traffic_factor": 1.0},
        "Moderate": {"base": 0.18, "traffic_factor": 0.7},
        "Low": {"base": 0.06, "traffic_factor": 0.4}
    }

    params = damage_probs.get(severity, {"base": 0.05, "traffic_factor": 0.3})

    # Size and depth multipliers
    size_multiplier = min(area_cm2 / 400, 2.5)
    depth_multiplier = min(depth_cm / 15, 2.0)

    # Calculate affected vehicles
    affected_traffic = traffic_daily * params["traffic_factor"]
    damage_probability = params["base"] * size_multiplier * depth_multiplier
    damage_probability = min(damage_probability, 0.85)  # Cap at 85%

    vehicles_damaged_per_month = affected_traffic * damage_probability * 30
    monthly_damage_cost = vehicles_damaged_per_month * avg_vehicle_repair
    annual_damage_cost = min(monthly_damage_cost * 12, 15000)


    # ROI calculation
    roi = ((annual_damage_cost - repair_cost) / repair_cost * 100) if repair_cost > 0 else 0
    payback_months = (repair_cost / monthly_damage_cost) if monthly_damage_cost > 0 else 999

    return {
        'monthly_damage': monthly_damage_cost,
        'annual_damage': annual_damage_cost,
        'vehicles_affected_monthly': int(vehicles_damaged_per_month),
        'damage_probability': damage_probability * 100,
        'roi': roi,
        'payback_months': payback_months
    }

def compute_pothole_danger(severity, area_cm2, depth_cm, traffic_daily,
                           severity_w=2.0, area_w=5.0, depth_w=2.0, traffic_w=1.0):
    """
    Return a numeric danger score for a pothole. Tunable weights.
    area_cm2 -> converted to m2 inside function
    """
    # severity mapping
    sev_map = {"Low": 1, "Moderate": 2, "Severe": 3}
    sev_score = sev_map.get(severity, 1)

    area_m2 = max(area_cm2 / 10000.0, 0.0)  # cm2 -> m2
    traffic_factor = min(max(traffic_daily / 1000.0, 0.01), 5.0)  # scaled traffic

    # base score (linear combination)
    raw = (severity_w * sev_score) + (area_w * area_m2) + (depth_w * depth_cm) + (traffic_w * traffic_factor)

    # scale into an easy range (optional): here we simply return raw
    return raw


# ==================== VISUALIZATION FUNCTIONS ====================
def create_growth_chart_advanced(predictions, current_cost, cost_per_m2, economic_predictions=None):
    """Enhanced growth visualization with economic overlay"""

    months = [p['month'] for p in predictions]
    areas = [p['area'] for p in predictions]
    depths = [p['depth'] for p in predictions]
    costs = [(a / 10000) * cost_per_m2 for a in areas]
    growth_rates = [p['growth_rate'] for p in predictions]

    fig = go.Figure()

    # Area growth
    fig.add_trace(go.Scatter(
        x=months, y=areas,
        mode='lines+markers',
        name='Area (cm²)',
        line=dict(color='blue', width=3),
        marker=dict(size=10),
        yaxis='y1'
    ))

    # Depth growth
    fig.add_trace(go.Scatter(
        x=months, y=depths,
        mode='lines+markers',
        name='Depth (cm)',
        line=dict(color='green', width=2, dash='dot'),
        marker=dict(size=8),
        yaxis='y1'
    ))

    # Repair cost growth
    fig.add_trace(go.Scatter(
        x=months, y=costs,
        mode='lines+markers',
        name='Repair Cost (₹)',
        line=dict(color='red', width=3, dash='dash'),
        marker=dict(size=10, symbol='diamond'),
        yaxis='y2'
    ))

    # Growth rate bars
    fig.add_trace(go.Bar(
        x=months[1:], y=growth_rates[1:],
        name='Growth Rate (%)',
        marker_color='orange',
        opacity=0.3,
        yaxis='y3'
    ))

    fig.update_layout(
        title='Multi-Factor Pothole Growth Forecast',
        xaxis_title='Months from Now',
        yaxis=dict(
            title='Area (cm²) / Depth (cm)',
            side='left'
        ),
        yaxis2=dict(
            title='Repair Cost (₹)',
            overlaying='y',
            side='right'
        ),
        yaxis3=dict(
            title='Growth Rate (%)',
            overlaying='y',
            side='right',
            position=0.95
        ),
        hovermode='x unified',
        height=500,
        legend=dict(x=0.01, y=0.99)
    )

    return fig

def create_roi_comparison_chart(repair_cost, economic_data, predictions, cost_per_m2):
    """Compare costs of fixing now vs. fixing later"""

    months = [0, 1, 3, 6, 12, 18]

    # If fixed now
    fix_now_costs = [repair_cost] * len(months)

    # If delayed - repair cost increases + accumulated damage
    fix_later_costs = []
    cumulative_damage = []

    for i, month in enumerate(months):
        if month == 0:
            fix_later_costs.append(repair_cost)
            cumulative_damage.append(0)
        else:
            # Find corresponding prediction
            pred = next((p for p in predictions if p['month'] == month), predictions[-1])
            future_repair = (pred['area'] / 10000) * cost_per_m2
            damage = economic_data['monthly_damage'] * month

            fix_later_costs.append(future_repair + damage)
            cumulative_damage.append(damage)

    fig = go.Figure()

    fig.add_trace(go.Bar(
        x=[f'{m}M' for m in months],
        y=fix_now_costs,
        name='Fix Now (One-time)',
        marker_color='green'
    ))

    fig.add_trace(go.Bar(
        x=[f'{m}M' for m in months],
        y=fix_later_costs,
        name='Fix Later (Repair + Damage)',
        marker_color='red'
    ))

    fig.add_trace(go.Scatter(
        x=[f'{m}M' for m in months],
        y=cumulative_damage,
        name='Vehicle Damage Only',
        line=dict(color='orange', width=3, dash='dot'),
        mode='lines+markers'
    ))

    fig.update_layout(
        title='Cost-Benefit Analysis: Fix Now vs. Delay',
        xaxis_title='Decision Delay Period',
        yaxis_title='Total Cost (₹)',
        barmode='group',
        height=400
    )

    return fig

def create_3d_pothole_model(depth_crop, area_cm2, avg_depth):
    """3D surface visualization"""
    try:
        if depth_crop.shape[0] < 10 or depth_crop.shape[1] < 10:
            depth_crop = cv2.resize(depth_crop, (50, 50), interpolation=cv2.INTER_CUBIC)

        x = np.linspace(0, depth_crop.shape[1], depth_crop.shape[1])
        y = np.linspace(0, depth_crop.shape[0], depth_crop.shape[0])
        X, Y = np.meshgrid(x, y)
        Z = -depth_crop

        fig = go.Figure(data=[go.Surface(x=X, y=Y, z=Z, colorscale='Viridis', showscale=True)])
        fig.update_layout(
            title=f"3D Model - Area: {area_cm2:.1f}cm², Depth: {avg_depth:.1f}cm",
            scene=dict(
                xaxis_title="Width (pixels)",
                yaxis_title="Length (pixels)",
                zaxis_title="Depth (cm)",
                camera=dict(eye=dict(x=1.5, y=1.5, z=1.3))
            ),
            width=700,
            height=600
        )
        return fig
    except:
        return None

def create_route_map(pothole_data_list, speed_kmph, fps):
    """Create linear route map for video analysis"""
    if not pothole_data_list:
        return None

    speed_mps = speed_kmph / 3.6
    distance_per_frame = speed_mps / fps

    distances = []
    severities = []
    costs = []
    labels = []
    colors = []

    for item in pothole_data_list:
        dist = item['frame'] * distance_per_frame
        distances.append(dist)
        severities.append(item['severity'])
        costs.append(item['cost'])
        labels.append(f"#{item['pothole_num']}")

        color_map = {'Severe': 'red', 'Moderate': 'orange', 'Low': 'green'}
        colors.append(color_map.get(item['severity'], 'gray'))

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=distances,
        y=[1] * len(distances),
        mode='markers+text',
        marker=dict(size=20, color=colors, line=dict(width=2, color='black')),
        text=labels,
        textposition="top center",
        hovertemplate='<b>Pothole %{text}</b><br>Distance: %{x:.1f}m<br>Severity: %{customdata[0]}<br>Cost: ₹%{customdata[1]:.0f}<extra></extra>',
        customdata=list(zip(severities, costs)),
        name='Potholes'
    ))

    fig.add_trace(go.Scatter(
        x=[0, max(distances) if distances else 100],
        y=[1, 1],
        mode='lines',
        line=dict(color='gray', width=10),
        showlegend=False,
        hoverinfo='skip'
    ))

    fig.update_layout(
        title="Road Route with Pothole Locations",
        xaxis_title="Distance from Start (meters)",
        yaxis=dict(visible=False, range=[0.5, 1.5]),
        height=300,
        showlegend=False,
        hovermode='closest'
    )

    return fig

def create_severity_timeline(pothole_data_list, fps):
    """Timeline visualization for video"""
    if not pothole_data_list:
        return None

    frames = [item['frame'] for item in pothole_data_list]
    times = [f / fps for f in frames]
    severities = [item['severity'] for item in pothole_data_list]

    severity_map = {'Severe': 3, 'Moderate': 2, 'Low': 1, 'Unknown': 0}
    severity_values = [severity_map.get(s, 0) for s in severities]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=times,
        y=severity_values,
        mode='markers+lines',
        marker=dict(size=12, color=severity_values, colorscale='RdYlGn_r',
                   colorbar=dict(title="Severity", tickvals=[1,2,3], ticktext=['Low','Moderate','Severe'])),
        line=dict(width=2),
        name='Severity'
    ))

    fig.update_layout(
        title="Severity Timeline",
        xaxis_title="Time (seconds)",
        yaxis_title="Severity Level",
        yaxis=dict(tickvals=[1, 2, 3], ticktext=['Low', 'Moderate', 'Severe']),
        height=300
    )

    return fig

# ==================== IMAGE ANALYSIS FUNCTION ====================
def analyze_image(pil_img, conf_threshold=0.5, pixel_ratio=0.5, cost_m2=1942, lat=None, lon=None):
    """
    Complete image analysis with all features + robust spline generation.

    Returns:
      - annotated_pil_img (PIL.Image)       : annotated image with boxes/contours
      - result_data (list[dict])            : per-pothole scalar information (no images)
      - depth_map_colored (np.uint8 RGB)    : colored depth visualization for full image
      - spline_img (np.uint8 RGB)           : RGB image of spline surface for last pothole (or empty if none)
      - depth_crops_3d (list[dict])         : list of depth crop dicts (raw depth arrays + metadata)
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    opencv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # -------------------------
    # Depth estimation (MiDaS)
    # -------------------------
    img_transformed = midas_transform(pil_img).unsqueeze(0).to(device)
    with torch.no_grad():
        prediction = midas(img_transformed)
    depth_map = torch.nn.functional.interpolate(
        prediction.unsqueeze(1), size=pil_img.size[::-1],
        mode="bicubic", align_corners=False
    ).squeeze().cpu().numpy()

    # produce a colored depth viz (uint8 RGB)
    depth_map_normalized = cv2.normalize(depth_map, None, 0, 255, cv2.NORM_MINMAX)
    depth_map_colored = cv2.applyColorMap(depth_map_normalized.astype(np.uint8), cv2.COLORMAP_MAGMA)
    depth_map_colored = cv2.cvtColor(depth_map_colored, cv2.COLOR_BGR2RGB)

    # -------------------------
    # YOLO detection
    # -------------------------
    results = yolo_model(pil_img, conf=conf_threshold)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
        small_font = ImageFont.truetype("arial.ttf", 16)
    except Exception:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    annotated_pil = pil_img.copy()
    draw = ImageDraw.Draw(annotated_pil)

    annotated_image = np.array(annotated_pil)
    result_data = []
    pothole_count = 0
    depth_crops_3d = []
    severity_map = np.zeros((pil_img.height, pil_img.width), dtype=np.float32)

    # default empty spline (safe uint8 RGB)
    spline_img = np.zeros((max(64, int(pil_img.height//8)), max(64, int(pil_img.width//8)), 3), dtype=np.uint8)

    # iterate detections
    for bbox in results[0].boxes:
        pothole_count += 1
        confidence = float(bbox.conf[0])
        x1, y1, x2, y2 = map(int, bbox.xyxy[0].cpu().numpy())

        h, w = pil_img.height, pil_img.width
        # clamp bbox
        x1, x2 = max(0, min(x1, w - 1)), max(0, min(x2, w - 1))
        y1, y2 = max(0, min(y1, h - 1)), max(0, min(y2, h - 1))

        # crop ROI from original opencv BGR
        roi = opencv_img[y1:y2, x1:x2]

        area_cm2 = perimeter_cm = 0.0
        avg_depth = volume_cm3 = estimated_cost = 0.0
        severity = "Unknown"
        severity_score = 0
        risk_level = "Unknown"
        pothole_lat = lat
        pothole_lon = lon

        spline_local = None  # will hold the spline image for this pothole

        if roi.size > 0 and (y2 - y1) > 2 and (x2 - x1) > 2:
            try:
                # -------------------------
                # Contour & area
                # -------------------------
                gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                blur = cv2.GaussianBlur(gray, (5, 5), 0)
                edges = cv2.Canny(blur, 50, 150)
                kernel = np.ones((3, 3), np.uint8)
                edges = cv2.dilate(edges, kernel, iterations=1)
                edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
                contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                cnt = None
                if contours:
                    cnt = max(contours, key=cv2.contourArea)

                if cnt is not None and cv2.contourArea(cnt) > 10:
                    # approximate physical conversions
                    px_to_cm = pixel_ratio  # user supplied px->cm or px/cm variable
                    # if pixel_ratio is cm per pixel, area in cm^2 = px_area * (px_to_cm)^2
                    area_px = cv2.contourArea(cnt)
                    area_cm2 = area_px * (px_to_cm ** 2)

                    perimeter_cm = cv2.arcLength(cnt, True) * px_to_cm

                    # depth crop (from full depth_map which matches the full image size)
                    # depth_map indexing: [rows(height), cols(width)]
                    depth_crop = depth_map[y1:y2, x1:x2]

                    # compute robust avg depth in crop
                    if depth_crop.size > 0:
                        depth_vals = depth_crop.flatten()
                        depth_vals = depth_vals[~np.isnan(depth_vals)]
                        if depth_vals.size > 0:
                            low, high = np.percentile(depth_vals, [5, 95])
                            depth_vals = depth_vals[(depth_vals >= low) & (depth_vals <= high)]
                            if depth_vals.size > 0:
                                # calibration factor (you used 1.8 earlier)
                                avg_depth = float(np.mean(depth_vals)) * 1.8
                                # clamp to reasonable range for display
                                avg_depth = float(np.clip(avg_depth, 0.5, 50.0))
                                volume_cm3 = area_cm2 * avg_depth
                            else:
                                avg_depth = 0.0
                        else:
                            avg_depth = 0.0
                    else:
                        avg_depth = 0.0

                    # simple cost model - keep your original parameters
                    area_m2 = area_cm2 / 10000.0
                    base_cost = 450
                    material_cost = area_cm2 * 0.5
                    estimated_cost = base_cost + material_cost
                    estimated_cost = max(450, min(estimated_cost, 2500))

                    # severity (your thresholds)
                    if area_cm2 < 300 and avg_depth < 15:
                        severity = "Low"
                        severity_score = 1
                        bg_color = "green"
                        text_color = "white"
                        risk_level = "Monitor"
                    elif 300 <= area_cm2 <= 700 or 15 <= avg_depth <= 30:
                        severity = "Moderate"
                        severity_score = 2
                        bg_color = "orange"
                        text_color = "black"
                        risk_level = "Schedule Repair"
                    else:
                        severity = "Severe"
                        severity_score = 3
                        bg_color = "red"
                        text_color = "white"
                        risk_level = "Urgent Repair"

                    # mark severity region in heatmap
                    severity_map[y1:y2, x1:x2] = severity_score

                    # draw contour onto annotated image (shift contour coords to full-image)
                    cnt_adjusted = cnt.copy()
                    cnt_adjusted[:, 0, 0] = cnt_adjusted[:, 0, 0] + x1
                    cnt_adjusted[:, 0, 1] = cnt_adjusted[:, 0, 1] + y1
                    ann_np = np.array(annotated_pil)
                    cv2.drawContours(ann_np, [cnt_adjusted], -1, (0, 255, 0), 2)
                    annotated_pil = Image.fromarray(ann_np)
                    draw = ImageDraw.Draw(annotated_pil)

                    # Save depth crop metadata for 3D modelling
                    depth_crops_3d.append({
                        'pothole_num': pothole_count,
                        'depth_data': depth_crop.copy(),  # raw floats
                        'area': area_cm2,
                        'depth': avg_depth,
                        'perimeter': perimeter_cm
                    })

                    # -------------------------
                    # Spline surface creation (per-pothole)
                    # -------------------------
                    # Plan:
                    #  - try SmoothBivariateSpline (scipy) for a smooth surface
                    #  - if unavailable or fails, use a safe normalization + colormap fallback
                    try:
                        # prepare z matrix (replace nan/inf)
                        z = np.nan_to_num(depth_crop, nan=0.0, posinf=0.0, neginf=0.0)
                        if z.size == 0:
                            raise ValueError("empty depth crop")

                        # ensure reasonable shape
                        zh, zw = z.shape
                        if zh < 4 or zw < 4:
                            # small crop -> upscale for nicer visualization
                            z = cv2.resize(z, (max(16, zw*4), max(16, zh*4)), interpolation=cv2.INTER_CUBIC)
                            zh, zw = z.shape

                        # coordinate grid
                        xs = np.arange(0, zw)
                        ys = np.arange(0, zh)
                        xx, yy = np.meshgrid(xs, ys)

                        # flatten for fitting
                        pts_x = xx.flatten()
                        pts_y = yy.flatten()
                        pts_z = z.flatten()

                        # robust fitting with a small smoothing factor
                        from scipy.interpolate import SmoothBivariateSpline
                        # s parameter: tradeoff smoothing: set relative to number of points
                        s_val = max(1.0, (pts_z.size) * 0.001)
                        spline = SmoothBivariateSpline(pts_x, pts_y, pts_z, s=s_val)
                        zz = spline(xs, ys)
                        # spline returns shape (len(xs), len(ys)) -> transpose to (h,w)
                        zz = np.array(zz)
                        if zz.shape != (zh, zw):
                            zz = zz.T
                    except Exception:
                        # fallback: just use normalized depth crop (no spline)
                        try:
                            zz = np.nan_to_num(depth_crop, nan=0.0, posinf=0.0, neginf=0.0)
                            if zz.size == 0:
                                zz = np.zeros((64, 64), dtype=np.float32)
                            # if very small, upscale
                            if zz.shape[0] < 8 or zz.shape[1] < 8:
                                zz = cv2.resize(zz, (max(64, zz.shape[1]*4), max(64, zz.shape[0]*4)), interpolation=cv2.INTER_CUBIC)
                        except Exception:
                            zz = np.zeros((64, 64), dtype=np.float32)

                    # Normalize to 0-255 uint8 for display
                    zz_norm = zz - np.min(zz)
                    if np.max(zz_norm) > 0:
                        zz_norm = zz_norm / np.max(zz_norm)
                    zz_img = (zz_norm * 255.0).astype(np.uint8)

                    # Colorize and convert to RGB
                    try:
                        spline_col = cv2.applyColorMap(zz_img, cv2.COLORMAP_VIRIDIS)
                        spline_col = cv2.cvtColor(spline_col, cv2.COLOR_BGR2RGB)
                    except Exception:
                        # if applyColorMap fails (rare), make grayscale RGB
                        spline_col = np.stack([zz_img]*3, axis=-1)

                    spline_local = spline_col  # uint8 RGB array

                else:
                    # no contours found; set defaults
                    area_cm2 = 0.0
                    perimeter_cm = 0.0
                    avg_depth = 0.0
                    estimated_cost = 0.0
                    spline_local = np.zeros((128, 128, 3), dtype=np.uint8)

            except Exception as e:
                # any per-pothole failure -> continue but keep placeholders
                area_cm2 = 0.0
                perimeter_cm = 0.0
                avg_depth = 0.0
                estimated_cost = 0.0
                spline_local = np.zeros((128, 128, 3), dtype=np.uint8)

        else:
            # ROI has no size or invalid -> safe placeholders
            area_cm2 = 0.0
            perimeter_cm = 0.0
            avg_depth = 0.0
            estimated_cost = 0.0
            spline_local = np.zeros((128, 128, 3), dtype=np.uint8)

        # GPS offset (if enabled)
        if use_gps and lat is not None and lon is not None:
            offset_lat = (y1 / h) * 0.0001 - 0.00005
            offset_lon = (x1 / w) * 0.0001 - 0.00005
            pothole_lat = lat + offset_lat
            pothole_lon = lon + offset_lon

        # -------------------------
        # Economic impact
        # -------------------------
        economic_impact = calculate_economic_impact(
            area_cm2, avg_depth, severity, avg_traffic_per_day, estimated_cost
        )

        # -------------------------
        # Draw final annotations (boxes, labels)
        # -------------------------
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)

        number_text = f"#{pothole_count}"
        num_bbox = draw.textbbox((x1 + 5, y1 + 5), number_text, font=font)
        draw.rectangle([num_bbox[0] - 3, num_bbox[1] - 3, num_bbox[2] + 3, num_bbox[3] + 3], fill="blue")
        draw.text((x1 + 5, y1 + 5), number_text, fill="white", font=font)

        cost_text = f"₹{estimated_cost:.0f}"
        cost_bbox = draw.textbbox((x1, y1 - 25), cost_text, font=small_font)
        draw.rectangle([cost_bbox[0] - 3, cost_bbox[1] - 3, cost_bbox[2] + 3, cost_bbox[3] + 3], fill="black")
        draw.text((x1, y1 - 25), cost_text, fill="lime", font=small_font)

        severity_text = f"{severity}"
        sev_bbox = draw.textbbox((x1, y2 + 5), severity_text, font=small_font)
        draw.rectangle([sev_bbox[0] - 3, sev_bbox[1] - 3, sev_bbox[2] + 3, sev_bbox[3] + 3], fill=bg_color)
        draw.text((x1, y2 + 5), severity_text, fill=text_color, font=small_font)

        # Danger score
        pothole_danger = compute_pothole_danger(
            severity,
            area_cm2,
            avg_depth,
            avg_traffic_per_day,
            severity_w=severity_weight,
            area_w=area_weight,
            depth_w=depth_weight,
            traffic_w=traffic_weight
        )

        # Save scalars (no image arrays) to result_data
        result_data.append({
            "Pothole #": pothole_count,
            "Latitude": round(pothole_lat, 6) if pothole_lat else None,
            "Longitude": round(pothole_lon, 6) if pothole_lon else None,
            "Confidence": round(confidence, 3),
            "Area (cm²)": round(area_cm2, 2),
            "Perimeter (cm)": round(perimeter_cm, 2),
            "Avg Depth (cm)": round(avg_depth, 2),
            "Volume (cm³)": round(volume_cm3, 2),
            "Severity": severity,
            "Risk Level": risk_level,
            "Repair Cost (₹)": round(estimated_cost, 2),
            "Monthly Damage (₹)": round(economic_impact['monthly_damage'], 2),
            "Annual Damage (₹)": round(economic_impact['annual_damage'], 2),
            "Vehicles Affected/Month": economic_impact['vehicles_affected_monthly'],
            "ROI (%)": round(economic_impact['roi'], 1),
            "Payback (Months)": round(economic_impact['payback_months'], 1),
            "Danger Score": round(pothole_danger, 2)
        })

        # set the last-spline to return (the caller expects a single spline_img)
        if spline_local is None:
            # ensure a safe uint8 RGB
            spline_local = np.zeros((128, 128, 3), dtype=np.uint8)
        spline_img = spline_local.copy()

    # End of detection loop

    # final annotated PIL to return
    contour_img = annotated_pil

    # depth_map_colored is already uint8 RGB
    # severity_map is float map (keeps for heatmap viz)
    # depth_crops_3d contains raw arrays (useful for 3D modeling)

    return contour_img, result_data, depth_map_colored, spline_img, depth_crops_3d


# ==================== MAIN APPLICATION ====================

if analysis_mode == "Image Analysis":
    # IMAGE PROCESSING MODE
    file =  st.file_uploader(
    "Take a photo or upload an image",
    type=["jpg", "jpeg", "png"],
    accept_multiple_files=False
)

    if file is not None:
        img = Image.open(file).convert("RGB")
        gps = extract_gps(img)

        # Store location permanently for live map
        if "pothole_locations" not in st.session_state:
            st.session_state.pothole_locations = []

        if gps:
            # Add to session map storage
            st.session_state.pothole_locations.append({
                "lat": gps[0],
                "lon": gps[1],
                "severity": "Unknown",   # Updated after analysis
                "cost": 0
            })

            st.success(f"📍 Location detected automatically: {gps}")
        else:
            st.warning("⚠️ No GPS location found in this image.")


        with st.spinner("🔍 Analyzing potholes..."):
            processed_img, data, depth_viz, severity_heatmap, depth_3d_data = analyze_image(
                img.copy(),
                conf_threshold=confidence_threshold,
                pixel_ratio=pixel_to_cm,
                cost_m2=cost_per_m2,
                lat=default_lat if use_gps else None,
                lon=default_lon if use_gps else None
            )
        # Update session-state entry with severity & cost
        if gps and len(data) > 0:
            st.session_state.pothole_locations[-1]["severity"] = data[0]["Severity"]
            st.session_state.pothole_locations[-1]["cost"] = data[0]["Repair Cost (₹)"]


        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📸 Detected Potholes")
            st.image(processed_img, use_column_width=True)

        with col2:
            if show_depth_map:
                st.subheader("🌊 Depth Map")
                st.image(depth_viz, use_column_width=True)

            if show_heatmap and len(data) > 0:
                st.subheader("🔥 Severity Heatmap")
                fig = px.imshow(severity_heatmap, color_continuous_scale='RdYlGn_r')
                fig.update_layout(coloraxis_showscale=False, height=400)
                st.plotly_chart(fig, use_container_width=True)

        if len(data) > 0:
            df = pd.DataFrame(data)

            # --- aggregate danger for image / road ---
            total_danger = df['Danger Score'].sum()
            avg_danger = df['Danger Score'].mean()

            st.markdown("---")
            st.subheader("⚠️ Risk Summary")
            col_a, col_b, col_c = st.columns([1,1,2])
            with col_a:
                st.metric("Image Danger (sum)", f"{total_danger:.1f}")
            with col_b:
                st.metric("Avg Pothole Danger", f"{avg_danger:.1f}")
            with col_c:
                # advisory text
                if total_danger >= danger_threshold_high:
                    st.error("🚨 HIGH RISK: This road segment is dangerous — avoid if possible and report immediately.")
                elif total_danger >= danger_threshold_medium:
                    st.warning("⚠️ MEDIUM RISK: Consider scheduling repairs and avoid heavy vehicles.")
                else:
                    st.success("✅ LOW RISK: Monitor and report when convenient.")


            # Summary Metrics
            st.markdown("---")
            st.subheader("📊 Analysis Summary")

            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                st.metric("Total Potholes", len(data))
            with col2:
                total_repair = df['Repair Cost (₹)'].sum()
                st.metric("Repair Cost", f"₹{total_repair:,.0f}")
            with col3:
                total_annual_damage = df['Annual Damage (₹)'].sum()
                st.metric("Annual Damage", f"₹{total_annual_damage:,.0f}")
            with col4:
                severe_count = len(df[df['Severity'] == 'Severe'])
                st.metric("Severe Potholes", severe_count,
                         delta="Critical" if severe_count > 0 else "None",
                         delta_color="inverse")
            with col5:
                avg_roi = df['ROI (%)'].mean()
                st.metric("Avg ROI", f"{avg_roi:.0f}%")

            # Economic Impact Analysis
            if show_economic_impact:
                st.markdown("---")
                st.subheader("💰 Economic Impact Analysis")

                col1, col2 = st.columns(2)

                with col1:
                    total_vehicles = df['Vehicles Affected/Month'].sum()
                    avg_payback = df['Payback (Months)'].mean()

                    st.success(f"""
                    **Investment Analysis:**
                    - **One-time repair cost:** ₹{total_repair:,.0f}
                    - **Annual vehicle damage:** ₹{total_annual_damage:,.0f}
                    - **Net savings (Year 1):** ₹{(total_annual_damage - total_repair):,.0f}
                    - **ROI:** {((total_annual_damage - total_repair)/total_repair * 100):.0f}%
                    - **Average payback:** {avg_payback:.1f} months
                    """)

                with col2:
                    st.warning(f"""
                    **Public Impact (if not repaired):**
                    - **{total_vehicles:,}** vehicles damaged per month
                    - **{total_vehicles * 12:,}** vehicles per year
                    - Citizens pay **₹{avg_vehicle_repair:,}** per repair
                    - Total public burden: **₹{total_annual_damage:,.0f}/year**
                    """)

            # Growth Prediction
            if show_growth_prediction and len(df) > 0:
                st.markdown("---")
                st.subheader("📈 Growth Prediction & Future Cost Analysis")

                # Calculate environmental multiplier
                env_multiplier = calculate_environmental_multiplier(
                    rainfall_intensity, temperature_range, traffic_load
                )

                st.info(f"""
                **Environmental Factor:** {env_multiplier:.2f}x base growth rate
                - Rainfall: {rainfall_intensity}
                - Temperature: {temperature_range}
                - Traffic: {traffic_load}
                """)

                # Select pothole for detailed prediction
                pothole_options = [f"Pothole #{i+1} - {row['Severity']} ({row['Area (cm²)']:.0f}cm², ₹{row['Repair Cost (₹)']:.0f})"
                                 for i, row in df.iterrows()]

                selected_pothole = st.selectbox("Select Pothole for Detailed Analysis:", pothole_options)
                selected_idx = int(selected_pothole.split('#')[1].split(' ')[0]) - 1

                pothole_data = df.iloc[selected_idx]

                # Generate predictions
                predictions = predict_pothole_growth_advanced(
                    pothole_data['Area (cm²)'],
                    pothole_data['Avg Depth (cm)'],
                    pothole_data['Severity'],
                    env_multiplier,
                    pothole_data['Perimeter (cm)']
                )

                col1, col2 = st.columns([2, 1])

                with col1:
                    growth_fig = create_growth_chart_advanced(
                        predictions,
                        pothole_data['Repair Cost (₹)'],
                        cost_per_m2
                    )
                    st.plotly_chart(growth_fig, use_container_width=True)

                with col2:
                    st.markdown("**Cost Escalation:**")
                    for pred in predictions[1:]:
                        # Use realistic linear monthly growth
                        monthly_growth_rate = 0.04   # 4% per month
                        future_cost = pothole_data['Repair Cost (₹)'] * (1 + monthly_growth_rate * pred['month'])

                        increase = ((future_cost / pothole_data['Repair Cost (₹)']) - 1) * 100
                        st.metric(
                            f"{pred['label']}",
                            f"₹{future_cost:.0f}",
                            delta=f"+{increase:.0f}%",
                            delta_color="inverse"
                        )

                # ROI Comparison
                economic_data = calculate_economic_impact(
                    pothole_data['Area (cm²)'],
                    pothole_data['Avg Depth (cm)'],
                    pothole_data['Severity'],
                    avg_traffic_per_day,
                    pothole_data['Repair Cost (₹)']
                )

                roi_fig = create_roi_comparison_chart(
                    pothole_data['Repair Cost (₹)'],
                    economic_data,
                    predictions,
                    cost_per_m2
                )
                st.plotly_chart(roi_fig, use_container_width=True)

                # Future cost table
                st.markdown("**Detailed Growth Forecast:**")
                forecast_df = pd.DataFrame([{
                    'Timeline': p['label'],
                    'Area (cm²)': round(p['area'], 1),
                    'Depth (cm)': round(p['depth'], 1),
                    'Repair Cost (₹)': round((p['area']/10000)*cost_per_m2, 0),
                    'Growth Rate (%)': round(p['growth_rate'], 1)
                } for p in predictions])
                st.dataframe(forecast_df, use_container_width=True)

            # Priority Ranking
            st.markdown("---")
            st.subheader(f"🚨 Priority Repairs (by {prioritize_by})")

            if prioritize_by == "ROI":
                priority_df = df.sort_values("ROI (%)", ascending=False).head(5)
            elif prioritize_by == "Cost":
                priority_df = df.sort_values("Repair Cost (₹)", ascending=False).head(5)
            elif prioritize_by == "Severity":
                severity_order = {"Severe": 3, "Moderate": 2, "Low": 1}
                df['Sev_Score'] = df['Severity'].map(severity_order)
                priority_df = df.sort_values("Sev_Score", ascending=False).head(5)
            elif prioritize_by == "Area":
                priority_df = df.sort_values("Area (cm²)", ascending=False).head(5)
            else:  # Growth Rate
                # Calculate growth rate for each pothole
                growth_rates = []
                env_multiplier = calculate_environmental_multiplier(
                    rainfall_intensity, temperature_range, traffic_load
                )
                for _, row in df.iterrows():
                    preds = predict_pothole_growth_advanced(
                        row['Area (cm²)'], row['Avg Depth (cm)'],
                        row['Severity'], env_multiplier
                    )
                    # Use 3-month growth rate
                    growth_rate = preds[3]['growth_rate'] if len(preds) > 3 else 0
                    growth_rates.append(growth_rate)
                df['Growth Rate (%)'] = growth_rates
                priority_df = df.sort_values("Growth Rate (%)", ascending=False).head(5)

            st.dataframe(priority_df[['Pothole #', 'Severity', 'Area (cm²)', 'Repair Cost (₹)',
                                      'ROI (%)', 'Payback (Months)']], use_container_width=True)

            # -------------------------
            # 🗺️ LIVE POTHOLE MAP
            # -------------------------
            st.markdown("---")
            st.subheader("🗺️ Live Pothole Map")

            if FOLIUM_AVAILABLE:
                m = folium.Map(location=[default_lat, default_lon], zoom_start=13)

                for p in st.session_state.pothole_locations:
                    color = {
                        "Severe": "red",
                        "Moderate": "orange",
                        "Low": "green"
                    }.get(p["severity"], "blue")

                    folium.CircleMarker(
                        location=[p["lat"], p["lon"]],
                        radius=10,
                        popup=f"Severity: {p['severity']}<br>Cost: ₹{p['cost']}",
                        color=color,
                        fill=True,
                        fillColor=color
                    ).add_to(m)

                folium_static(m)
            else:
                st.info("🌍 Install `folium` to enable mapping: pip install folium streamlit-folium")


            # 3D Models
            if show_3d_model and len(depth_3d_data) > 0:
                st.markdown("---")
                st.subheader("🎬 3D Pothole Visualization")

                selected_3d = st.selectbox("Choose Pothole for 3D Model:",
                    [f"Pothole #{d['pothole_num']} - {d['area']:.1f}cm², {d['depth']:.1f}cm"
                     for d in depth_3d_data])
                selected_3d_idx = int(selected_3d.split('#')[1].split(' ')[0]) - 1

                if selected_3d_idx < len(depth_3d_data):
                    fig_3d = create_3d_pothole_model(
                        depth_3d_data[selected_3d_idx]['depth_data'],
                        depth_3d_data[selected_3d_idx]['area'],
                        depth_3d_data[selected_3d_idx]['depth']
                    )
                    if fig_3d:
                        st.plotly_chart(fig_3d, use_container_width=True)

            # GPS Map
            if use_gps and FOLIUM_AVAILABLE:
                st.markdown("---")
                st.subheader("🗺️ GPS Location Map")

                m = folium.Map(location=[default_lat, default_lon], zoom_start=15)

                for _, row in df.iterrows():
                    if row['Latitude'] and row['Longitude']:
                        color = {'Severe': 'red', 'Moderate': 'orange', 'Low': 'green'}.get(row['Severity'], 'gray')
                        folium.CircleMarker(
                            location=[row['Latitude'], row['Longitude']],
                            radius=10,
                            popup=f"Pothole #{row['Pothole #']}<br>Severity: {row['Severity']}<br>Cost: ₹{row['Repair Cost (₹)']:.0f}",
                            color=color,
                            fill=True,
                            fillColor=color
                        ).add_to(m)

                folium_static(m)

           # Complete Data
            st.markdown("---")
            st.subheader("📋 Complete Analysis Data")

            # Remove image columns before displaying or converting to CSV
            safe_df = df.drop(columns=["Contour Image", "Depth Map", "Spline Map"], errors="ignore")

            # Show clean table
            st.dataframe(safe_df, use_container_width=True)

            # Download cleaned CSV (not the original df with images)
            csv = safe_df.to_csv(index=False)

            st.download_button(
                "📥 Download Complete Report (CSV)",
                csv,
                f"pothole_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                "text/csv"
            )

else:
    # VIDEO PROCESSING MODE
    st.subheader("🎬 Video Analysis")
    video_file = st.file_uploader("📁 Upload Road Video", type=["mp4", "avi", "mov"])


    if video_file is not None:
        st.video(video_file)

        if st.button("🎬 Process Video", type="primary"):

            # Save temp video
            tmp_video = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
            tmp_video.write(video_file.read())
            tmp_video.flush()

            cap = cv2.VideoCapture(tmp_video.name)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            fps = int(cap.get(cv2.CAP_PROP_FPS) or 25)

            st.info(f"📹 Video: {frame_count} frames @ {fps} FPS | Processing every {frame_skip} frames")

            # Layout containers
            col_left, col_right = st.columns([2, 1])
            stframe = col_left.empty()      # annotated video stream
            depth_frame = col_right.empty() # thumbnails for contour/depth/spline

            progress_bar = st.progress(0)
            status_text = st.empty()
            map_placeholder = st.empty()

            # Tracking lists
            all_results = []
            pothole_map_data = []
            tracked_potholes = []
            next_track_id = 1
            frame_idx = 0
            # Store all pothole images for final gallery
            pothole_gallery = []


            # -------------------------------
            # Helper: IoU for tracking
            # -------------------------------
            def iou(boxA, boxB):
                xA = max(boxA[0], boxB[0])
                yA = max(boxA[1], boxB[1])
                xB = min(boxA[2], boxB[2])
                yB = min(boxA[3], boxB[3])
                interW = max(0, xB - xA)
                interH = max(0, yB - yA)
                interArea = interW * interH
                areaA = max(1, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
                areaB = max(1, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))
                return interArea / (areaA + areaB - interArea + 1e-9)

            # ===============================
            # MAIN FRAME LOOP
            # ===============================
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % frame_skip == 0:

                    # Convert for YOLO
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_frame = Image.fromarray(frame_rgb)

                    # ------------------------
                    # YOLO DETECTION
                    # ------------------------
                    results = yolo_model(pil_frame, conf=confidence_threshold)

                    try:
                        annotated_rgb = results[0].plot()
                        annotated_bgr = cv2.cvtColor(annotated_rgb, cv2.COLOR_RGB2BGR)
                    except:
                        annotated_bgr = frame

                    # Display annotated frame
                    stframe.image(annotated_bgr, channels="BGR")

                    # ------------------------
                    # DEPTH MAP (MIDAS)
                    # ------------------------
                    try:
                        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
                        t_in = midas_transform(pil_frame).unsqueeze(0).to(device)
                        with torch.no_grad():
                            pred = midas(t_in)

                        depth_map = torch.nn.functional.interpolate(
                            pred.unsqueeze(1),
                            size=(frame.shape[0], frame.shape[1]),
                            mode="bicubic",
                            align_corners=False
                        ).squeeze().cpu().numpy()

                        depth_color = cv2.normalize(depth_map, None, 0, 255, cv2.NORM_MINMAX)
                        depth_color = cv2.applyColorMap(depth_color.astype(np.uint8), cv2.COLORMAP_MAGMA)
                    except:
                        depth_map = np.zeros((frame.shape[0], frame.shape[1]))
                        depth_color = np.zeros_like(frame)

                    # ------------------------
                    # GET DETECTIONS
                    # ------------------------
                    current_detections = []
                    try:
                        for bbox in results[0].boxes:
                            xyxy = bbox.xyxy[0].cpu().numpy()
                            conf = float(bbox.conf[0])
                            current_detections.append((
                                int(xyxy[0]),
                                int(xyxy[1]),
                                int(xyxy[2]),
                                int(xyxy[3]),
                                conf
                            ))
                    except:
                        current_detections = []

                    # ------------------------
                    # TRACK UNIQUE POTHOLES
                    # ------------------------
                    for (x1, y1, x2, y2, conf) in current_detections:
                        bb = [x1, y1, x2, y2]
                        matched = False

                        for t in tracked_potholes:
                            if iou(bb, t["bbox"]) > 0.45:
                                t["last_seen"] = frame_idx
                                matched = True
                                break

                        # ------------------------
                        # NEW POTHOLE FOUND
                        # Run FULL analyze_image() like IMAGES
                        # ------------------------
                        if not matched:
                            crop = frame[y1:y2, x1:x2]
                            if crop.size == 0:
                                continue

                            crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
                            crop_pil = Image.fromarray(crop_rgb)

                            # FULL ANALYSIS (CONTOURS, DEPTH, SPLINE, COST, ROI, DAMAGE…)
                            (
                                contour_img,
                                poth_data_list,
                                depth_img,
                                spline_img,
                                _extra
                            ) = analyze_image(
                                crop_pil,
                                conf_threshold=confidence_threshold,
                                pixel_ratio=pixel_to_cm,
                                cost_m2=cost_per_m2
                            )

                            if len(poth_data_list) == 0:
                                continue

                            poth = poth_data_list[0]
                            poth["Pothole #"] = next_track_id
                            poth["Frame"] = frame_idx
                            poth["Time (s)"] = round(frame_idx / fps, 2)

                            # Attach visual outputs
                            poth["Contour Image"] = contour_img
                            poth["Depth Map"] = depth_img
                            poth["Spline Map"] = spline_img
                            # Save for gallery
                            pothole_gallery.append({
                            "id": poth["Pothole #"],
                            "contour": contour_img,
                            "depth": depth_img,
                            "spline": normalize_spline_image(spline_img)
                        })

                            # Save
                            all_results.append(poth)
                            pothole_map_data.append({
                                "pothole_num": next_track_id,
                                "frame": frame_idx,
                                "severity": poth["Severity"],
                                "cost": poth["Repair Cost (₹)"],
                                "area": poth["Area (cm²)"]
                            })

                            tracked_potholes.append({
                                "id": next_track_id,
                                "bbox": bb,
                                "last_seen": frame_idx
                            })

                            next_track_id += 1

                            # Show thumbnails
                            with depth_frame.container():
                                t1, t2, t3 = st.columns(3)
                                t1.image(contour_img, caption=f"Contour #{poth['Pothole #']}")
                                t2.image(depth_img, caption="Depth Map")
                                # ---- FIX SPLINE IMAGE BEFORE DISPLAY ----
                                try:
                                    spline_safe = spline_img

                                    # Convert lists to numpy
                                    if isinstance(spline_safe, list):
                                        spline_safe = np.array(spline_safe)

                                    # Remove NaN / inf
                                    spline_safe = np.nan_to_num(spline_safe, nan=0.0, posinf=0.0, neginf=0.0)

                                    # If float, normalize to 0–255
                                    if spline_safe.dtype != np.uint8:
                                        spline_safe = spline_safe.astype(np.float32)
                                        spline_safe = spline_safe - spline_safe.min()
                                        if spline_safe.max() > 0:
                                            spline_safe = spline_safe / spline_safe.max()
                                        spline_safe = (spline_safe * 255).astype(np.uint8)

                                    # Convert grayscale to RGB for Streamlit
                                    if len(spline_safe.shape) == 2:
                                        spline_safe = cv2.cvtColor(spline_safe, cv2.COLOR_GRAY2RGB)

                                    t3.image(spline_safe, caption="Spline Surface")

                                except Exception as e:
                                    t3.error(f"Spline image failed: {e}")


                    # Remove old potholes not seen for a while
                    max_inactive = max(1, fps * 5 // max(1, frame_skip))
                    tracked_potholes = [
                        t for t in tracked_potholes if (frame_idx - t["last_seen"]) <= max_inactive
                    ]

                    # Update live mini route map
                    if pothole_map_data:
                        with map_placeholder.container():
                            rfig = create_route_map(pothole_map_data, assumed_speed, fps)
                            if rfig:
                                st.plotly_chart(rfig, use_container_width=True, key=f"map_live_{frame_idx}")


                # Update UI
                frame_idx += 1
                progress_bar.progress(frame_idx / max(1, frame_count))
                status_text.text(f"Processing frame {frame_idx}/{frame_count} | Potholes: {len(all_results)}")

            # Cleanup
            cap.release()
            os.unlink(tmp_video.name)

            st.success("✔ Video Processing Complete!")

            # ===============================
            # SHOW GALLERY OF ALL POTHOLES
            # ===============================
            if pothole_gallery:
                st.subheader("🖼️ All Potholes Detected (Gallery)")

                for item in pothole_gallery:
                    st.markdown(f"### Pothole #{item['id']}")

                    g1, g2, g3 = st.columns(3)
                    g1.image(item["contour"], caption="Contour Image")
                    g2.image(item["depth"], caption="Depth Map")
                    g3.image(item["spline"], caption="Spline Surface")

                    st.markdown("---")


            # ===============================
            # FINAL SUMMARY
            # ===============================
            if all_results:
                df = pd.DataFrame(all_results)

                st.subheader("📊 Video Analysis Summary")
                col1, col2, col3, col4, col5 = st.columns(5)

                with col1:
                    st.metric("Total Potholes", len(df))
                with col2:
                    road_len = (frame_count / fps) * (assumed_speed / 3.6)
                    st.metric("Road Length", f"{road_len:.1f}m")
                with col3:
                    total_cost = df['Repair Cost (₹)'].sum()
                    st.metric("Repair Cost", f"₹{total_cost:,.0f}")
                with col4:
                    severe = len(df[df["Severity"] == "Severe"])
                    st.metric("Severe", severe)
                with col5:
                    density = len(df) / (road_len / 1000) if road_len else 0
                    st.metric("Density", f"{density:.1f}/km")

                st.markdown("---")
                st.subheader("🗺️ Final Route Map")
                rfig = create_route_map(pothole_map_data, assumed_speed, fps)
                if rfig: st.plotly_chart(rfig, use_container_width=True, key="map_final")

                st.markdown("---")

                st.subheader("📈 Severity Timeline")
                tfig = create_severity_timeline(pothole_map_data, fps)
                if tfig: st.plotly_chart(tfig, use_container_width=True, key="timeline_final")


                # Economic analysis
                if show_economic_impact:
                    st.subheader("💰 Economic Impact Summary")
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Total Repair Cost", f"₹{total_cost:,.0f}")
                    col2.metric("Annual Damage", f"₹{df['Annual Damage (₹)'].sum():,.0f}")
                    col3.metric("Average ROI", f"{df['ROI (%)'].mean():.1f}%")

                st.subheader("📋 All Detected Potholes")
                # REMOVE IMAGE COLUMNS
                safe_df = df.drop(columns=["Contour Image", "Depth Map", "Spline Map"], errors="ignore")

                st.dataframe(safe_df, use_container_width=True)

                # CSV export of cleaned data
                csv = safe_df.to_csv(index=False)
                st.download_button(
                    "📥 Download Video Analysis CSV",
                    csv,
                    f"video_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                    "text/csv"
                )

            else:
                st.warning("⚠ No potholes detected in video!")

st.markdown("---")
st.markdown("""
<p style='text-align: center; color: gray;'>
🤖 Powered by YOLOv11 & MiDaS | Advanced Growth Prediction with Environmental Factors<br>
💡 Integrated System: Detection + 3D Modeling + Economic Analysis + GPS Mapping
</p>
""", unsafe_allow_html=True)
