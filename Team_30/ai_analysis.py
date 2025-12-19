# Fixed AI Analysis Engine (ai_analysis.py)
# Corrected to work accurately with actual game session data

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from datetime import datetime, timedelta
import json
import math

class AnalysisEngine:
    """
    AI-powered analysis engine for motor and cognitive skill assessment
    Fixed to work with actual game data from Follow the Dot and Bubble Pop
    """
    
    def __init__(self):
        self.motor_thresholds = {
            'excellent': 85,
            'good': 70,
            'developing': 50,
            'needs_attention': 30
        }
        
        self.cognitive_thresholds = {
            'excellent': 90,
            'good': 75,
            'developing': 55,
            'needs_attention': 35
        }
        
        # Game-specific analysis weights
        self.game_weights = {
            'Follow the Dot': {
                'accuracy': 0.4,
                'smoothness': 0.3,
                'completion': 0.2,
                'consistency': 0.1
            },
            'Bubble Pop': {
                'accuracy': 0.5,
                'reaction_time': 0.3,
                'coordination': 0.2
            }
        }
    
    def analyze_session(self, session):
        """Analyze a single game session and extract insights"""
        from models import db, ProgressData, AIInsight
        
        try:
            print(f"🔍 Analyzing session: {session.id} - {session.game_name}")
            
            # Extract raw session data safely
            raw_data = {}
            if session.raw_data:
                try:
                    raw_data = json.loads(session.raw_data) if isinstance(session.raw_data, str) else session.raw_data
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"⚠️ Could not parse raw data for session {session.id}: {e}")
                    raw_data = {}
            
            # Calculate advanced metrics
            metrics = self._calculate_session_metrics(session, raw_data)
            print(f"📊 Calculated metrics: {metrics}")
            
            # Update progress data
            self._update_progress_data(session.user_id, metrics)
            
            # Generate session-specific insights
            insights = self._generate_session_insights(session, metrics)
            print(f"💡 Generated insights for session {session.id}")
            
            # Store AI insights
            ai_insight = AIInsight(
                user_id=session.user_id,
                insight_type='session_specific',
                motor_analysis=json.dumps(insights.get('motor', {})),
                cognitive_analysis=json.dumps(insights.get('cognitive', {})),
                recommendations=json.dumps(insights.get('recommendations', [])),
                improvement_areas=json.dumps(insights.get('improvement_areas', [])),
                strengths=json.dumps(insights.get('strengths', [])),
                progress_trajectory=insights.get('trajectory', 'stable'),
                attention_risk_score=insights.get('attention_risk', 0.0),
                motor_risk_score=insights.get('motor_risk', 0.0),
                overall_development_risk=insights.get('overall_risk', 0.0),
                confidence_score=insights.get('confidence', 0.8),
                generated_date=datetime.utcnow()
            )
            
            db.session.add(ai_insight)
            db.session.commit()
            print(f"✅ Stored AI insights for session {session.id}")
            
            return insights
            
        except Exception as e:
            print(f"❌ Error analyzing session {session.id}: {e}")
            db.session.rollback()
            return None
    
    def _calculate_session_metrics(self, session, raw_data):
        """Calculate advanced metrics from session data"""
        metrics = {}
        
        # Calculate base accuracy safely
        base_accuracy = 0
        if session.total_attempts and session.total_attempts > 0:
            base_accuracy = (session.successful_attempts / session.total_attempts) * 100
        elif session.successful_attempts and not session.total_attempts:
            # If we only have successful attempts, estimate total attempts
            base_accuracy = min(95, session.successful_attempts * 20)  # Rough estimate
        
        # Session duration in minutes for calculations
        duration_minutes = (session.session_duration or 60) / 60
        
        print(f"📊 Base metrics - Accuracy: {base_accuracy:.1f}%, Duration: {duration_minutes:.1f}min")
        
        # Game-specific motor analysis
        game_name = session.game_name or 'Unknown'
        if 'Follow the Dot' in game_name or 'follow' in game_name.lower():
            metrics['motor'] = self._analyze_tracing_performance(session, raw_data, base_accuracy)
        elif 'Bubble Pop' in game_name or 'bubble' in game_name.lower():
            metrics['motor'] = self._analyze_popping_performance(session, raw_data, base_accuracy)
        else:
            # Generic motor analysis for unknown games
            metrics['motor'] = self._analyze_generic_motor_performance(session, base_accuracy)
        
        # Cognitive skill metrics
        metrics['cognitive'] = self._analyze_cognitive_performance(session, raw_data, duration_minutes)
        
        # Overall session metrics
        metrics['accuracy'] = base_accuracy
        metrics['engagement'] = self._calculate_engagement_metrics(session, duration_minutes)
        
        # Hand dominance analysis (if data available)
        left_usage = session.left_hand_usage or 0
        right_usage = session.right_hand_usage or 0
        total_hand_usage = left_usage + right_usage
        
        if total_hand_usage > 0:
            metrics['hand_dominance'] = {
                'left_percentage': (left_usage / total_hand_usage) * 100,
                'right_percentage': (right_usage / total_hand_usage) * 100,
                'dominance_consistency': abs(50 - (right_usage / total_hand_usage) * 100),
                'bilateral_balance': 100 - abs(left_usage - right_usage) / total_hand_usage * 100
            }
        else:
            # Default balanced hand usage if no data
            metrics['hand_dominance'] = {
                'left_percentage': 50,
                'right_percentage': 50,
                'dominance_consistency': 0,
                'bilateral_balance': 85  # Assume reasonable balance
            }
        
        return metrics
    
    def _analyze_tracing_performance(self, session, raw_data, base_accuracy):
        """Analyze tracing game performance (Follow the Dot)"""
        analysis = {}
        
        print(f"🎯 Analyzing Follow the Dot performance")
        
        # Hand-eye coordination (primary metric for tracing)
        analysis['hand_eye_coordination'] = base_accuracy
        
        # Movement smoothness from raw data or estimate
        if 'smoothness' in raw_data:
            analysis['movement_smoothness'] = min(100, max(0, raw_data['smoothness']))
        elif 'handTrackingData' in raw_data and len(raw_data['handTrackingData']) > 2:
            # Calculate smoothness from tracking data
            analysis['movement_smoothness'] = self._calculate_movement_smoothness(raw_data['handTrackingData'])
        else:
            # Estimate smoothness from accuracy and level
            level_bonus = min(20, (session.level_reached or 1) * 4)
            analysis['movement_smoothness'] = min(100, base_accuracy * 0.8 + level_bonus)
        
        # Fine motor control (combination of accuracy and precision)
        analysis['fine_motor_control'] = base_accuracy * 0.7 + analysis['movement_smoothness'] * 0.3
        
        # Completion rate and speed
        if session.session_duration and session.session_duration > 0:
            completion_efficiency = (session.level_reached or 1) / (session.session_duration / 60)
            analysis['completion_rate'] = min(100, completion_efficiency * 30)
            
            # Speed-accuracy balance
            if session.score:
                analysis['speed_accuracy_balance'] = min(100, (session.score * base_accuracy) / session.session_duration * 0.1)
            else:
                analysis['speed_accuracy_balance'] = base_accuracy * 0.7
        else:
            analysis['completion_rate'] = base_accuracy * 0.6
            analysis['speed_accuracy_balance'] = base_accuracy * 0.7
        
        # Bilateral coordination (hand balance)
        left_usage = session.left_hand_usage or 0
        right_usage = session.right_hand_usage or 0
        total_usage = left_usage + right_usage
        
        if total_usage > 0:
            balance_score = 100 - abs(left_usage - right_usage) / total_usage * 100
            analysis['bilateral_coordination'] = max(0, balance_score)
        else:
            analysis['bilateral_coordination'] = 75  # Default moderate score
        
        print(f"✅ Tracing analysis complete: {analysis}")
        return analysis
    
    def _analyze_popping_performance(self, session, raw_data, base_accuracy):
        """Analyze bubble popping performance"""
        analysis = {}
        
        print(f"🫧 Analyzing Bubble Pop performance")
        
        # Hand-eye coordination (primary skill for bubble popping)
        analysis['hand_eye_coordination'] = base_accuracy
        
        # Reaction time analysis
        if 'averageReactionTime' in raw_data:
            avg_reaction = raw_data['averageReactionTime']
            # Convert reaction time to performance score (lower time = higher score)
            # Typical range: 200-2000ms, good performance around 300-800ms
            reaction_score = max(0, min(100, (1500 - avg_reaction) / 13))
            analysis['reaction_time_score'] = reaction_score
            analysis['average_reaction_time'] = avg_reaction
        elif 'reactionTimes' in raw_data:
            reaction_times = raw_data['reactionTimes']
            avg_reaction = np.mean(reaction_times)
            reaction_score = max(0, min(100, (1500 - avg_reaction) / 13))
            analysis['reaction_time_score'] = reaction_score
            analysis['average_reaction_time'] = avg_reaction
            
            # Reaction consistency
            if len(reaction_times) > 1:
                consistency = 100 - min(100, np.std(reaction_times) / 20)
                analysis['reaction_consistency'] = max(0, consistency)
        else:
            # Estimate reaction performance from score and session data
            if session.session_duration and session.successful_attempts:
                estimated_reaction_score = min(100, (session.successful_attempts / (session.session_duration / 60)) * 2)
                analysis['reaction_time_score'] = estimated_reaction_score
                analysis['reaction_consistency'] = base_accuracy * 0.8
            else:
                analysis['reaction_time_score'] = base_accuracy * 0.9
                analysis['reaction_consistency'] = base_accuracy * 0.8
        
        # Movement precision (based on successful hits vs misses)
        analysis['movement_precision'] = base_accuracy
        
        # Speed adaptation (performance under pressure)
        level_adaptation = min(100, (session.level_reached or 1) * 20)
        analysis['speed_adaptation'] = (base_accuracy * 0.7) + (level_adaptation * 0.3)
        
        # Bilateral coordination
        left_usage = session.left_hand_usage or 0
        right_usage = session.right_hand_usage or 0
        total_usage = left_usage + right_usage
        
        if total_usage > 0:
            balance_score = 100 - abs(left_usage - right_usage) / total_usage * 100
            analysis['bilateral_coordination'] = max(0, balance_score)
        else:
            analysis['bilateral_coordination'] = 70  # Default for bubble pop
        
        print(f"✅ Bubble pop analysis complete: {analysis}")
        return analysis
    
    def _analyze_generic_motor_performance(self, session, base_accuracy):
        """Generic motor analysis for unknown games"""
        return {
            'hand_eye_coordination': base_accuracy,
            'fine_motor_control': base_accuracy * 0.9,
            'movement_precision': base_accuracy,
            'bilateral_coordination': 75,  # Default moderate score
            'motor_control_overall': min(100, (session.score or 0) / max(1, (session.level_reached or 1)) * 0.5)
        }
    
    def _analyze_cognitive_performance(self, session, raw_data, duration_minutes):
        """Analyze cognitive aspects of game performance"""
        analysis = {}
        
        print(f"🧠 Analyzing cognitive performance")
        
        # Sustained attention (based on session duration and performance consistency)
        # Optimal session duration is 3-10 minutes for attention measurement
        if duration_minutes > 0:
            attention_from_duration = min(100, max(20, (duration_minutes / 8) * 100))
            
            # Adjust based on performance consistency
            if session.total_attempts and session.total_attempts > 0:
                consistency_bonus = (session.successful_attempts / session.total_attempts) * 20
                attention_from_duration = min(100, attention_from_duration + consistency_bonus)
            
            analysis['sustained_attention'] = attention_from_duration
        else:
            analysis['sustained_attention'] = 40  # Default low attention score
        
        # Working memory (based on level progression and complexity handling)
        level_reached = session.level_reached or 1
        working_memory_score = min(100, level_reached * 18)  # Each level represents working memory challenge
        analysis['working_memory'] = working_memory_score
        
        # Executive function (error management and adaptation)
        if session.total_attempts and session.total_attempts > 0:
            error_rate = (session.failed_attempts or 0) / session.total_attempts
            error_management = max(0, 100 - (error_rate * 120))  # Penalize errors but not too harshly
            analysis['executive_function'] = min(100, error_management)
        else:
            analysis['executive_function'] = 70  # Default moderate score
        
        # Processing speed (actions per minute)
        if duration_minutes > 0 and session.successful_attempts:
            actions_per_minute = session.successful_attempts / duration_minutes
            # Good range is 3-20 actions per minute depending on game
            processing_speed = min(100, max(0, (actions_per_minute / 15) * 100))
            analysis['processing_speed'] = processing_speed
        else:
            analysis['processing_speed'] = 50  # Default moderate speed
        
        # Cognitive flexibility (adaptation to increasing difficulty)
        if level_reached > 1:
            flexibility_score = min(100, (level_reached - 1) * 25)  # Bonus for reaching higher levels
            analysis['cognitive_flexibility'] = flexibility_score
        else:
            analysis['cognitive_flexibility'] = 30  # Lower for staying at basic level
        
        # Decision making (based on accuracy under time pressure)
        if session.session_duration and session.session_duration > 0:
            decisions_per_second = (session.total_attempts or 1) / session.session_duration
            decision_quality = (session.successful_attempts or 0) / (session.total_attempts or 1)
            decision_score = min(100, (decision_quality * 70) + (decisions_per_second * 30))
            analysis['decision_making'] = decision_score
        else:
            analysis['decision_making'] = 60  # Default
        
        print(f"✅ Cognitive analysis complete: {analysis}")
        return analysis
    
    def _calculate_engagement_metrics(self, session, duration_minutes):
        """Calculate engagement and motivation metrics"""
        engagement = {}
        
        # Session length engagement (3-8 minutes is optimal)
        if 3 <= duration_minutes <= 8:
            engagement['duration_quality'] = 100
        elif 2 <= duration_minutes < 3:
            engagement['duration_quality'] = 80
        elif 1 <= duration_minutes < 2:
            engagement['duration_quality'] = 60
        elif duration_minutes < 1:
            engagement['duration_quality'] = 30
        else:  # > 8 minutes
            engagement['duration_quality'] = max(60, 100 - (duration_minutes - 8) * 5)
        
        # Completion engagement (level progression)
        level_reached = session.level_reached or 1
        engagement['completion_engagement'] = min(100, level_reached * 25)
        
        # Score progression
        if session.score:
            score_per_minute = session.score / duration_minutes if duration_minutes > 0 else 0
            engagement['score_progression'] = min(100, score_per_minute * 2)
        else:
            engagement['score_progression'] = 0
        
        # Overall engagement
        engagement['overall'] = (
            engagement['duration_quality'] * 0.4 +
            engagement['completion_engagement'] * 0.35 +
            engagement['score_progression'] * 0.25
        )
        
        return engagement
    
    def _calculate_movement_smoothness(self, tracking_data):
        """Calculate movement smoothness from hand tracking data"""
        if not tracking_data or len(tracking_data) < 3:
            return 50  # Default moderate smoothness
        
        try:
            velocities = []
            for i in range(1, len(tracking_data)):
                if i >= len(tracking_data):
                    break
                
                prev_point = tracking_data[i-1]
                curr_point = tracking_data[i]
                
                if isinstance(prev_point, dict) and isinstance(curr_point, dict):
                    dx = curr_point.get('x', 0) - prev_point.get('x', 0)
                    dy = curr_point.get('y', 0) - prev_point.get('y', 0)
                    dt = curr_point.get('timestamp', 0) - prev_point.get('timestamp', 1)
                    
                    if dt > 0:
                        velocity = math.sqrt(dx*dx + dy*dy) / dt
                        velocities.append(velocity)
            
            if not velocities:
                return 50
            
            # Smoothness is inversely related to velocity variation
            velocity_std = np.std(velocities)
            smoothness = max(0, min(100, 100 - (velocity_std * 20)))
            
            return smoothness
            
        except Exception as e:
            print(f"⚠️ Error calculating smoothness: {e}")
            return 50
    
    def _update_progress_data(self, user_id, metrics):
        """Update user progress data based on session metrics"""
        from models import db, ProgressData
        
        try:
            # Calculate composite scores
            motor_score = self._calculate_motor_score(metrics.get('motor', {}))
            cognitive_score = self._calculate_cognitive_score(metrics.get('cognitive', {}))
            
            # Extract specific metrics safely
            motor_data = metrics.get('motor', {})
            cognitive_data = metrics.get('cognitive', {})
            
            progress = ProgressData(
                user_id=user_id,
                motor_skills_score=motor_score,
                cognitive_skills_score=cognitive_score,
                hand_eye_coordination=motor_data.get('hand_eye_coordination', 0),
                reaction_time=motor_data.get('average_reaction_time', 0),
                fine_motor_score=motor_data.get('fine_motor_control', 0),
                gross_motor_score=motor_data.get('bilateral_coordination', 0),
                attention_score=cognitive_data.get('sustained_attention', 0),
                memory_score=cognitive_data.get('working_memory', 0),
                executive_function_score=cognitive_data.get('executive_function', 0),
                processing_speed_score=cognitive_data.get('processing_speed', 0),
                overall_development_score=(motor_score + cognitive_score) / 2,
                assessment_date=datetime.utcnow()
            )
            
            db.session.add(progress)
            db.session.commit()
            print(f"✅ Updated progress data for user {user_id}")
            
        except Exception as e:
            print(f"❌ Error updating progress data: {e}")
            db.session.rollback()
    
    def _calculate_motor_score(self, motor_metrics):
        """Calculate overall motor skills score with proper weighting"""
        if not motor_metrics:
            return 0
        
        # Define weights for different motor skills
        weights = {
            'hand_eye_coordination': 0.3,
            'fine_motor_control': 0.25,
            'movement_smoothness': 0.2,
            'bilateral_coordination': 0.15,
            'movement_precision': 0.1
        }
        
        weighted_score = 0
        total_weight = 0
        
        for metric, weight in weights.items():
            if metric in motor_metrics and motor_metrics[metric] is not None:
                weighted_score += motor_metrics[metric] * weight
                total_weight += weight
        
        # If no metrics available, return 0
        if total_weight == 0:
            return 0
        
        # Normalize by actual total weight used
        final_score = weighted_score / total_weight if total_weight > 0 else 0
        return min(100, max(0, final_score))
    
    def _calculate_cognitive_score(self, cognitive_metrics):
        """Calculate overall cognitive skills score with proper weighting"""
        if not cognitive_metrics:
            return 0
        
        # Define weights for different cognitive skills
        weights = {
            'sustained_attention': 0.3,
            'working_memory': 0.25,
            'executive_function': 0.2,
            'processing_speed': 0.15,
            'cognitive_flexibility': 0.1
        }
        
        weighted_score = 0
        total_weight = 0
        
        for metric, weight in weights.items():
            if metric in cognitive_metrics and cognitive_metrics[metric] is not None:
                weighted_score += cognitive_metrics[metric] * weight
                total_weight += weight
        
        # If no metrics available, return 0
        if total_weight == 0:
            return 0
        
        # Normalize by actual total weight used
        final_score = weighted_score / total_weight if total_weight > 0 else 0
        return min(100, max(0, final_score))
    
    def _generate_session_insights(self, session, metrics):
        """Generate AI insights for a specific session"""
        insights = {
            'motor': {},
            'cognitive': {},
            'recommendations': [],
            'improvement_areas': [],
            'strengths': [],
            'trajectory': 'stable',
            'attention_risk': 0.0,
            'motor_risk': 0.0,
            'overall_risk': 0.0,
            'confidence': 0.85
        }
        
        # Calculate composite scores
        motor_score = self._calculate_motor_score(metrics.get('motor', {}))
        cognitive_score = self._calculate_cognitive_score(metrics.get('cognitive', {}))
        
        print(f"📊 Session scores - Motor: {motor_score:.1f}, Cognitive: {cognitive_score:.1f}")
        
        # Motor analysis summary
        insights['motor'] = {
            'overall_score': round(motor_score, 1),
            'level': self._get_performance_level(motor_score, self.motor_thresholds),
            'details': metrics.get('motor', {})
        }
        
        # Cognitive analysis summary
        insights['cognitive'] = {
            'overall_score': round(cognitive_score, 1),
            'level': self._get_performance_level(cognitive_score, self.cognitive_thresholds),
            'details': metrics.get('cognitive', {})
        }
        
        # Generate personalized recommendations
        insights['recommendations'] = self._generate_recommendations(
            motor_score, cognitive_score, metrics, session
        )
        
        # Identify strengths and improvement areas
        insights['strengths'], insights['improvement_areas'] = self._identify_strengths_and_improvements(
            metrics, motor_score, cognitive_score
        )
        
        # Calculate risk scores
        insights['motor_risk'] = max(0, min(100, (75 - motor_score) / 75 * 100))
        insights['attention_risk'] = max(0, min(100, (75 - cognitive_score) / 75 * 100))
        insights['overall_risk'] = (insights['motor_risk'] + insights['attention_risk']) / 2
        
        # Determine trajectory based on performance
        if motor_score >= 80 and cognitive_score >= 80:
            insights['trajectory'] = 'excellent_progress'
        elif motor_score >= 65 and cognitive_score >= 65:
            insights['trajectory'] = 'steady_improvement'
        elif motor_score < 40 or cognitive_score < 40:
            insights['trajectory'] = 'needs_attention'
        else:
            insights['trajectory'] = 'stable'
        
        print(f"💡 Generated insights with trajectory: {insights['trajectory']}")
        return insights
    
    def _get_performance_level(self, score, thresholds):
        """Determine performance level based on score and thresholds"""
        if score >= thresholds['excellent']:
            return 'Excellent'
        elif score >= thresholds['good']:
            return 'Good'
        elif score >= thresholds['developing']:
            return 'Developing'
        else:
            return 'Needs Attention'
    
    def _generate_recommendations(self, motor_score, cognitive_score, metrics, session):
        """Generate personalized recommendations based on performance"""
        recommendations = []
        game_name = session.game_name or 'Unknown Game'
        
        # Motor skill recommendations
        if motor_score < self.motor_thresholds['developing']:
            if 'Follow the Dot' in game_name:
                recommendations.append({
                    'title': 'Improve Tracing Skills',
                    'description': 'Practice slow, smooth tracing movements to improve hand-eye coordination',
                    'category': 'Motor Skills',
                    'priority': 'high',
                    'icon': 'pencil-alt'
                })
            elif 'Bubble Pop' in game_name:
                recommendations.append({
                    'title': 'Target Practice',
                    'description': 'Focus on accurate pointing and tapping rather than speed',
                    'category': 'Coordination',
                    'priority': 'high',
                    'icon': 'bullseye'
                })
            
            recommendations.append({
                'title': 'Daily Fine Motor Practice',
                'description': 'Spend 10-15 minutes daily on fine motor activities like drawing or puzzles',
                'category': 'Practice',
                'priority': 'medium',
                'icon': 'clock'
            })
        
        elif motor_score >= self.motor_thresholds['good']:
            recommendations.append({
                'title': 'Excellent Motor Skills!',
                'description': 'Your hand-eye coordination is developing very well. Keep practicing!',
                'category': 'Encouragement',
                'priority': 'low',
                'icon': 'thumbs-up'
            })
        
        # Cognitive recommendations
        if cognitive_score < self.cognitive_thresholds['developing']:
            recommendations.append({
                'title': 'Build Attention Span',
                'description': 'Start with shorter practice sessions and gradually increase duration',
                'category': 'Attention',
                'priority': 'high',
                'icon': 'brain'
            })
            
            recommendations.append({
                'title': 'Memory Games',
                'description': 'Practice pattern recognition and memory games to boost working memory',
                'category': 'Memory',
                'priority': 'medium',
                'icon': 'puzzle-piece'
            })
        
        elif cognitive_score >= self.cognitive_thresholds['good']:
            recommendations.append({
                'title': 'Great Focus!',
                'description': 'Your attention and cognitive skills are showing excellent development',
                'category': 'Encouragement',
                'priority': 'low',
                'icon': 'star'
            })
        
        # Session-specific recommendations
        engagement = metrics.get('engagement', {})
        if engagement.get('duration_quality', 50) < 60:
            if engagement.get('overall', 50) < 40:
                recommendations.append({
                    'title': 'Optimize Session Length',
                    'description': 'Try playing for 3-5 minutes for better engagement and learning',
                    'category': 'Session Management',
                    'priority': 'medium',
                    'icon': 'hourglass-half'
                })
        
        # Hand dominance recommendations
        hand_dom = metrics.get('hand_dominance', {})
        if hand_dom.get('dominance_consistency', 0) > 30:
            recommendations.append({
                'title': 'Practice with Both Hands',
                'description': 'Encourage using both hands equally to improve bilateral coordination',
                'category': 'Coordination',
                'priority': 'medium',
                'icon': 'hands-helping'
            })
        
        # Level progression recommendations
        if (session.level_reached or 1) < 2:
            recommendations.append({
                'title': 'Focus on Accuracy First',
                'description': 'Master each level completely before moving to the next for better skill building',
                'category': 'Strategy',
                'priority': 'medium',
                'icon': 'target'
            })
        
        # Ensure we have some recommendations
        if not recommendations:
            recommendations.extend([
                {
                    'title': 'Keep Up the Great Work!',
                    'description': 'Continue regular practice to maintain and improve your skills',
                    'category': 'General',
                    'priority': 'low',
                    'icon': 'heart'
                },
                {
                    'title': 'Try Different Challenges',
                    'description': 'Explore both games to develop different aspects of motor and cognitive skills',
                    'category': 'Variety',
                    'priority': 'low',
                    'icon': 'gamepad'
                }
            ])
        
        return recommendations[:5]  # Limit to 5 recommendations to avoid overwhelm
    
    def _identify_strengths_and_improvements(self, metrics, motor_score, cognitive_score):
        """Identify specific strengths and improvement areas"""
        strengths = []
        improvements = []
        
        # Motor performance analysis
        motor_data = metrics.get('motor', {})
        
        if motor_data.get('hand_eye_coordination', 0) > 75:
            strengths.append("Excellent hand-eye coordination")
        elif motor_data.get('hand_eye_coordination', 0) < 50:
            improvements.append("Hand-eye coordination needs more practice")
        
        if motor_data.get('movement_smoothness', 0) > 80:
            strengths.append("Very smooth and controlled movements")
        elif motor_data.get('movement_smoothness', 0) < 60:
            improvements.append("Focus on smoother, more controlled movements")
        
        if motor_data.get('fine_motor_control', 0) > 75:
            strengths.append("Good fine motor precision")
        elif motor_data.get('fine_motor_control', 0) < 55:
            improvements.append("Fine motor skills need development")
        
        if motor_data.get('bilateral_coordination', 0) > 80:
            strengths.append("Great bilateral hand coordination")
        elif motor_data.get('bilateral_coordination', 0) < 60:
            improvements.append("Work on using both hands equally")
        
        # Cognitive performance analysis
        cognitive_data = metrics.get('cognitive', {})
        
        if cognitive_data.get('sustained_attention', 0) > 80:
            strengths.append("Excellent attention and focus")
        elif cognitive_data.get('sustained_attention', 0) < 60:
            improvements.append("Attention span can be improved with practice")
        
        if cognitive_data.get('working_memory', 0) > 75:
            strengths.append("Strong working memory skills")
        elif cognitive_data.get('working_memory', 0) < 55:
            improvements.append("Memory exercises would be beneficial")
        
        if cognitive_data.get('executive_function', 0) > 75:
            strengths.append("Good decision-making and error management")
        elif cognitive_data.get('executive_function', 0) < 55:
            improvements.append("Work on planning and error correction")
        
        if cognitive_data.get('processing_speed', 0) > 70:
            strengths.append("Good processing speed")
        elif cognitive_data.get('processing_speed', 0) < 50:
            improvements.append("Processing speed can be improved")
        
        # Engagement analysis
        engagement = metrics.get('engagement', {})
        if engagement.get('overall', 0) > 80:
            strengths.append("High engagement and motivation")
        elif engagement.get('overall', 0) < 50:
            improvements.append("Try shorter, more frequent practice sessions")
        
        # Overall performance
        if motor_score > 80 and cognitive_score > 80:
            strengths.append("Outstanding overall development!")
        elif motor_score > 65 and cognitive_score > 65:
            strengths.append("Good balanced skill development")
        
        # Ensure we have some feedback
        if not strengths and not improvements:
            strengths.append("Completed the activity successfully")
            improvements.append("Continue practicing to see improvement")
        
        return strengths[:4], improvements[:4]  # Limit for readability
    
    def generate_comprehensive_insights(self, user_id):
        """Generate comprehensive insights based on multiple sessions"""
        from models import db, GameSession, AIInsight
        
        try:
            print(f"🔄 Generating comprehensive insights for user {user_id}")
            
            # Get recent sessions (last 30 days)
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            sessions = GameSession.query.filter(
                GameSession.user_id == user_id,
                GameSession.session_date >= cutoff_date
            ).order_by(GameSession.session_date.asc()).all()
            
            if not sessions:
                print(f"⚠️ No recent sessions found for user {user_id}")
                return None
            
            print(f"📊 Analyzing {len(sessions)} sessions for comprehensive insights")
            
            # Analyze trends across sessions
            trends = self._analyze_performance_trends(sessions)
            
            # Generate predictions and recommendations
            predictions = self._generate_long_term_recommendations(sessions, trends)
            
            # Create comprehensive insight
            comprehensive_insight = AIInsight(
                user_id=user_id,
                insight_type='comprehensive',
                motor_analysis=json.dumps(trends.get('motor', {})),
                cognitive_analysis=json.dumps(trends.get('cognitive', {})),
                recommendations=json.dumps(predictions.get('recommendations', [])),
                improvement_areas=json.dumps(trends.get('improvement_areas', [])),
                strengths=json.dumps(trends.get('strengths', [])),
                progress_trajectory=trends.get('trajectory', 'stable'),
                attention_risk_score=trends.get('attention_risk', 0.0),
                motor_risk_score=trends.get('motor_risk', 0.0),
                overall_development_risk=trends.get('overall_risk', 0.0),
                confidence_score=0.9,
                generated_date=datetime.utcnow()
            )
            
            db.session.add(comprehensive_insight)
            db.session.commit()
            
            print(f"✅ Generated comprehensive insights for user {user_id}")
            return comprehensive_insight
            
        except Exception as e:
            print(f"❌ Error generating comprehensive insights: {e}")
            db.session.rollback()
            return None
    
    def _analyze_performance_trends(self, sessions):
        """Analyze performance trends over multiple sessions"""
        trends = {
            'motor': {},
            'cognitive': {},
            'strengths': [],
            'improvement_areas': [],
            'trajectory': 'stable',
            'attention_risk': 0.0,
            'motor_risk': 0.0,
            'overall_risk': 0.0
        }
        
        if len(sessions) < 2:
            return trends
        
        try:
            # Extract session data for trend analysis
            session_data = []
            for session in sessions:
                accuracy = 0
                if session.total_attempts and session.total_attempts > 0:
                    accuracy = (session.successful_attempts / session.total_attempts) * 100
                
                session_data.append({
                    'date': session.session_date,
                    'score': session.score or 0,
                    'accuracy': accuracy,
                    'duration': session.session_duration or 60,
                    'level': session.level_reached or 1,
                    'game': session.game_name or 'Unknown'
                })
            
            df = pd.DataFrame(session_data)
            
            # Calculate trends using linear regression if we have enough data
            if len(df) >= 3:
                X = np.array(range(len(df))).reshape(-1, 1)
                
                # Score trend
                if df['score'].sum() > 0:  # Only if we have actual scores
                    score_model = LinearRegression().fit(X, df['score'])
                    score_trend = score_model.coef_[0]
                else:
                    score_trend = 0
                
                # Accuracy trend
                if df['accuracy'].sum() > 0:
                    accuracy_model = LinearRegression().fit(X, df['accuracy'])
                    accuracy_trend = accuracy_model.coef_[0]
                else:
                    accuracy_trend = 0
                
                # Determine overall trajectory
                if score_trend > 5 and accuracy_trend > 2:
                    trends['trajectory'] = 'excellent_improvement'
                elif score_trend > 2 and accuracy_trend > 1:
                    trends['trajectory'] = 'steady_improvement'
                elif score_trend < -5 or accuracy_trend < -2:
                    trends['trajectory'] = 'needs_attention'
                else:
                    trends['trajectory'] = 'stable'
                
                # Calculate recent performance
                recent_sessions = df.tail(5)
                recent_avg_accuracy = recent_sessions['accuracy'].mean()
                recent_avg_duration = recent_sessions['duration'].mean()
                recent_avg_score = recent_sessions['score'].mean()
                
                # Risk assessment
                trends['motor_risk'] = max(0, min(100, (70 - recent_avg_accuracy) / 70 * 100))
                trends['attention_risk'] = max(0, min(100, (120 - recent_avg_duration) / 120 * 100))
                trends['overall_risk'] = (trends['motor_risk'] + trends['attention_risk']) / 2
                
                # Identify overall trends
                if score_trend > 0:
                    trends['strengths'].append("Showing consistent score improvement")
                if accuracy_trend > 0:
                    trends['strengths'].append("Accuracy is improving over time")
                if recent_avg_duration > df.head(5)['duration'].mean():
                    trends['strengths'].append("Session engagement is increasing")
                
                if score_trend < 0:
                    trends['improvement_areas'].append("Focus on maintaining performance consistency")
                if recent_avg_accuracy < 60:
                    trends['improvement_areas'].append("Work on improving overall accuracy")
                if recent_avg_duration < 120:  # Less than 2 minutes
                    trends['improvement_areas'].append("Consider longer practice sessions")
                
                # Motor and cognitive trend analysis
                trends['motor'] = {
                    'average_accuracy': recent_avg_accuracy,
                    'trend': 'improving' if accuracy_trend > 1 else 'stable' if accuracy_trend > -1 else 'declining',
                    'score_trend': score_trend,
                    'performance_consistency': 100 - min(100, df['accuracy'].std())
                }
                
                trends['cognitive'] = {
                    'average_attention_duration': recent_avg_duration / 60,
                    'engagement_trend': 'improving' if recent_avg_duration > df.head(5)['duration'].mean() else 'stable',
                    'level_progression': recent_sessions['level'].max(),
                    'working_memory_indicator': recent_sessions['level'].mean()
                }
            
            return trends
            
        except Exception as e:
            print(f"❌ Error analyzing trends: {e}")
            return trends
    
    def _generate_long_term_recommendations(self, sessions, trends):
        """Generate long-term recommendations based on trends"""
        recommendations = []
        
        try:
            trajectory = trends.get('trajectory', 'stable')
            motor_risk = trends.get('motor_risk', 0)
            attention_risk = trends.get('attention_risk', 0)
            
            # Trajectory-based recommendations
            if trajectory == 'excellent_improvement':
                recommendations.extend([
                    {
                        'title': 'Outstanding Progress!',
                        'description': 'Continue your current practice routine - you\'re showing excellent improvement',
                        'category': 'Motivation',
                        'priority': 'high',
                        'icon': 'trophy'
                    },
                    {
                        'title': 'Try Advanced Challenges',
                        'description': 'You\'re ready for more complex patterns and higher difficulty levels',
                        'category': 'Progression',
                        'priority': 'medium',
                        'icon': 'arrow-up'
                    }
                ])
            
            elif trajectory == 'needs_attention':
                recommendations.extend([
                    {
                        'title': 'Adjust Practice Approach',
                        'description': 'Consider shorter, more frequent practice sessions with focus on accuracy',
                        'category': 'Strategy',
                        'priority': 'high',
                        'icon': 'bullseye'
                    },
                    {
                        'title': 'Seek Additional Support',
                        'description': 'Consider working with a therapist or educator for personalized guidance',
                        'category': 'Support',
                        'priority': 'medium',
                        'icon': 'user-friends'
                    }
                ])
            
            # Risk-based recommendations
            if motor_risk > 60:
                recommendations.append({
                    'title': 'Focus on Motor Skills',
                    'description': 'Increase fine motor practice activities outside of games',
                    'category': 'Motor Development',
                    'priority': 'high',
                    'icon': 'hand-paper'
                })
            
            if attention_risk > 60:
                recommendations.append({
                    'title': 'Build Attention Gradually',
                    'description': 'Start with very short sessions and slowly increase duration',
                    'category': 'Attention',
                    'priority': 'high',
                    'icon': 'brain'
                })
            
            # Game variety recommendations
            game_variety = len(set(s.game_name for s in sessions if s.game_name))
            if game_variety < 2:
                recommendations.append({
                    'title': 'Try Different Games',
                    'description': 'Playing both Follow the Dot and Bubble Pop provides balanced skill development',
                    'category': 'Variety',
                    'priority': 'medium',
                    'icon': 'gamepad'
                })
            
            # Session frequency recommendations
            session_days = len(set(s.session_date.date() for s in sessions if s.session_date))
            if session_days < 10:  # Less than 10 days in the last month
                recommendations.append({
                    'title': 'Increase Practice Frequency',
                    'description': 'Aim for 15-20 minutes of practice 4-5 times per week',
                    'category': 'Schedule',
                    'priority': 'medium',
                    'icon': 'calendar-alt'
                })
            
            # Default positive recommendations
            if not recommendations:
                recommendations.extend([
                    {
                        'title': 'Maintain Current Progress',
                        'description': 'Your consistent practice is paying off. Keep up the great work!',
                        'category': 'Encouragement',
                        'priority': 'low',
                        'icon': 'thumbs-up'
                    },
                    {
                        'title': 'Set New Goals',
                        'description': 'Challenge yourself with specific targets like reaching higher levels or improving accuracy',
                        'category': 'Goal Setting',
                        'priority': 'low',
                        'icon': 'target'
                    }
                ])
            
            return {
                'recommendations': recommendations[:6],  # Limit to prevent overwhelm
                'expected_improvement': trajectory,
                'focus_areas': trends.get('improvement_areas', [])
            }
            
        except Exception as e:
            print(f"❌ Error generating long-term recommendations: {e}")
            return {'recommendations': [], 'expected_improvement': 'stable', 'focus_areas': []}