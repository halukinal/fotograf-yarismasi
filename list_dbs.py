from google.cloud import firestore_admin_v1
from google.oauth2 import service_account
import os

key_path = 'serviceAccountKey.json'

def list_databases():
    if not os.path.exists(key_path):
        print("Key not found")
        return

    try:
        creds = service_account.Credentials.from_service_account_file(key_path)
        client = firestore_admin_v1.FirestoreAdminClient(credentials=creds)
        parent = f"projects/{creds.project_id}"
        print(f"Listing databases for: {parent}")
        
        # List databases
        response = client.list_databases(parent=parent)
        
        # Handle response based on structure
        if hasattr(response, 'databases'):
            if not response.databases:
                 print("No databases returned (empty list).")
            for db in response.databases:
                print(f"Found DB Name: {db.name}")
        else:
            # Fallback for iterable pager
            try:
                count = 0
                for db in response:
                    print(f"Found DB Name: {db.name}")
                    count += 1
                if count == 0:
                    print("No databases found (iterator empty).")
            except Exception as e:
                print(f"Could not iterate response: {e}")
                print(f"Raw Response: {response}")
            
    except Exception as e:
        print(f"Error listing DBs: {e}")

if __name__ == "__main__":
    list_databases()
