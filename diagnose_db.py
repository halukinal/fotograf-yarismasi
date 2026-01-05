from google.cloud import firestore
from google.oauth2 import service_account
import os

key_path = 'serviceAccountKey.json'

def test_db_connection():
    if not os.path.exists(key_path):
        print(f"Error: {key_path} not found.")
        return

    try:
        creds = service_account.Credentials.from_service_account_file(key_path)
        project_id = creds.project_id
        print(f"Project ID from key: {project_id}")
    except Exception as e:
        print(f"Error loading keys: {e}")
        return

    # List of database names to try
    # '(default)' is the standard one.
    db_names = ['(default)', project_id]

    for db_name in db_names:
        print(f"\nTesting Connection to Database: '{db_name}'")
        try:
            db = firestore.Client(credentials=creds, project=project_id, database=db_name)
            
            # Simple read operation to verify access
            # We use a dummy collection or list collections
            # list_collections() is a good test
            collections = list(db.collections())
            print(f"✅ SUCCESS! Connected to '{db_name}'.")
            print(f"   Found Collections: {[c.id for c in collections]}")
            return # Stop if successful
        except Exception as e:
            print(f"❌ FAILED: {e}")

if __name__ == "__main__":
    test_db_connection()
