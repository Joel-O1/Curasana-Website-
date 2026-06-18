import pandas as pd
from sklearn.cluster import DBSCAN

def analyze_symptom_cooccurrence(raw_log_df: pd.DataFrame) -> dict:
    """
    takes a raw DataFrame of health logs and extracts 
    symptom co-occurrence profiles using DBSCAN.
    """
    if raw_log_df.empty:
        return {}
        
    matrix = pd.crosstab(
        [raw_log_df['user_id'], raw_log_df['timestamp']], 
        raw_log_df['symptom']
    ).reset_index()
    
    features = matrix.drop(columns=['user_id', 'timestamp'], errors='ignore')
    
    dbscan_engine = DBSCAN(eps=0.1, min_samples=5, metric='hamming')
    matrix['cluster'] = dbscan_engine.fit_predict(features)
    
    profile_means = matrix.groupby('cluster')[features.columns].mean()
    
    insights = {}
    for cluster_id, row in profile_means.iterrows():
        if cluster_id == -1:
            continue
            
        dominant_symptoms = row[row > 0.5].index.tolist()
        
        if len(dominant_symptoms) > 1:
            insights[f"profile_{cluster_id}"] = {
                "symptoms": dominant_symptoms,
                "occurrence_count": int((matrix['cluster'] == cluster_id).sum())
            }
            
    return insights