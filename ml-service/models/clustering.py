# models/clustering.py
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

def train_user_clusters(feature_df):
    # Scale the data
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(feature_df[['total_events', 'avg_severity']])
    
    # Run the clustering
    kmeans = KMeans(n_clusters=4, n_init=15, random_state=42)
    feature_df['cluster'] = kmeans.fit_predict(scaled_data)
    
    return feature_df