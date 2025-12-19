#!/usr/bin/env python3
"""
Construction Site Digital Twin
A comprehensive system to monitor construction equipment, worker safety, 
environmental conditions, and project progress in real-time.
"""

import time
import random
import json
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Any, List
from dataclasses import dataclass, asdict
from enum import Enum
import threading
from flask import Flask, render_template, jsonify, request
import uuid
import os

class EquipmentType(Enum):
    EXCAVATOR = "excavator"
    CRANE = "crane"
    BULLDOZER = "bulldozer"
    CONCRETE_MIXER = "concrete_mixer"
    GENERATOR = "generator"
    COMPACTOR = "compactor"

class SafetyStatus(Enum):
    SAFE = "safe"
    WARNING = "warning"
    CRITICAL = "critical"

class ProjectPhase(Enum):
    FOUNDATION = "foundation"
    STRUCTURE = "structure"
    ROOFING = "roofing"
    FINISHING = "finishing"

@dataclass
class Location:
    x: float
    y: float
    z: float = 0.0

@dataclass
class Worker:
    id: str
    name: str
    location: Location
    heart_rate: int
    body_temp: float
    has_helmet: bool
    has_vest: bool
    last_seen: datetime


class TelemetryDatabase:
    """SQLite database for high-frequency telemetry storage (10ms intervals)"""

    def __init__(self, db_path: str = "construction_telemetry.db"):
        self.db_path = db_path
        self.conn = None
        self.lock = threading.Lock()
        self._init_database()

    def _init_database(self):
        """Initialize database schema"""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        cursor = self.conn.cursor()

        # Equipment telemetry table (10ms data)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS equipment_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                equipment_id TEXT,
                equipment_type TEXT,
                pos_x REAL,
                pos_y REAL,
                pos_z REAL,
                engine_temp REAL,
                fuel_level REAL,
                vibration_level REAL,
                load_weight REAL,
                is_active INTEGER,
                is_moving INTEGER,
                rotation_angle REAL,
                movement_speed REAL
            )
        """)

        # Worker telemetry table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS worker_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                worker_id TEXT,
                worker_name TEXT,
                pos_x REAL,
                pos_y REAL,
                pos_z REAL,
                heart_rate INTEGER,
                body_temp REAL,
                has_helmet INTEGER,
                has_vest INTEGER
            )
        """)

        # Environment telemetry table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS environment_telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                temperature REAL,
                humidity REAL,
                wind_speed REAL,
                air_quality REAL,
                noise_level REAL,
                dust_level REAL
            )
        """)

        # Create indices for faster queries
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_equip_ts ON equipment_telemetry(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_equip_id ON equipment_telemetry(equipment_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_worker_ts ON worker_telemetry(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_env_ts ON environment_telemetry(timestamp)")

        self.conn.commit()

    def insert_equipment_telemetry(self, equipment):
        """Insert equipment telemetry record"""
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO equipment_telemetry (
                    timestamp, equipment_id, equipment_type, pos_x, pos_y, pos_z,
                    engine_temp, fuel_level, vibration_level, load_weight,
                    is_active, is_moving, rotation_angle, movement_speed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                time.time(),
                equipment.id,
                equipment.type.value,
                equipment.location.x,
                equipment.location.y,
                equipment.location.z,
                equipment.engine_temp,
                equipment.fuel_level,
                equipment.vibration_level,
                equipment.load_weight,
                1 if equipment.is_active else 0,
                1 if equipment.is_moving else 0,
                equipment.rotation_angle,
                equipment.movement_speed
            ))
            self.conn.commit()

    def insert_worker_telemetry(self, worker):
        """Insert worker telemetry record"""
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO worker_telemetry (
                    timestamp, worker_id, worker_name, pos_x, pos_y, pos_z,
                    heart_rate, body_temp, has_helmet, has_vest
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                time.time(),
                worker.id,
                worker.name,
                worker.location.x,
                worker.location.y,
                worker.location.z,
                worker.heart_rate,
                worker.body_temp,
                1 if worker.has_helmet else 0,
                1 if worker.has_vest else 0
            ))
            self.conn.commit()

    def insert_environment_telemetry(self, env):
        """Insert environment telemetry record"""
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO environment_telemetry (
                    timestamp, temperature, humidity, wind_speed,
                    air_quality, noise_level, dust_level
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                time.time(),
                env.temperature,
                env.humidity,
                env.wind_speed,
                env.air_quality,
                env.noise_level,
                env.dust_level
            ))
            self.conn.commit()

    def get_equipment_telemetry(self, equipment_id: str = None, limit: int = 100) -> List[Dict]:
        """Get recent equipment telemetry records"""
        with self.lock:
            cursor = self.conn.cursor()
            if equipment_id:
                cursor.execute("""
                    SELECT * FROM equipment_telemetry
                    WHERE equipment_id = ?
                    ORDER BY timestamp DESC LIMIT ?
                """, (equipment_id, limit))
            else:
                cursor.execute("""
                    SELECT * FROM equipment_telemetry
                    ORDER BY timestamp DESC LIMIT ?
                """, (limit,))
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get_worker_telemetry(self, worker_id: str = None, limit: int = 100) -> List[Dict]:
        """Get recent worker telemetry records"""
        with self.lock:
            cursor = self.conn.cursor()
            if worker_id:
                cursor.execute("""
                    SELECT * FROM worker_telemetry
                    WHERE worker_id = ?
                    ORDER BY timestamp DESC LIMIT ?
                """, (worker_id, limit))
            else:
                cursor.execute("""
                    SELECT * FROM worker_telemetry
                    ORDER BY timestamp DESC LIMIT ?
                """, (limit,))
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def get_environment_telemetry(self, limit: int = 100) -> List[Dict]:
        """Get recent environment telemetry records"""
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT * FROM environment_telemetry
                ORDER BY timestamp DESC LIMIT ?
            """, (limit,))
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


class ConstructionEquipment:
    def __init__(self, equipment_id: str, equipment_type: EquipmentType, location: Location):
        self.id = equipment_id
        self.type = equipment_type
        self.location = location
        self.is_active = False
        self.fuel_level = 100.0
        self.engine_temp = 20.0
        self.operating_hours = 0.0
        self.vibration_level = 0.0
        self.load_weight = 0.0
        self.alerts = []
        self.telemetry_history = []
        
        # Movement tracking for mobile equipment
        self.target_location = location
        self.movement_speed = 0.0  # units per update
        self.rotation_angle = 0.0  # degrees
        self.is_moving = False
        self.movement_path = []  # list of waypoints for complex movements
        self.path_index = 0
        
        # Set default movement parameters based on equipment type
        if equipment_type == EquipmentType.CONCRETE_MIXER:
            self.movement_speed = 1.0  # Smooth movement at 10ms updates
            self.setup_truck_routes()
        elif equipment_type == EquipmentType.EXCAVATOR:
            self.movement_speed = 1.0  # Slow movement for excavators
        elif equipment_type == EquipmentType.BULLDOZER:
            self.movement_speed = 1.5  # Moderate speed for bulldozers
        
    def start_equipment(self):
        self.is_active = True
        print(f"✅ Started {self.type.value}: {self.id}")
        
    def stop_equipment(self):
        self.is_active = False
        self.is_moving = False
        print(f"🛑 Stopped {self.type.value}: {self.id}")
        
    def setup_truck_routes(self):
        """Setup predefined routes for concrete mixer trucks from JSON file"""
        if self.type == EquipmentType.CONCRETE_MIXER:
            self.movement_path = []
            try:
                route_file = getattr(self, 'route_file', 'truck_route.json')
                with open(route_file, 'r') as f:
                    route_data = json.load(f)
                    for point in route_data.get('route', []):
                        self.movement_path.append(Location(point[0], point[1]))
            except FileNotFoundError:
                # Fallback: simple back-and-forth route
                for y in range(0, 210, 10):
                    self.movement_path.append(Location(150, y))
                for y in range(190, 0, -10):
                    self.movement_path.append(Location(150, y))

            self.path_index = 0
            # Start truck at first waypoint
            if self.movement_path:
                self.location = Location(self.movement_path[0].x, self.movement_path[0].y)
                self.target_location = self.movement_path[0]
            
    def update_movement(self):
        """Update equipment position based on movement patterns"""
        if not self.is_active or not self.is_moving:
            return

        # Kill switch check - freeze if active
        if hasattr(self, 'kill_switch') and self.kill_switch:
            return

        # Emergency evacuation takes priority
        if hasattr(self, 'is_evacuating') and self.is_evacuating:
            self.move_to_evacuation_point()
            return

        if self.type == EquipmentType.CONCRETE_MIXER and self.movement_path:
            # Follow predefined path for trucks
            self.follow_path()
        else:
            # Simple random movement for other equipment
            self.random_movement()

    def move_to_evacuation_point(self):
        """Move toward evacuation assembly point"""
        if not hasattr(self, 'evacuation_target'):
            return

        target = self.evacuation_target
        dx = target.x - self.location.x
        dy = target.y - self.location.y
        distance = (dx**2 + dy**2)**0.5

        if distance < 3.0:  # Reached assembly point
            self.is_moving = False
            return

        # Move faster during evacuation
        speed = self.movement_speed * 2.0
        move_x = (dx / distance) * speed
        move_y = (dy / distance) * speed
        self.location.x += move_x
        self.location.y += move_y

        # Update rotation angle
        import math
        self.rotation_angle = math.atan2(dy, dx) * 180 / math.pi
            
    def follow_path(self):
        """Follow predefined waypoint path"""
        if not self.movement_path:
            return
            
        current_target = self.movement_path[self.path_index]
        dx = current_target.x - self.location.x
        dy = current_target.y - self.location.y
        distance = (dx**2 + dy**2)**0.5
        
        if distance < 5.0:  # Reached waypoint
            self.path_index = (self.path_index + 1) % len(self.movement_path)
            current_target = self.movement_path[self.path_index]
            dx = current_target.x - self.location.x
            dy = current_target.y - self.location.y
            distance = (dx**2 + dy**2)**0.5
            
        if distance > 0:
            # Move toward target
            move_x = (dx / distance) * self.movement_speed
            move_y = (dy / distance) * self.movement_speed
            self.location.x += move_x
            self.location.y += move_y
            
            # Update rotation angle based on movement direction
            import math
            self.rotation_angle = math.atan2(dy, dx) * 180 / math.pi
            
    def random_movement(self):
        """Random movement pattern for non-truck equipment"""
        # Small random movements within a constrained area
        self.location.x += random.uniform(-0.5, 0.5) * self.movement_speed
        self.location.y += random.uniform(-0.5, 0.5) * self.movement_speed
        
        # Keep equipment within site boundaries
        self.location.x = max(10, min(290, self.location.x))
        self.location.y = max(10, min(190, self.location.y))
        
    def update_telemetry(self):
        if not self.is_active:
            return
            
        # Simulate realistic equipment telemetry
        if self.type == EquipmentType.EXCAVATOR:
            self.engine_temp += random.uniform(-1, 3)
            self.fuel_level -= random.uniform(0.1, 0.5)
            self.vibration_level = random.uniform(10, 50)
            self.load_weight = random.uniform(0, 15000)  # kg
        elif self.type == EquipmentType.CRANE:
            self.engine_temp += random.uniform(-0.5, 2)
            self.fuel_level -= random.uniform(0.05, 0.3)
            self.vibration_level = random.uniform(5, 25)
            self.load_weight = random.uniform(0, 50000)  # kg
        elif self.type == EquipmentType.CONCRETE_MIXER:
            self.engine_temp += random.uniform(0, 4)
            self.fuel_level -= random.uniform(0.2, 0.8)
            self.vibration_level = random.uniform(20, 80)
            
        # Add some randomness
        self.engine_temp = max(15, min(120, self.engine_temp))
        self.fuel_level = max(0, self.fuel_level)
        self.operating_hours += 0.033  # 2 minutes per hour
        
        # Record telemetry
        telemetry = {
            "timestamp": datetime.now(),
            "engine_temp": round(self.engine_temp, 2),
            "fuel_level": round(self.fuel_level, 2),
            "vibration_level": round(self.vibration_level, 2),
            "load_weight": round(self.load_weight, 2),
            "is_active": self.is_active
        }
        
        self.telemetry_history.append(telemetry)
        if len(self.telemetry_history) > 100:
            self.telemetry_history.pop(0)

        # Check for alerts
        self.check_alerts()
        
    def check_alerts(self):
        self.alerts.clear()
        
        if self.engine_temp > 90:
            self.alerts.append("HIGH_ENGINE_TEMP")
        if self.fuel_level < 10:
            self.alerts.append("LOW_FUEL")
        if self.vibration_level > 70:
            self.alerts.append("HIGH_VIBRATION")
        if self.type == EquipmentType.CRANE and self.load_weight > 45000:
            self.alerts.append("OVERLOAD")
            
    def get_status(self):
        # Waypoint names for event injection reference (12 points on oval)
        waypoint_names = [
            "East point", "Northeast", "North-northeast", "North point",
            "North-northwest", "Northwest", "West point", "Southwest",
            "South-southwest", "South point", "South-southeast", "Southeast"
        ]
        current_waypoint_name = waypoint_names[self.path_index] if self.movement_path and self.path_index < len(waypoint_names) else "N/A"

        return {
            "id": self.id,
            "type": self.type.value,
            "location": asdict(self.location),
            "is_active": self.is_active,
            "engine_temp": self.engine_temp,
            "fuel_level": self.fuel_level,
            "vibration_level": self.vibration_level,
            "load_weight": self.load_weight,
            "operating_hours": round(self.operating_hours, 2),
            "alerts": self.alerts,
            "last_updated": datetime.now(),
            # Movement data
            "is_moving": self.is_moving,
            "kill_switch": getattr(self, 'kill_switch', False),
            "movement_speed": self.movement_speed,
            "rotation_angle": self.rotation_angle,
            "target_location": asdict(self.target_location) if hasattr(self, 'target_location') else None,
            "path_index": self.path_index,
            "current_waypoint": current_waypoint_name,
            "path_progress": f"{self.path_index + 1}/{len(self.movement_path)}" if hasattr(self, 'movement_path') and self.movement_path else "N/A",
            "movement_path": [asdict(p) for p in self.movement_path] if hasattr(self, 'movement_path') and self.movement_path else []
        }

class SafetyMonitor:
    def __init__(self):
        self.workers = {}
        self.safety_violations = []
        self.restricted_zones = [
            {"name": "Crane Operation Zone", "center": Location(100, 50), "radius": 30},
            {"name": "Deep Excavation", "center": Location(200, 100), "radius": 20}
        ]
        
    def add_worker(self, worker: Worker):
        self.workers[worker.id] = worker
        
    def update_worker_status(self, worker_id: str, location: Location, heart_rate: int, 
                           body_temp: float, has_helmet: bool, has_vest: bool):
        if worker_id in self.workers:
            worker = self.workers[worker_id]
            worker.location = location
            worker.heart_rate = heart_rate
            worker.body_temp = body_temp
            worker.has_helmet = has_helmet
            worker.has_vest = has_vest
            worker.last_seen = datetime.now()
            
            self.check_safety_violations(worker)
            
    def check_safety_violations(self, worker: Worker):
        violations = []
        
        # Check PPE compliance
        if not worker.has_helmet:
            violations.append(f"Worker {worker.name} missing safety helmet")
        if not worker.has_vest:
            violations.append(f"Worker {worker.name} missing safety vest")
            
        # Check health metrics
        if worker.heart_rate > 120:
            violations.append(f"Worker {worker.name} elevated heart rate: {worker.heart_rate}")
        if worker.body_temp > 38.5:
            violations.append(f"Worker {worker.name} high body temperature: {worker.body_temp}°C")
            
        # Check restricted zones
        for zone in self.restricted_zones:
            distance = ((worker.location.x - zone["center"].x)**2 + 
                       (worker.location.y - zone["center"].y)**2)**0.5
            if distance < zone["radius"]:
                violations.append(f"Worker {worker.name} in restricted zone: {zone['name']}")
                
        # Add violations with timestamp
        for violation in violations:
            self.safety_violations.append({
                "timestamp": datetime.now(),
                "violation": violation,
                "severity": "critical" if "missing" in violation or "restricted zone" in violation else "warning"
            })
            
        # Keep only recent violations (last 24 hours)
        cutoff = datetime.now() - timedelta(hours=24)
        self.safety_violations = [v for v in self.safety_violations if v["timestamp"] > cutoff]

class ProgressTracker:
    def __init__(self):
        self.current_phase = ProjectPhase.FOUNDATION
        self.phase_progress = {
            ProjectPhase.FOUNDATION: 0.0,
            ProjectPhase.STRUCTURE: 0.0,
            ProjectPhase.ROOFING: 0.0,
            ProjectPhase.FINISHING: 0.0
        }
        self.milestones = []
        self.weather_impact = 0.0
        
    def update_progress(self, phase: ProjectPhase, progress: float):
        self.phase_progress[phase] = min(100.0, max(0.0, progress))
        
        # Auto-advance phases
        if progress >= 100.0 and phase == self.current_phase:
            phases = list(ProjectPhase)
            current_idx = phases.index(self.current_phase)
            if current_idx < len(phases) - 1:
                self.current_phase = phases[current_idx + 1]
                
    def add_milestone(self, name: str, completed: bool = False):
        self.milestones.append({
            "name": name,
            "completed": completed,
            "timestamp": datetime.now()
        })
        
    def get_overall_progress(self):
        total_progress = sum(self.phase_progress.values())
        return round(total_progress / len(self.phase_progress), 2)

class EnvironmentalMonitor:
    def __init__(self):
        self.temperature = 20.0
        self.humidity = 50.0
        self.wind_speed = 5.0
        self.air_quality = 85.0
        self.noise_level = 60.0
        self.dust_level = 20.0
        self.emergency_active = False
        self.emergency_type = None

    def trigger_emergency(self, emergency_type: str, dust_level: float = 90.0):
        """Trigger emergency condition"""
        self.emergency_active = True
        self.emergency_type = emergency_type
        self.dust_level = dust_level
        print(f"🚨 EMERGENCY: {emergency_type} - Dust level: {dust_level}%")

    def clear_emergency(self):
        """Clear emergency condition"""
        self.emergency_active = False
        self.emergency_type = None
        self.dust_level = 20.0
        print("✅ Emergency cleared")
        
    def update_conditions(self):
        # Simulate changing environmental conditions
        self.temperature += random.uniform(-2, 2)
        self.humidity += random.uniform(-5, 5)
        self.wind_speed += random.uniform(-2, 3)
        self.air_quality += random.uniform(-3, 3)
        self.noise_level += random.uniform(-10, 15)
        self.dust_level += random.uniform(-5, 10)
        
        # Keep within realistic bounds
        self.temperature = max(-10, min(45, self.temperature))
        self.humidity = max(0, min(100, self.humidity))
        self.wind_speed = max(0, min(50, self.wind_speed))
        self.air_quality = max(0, min(100, self.air_quality))
        self.noise_level = max(30, min(120, self.noise_level))
        self.dust_level = max(0, min(100, self.dust_level))
        
    def get_status(self):
        return {
            "temperature": round(self.temperature, 1),
            "humidity": round(self.humidity, 1),
            "wind_speed": round(self.wind_speed, 1),
            "air_quality": round(self.air_quality, 1),
            "noise_level": round(self.noise_level, 1),
            "dust_level": round(self.dust_level, 1),
            "emergency_active": self.emergency_active,
            "emergency_type": self.emergency_type,
            "timestamp": datetime.now()
        }

class ConstructionSiteDigitalTwin:
    def __init__(self, site_name: str):
        self.site_name = site_name
        self.equipment = {}
        self.safety_monitor = SafetyMonitor()
        self.progress_tracker = ProgressTracker()
        self.environmental_monitor = EnvironmentalMonitor()
        self.telemetry_db = TelemetryDatabase()
        self.start_time = datetime.now()
        self.is_running = False

        # Telemetry collection thread (10ms interval)
        self.telemetry_thread = None
        self.telemetry_running = False

        # Safe assembly points for emergency evacuation
        self.assembly_points = [
            {"name": "Assembly Point A", "location": Location(20, 20), "capacity": 20},
            {"name": "Assembly Point B", "location": Location(280, 20), "capacity": 20},
            {"name": "Assembly Point C", "location": Location(20, 180), "capacity": 20},
            {"name": "Assembly Point D", "location": Location(280, 180), "capacity": 20},
        ]

        # Initialize with sample equipment
        self.add_equipment("EXC001", EquipmentType.EXCAVATOR, Location(50, 25))
        self.add_equipment("CRANE001", EquipmentType.CRANE, Location(100, 50))
        self.add_equipment("MIX001", EquipmentType.CONCRETE_MIXER, Location(150, 75))
        self.add_equipment("BULL001", EquipmentType.BULLDOZER, Location(75, 100))

        # Add sample workers
        self.add_sample_workers()
        
    def add_equipment(self, equipment_id: str, equipment_type: EquipmentType, location: Location):
        equipment = ConstructionEquipment(equipment_id, equipment_type, location)
        self.equipment[equipment_id] = equipment
        print(f"➕ Added {equipment_type.value}: {equipment_id}")
        
    def add_sample_workers(self):
        workers = [
            Worker("W001", "Muniraju", Location(60, 30), 75, 36.5, True, True, datetime.now()),
            Worker("W002", "Siddha", Location(110, 60), 82, 36.8, True, False, datetime.now()),
            Worker("W003", "Ranga", Location(200, 95), 95, 37.1, False, True, datetime.now()),
            Worker("W004", "Peddanna", Location(80, 105), 88, 36.6, True, True, datetime.now())
        ]
        
        for worker in workers:
            self.safety_monitor.add_worker(worker)

    def find_nearest_assembly_point(self, location: Location) -> dict:
        """Find the nearest assembly point to a given location"""
        nearest = None
        min_distance = float('inf')
        for point in self.assembly_points:
            dx = point["location"].x - location.x
            dy = point["location"].y - location.y
            distance = (dx**2 + dy**2)**0.5
            if distance < min_distance:
                min_distance = distance
                nearest = point
        return nearest

    def trigger_emergency_evacuation(self, dust_level: float = 90.0):
        """Trigger emergency evacuation - all entities move to nearest assembly point"""
        self.environmental_monitor.trigger_emergency("HIGH_DUST_LEVEL", dust_level)

        # Set evacuation targets for all equipment
        for equipment in self.equipment.values():
            nearest = self.find_nearest_assembly_point(equipment.location)
            equipment.evacuation_target = nearest["location"]
            equipment.is_evacuating = True
            equipment.is_moving = True
            # Clear normal path following
            equipment.movement_path = []
            print(f"🚨 {equipment.id} evacuating to {nearest['name']}")

        # Set evacuation targets for all workers
        for worker in self.safety_monitor.workers.values():
            nearest = self.find_nearest_assembly_point(worker.location)
            worker.evacuation_target = nearest["location"]
            worker.is_evacuating = True
            print(f"🚨 Worker {worker.name} evacuating to {nearest['name']}")

    def clear_emergency(self):
        """Clear emergency and resume normal operations"""
        self.environmental_monitor.clear_emergency()

        # Reset equipment evacuation state
        for equipment in self.equipment.values():
            equipment.is_evacuating = False
            if hasattr(equipment, 'evacuation_target'):
                delattr(equipment, 'evacuation_target')
            # Restore truck routes (unless kill switch is active)
            if equipment.type == EquipmentType.CONCRETE_MIXER:
                equipment.setup_truck_routes()
                if not getattr(equipment, 'kill_switch', False):
                    equipment.is_moving = True

        # Reset worker evacuation state
        for worker in self.safety_monitor.workers.values():
            worker.is_evacuating = False
            if hasattr(worker, 'evacuation_target'):
                delattr(worker, 'evacuation_target')

    def start_operations(self):
        self.is_running = True
        for equipment in self.equipment.values():
            equipment.start_equipment()
            # Start movement for trucks (unless kill switch is active)
            if equipment.type == EquipmentType.CONCRETE_MIXER:
                if not getattr(equipment, 'kill_switch', False):
                    equipment.is_moving = True
        # Start 10ms telemetry collection
        self.start_telemetry_collection()

    def stop_operations(self):
        self.is_running = False
        self.stop_telemetry_collection()
        for equipment in self.equipment.values():
            equipment.stop_equipment()

    def start_telemetry_collection(self):
        """Start high-frequency telemetry collection (10ms intervals)"""
        if self.telemetry_running:
            return
        self.telemetry_running = True
        self.telemetry_thread = threading.Thread(target=self._telemetry_loop, daemon=True)
        self.telemetry_thread.start()
        print("📊 Started high-frequency telemetry collection (10ms)")

    def stop_telemetry_collection(self):
        """Stop telemetry collection"""
        self.telemetry_running = False
        if self.telemetry_thread:
            self.telemetry_thread.join(timeout=1.0)
        print("📊 Stopped telemetry collection")

    def _telemetry_loop(self):
        """High-frequency telemetry collection loop (10ms)"""
        while self.telemetry_running:
            try:
                # Update equipment movement at 10ms for smooth motion
                for equipment in self.equipment.values():
                    if equipment.is_active:
                        equipment.update_movement()
                        self.telemetry_db.insert_equipment_telemetry(equipment)

                # Collect worker telemetry
                for worker in self.safety_monitor.workers.values():
                    self.telemetry_db.insert_worker_telemetry(worker)

                # Collect environment telemetry
                self.telemetry_db.insert_environment_telemetry(self.environmental_monitor)

            except Exception as e:
                print(f"Telemetry collection error: {e}")

            time.sleep(0.01)  # 10ms interval
            
    def update_system(self):
        if not self.is_running:
            return
            
        # Update equipment telemetry
        for equipment in self.equipment.values():
            equipment.update_telemetry()
            
        # Update environmental conditions
        self.environmental_monitor.update_conditions()
        
        # Simulate worker movements and status updates
        for worker_id, worker in self.safety_monitor.workers.items():
            # Check if evacuating
            if hasattr(worker, 'is_evacuating') and worker.is_evacuating:
                # Move toward evacuation target
                if hasattr(worker, 'evacuation_target'):
                    target = worker.evacuation_target
                    dx = target.x - worker.location.x
                    dy = target.y - worker.location.y
                    distance = (dx**2 + dy**2)**0.5
                    if distance > 3.0:
                        # Move faster during evacuation (running)
                        speed = 8.0
                        worker.location.x += (dx / distance) * speed
                        worker.location.y += (dy / distance) * speed
            else:
                # Normal random movement
                worker.location.x += random.uniform(-5, 5)
                worker.location.y += random.uniform(-5, 5)
            worker.location.x = max(0, min(300, worker.location.x))
            worker.location.y = max(0, min(200, worker.location.y))
            
            # Update worker status
            self.safety_monitor.update_worker_status(
                worker_id, worker.location,
                random.randint(70, 120),
                random.uniform(36.0, 38.0),
                random.choice([True, False]) if worker_id == "W003" else True,
                random.choice([True, False]) if worker_id == "W002" else True
            )
            
        # Simulate progress updates
        if random.random() < 0.1:  # 10% chance each update
            phase = self.progress_tracker.current_phase
            current_progress = self.progress_tracker.phase_progress[phase]
            if current_progress < 100:
                self.progress_tracker.update_progress(phase, current_progress + random.uniform(0.5, 2.0))
                
    def get_dashboard_data(self):
        """Get all data for the web dashboard"""
        return {
            "site_info": {
                "name": self.site_name,
                "start_time": self.start_time,
                "is_running": self.is_running,
                "uptime": str(datetime.now() - self.start_time)
            },
            "equipment": {eq_id: eq.get_status() for eq_id, eq in self.equipment.items()},
            "workers": {
                worker_id: {
                    "id": worker.id,
                    "name": worker.name,
                    "location": asdict(worker.location),
                    "heart_rate": worker.heart_rate,
                    "body_temp": worker.body_temp,
                    "has_helmet": worker.has_helmet,
                    "has_vest": worker.has_vest,
                    "last_seen": worker.last_seen
                } for worker_id, worker in self.safety_monitor.workers.items()
            },
            "safety": {
                "violations": self.safety_monitor.safety_violations[-10:],  # Last 10 violations
                "restricted_zones": self.safety_monitor.restricted_zones
            },
            "progress": {
                "current_phase": self.progress_tracker.current_phase.value,
                "phase_progress": {phase.value: progress for phase, progress in self.progress_tracker.phase_progress.items()},
                "overall_progress": self.progress_tracker.get_overall_progress(),
                "milestones": self.progress_tracker.milestones[-5:]  # Last 5 milestones
            },
            "environment": self.environmental_monitor.get_status(),
            "assembly_points": [
                {"name": p["name"], "location": {"x": p["location"].x, "y": p["location"].y}, "capacity": p["capacity"]}
                for p in self.assembly_points
            ],
            "timestamp": datetime.now()
        }
        
    def run_simulation(self, duration_seconds: int):
        """Run the construction site simulation"""
        print(f"\n🏗️  Starting Construction Site Digital Twin: {self.site_name}")
        print(f"🚀 Simulation running for {duration_seconds} seconds...\n")
        
        self.start_operations()
        
        iterations = 0
        while self.is_running and iterations < duration_seconds // 2:
            iterations += 1
            print(f"--- Iteration {iterations} ---")
            
            self.update_system()
            
            # Print summary
            active_equipment = sum(1 for eq in self.equipment.values() if eq.is_active)
            total_alerts = sum(len(eq.alerts) for eq in self.equipment.values())
            safety_violations = len([v for v in self.safety_monitor.safety_violations 
                                   if (datetime.now() - v["timestamp"]).seconds < 3600])  # Last hour
            
            print(f"  🏗️  Active Equipment: {active_equipment}/{len(self.equipment)}")
            print(f"  ⚠️  Active Alerts: {total_alerts}")
            print(f"  👷 Workers on Site: {len(self.safety_monitor.workers)}")
            print(f"  🚨 Safety Violations (1h): {safety_violations}")
            print(f"  📊 Overall Progress: {self.progress_tracker.get_overall_progress()}%")
            print(f"  🌡️  Temperature: {self.environmental_monitor.temperature:.1f}°C")
            print(f"  🔊 Noise Level: {self.environmental_monitor.noise_level:.1f} dB")
            print()
            
            time.sleep(2)
            
        self.stop_operations()
        print("✅ Construction Site Simulation completed!")
        
        # Print final summary
        final_data = self.get_dashboard_data()
        print(f"\n📊 Final Site Summary:")
        print(f"  🏗️  Site: {final_data['site_info']['name']}")
        print(f"  ⏱️  Uptime: {final_data['site_info']['uptime']}")
        print(f"  📈 Overall Progress: {final_data['progress']['overall_progress']}%")
        print(f"  🔧 Equipment Status: {len([eq for eq in final_data['equipment'].values() if eq['is_active']])}/{len(final_data['equipment'])} active")

# Flask Web Application for Visualization
app = Flask(__name__)
construction_site = ConstructionSiteDigitalTwin("Metro Construction Project - Phase 1")

@app.route('/')
def index():
    """Main route - goes directly to 3D visualization"""
    return render_template('construction_3d_dashboard.html')

@app.route('/api/dashboard-data')
def api_dashboard_data():
    return jsonify(construction_site.get_dashboard_data())

@app.route('/health')
def health():
    """Simple health check endpoint"""
    return jsonify({
        "status": "ok",
        "app_running": construction_site.is_running,
        "telemetry_running": construction_site.telemetry_running,
        "equipment_count": len(construction_site.equipment),
        "worker_count": len(construction_site.safety_monitor.workers)
    })

@app.route('/api/start-operations', methods=['POST'])
def start_operations():
    construction_site.start_operations()
    return jsonify({"status": "started"})

@app.route('/api/stop-operations', methods=['POST'])
def stop_operations():
    construction_site.stop_operations()
    return jsonify({"status": "stopped"})

@app.route('/api/trigger-emergency', methods=['POST'])
def trigger_emergency():
    """Trigger emergency evacuation (e.g., high dust level)"""
    data = request.get_json() or {}
    dust_level = data.get('dust_level', 90.0)
    construction_site.trigger_emergency_evacuation(dust_level)
    return jsonify({
        "status": "emergency_triggered",
        "dust_level": dust_level,
        "assembly_points": [
            {"name": p["name"], "location": {"x": p["location"].x, "y": p["location"].y}}
            for p in construction_site.assembly_points
        ]
    })

@app.route('/api/clear-emergency', methods=['POST'])
def clear_emergency():
    """Clear emergency and resume normal operations"""
    construction_site.clear_emergency()
    return jsonify({"status": "emergency_cleared"})

@app.route('/api/route/select', methods=['POST'])
def select_route():
    """Select a route file for the concrete mixer truck at runtime.
    Body: {"route_file": "truck_route_wrong_route.json", "equipment_id": "MIX001"}
    """
    data = request.get_json(silent=True) or {}
    equipment_id = data.get('equipment_id', 'MIX001')
    route_file = data.get('route_file')

    if not route_file:
        return jsonify({"status": "error", "message": "route_file required"}), 400

    if not os.path.isabs(route_file):
        route_file_path = route_file
    else:
        route_file_path = route_file

    if not os.path.exists(route_file_path):
        return jsonify({"status": "error", "message": f"Route file not found: {route_file_path}"}), 404

    eq = construction_site.equipment.get(equipment_id)
    if not eq or eq.type != EquipmentType.CONCRETE_MIXER:
        return jsonify({"status": "error", "message": "Concrete mixer equipment not found"}), 404

    # Apply new route
    eq.route_file = route_file_path
    eq.setup_truck_routes()
    eq.is_moving = not getattr(eq, 'kill_switch', False)

    return jsonify({
        "status": "route_applied",
        "equipment_id": equipment_id,
        "route_file": route_file_path,
        "waypoints": len(eq.movement_path)
    })

@app.route('/api/truck/kill', methods=['POST'])
def truck_kill():
    """Kill switch - freeze truck at current location"""
    data = request.get_json(silent=True) or {}
    equipment_id = data.get('equipment_id', 'MIX001')

    if equipment_id in construction_site.equipment:
        equipment = construction_site.equipment[equipment_id]
        equipment.is_moving = False
        equipment.kill_switch = True
        return jsonify({
            "status": "truck_frozen",
            "equipment_id": equipment_id,
            "location": {"x": equipment.location.x, "y": equipment.location.y}
        })
    return jsonify({"status": "error", "message": "Equipment not found"}), 404

@app.route('/api/truck/resume', methods=['POST'])
def truck_resume():
    """Resume truck movement after kill switch"""
    data = request.get_json(silent=True) or {}
    equipment_id = data.get('equipment_id', 'MIX001')

    if equipment_id in construction_site.equipment:
        equipment = construction_site.equipment[equipment_id]
        equipment.kill_switch = False
        equipment.is_moving = True
        return jsonify({
            "status": "truck_resumed",
            "equipment_id": equipment_id
        })
    return jsonify({"status": "error", "message": "Equipment not found"}), 404

@app.route('/api/telemetry/equipment')
def get_equipment_telemetry():
    """Get equipment telemetry data"""
    equipment_id = request.args.get('equipment_id')
    limit = request.args.get('limit', 100, type=int)
    data = construction_site.telemetry_db.get_equipment_telemetry(equipment_id, limit)
    return jsonify(data)

@app.route('/api/telemetry/workers')
def get_worker_telemetry():
    """Get worker telemetry data"""
    worker_id = request.args.get('worker_id')
    limit = request.args.get('limit', 100, type=int)
    data = construction_site.telemetry_db.get_worker_telemetry(worker_id, limit)
    return jsonify(data)

@app.route('/api/telemetry/environment')
def get_environment_telemetry():
    """Get environment telemetry data"""
    limit = request.args.get('limit', 100, type=int)
    data = construction_site.telemetry_db.get_environment_telemetry(limit)
    return jsonify(data)

def background_updates():
    """Background thread to continuously update the system"""
    while True:
        construction_site.update_system()
        time.sleep(0.1)  # Update every 100ms for smoother movement

if __name__ == "__main__":
    print("🏗️  Construction Site Digital Twin")
    print("=====================================")

    # Start background updates
    update_thread = threading.Thread(target=background_updates, daemon=True)
    update_thread.start()

    # Optional auto-start operations via env var
    if os.environ.get("AUTO_START", "0") == "1":
        try:
            construction_site.start_operations()
            print("✅ AUTO_START enabled: operations started")
        except Exception as e:
            print(f"AUTO_START failed: {e}")

    # Determine port from environment
    port = int(os.environ.get("PORT", "8001"))
    print(f"\n🌐 Starting 3D Construction Site Visualization at http://localhost:{port}")
    print("   Open your browser and watch the site in real-time 3D!")

    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)