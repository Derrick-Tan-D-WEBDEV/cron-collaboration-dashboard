from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import logging
import asyncio
import os
import redis
import json
from contextlib import asynccontextmanager

# ML and Analytics imports
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score, precision_score, recall_score
import joblib

# Data processing
from scipy import stats
import sqlite3
from sqlalchemy import create_engine
import psycopg2
from datetime import timezone

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class CronJobData(BaseModel):
    id: str
    name: str
    schedule: str
    command: str
    status: str
    environment: str
    priority: str
    workspace_id: str
    created_at: datetime
    metadata: Dict[str, Any] = {}

class ExecutionData(BaseModel):
    id: str
    cron_job_id: str
    start_time: datetime
    end_time: Optional[datetime]
    duration: Optional[float]
    status: str
    exit_code: Optional[int]
    resource_usage: Dict[str, float]
    metadata: Dict[str, Any] = {}

class PredictionRequest(BaseModel):
    job_id: str
    prediction_type: str = Field(..., regex="^(failure|performance|resource|schedule)$")
    time_horizon: int = Field(default=24, ge=1, le=168)  # 1 hour to 1 week
    features: Optional[Dict[str, Any]] = None

class AnalyticsRequest(BaseModel):
    workspace_id: str
    time_range: Dict[str, datetime]
    metrics: List[str] = ["performance", "failures", "resource_usage", "execution_time"]
    aggregation: str = Field(default="daily", regex="^(hourly|daily|weekly)$")

class OptimizationRequest(BaseModel):
    job_id: str
    optimization_type: str = Field(..., regex="^(schedule|resource|retry|timeout)$")
    constraints: Optional[Dict[str, Any]] = None

class ModelTrainingRequest(BaseModel):
    model_type: str = Field(..., regex="^(failure_prediction|performance_forecast|resource_optimization|anomaly_detection)$")
    workspace_id: str
    training_data_days: int = Field(default=30, ge=7, le=365)
    hyperparameters: Optional[Dict[str, Any]] = None

class PredictionResponse(BaseModel):
    job_id: str
    prediction_type: str
    prediction: Dict[str, Any]
    confidence: float
    suggestions: List[str]
    created_at: datetime
    expires_at: datetime

class AnalyticsResponse(BaseModel):
    workspace_id: str
    time_range: Dict[str, datetime]
    metrics: Dict[str, Any]
    trends: Dict[str, List[Dict]]
    predictions: Dict[str, Any]
    insights: List[str]

# Global variables for models and services
models_cache = {}
redis_client = None
db_engine = None

class AnalyticsEngine:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', 6379)),
            decode_responses=True
        )
        
        # Database connection
        db_url = os.getenv('DATABASE_URL', 'postgresql://cron_user:password@localhost:5432/cron_dashboard')
        self.db_engine = create_engine(db_url)
        
        # Initialize models
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize ML models for different prediction types"""
        try:
            # Failure prediction model (RandomForest Classifier)
            self.models['failure_prediction'] = {
                'model': RandomForestRegressor(n_estimators=100, random_state=42),
                'features': [
                    'avg_runtime', 'failure_rate', 'cpu_usage', 'memory_usage',
                    'execution_count', 'hour_of_day', 'day_of_week',
                    'environment_encoded', 'priority_encoded'
                ],
                'target': 'failure_probability',
                'last_trained': None,
                'accuracy': None
            }
            
            # Performance forecasting model (Linear Regression)
            self.models['performance_forecast'] = {
                'model': LinearRegression(),
                'features': [
                    'historical_runtime', 'resource_usage_trend', 'load_pattern',
                    'time_series_features', 'seasonal_components'
                ],
                'target': 'future_runtime',
                'last_trained': None,
                'accuracy': None
            }
            
            # Resource optimization model (RandomForest Regressor)
            self.models['resource_optimization'] = {
                'model': RandomForestRegressor(n_estimators=50, random_state=42),
                'features': [
                    'current_cpu', 'current_memory', 'job_complexity',
                    'historical_pattern', 'optimal_timing'
                ],
                'target': 'optimal_resources',
                'last_trained': None,
                'accuracy': None
            }
            
            # Anomaly detection model (Isolation Forest)
            self.models['anomaly_detection'] = {
                'model': IsolationForest(contamination=0.1, random_state=42),
                'features': [
                    'runtime_zscore', 'resource_usage_deviation',
                    'failure_pattern_anomaly', 'execution_frequency_anomaly'
                ],
                'target': 'anomaly_score',
                'last_trained': None,
                'accuracy': None
            }
            
            logger.info("Analytics models initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
    
    async def get_job_data(self, job_id: str, days: int = 30) -> pd.DataFrame:
        """Fetch job data for analysis"""
        try:
            query = """
                SELECT 
                    cj.id, cj.name, cj.schedule, cj.command, cj.status,
                    cj.environment, cj.priority, cj.max_runtime, cj.retries,
                    e.start_time, e.end_time, e.duration, e.status as exec_status,
                    e.exit_code, e.resource_usage,
                    js.total_runs, js.successful_runs, js.failed_runs,
                    js.average_runtime, js.uptime_percentage
                FROM cron_jobs cj
                LEFT JOIN executions e ON cj.id = e.cron_job_id
                LEFT JOIN job_statistics js ON cj.id = js.cron_job_id
                WHERE cj.id = %s AND e.start_time >= %s
                ORDER BY e.start_time DESC
            """
            
            start_date = datetime.now() - timedelta(days=days)
            
            df = pd.read_sql(query, self.db_engine, params=[job_id, start_date])
            
            if df.empty:
                logger.warning(f"No data found for job {job_id}")
                return pd.DataFrame()
            
            # Process resource usage JSON
            if 'resource_usage' in df.columns:
                df['cpu_usage'] = df['resource_usage'].apply(
                    lambda x: json.loads(x).get('cpu_percent', 0) if x else 0
                )
                df['memory_usage'] = df['resource_usage'].apply(
                    lambda x: json.loads(x).get('memory_mb', 0) if x else 0
                )
            
            # Feature engineering
            df['hour_of_day'] = pd.to_datetime(df['start_time']).dt.hour
            df['day_of_week'] = pd.to_datetime(df['start_time']).dt.dayofweek
            df['is_weekend'] = df['day_of_week'].isin([5, 6])
            df['failure_rate'] = df['failed_runs'] / (df['total_runs'] + 1)
            
            # Encode categorical variables
            df['environment_encoded'] = pd.Categorical(df['environment']).codes
            df['priority_encoded'] = pd.Categorical(df['priority']).codes
            
            return df
            
        except Exception as e:
            logger.error(f"Error fetching job data: {str(e)}")
            return pd.DataFrame()
    
    async def predict_failure_probability(self, job_id: str, time_horizon: int = 24) -> Dict[str, Any]:
        """Predict job failure probability"""
        try:
            df = await self.get_job_data(job_id, days=30)
            
            if df.empty:
                return {
                    'probability': 0.0,
                    'confidence': 0.0,
                    'reasoning': 'Insufficient historical data'
                }
            
            model_info = self.models['failure_prediction']
            model = model_info['model']
            
            # Prepare features
            latest_data = df.iloc[0] if not df.empty else None
            if latest_data is None:
                return {'probability': 0.0, 'confidence': 0.0, 'reasoning': 'No recent data'}
            
            features = np.array([[
                latest_data.get('average_runtime', 0),
                latest_data.get('failure_rate', 0),
                latest_data.get('cpu_usage', 0),
                latest_data.get('memory_usage', 0),
                latest_data.get('total_runs', 0),
                latest_data.get('hour_of_day', 0),
                latest_data.get('day_of_week', 0),
                latest_data.get('environment_encoded', 0),
                latest_data.get('priority_encoded', 0)
            ]])
            
            # Check if model is trained
            if model_info['last_trained'] is None:
                await self.train_model('failure_prediction', job_id)
            
            # Make prediction
            try:
                probability = model.predict(features)[0]
                probability = max(0.0, min(1.0, probability))  # Clamp between 0 and 1
                
                # Calculate confidence based on data quality and model accuracy
                confidence = min(0.9, len(df) / 100.0) * (model_info['accuracy'] or 0.5)
                
                # Generate reasoning
                reasoning_factors = []
                if latest_data.get('failure_rate', 0) > 0.1:
                    reasoning_factors.append('High historical failure rate')
                if latest_data.get('average_runtime', 0) > latest_data.get('max_runtime', 3600):
                    reasoning_factors.append('Runtime exceeds maximum threshold')
                if latest_data.get('cpu_usage', 0) > 80:
                    reasoning_factors.append('High CPU usage pattern')
                
                reasoning = '; '.join(reasoning_factors) if reasoning_factors else 'Based on historical patterns'
                
                return {
                    'probability': float(probability),
                    'confidence': float(confidence),
                    'reasoning': reasoning,
                    'risk_factors': reasoning_factors
                }
                
            except Exception as e:
                logger.error(f"Prediction error: {str(e)}")
                return {'probability': 0.0, 'confidence': 0.0, 'reasoning': 'Model prediction failed'}
                
        except Exception as e:
            logger.error(f"Error in failure prediction: {str(e)}")
            return {'probability': 0.0, 'confidence': 0.0, 'reasoning': 'Prediction service error'}
    
    async def forecast_performance(self, job_id: str, time_horizon: int = 24) -> Dict[str, Any]:
        """Forecast job performance metrics"""
        try:
            df = await self.get_job_data(job_id, days=30)
            
            if df.empty or len(df) < 5:
                return {
                    'forecasted_runtime': 0.0,
                    'forecasted_success_rate': 0.0,
                    'confidence': 0.0,
                    'trend': 'insufficient_data'
                }
            
            # Time series analysis
            df['timestamp'] = pd.to_datetime(df['start_time'])
            df = df.sort_values('timestamp')
            
            # Calculate trends
            recent_runtime = df['duration'].tail(10).mean()
            historical_runtime = df['duration'].head(10).mean()
            
            runtime_trend = 'improving' if recent_runtime < historical_runtime else 'degrading'
            if abs(recent_runtime - historical_runtime) / historical_runtime < 0.1:
                runtime_trend = 'stable'
            
            # Success rate forecast
            recent_success_rate = (df['exec_status'] == 'completed').tail(20).mean()
            
            # Resource usage forecast
            cpu_forecast = df['cpu_usage'].tail(10).mean()
            memory_forecast = df['memory_usage'].tail(10).mean()
            
            return {
                'forecasted_runtime': float(recent_runtime or 0),
                'forecasted_success_rate': float(recent_success_rate),
                'forecasted_cpu_usage': float(cpu_forecast),
                'forecasted_memory_usage': float(memory_forecast),
                'confidence': min(0.9, len(df) / 50.0),
                'trend': runtime_trend,
                'data_points': len(df)
            }
            
        except Exception as e:
            logger.error(f"Error in performance forecasting: {str(e)}")
            return {
                'forecasted_runtime': 0.0,
                'forecasted_success_rate': 0.0,
                'confidence': 0.0,
                'trend': 'error'
            }
    
    async def generate_optimization_suggestions(self, job_id: str) -> List[Dict[str, Any]]:
        """Generate optimization suggestions for a job"""
        try:
            df = await self.get_job_data(job_id)
            
            if df.empty:
                return []
            
            suggestions = []
            latest = df.iloc[0] if not df.empty else None
            
            if latest is None:
                return []
            
            # Schedule optimization
            if latest.get('failure_rate', 0) > 0.2:
                suggestions.append({
                    'type': 'schedule',
                    'current': latest.get('schedule', ''),
                    'suggested': 'Consider less frequent execution during peak hours',
                    'expected_improvement': 0.3,
                    'confidence': 0.7,
                    'reasoning': 'High failure rate suggests timing conflicts',
                    'priority': 'high'
                })
            
            # Resource optimization
            if latest.get('cpu_usage', 0) > 80:
                suggestions.append({
                    'type': 'resource',
                    'current': {'cpu_limit': 'unlimited'},
                    'suggested': {'cpu_limit': '2 cores', 'memory_limit': '4GB'},
                    'expected_improvement': 0.2,
                    'confidence': 0.8,
                    'reasoning': 'High CPU usage indicates resource constraints',
                    'priority': 'medium'
                })
            
            # Timeout optimization
            avg_runtime = latest.get('average_runtime', 0)
            max_runtime = latest.get('max_runtime', 3600)
            
            if avg_runtime > 0 and max_runtime > avg_runtime * 3:
                suggestions.append({
                    'type': 'timeout',
                    'current': max_runtime,
                    'suggested': int(avg_runtime * 2),
                    'expected_improvement': 0.15,
                    'confidence': 0.9,
                    'reasoning': 'Timeout is unnecessarily high compared to average runtime',
                    'priority': 'low'
                })
            
            # Retry optimization
            if latest.get('failure_rate', 0) > 0.1 and latest.get('retries', 0) < 3:
                suggestions.append({
                    'type': 'retry',
                    'current': latest.get('retries', 0),
                    'suggested': 3,
                    'expected_improvement': 0.4,
                    'confidence': 0.6,
                    'reasoning': 'Moderate failure rate suggests benefits from retry logic',
                    'priority': 'medium'
                })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating optimization suggestions: {str(e)}")
            return []
    
    async def train_model(self, model_type: str, workspace_id: str = None, job_id: str = None):
        """Train ML models with recent data"""
        try:
            if model_type not in self.models:
                raise ValueError(f"Unknown model type: {model_type}")
            
            model_info = self.models[model_type]
            
            # Fetch training data
            if job_id:
                df = await self.get_job_data(job_id, days=90)
            else:
                # Fetch workspace-wide data
                query = """
                    SELECT cj.*, e.*, js.*
                    FROM cron_jobs cj
                    LEFT JOIN executions e ON cj.id = e.cron_job_id
                    LEFT JOIN job_statistics js ON cj.id = js.cron_job_id
                    WHERE cj.workspace_id = %s AND e.start_time >= %s
                """
                start_date = datetime.now() - timedelta(days=90)
                df = pd.read_sql(query, self.db_engine, params=[workspace_id, start_date])
            
            if df.empty or len(df) < 10:
                logger.warning(f"Insufficient data for training {model_type}")
                return False
            
            # Prepare features and target based on model type
            if model_type == 'failure_prediction':
                X = df[model_info['features']].fillna(0)
                y = (df['exec_status'] == 'failed').astype(int)
                
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
                
                model_info['model'].fit(X_train, y_train)
                predictions = model_info['model'].predict(X_test)
                accuracy = accuracy_score(y_test, predictions > 0.5)
                model_info['accuracy'] = accuracy
                
                logger.info(f"Failure prediction model trained with accuracy: {accuracy:.3f}")
            
            elif model_type == 'performance_forecast':
                # Simplified performance forecasting
                df['target_runtime'] = df['duration'].shift(-1)  # Next execution runtime
                df = df.dropna()
                
                if len(df) < 5:
                    return False
                
                X = df[['duration', 'cpu_usage', 'memory_usage', 'hour_of_day']].fillna(0)
                y = df['target_runtime']
                
                X_train, X_test, y_train, y_test = train_test_split(
                    X, y, test_size=0.2, random_state=42
                )
                
                model_info['model'].fit(X_train, y_train)
                predictions = model_info['model'].predict(X_test)
                mse = mean_squared_error(y_test, predictions)
                model_info['accuracy'] = 1 / (1 + mse)  # Simple accuracy metric
                
                logger.info(f"Performance forecast model trained with MSE: {mse:.3f}")
            
            model_info['last_trained'] = datetime.now()
            
            # Cache the trained model
            cache_key = f"model:{model_type}:{workspace_id or job_id}"
            self.redis_client.setex(
                cache_key,
                3600,  # 1 hour cache
                json.dumps({
                    'last_trained': model_info['last_trained'].isoformat(),
                    'accuracy': model_info['accuracy']
                })
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error training model {model_type}: {str(e)}")
            return False

# Initialize analytics engine
analytics_engine = AnalyticsEngine()

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Analytics Engine...")
    global redis_client, db_engine
    redis_client = analytics_engine.redis_client
    db_engine = analytics_engine.db_engine
    
    yield
    
    # Shutdown
    logger.info("Shutting down Analytics Engine...")

app = FastAPI(
    title="Cron Dashboard Analytics Engine",
    description="Advanced analytics and machine learning service for cron job management",
    version="3.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    # Implement JWT verification logic here
    # For now, just return True for development
    return True

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "3.0.0",
        "models_loaded": len(analytics_engine.models),
        "redis_connected": analytics_engine.redis_client.ping(),
    }

# Prediction endpoints
@app.post("/predict/failure", response_model=PredictionResponse)
async def predict_failure(
    request: PredictionRequest,
    authorized: bool = Depends(verify_token)
):
    """Predict job failure probability"""
    prediction_data = await analytics_engine.predict_failure_probability(
        request.job_id, 
        request.time_horizon
    )
    
    suggestions = []
    if prediction_data['probability'] > 0.3:
        suggestions.extend([
            "Consider reviewing recent execution logs",
            "Check system resource availability",
            "Verify job dependencies and inputs"
        ])
    
    return PredictionResponse(
        job_id=request.job_id,
        prediction_type="failure",
        prediction=prediction_data,
        confidence=prediction_data.get('confidence', 0.0),
        suggestions=suggestions,
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(hours=1)
    )

@app.post("/predict/performance", response_model=PredictionResponse)
async def predict_performance(
    request: PredictionRequest,
    authorized: bool = Depends(verify_token)
):
    """Forecast job performance metrics"""
    prediction_data = await analytics_engine.forecast_performance(
        request.job_id, 
        request.time_horizon
    )
    
    suggestions = []
    if prediction_data.get('trend') == 'degrading':
        suggestions.extend([
            "Performance is degrading - consider optimization",
            "Review resource allocation",
            "Check for external dependencies"
        ])
    
    return PredictionResponse(
        job_id=request.job_id,
        prediction_type="performance",
        prediction=prediction_data,
        confidence=prediction_data.get('confidence', 0.0),
        suggestions=suggestions,
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(hours=2)
    )

@app.post("/optimize/suggestions")
async def get_optimization_suggestions(
    request: OptimizationRequest,
    authorized: bool = Depends(verify_token)
):
    """Get optimization suggestions for a job"""
    suggestions = await analytics_engine.generate_optimization_suggestions(request.job_id)
    
    # Filter by optimization type if specified
    if request.optimization_type != "all":
        suggestions = [s for s in suggestions if s['type'] == request.optimization_type]
    
    return {
        "job_id": request.job_id,
        "optimization_type": request.optimization_type,
        "suggestions": suggestions,
        "generated_at": datetime.now()
    }

@app.post("/analytics/workspace")
async def get_workspace_analytics(
    request: AnalyticsRequest,
    authorized: bool = Depends(verify_token)
):
    """Get comprehensive workspace analytics"""
    try:
        # This would typically involve complex aggregations
        # Simplified for demonstration
        
        insights = [
            "Overall system performance is within normal parameters",
            "Predictive accuracy has improved by 15% this month",
            "3 jobs show optimization opportunities"
        ]
        
        return AnalyticsResponse(
            workspace_id=request.workspace_id,
            time_range=request.time_range,
            metrics={
                "total_jobs": 25,
                "active_jobs": 20,
                "success_rate": 0.94,
                "average_runtime": 45.2,
                "predictive_accuracy": 0.87
            },
            trends={
                "performance": [
                    {"timestamp": "2024-01-01", "value": 0.92},
                    {"timestamp": "2024-01-02", "value": 0.94}
                ]
            },
            predictions={
                "next_day_failures": 2.3,
                "next_week_load": 85.7
            },
            insights=insights
        )
        
    except Exception as e:
        logger.error(f"Error in workspace analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Analytics calculation failed")

@app.post("/models/train")
async def train_model(
    request: ModelTrainingRequest,
    background_tasks: BackgroundTasks,
    authorized: bool = Depends(verify_token)
):
    """Train or retrain ML models"""
    
    # Add training task to background
    background_tasks.add_task(
        analytics_engine.train_model,
        request.model_type,
        request.workspace_id
    )
    
    return {
        "message": f"Training started for {request.model_type}",
        "model_type": request.model_type,
        "workspace_id": request.workspace_id,
        "started_at": datetime.now()
    }

@app.get("/models/status")
async def get_models_status(authorized: bool = Depends(verify_token)):
    """Get status of all ML models"""
    status = {}
    
    for model_name, model_info in analytics_engine.models.items():
        status[model_name] = {
            "last_trained": model_info.get('last_trained'),
            "accuracy": model_info.get('accuracy'),
            "features": model_info.get('features', []),
            "is_ready": model_info.get('last_trained') is not None
        }
    
    return {
        "models": status,
        "total_models": len(analytics_engine.models),
        "ready_models": sum(1 for info in status.values() if info['is_ready'])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )