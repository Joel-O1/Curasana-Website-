from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
import pandas as pd
from typing import List

# import data science engines
from app.engines.clustering import analyze_symptom_cooccurrence
from app.engines.anomalies import detect_user_anomalies, generate_doctor_summary

# import the db engine
from database import engine

app = FastAPI(title="Curasana ML Service")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows testing from any local port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomLogDTO(BaseModel):
    user_id: str
    timestamp: str  
    symptom: str
    severity: int

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])

# ----------------------------------------------------------------
# ROUTE 1: LIGHTWEIGHT DASHBOARD ALERT (Runs on Login)
# ----------------------------------------------------------------
from fastapi import APIRouter, HTTPException
import pandas as pd

@analytics_router.get("/dashboard-alert/{user_id}")
def get_dashboard_alert(user_id: str):
    # Added a WHERE constraint to pull only the last 30 days of data
    query = """
        SELECT 
            he.patient_id AS user_id,
            he.id AS id,
            (he.date + he.time)::timestamp AS timestamp,
            COALESCE(
                MAX(CASE WHEN hef.field_name ILIKE '%%Symptom%%' THEN hef.field_value END),
                c.category_name
            ) AS symptom,
            he.severity AS severity
        FROM health_event he
        JOIN category c ON he.category_id = c.id
        LEFT JOIN health_event_fields hef ON he.id = hef.event_id
        WHERE he.patient_id = %(uid)s
          AND he.date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY he.patient_id, he.id, he.date, he.time, he.severity, c.category_name
        ORDER BY timestamp DESC;
    """
    try:
        df = pd.read_sql_query(query, engine, params={"uid": user_id})
        
        if df.empty:
            return {
                "status": "no_data", 
                "message": "No data logged in the last 30 days.", 
                "anomalies_detected": []
            }
            
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Run anomaly detection on the 30-day window
        anomalies = detect_user_anomalies(df, target_user_id=user_id)
        return anomalies

    except Exception as e:
        # Completed your error handling block safely
        raise HTTPException(status_code=500, detail=f"Analytics engine error: {str(e)}")

# ----------------------------------------------------------------
# ROUTE 2: HEAVY CLINICAL REPORT (Runs on Demand)
# ----------------------------------------------------------------
@analytics_router.get("/doctor-report/{user_id}")
def get_doctor_report(user_id: str, days_back: int = 60):
    query = """
        SELECT 
            he.patient_id AS user_id,
            he.id AS id,
            (he.date + he.time)::timestamp AS timestamp,
            hef.field_value AS symptom,
            he.severity
        FROM health_event he
        JOIN health_event_fields hef ON he.id = hef.event_id
        WHERE he.patient_id = %(uid)s 
          AND hef.field_name ILIKE '%%Symptom%%'
    """
    try:
        df = pd.read_sql_query(query, engine, params={"uid": user_id})
        if df.empty:
            raise HTTPException(status_code=404, detail="No health records found for this user.")
            
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # generate the heavy calculations and statistics
        report = generate_doctor_summary(df, target_user_id=user_id, days_back=days_back)
        
        # run the anomalies separately and append them to the report wrapper
        anomalies_res = detect_user_anomalies(df, target_user_id=user_id)
        report["clinical_anomalies_detected"] = anomalies_res.get("anomalies_detected", [])
        report["baseline_status"] = anomalies_res.get("status", "cold_start")
        
        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate clinical report: {str(e)}")
    
    # mount the router
app.include_router(analytics_router)

#check the health of the service
@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Curasana ML Microservice ready"}