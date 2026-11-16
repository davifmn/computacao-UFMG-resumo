import sys
import os
import json
import requests

# --- Configuration ---
# Get the port from an environment variable or default to 30502
PORT = os.environ.get("PORT", 30502)
SERVER_URL = f"http://localhost:{PORT}/api/recommend"

# --- RUN ---
# flask run --port 30502

#--- testando no terminal: ---
# wget --server-response    
# --output-document response.out    
# --header='Content-Type: application/json'    
# --post-data '{"songs": ["spotify:track:06iMqWThw4w8fTFyccvOwr"]}'    
# http://localhost:30502/api/recommend

def main():
    # Get song URIs from command line arguments
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <song_uri_1> [song_uri_2] ...")
        print("\nExample:")
        print(f"python {sys.argv[0]} spotify:track:06iMqWThw4w8fTFyccvOwr spotify:track:47nm8czanMUzIqHsnr5x61")
        sys.exit(1)
        
    song_list = sys.argv[1:]
    
    # Prepare the JSON payload
    payload = {
        "songs": song_list
    }
    
    headers = {'Content-Type': 'application/json'}

    print(f"Sending request to {SERVER_URL} with {len(song_list)} songs...")
    print(json.dumps(payload, indent=2))
    
    try:
        # Send the POST request
        response = requests.post(SERVER_URL, data=json.dumps(payload), headers=headers)
        
        # Raise an exception if the server returned an error (e.g., 400, 500)
        response.raise_for_status()
        
        # If successful, print the response
        print("\n--- Server Response (Success) ---")
        print(json.dumps(response.json(), indent=2))
        
    except requests.exceptions.ConnectionError:
        print(f"\n[Error] Could not connect to the server at {SERVER_URL}")
        print("Please ensure the Flask server (api.py) is running.")
    except requests.exceptions.HTTPError as e:
        # Handle server errors (e.g., 400 Bad Request)
        print(f"\n--- Server Response (Error {e.response.status_code}) ---")
        try:
            # Try to print the JSON error from the server
            print(json.dumps(e.response.json(), indent=2))
        except:
            # Fallback if the error response isn't JSON
            print(e.response.text)
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    main()