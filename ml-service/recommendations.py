# recommendations.py
import pandas as pd
from database import engine
from sqlalchemy import text
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from models.clustering import train_user_clusters

def get_health_data(user_id):
    # 1. 'health_event' is your TABLE NAME
    # 2. 'patient_id' is your COLUMN NAME 
    query = text("SELECT * FROM health_event WHERE patient_id = :uid")
    
    with engine.connect() as conn:
        # 3. 'uid' matches the name inside the colon (:uid) above
        # 4. user_id is the variable passed into this function
        df = pd.read_sql(query, conn, params={"uid": user_id})

        # Convert timestamps to numeric features
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['hour'] = df['created_at'].dt.hour
        df['day_of_week'] = df['created_at'].dt.dayofweek
        
    return df[['patient_id', 'category_id', 'hour', 'day_of_week']]

def get_avg_logged_events_per_user():
    # 1. 'health_event' is your TABLE NAME
    # 2. 'patient_id' is your COLUMN NAME (Replace this with the real one!)

    #how many events are logged per user on average?
    query = text("""
                 SELECT patient_id, count(*) as count_event
                 FROM health_event
                 GROUP BY patient_id
                 """)
    
    with engine.connect() as conn:
        #fetch the count for every user
        df_counts = pd.read_sql(query, conn)

        #calculate the average
        avg_events = df_counts['count_event'].mean()
        max_events = df_counts['count_event'].max()
        min_events = df_counts['count_event'].min()

    return avg_events, max_events, min_events

def get_severity_distribution():
    # 1. 'health_event' is your TABLE NAME
    # 2. 'patient_id' is your COLUMN NAME (Replace this with the real one!)

    #how many events are logged per user on average?
    query = text("""
                 SELECT field_value
                 FROM health_event_fields
                 WHERE field_name = 'Severity'
                 """)
    
    with engine.connect() as conn:
        #fetch the count for every user
        df = pd.read_sql(query, conn)

        #calculate the average 
        df['field_value'] = pd.to_numeric(df['field_value']) 
        distribution = df['field_value'].value_counts(normalize=True) * 100
    return distribution

def get_duration_distribution():
    # 1. 'health_event' is your TABLE NAME
    # 2. 'patient_id' is your COLUMN NAME (Replace this with the real one!)

    #how many events are logged per user on average?
    query = text("""
                 SELECT field_value
                 FROM health_event_fields
                 WHERE field_name = 'Duration'
                 """)
    
    with engine.connect() as conn:
        #fetch the count for every user
        df = pd.read_sql(query, conn)

    #convert the strings to numbers
    df['duration_hours'] = df['field_value'].apply(to_hours)

    bins = [0, 1, 2, 3, 4, 5, 10, 24, 168, float('inf')] # Example buckets: 0-1hr, 1-5hrs, etc.
    labels = ['<1h', '1-2h', '2-3h', '3-4h', '4-5h', '5-10h', '10-24h', '1d-1w', '>1w']
    
    df['binned'] = pd.cut(df['duration_hours'], bins=bins, labels=labels)
    distribution = df['binned'].value_counts(normalize=True).sort_index() * 100

    total_entries = len(df)

    return total_entries, distribution

def to_hours(duration_val):
    #handle empty or null values
    if not duration_val or not isinstance(duration_val, str):
        return 0
    
    if isinstance (duration_val, (int, float)):
        return duration_val / 60
    
    if isinstance(duration_val, str):
        if duration_val.replace('.', '', 1).isdigit():
            return float(duration_val) / 60
        
        #split the string
        parts = duration_val.lower().split()
        if len(parts) >= 2:
            try:
                value = float(parts[0])
                unit = parts[1]
                if 'day' in unit: return value * 24
                if 'hour' in unit: return value
                if 'min' in unit: return value / 60
            except ValueError:
                return 0
    return 0

def get_user_feature_matrix():
    # Query: Group all your health metrics by patient_id
    #either keep the is_active_tracker or filter out the users that dont track severity at all 
    query = text("""
        SELECT 
            he.patient_id, 
            COUNT(f.field_value) FILTER (WHERE f.field_name = 'Severity') > 0 as is_active_tracker,
            COUNT(he.id) as total_events,
            COALESCE(AVG(
                CASE 
                    WHEN f.field_value ~ '^[0-9.]+$' THEN CAST(f.field_value AS NUMERIC) 
                    ELSE NULL 
                END
            ), 0) as avg_severity
        FROM health_event he
        LEFT JOIN health_event_fields f ON he.id = f.event_id AND f.field_name = 'Severity'
        GROUP BY he.patient_id;
    """)
    
    with engine.connect() as conn:
        df = pd.read_sql(query, conn)
    
    # Fill missing values (Important! Clustering hates NaNs)
    df = df.fillna(0)
    return df

def run_clustering_pipeline():
    df = get_user_feature_matrix()

    clustered_df = train_user_clusters(df)
    print(clustered_df)


# Test it
if __name__ == "__main__":
    #individual health events report for user_id
    data = get_health_data(2)
    print("\nUser(first 5 rows (head)): 2\n",data.head())

    #mean, max, min of logged health events among users
    mean, max, min = get_avg_logged_events_per_user();
    print(f"\n--- Health Event Stats ---\nMean events per user: {mean}")
    print(f"Max events per user: {max}")
    print(f"Min events per user: {min}")

    #Severity distribution report
    severity_dist = get_severity_distribution();
    print("\n--- Severity distribution ---:\n", severity_dist)

    #duration distribution report
    count, dist = get_duration_distribution()
    print(f"\n--- Duration Report ---")
    print(f"Total events analyzed: {count}")
    print("\nPercentage distribution per bin:")
    print(dist.map("{:.3f}%".format)) # Formats the floats as percentages

    print("\n--- Running Clustering Pipeline ---")
    clustered_results = run_clustering_pipeline()


