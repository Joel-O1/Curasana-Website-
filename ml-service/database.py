# database.py
import os
import socket
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

# Force IPv4 resolution for the database host
# This prevents your OS from choosing the broken IPv6 address
DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine with SSL and host-specific connection args
engine = create_engine(
    DATABASE_URL, 
    connect_args={
        "sslmode": "require",
        # This tells the driver to use the specific hostname
        "target_session_attrs": "read-write" 
    }
)