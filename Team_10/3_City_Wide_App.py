import streamlit as st
import pandas as pd
import folium
from streamlit_folium import folium_static
from xml.etree import ElementTree as ET
import requests
import math

st.set_page_config(page_title="Bengaluru Pothole Map", page_icon="🗺️", layout="wide")
st.title("🗺️ Bengaluru City-Wide Pothole Map (BBMP Data)")

# ============================================================================
# WORKING KML PARSER FOR YOUR BBMP FILE
# ============================================================================

def parse_bbmp_kml(file_path):
    """
    Parse BBMP pothole KML file with ExtendedData structure
    """
    
    tree = ET.parse(file_path)
    root = tree.getroot()
    
    # Define namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    potholes = []
    
    # Find all Placemark elements
    for placemark in root.findall('.//kml:Placemark', ns):
        pothole_data = {}
        
        # Extract coordinates
        coords_elem = placemark.find('.//kml:coordinates', ns)
        if coords_elem is not None:
            coords_text = coords_elem.text.strip()
            try:
                lon, lat, *_ = coords_text.split(',')
                pothole_data['Longitude'] = float(lon)
                pothole_data['Latitude'] = float(lat)
            except:
                continue  # Skip if coordinates are invalid
        
        # Extract ExtendedData (all the BBMP fields)
        extended_data = placemark.find('.//kml:ExtendedData', ns)
        if extended_data is not None:
            for simple_data in extended_data.findall('.//kml:SimpleData', ns):
                field_name = simple_data.get('name')
                field_value = simple_data.text
                pothole_data[field_name] = field_value
        
        potholes.append(pothole_data)
    
    return pd.DataFrame(potholes)


# ============================================================================
# ROUTE ANALYSIS FUNCTIONS
# ============================================================================

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters"""
    R = 6371000  # Earth radius in meters
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def get_osrm_routes(start_lat, start_lon, end_lat, end_lon, num_alternatives=3):
    """
    Get multiple route options using OSRM (Open Source Routing Machine)
    """
    
    try:
        # OSRM API endpoint (public demo server)
        url = f"http://router.project-osrm.org/route/v1/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
        
        params = {
            'alternatives': num_alternatives,
            'steps': 'true',
            'geometries': 'geojson',
            'overview': 'full'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if data['code'] == 'Ok':
                routes = []
                
                for route in data['routes']:
                    route_info = {
                        'geometry': route['geometry']['coordinates'],
                        'distance_km': route['distance'] / 1000,
                        'duration_min': route['duration'] / 60,
                        'steps': route.get('legs', [{}])[0].get('steps', [])
                    }
                    routes.append(route_info)
                
                return routes
        
        return None
    
    except Exception as e:
        st.warning(f"⚠️ Routing service error: {str(e)}")
        return None


def count_potholes_near_route(route_coords, potholes_df, buffer_meters=50):
    """
    Count potholes within buffer distance of route
    """
    
    pothole_count = 0
    severe_count = 0
    total_cost = 0
    
    potholes_on_route = []
    
    for _, pothole in potholes_df.iterrows():
        pot_lat = pothole['Latitude']
        pot_lon = pothole['Longitude']
        
        # Check distance to any point on route
        min_distance = float('inf')
        
        for coord in route_coords:
            route_lon, route_lat = coord
            distance = haversine_distance(pot_lat, pot_lon, route_lat, route_lon)
            
            if distance < min_distance:
                min_distance = distance
        
        # If pothole is within buffer
        if min_distance <= buffer_meters:
            pothole_count += 1
            
            if pothole.get('Color_code') == 'Red' or pothole.get('Status') == 'Rejected':
                severe_count += 1
            
            cost = pothole.get('Total_Esti', 0)
            if pd.notna(cost):
                total_cost += float(cost)
            
            potholes_on_route.append({
                'lat': pot_lat,
                'lon': pot_lon,
                'distance': min_distance,
                'status': pothole.get('Status', 'Unknown'),
                'ward': pothole.get('Ward_Name', 'Unknown')
            })
    
    return {
        'count': pothole_count,
        'severe': severe_count,
        'total_cost': total_cost,
        'potholes': potholes_on_route
    }


def calculate_route_safety_score(route_analysis):
    """
    Calculate safety score (0-100) based on pothole density
    100 = safest, 0 = most dangerous
    """
    
    pothole_count = route_analysis['count']
    severe_count = route_analysis['severe']
    
    # Base score
    score = 100
    
    # Deduct points for potholes
    score -= pothole_count * 2  # -2 points per pothole
    score -= severe_count * 5   # -5 extra points for severe/critical
    
    # Ensure score stays in range
    score = max(0, min(100, score))
    
    return round(score, 1)


def geocode_location(location_name):
    """
    Convert location name to coordinates using Nominatim
    """
    
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': f"{location_name}, Bengaluru, Karnataka, India",
            'format': 'json',
            'limit': 1
        }
        
        headers = {'User-Agent': 'BengaluruPotholeApp/1.0'}
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon']), data[0]['display_name']
        
        return None, None, None
    
    except Exception as e:
        st.error(f"Geocoding error: {str(e)}")
        return None, None, None


# ============================================================================
# LOAD DATA
# ============================================================================

FILE_PATH = "bbm_fms_potholes.kml"

try:
    with st.spinner("📂 Loading BBMP KML data..."):
        df = parse_bbmp_kml(FILE_PATH)
    
    st.success(f"✅ Successfully loaded {len(df)} pothole records!")
    
except FileNotFoundError:
    st.error("❌ KML file not found. Please check the file path.")
    st.stop()
except Exception as e:
    st.error(f"❌ Error loading KML: {str(e)}")
    st.stop()

# ============================================================================
# DATA CLEANING & PREPROCESSING
# ============================================================================

# Drop rows without coordinates
df = df.dropna(subset=['Latitude', 'Longitude'])

# Convert to numeric
df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')

# Convert numeric fields
numeric_fields = ['Length__in', 'Width__in', 'Area__in_s', 'Total_Esti']
for field in numeric_fields:
    if field in df.columns:
        df[field] = pd.to_numeric(df[field], errors='coerce')

# Parse dates
if 'Open_Date' in df.columns:
    df['Open_Date'] = pd.to_datetime(df['Open_Date'], format='%d/%m/%Y', errors='coerce')

# ============================================================================
# ROUTE PLANNING SECTION (NEW!)
# ============================================================================

st.markdown("---")
st.subheader("🚗 Smart Route Planner - Avoid Potholes!")

st.info("""
**Find the safest route between two locations in Bengaluru**  
The system analyzes all available routes and recommends the one with fewest potholes.
""")

col1, col2 = st.columns(2)

with col1:
    source = st.text_input(
        "📍 Source Location",
        placeholder="e.g., Koramangala, MG Road, Indiranagar",
        help="Enter starting point (area name, landmark, or address)"
    )

with col2:
    destination = st.text_input(
        "🎯 Destination Location",
        placeholder="e.g., HSR Layout, Whitefield, Electronic City",
        help="Enter destination (area name, landmark, or address)"
    )

buffer_distance = st.slider(
    "🔍 Pothole Detection Range (meters)",
    min_value=25,
    max_value=200,
    value=50,
    step=25,
    help="Distance from route to check for potholes"
)

if st.button("🗺️ Find Safest Route", type="primary"):
    
    if not source or not destination:
        st.warning("⚠️ Please enter both source and destination")
    else:
        with st.spinner("🔍 Geocoding locations..."):
            # Geocode source
            src_lat, src_lon, src_name = geocode_location(source)
            
            if src_lat is None:
                st.error(f"❌ Could not find location: {source}")
                st.stop()
            
            # Geocode destination
            dst_lat, dst_lon, dst_name = geocode_location(destination)
            
            if dst_lat is None:
                st.error(f"❌ Could not find location: {destination}")
                st.stop()
            
            st.success(f"✅ Source: {src_name}")
            st.success(f"✅ Destination: {dst_name}")
        
        with st.spinner("🛣️ Analyzing routes and pothole density..."):
            # Get multiple route options
            routes = get_osrm_routes(src_lat, src_lon, dst_lat, dst_lon, num_alternatives=3)
            
            if routes is None or len(routes) == 0:
                st.error("❌ Could not find routes. Please try different locations.")
                st.stop()
            
            # Analyze each route for potholes
            route_analyses = []
            
            for idx, route in enumerate(routes):
                analysis = count_potholes_near_route(
                    route['geometry'],
                    df,
                    buffer_meters=buffer_distance
                )
                
                analysis['route_id'] = idx + 1
                analysis['distance_km'] = route['distance_km']
                analysis['duration_min'] = route['duration_min']
                analysis['geometry'] = route['geometry']
                analysis['safety_score'] = calculate_route_safety_score(analysis)
                
                route_analyses.append(analysis)
            
            # Sort by safety score (highest first)
            route_analyses.sort(key=lambda x: x['safety_score'], reverse=True)
            
            # Display results
            st.markdown("---")
            st.subheader("📊 Route Analysis Results")
            
            # Summary comparison
            comparison_data = []
            for analysis in route_analyses:
                comparison_data.append({
                    'Route': f"Route {analysis['route_id']}",
                    'Distance (km)': round(analysis['distance_km'], 2),
                    'Time (min)': round(analysis['duration_min'], 0),
                    'Potholes': analysis['count'],
                    'Critical': analysis['severe'],
                    'Safety Score': analysis['safety_score']
                })
            
            comparison_df = pd.DataFrame(comparison_data)
            st.dataframe(comparison_df, use_container_width=True)
            
            # Recommend best route
            best_route = route_analyses[0]
            
            st.markdown("---")
            st.subheader("✅ Recommended Route")
            
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Route", f"Route {best_route['route_id']}")
            with col2:
                st.metric("Distance", f"{best_route['distance_km']:.1f} km")
            with col3:
                st.metric("Time", f"{best_route['duration_min']:.0f} min")
            with col4:
                safety_color = "🟢" if best_route['safety_score'] > 70 else "🟡" if best_route['safety_score'] > 40 else "🔴"
                st.metric("Safety", f"{safety_color} {best_route['safety_score']}/100")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.success(f"""
                **Why this route is recommended:**
                - Only {best_route['count']} potholes detected
                - {best_route['severe']} critical/severe potholes
                - Best safety-to-time ratio
                """)
            
            with col2:
                if len(route_analyses) > 1:
                    worst_route = route_analyses[-1]
                    potholes_avoided = worst_route['count'] - best_route['count']
                    time_diff = best_route['duration_min'] - worst_route['duration_min']
                    
                    st.info(f"""
                    **Compared to worst route:**
                    - Avoid {potholes_avoided} potholes
                    - Time difference: {abs(time_diff):.0f} min {"slower" if time_diff > 0 else "faster"}
                    """)
            
            # Create map with all routes
            st.markdown("---")
            st.subheader("🗺️ Route Comparison Map")
            
            # Create map centered between source and destination
            center_lat = (src_lat + dst_lat) / 2
            center_lon = (src_lon + dst_lon) / 2
            
            route_map = folium.Map(location=[center_lat, center_lon], zoom_start=12)
            
            # Add source marker
            folium.Marker(
                [src_lat, src_lon],
                popup="📍 Start",
                icon=folium.Icon(color='green', icon='play', prefix='fa'),
                tooltip="Source"
            ).add_to(route_map)
            
            # Add destination marker
            folium.Marker(
                [dst_lat, dst_lon],
                popup="🎯 Destination",
                icon=folium.Icon(color='red', icon='flag-checkered', prefix='fa'),
                tooltip="Destination"
            ).add_to(route_map)
            
            # Add all routes with different colors
            for idx, analysis in enumerate(route_analyses):
                # Determine color based on ranking
                if idx == 0:
                    color = 'green'
                    weight = 5
                    opacity = 0.8
                elif idx == 1:
                    color = 'blue'
                    weight = 4
                    opacity = 0.6
                else:
                    color = 'red'
                    weight = 3
                    opacity = 0.4
                
                # Convert route geometry to lat/lon format
                route_coords = [[coord[1], coord[0]] for coord in analysis['geometry']]
                
                folium.PolyLine(
                    route_coords,
                    color=color,
                    weight=weight,
                    opacity=opacity,
                    popup=f"Route {analysis['route_id']}: {analysis['count']} potholes, Safety: {analysis['safety_score']}/100",
                    tooltip=f"Route {analysis['route_id']}"
                ).add_to(route_map)
                
                # Add potholes along this route
                if idx == 0:  # Only show potholes for recommended route
                    for pothole in analysis['potholes'][:20]:  # Limit to 20 for performance
                        folium.CircleMarker(
                            location=[pothole['lat'], pothole['lon']],
                            radius=4,
                            color='red',
                            fill=True,
                            fillColor='red',
                            fillOpacity=0.6,
                            popup=f"Pothole - {pothole['ward']}<br>Status: {pothole['status']}",
                            tooltip="Pothole on route"
                        ).add_to(route_map)
            
            # Add legend
            legend_html = '''
            <div style="position: fixed; 
                        bottom: 50px; right: 50px; 
                        background-color: white; 
                        border: 2px solid grey; 
                        z-index:9999; 
                        font-size:14px;
                        padding: 10px;
                        border-radius: 5px;">
            <b>Legend:</b><br>
            <i style="background:green;width:20px;height:3px;display:inline-block;"></i> Best Route (Recommended)<br>
            <i style="background:blue;width:20px;height:3px;display:inline-block;"></i> Alternative Route<br>
            <i style="background:red;width:20px;height:3px;display:inline-block;"></i> Risky Route<br>
            <i class="fa fa-circle" style="color:red"></i> Potholes<br>
            </div>
            '''
            route_map.get_root().html.add_child(folium.Element(legend_html))
            
            folium_static(route_map, width=1200, height=600)
            
            # Detailed pothole list on recommended route
            if best_route['potholes']:
                with st.expander(f"📋 View all {len(best_route['potholes'])} potholes on recommended route"):
                    potholes_detail = pd.DataFrame(best_route['potholes'])
                    potholes_detail['distance'] = potholes_detail['distance'].round(1)
                    st.dataframe(potholes_detail, use_container_width=True)

# ============================================================================
# SIDEBAR FILTERS
# ============================================================================

st.sidebar.markdown("---")
st.sidebar.header("🔍 Filter Options")

# Zone filter
if 'Zone' in df.columns:
    zones = ['All'] + sorted(df['Zone'].dropna().unique().tolist())
    selected_zone = st.sidebar.selectbox("Select Zone", zones)
    
    if selected_zone != 'All':
        df = df[df['Zone'] == selected_zone]

# Status filter
if 'Status' in df.columns:
    statuses = ['All'] + sorted(df['Status'].dropna().unique().tolist())
    selected_status = st.sidebar.selectbox("Select Status", statuses)
    
    if selected_status != 'All':
        df = df[df['Status'] == selected_status]

# Ward filter
if 'Ward_Name' in df.columns:
    wards = ['All'] + sorted(df['Ward_Name'].dropna().unique().tolist())
    selected_ward = st.sidebar.selectbox("Select Ward", wards, 
                                         help="Filter by specific ward")
    
    if selected_ward != 'All':
        df = df[df['Ward_Name'] == selected_ward]

# Color code filter
if 'Color_code' in df.columns:
    colors = ['All'] + sorted(df['Color_code'].dropna().unique().tolist())
    selected_color = st.sidebar.selectbox("Select Priority", colors)
    
    if selected_color != 'All':
        df = df[df['Color_code'] == selected_color]

st.sidebar.markdown("---")
st.sidebar.info(f"📊 Showing {len(df)} potholes")

# ============================================================================
# SUMMARY STATISTICS
# ============================================================================

st.markdown("---")
st.subheader("📊 Summary Statistics")

col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.metric("Total Potholes", len(df))

with col2:
    if 'Status' in df.columns:
        scheduled = len(df[df['Status'] == 'Scheduled'])
        st.metric("Scheduled", scheduled)

with col3:
    if 'Status' in df.columns:
        completed = len(df[df['Status'].str.contains('Complete|Done', case=False, na=False)])
        st.metric("Completed", completed)

with col4:
    if 'Total_Esti' in df.columns:
        total_cost = df['Total_Esti'].sum()
        st.metric("Total Cost", f"₹{total_cost:,.0f}")

with col5:
    if 'Area__in_s' in df.columns:
        total_area = df['Area__in_s'].sum()
        st.metric("Total Area", f"{total_area:.1f} m²")

# ============================================================================
# CREATE MAP
# ============================================================================

st.markdown("---")
st.subheader("🗺️ Interactive Pothole Map")

# Calculate map center
center_lat = df['Latitude'].mean()
center_lon = df['Longitude'].mean()

# Create folium map
m = folium.Map(
    location=[center_lat, center_lon],
    zoom_start=12,
    tiles='OpenStreetMap'
)

# Color mapping based on Color_code
color_map = {
    'Red': 'red',
    'Amber': 'orange',
    'Green': 'green',
    'Yellow': 'yellow'
}

# Add markers
for idx, row in df.iterrows():
    # Determine marker color
    marker_color = 'gray'
    if 'Color_code' in row and pd.notna(row['Color_code']):
        marker_color = color_map.get(row['Color_code'], 'gray')
    
    # Create popup text
    popup_html = f"""
    <div style="width: 300px;">
        <h4 style="color: {marker_color};">🚧 {row.get('Ward_Name', 'Unknown Ward')}</h4>
        <b>Request ID:</b> {row.get('Request_Id', 'N/A')}<br>
        <b>Status:</b> {row.get('Status', 'Unknown')}<br>
        <b>Zone:</b> {row.get('Zone', 'N/A')}<br>
        <b>Open Date:</b> {row.get('Open_Date', 'N/A')}<br>
        <hr>
        <b>Problem:</b><br>
        {row.get('Problem_De', 'No description')[:200]}...<br>
        <hr>
        <b>Dimensions:</b><br>
        Length: {row.get('Length__in', 0)} m<br>
        Width: {row.get('Width__in', 0)} m<br>
        Area: {row.get('Area__in_s', 0)} m²<br>
        <b>Estimated Cost:</b> ₹{row.get('Total_Esti', 0):,.0f}<br>
        <hr>
        <b>Assigned to:</b> {row.get('Assigned_T', 'Not assigned')}<br>
        <b>Work Type:</b> {row.get('Type_of_Wo', 'N/A')}
    </div>
    """
    
    # Add marker
    folium.CircleMarker(
        location=[row['Latitude'], row['Longitude']],
        radius=7,
        color=marker_color,
        fill=True,
        fillColor=marker_color,
        fillOpacity=0.7,
        popup=folium.Popup(popup_html, max_width=300),
        tooltip=f"{row.get('Ward_Name', 'Unknown')} - {row.get('Status', 'Unknown')}"
    ).add_to(m)

# Display map
folium_static(m, width=1200, height=600)

# ============================================================================
# DETAILED DATA TABLE
# ============================================================================

st.markdown("---")
st.subheader("📋 Detailed Pothole Records")

# Select columns to display
display_cols = ['Ward_Name', 'Status', 'Open_Date', 'Problem_De', 
                'Length__in', 'Width__in', 'Area__in_s', 'Total_Esti', 
                'Color_code', 'Zone']

# Filter columns that exist
display_cols = [col for col in display_cols if col in df.columns]

st.dataframe(df[display_cols], use_container_width=True)

# ============================================================================
# DOWNLOAD FILTERED DATA
# ============================================================================

csv = df.to_csv(index=False)
st.download_button(
    "📥 Download Filtered Data (CSV)",
    csv,
    f"bbmp_potholes_filtered.csv",
    "text/csv",
    key='download-csv'
)

# ============================================================================
# ANALYTICS SECTION
# ============================================================================

st.markdown("---")
st.subheader("📈 Analytics")

tab1, tab2, tab3 = st.tabs(["Status Distribution", "Ward Analysis", "Timeline"])

with tab1:
    if 'Status' in df.columns:
        status_counts = df['Status'].value_counts()
        
        import plotly.express as px
        fig = px.bar(
            x=status_counts.index,
            y=status_counts.values,
            title="Pothole Status Distribution",
            labels={'x': 'Status', 'y': 'Count'},
            color=status_counts.values,
            color_continuous_scale='Reds'
        )
        st.plotly_chart(fig, use_container_width=True)

with tab2:
    if 'Ward_Name' in df.columns:
        ward_counts = df['Ward_Name'].value_counts().head(15)
        
        fig = px.bar(
            x=ward_counts.values,
            y=ward_counts.index,
            orientation='h',
            title="Top 15 Wards by Pothole Count",
            labels={'x': 'Number of Potholes', 'y': 'Ward'},
            color=ward_counts.values,
            color_continuous_scale='Oranges'
        )
        st.plotly_chart(fig, use_container_width=True)

with tab3:
    if 'Open_Date' in df.columns:
        df_timeline = df.dropna(subset=['Open_Date'])
        df_timeline['Month'] = df_timeline['Open_Date'].dt.to_period('M').astype(str)
        timeline_counts = df_timeline.groupby('Month').size()
        
        fig = px.line(
            x=timeline_counts.index,
            y=timeline_counts.values,
            title="Pothole Reports Over Time",
            labels={'x': 'Month', 'y': 'Number of Reports'},
            markers=True
        )
        st.plotly_chart(fig, use_container_width=True)

# ============================================================================
# LEGEND
# ============================================================================

st.markdown("---")
st.subheader("🎨 Legend")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("🔴 **Red** - Critical/Rejected")
with col2:
    st.markdown("🟠 **Amber** - Pending/Acknowledged")
with col3:
    st.markdown("🟢 **Green** - Completed")
with col4:
    st.markdown("⚪ **Gray** - Unclassified")

st.markdown("---")
st.info("""
💡 **Data Source:** BBMP Fix My Street Portal  
📅 **Last Updated:** Check individual records for dates  
🔄 **Refresh:** Re-upload KML file to see latest data  
🚗 **Route Planning:** Uses OSRM for routing and pothole overlay analysis
""")