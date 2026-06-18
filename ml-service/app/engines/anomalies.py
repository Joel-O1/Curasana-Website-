from multiprocessing import connection

import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy import text
from database import engine # Import your existing engine

def detect_user_anomalies(raw_log_df: pd.DataFrame, target_user_id: str) -> dict:
    """
    Checks an individual user's baseline and flags severe or highly unusual health days.
    """
    uid = int(target_user_id) if str(target_user_id).isdigit() else target_user_id
    user_df = raw_log_df[raw_log_df['user_id'] == uid].copy()
    
    if len(user_df) < 10:
        return {
            "status": "cold_start",
            "message": f"User has only logged {len(user_df)} events. Need at least 10 for a baseline.",
            "anomalies_detected": []
        }
        

    user_severity_avg = user_df['severity'].mean()
    # Build crosstab matrix
    user_matrix = pd.crosstab(user_df['timestamp'], user_df['symptom'], values=user_df['severity'], aggfunc='max').fillna(0)
    
    # Run Isolation Forest
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    user_matrix['anomaly_score'] = iso_forest.fit_predict(user_matrix)
    
    anomaly_timestamps = user_matrix[user_matrix['anomaly_score'] == -1].index
    anomaly_rows = user_df[user_df['timestamp'].isin(anomaly_timestamps)]

    # 1. Map both total occurrences AND matching group averages
    symptom_counts = user_df['symptom'].value_counts().to_dict()
    symptom_averages = user_df.groupby('symptom')['severity'].mean().to_dict()

    enriched_anomalies = []
    for _, row in anomaly_rows.iterrows():
        current_severity = int(row['severity'])
        symptom_name = row['symptom']
        
        # 2. Smart Baseline Selection: If the symptom has been tracked fewer than 3 times, 
        # use the global profile average instead of letting it compare against itself.
        if symptom_counts.get(symptom_name, 0) < 3:
            local_avg = user_severity_avg
        else:
            local_avg = symptom_averages.get(symptom_name, user_severity_avg)

        # 3. Dynamic Threshold check
        if current_severity > local_avg * 1.15:
            direction = "upward_spike"
        elif current_severity < local_avg * 0.85:
            direction = "downward_spike"
        else:
            direction = "average_range"
        
        enriched_anomalies.append({
            "event_id": int(row['id']) if 'id' in row else None,
            "date": row['timestamp'].strftime('%Y-%m-%d'),
            "symptom": symptom_name,
            "severity": current_severity,
            "direction": direction
        })

    enriched_anomalies.sort(key=lambda x: x['severity'], reverse=True)

    if enriched_anomalies:
        with engine.begin() as conn: # 'begin' automatically handles commits/rollbacks
            update_stmt = text("""
                UPDATE health_event 
                SET is_statistical_anomaly = :is_stat,
                    is_clinical_alert = :is_clin,
                    anomaly_direction = :dir
                WHERE id = :eid
            """)
            
            for anomaly in enriched_anomalies:
                if anomaly['event_id'] is None: continue
                
                # Clinical threshold: Alert if severity >= 5 
                is_clinical = anomaly['severity'] >= 5
                
                conn.execute(update_stmt, {
                    "is_stat": True,
                    "is_clin": is_clinical,
                    "dir": anomaly['direction'],
                    "eid": anomaly['event_id']
                })
    
    return {
        "status": "active",
        "total_logs_analyzed": len(user_df),
        "anomalies_detected": enriched_anomalies
    }



def generate_doctor_summary(raw_log_df: pd.DataFrame, target_user_id: str, days_back: int = 60) -> dict:
    """
    Aggregates a user's health history over a specific timeframe for clinical review.
    """
    uid = int(target_user_id) if str(target_user_id).isdigit() else target_user_id
    user_df = raw_log_df[raw_log_df['user_id'] == uid].copy()
    
    if user_df.empty:
        return {"message": "No data found for this user."}
        
    max_date = user_df['timestamp'].max()
    cutoff_date = max_date - pd.Timedelta(days=days_back)
    recent_df = user_df[user_df['timestamp'] >= cutoff_date]

    if len(recent_df) == 0:
        return {"message": "No data found for this user in the specified timeframe."}

    symptom_counts = recent_df['symptom'].value_counts().to_dict()
    severity_averages = recent_df.groupby('symptom')['severity'].mean().round(1).to_dict()

    # NOTE: We stripped the internal detect_user_anomalies call from here.
    # This keeps this function strictly focused on aggregation statistics.

    return {
        "user_id": target_user_id,
        "timeframe_days": days_back,
        "total_events_logged": len(recent_df),
        "symptom_frequencies": symptom_counts,
        "average_severities": severity_averages
    }