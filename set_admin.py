# set_admin.py
import firebase_admin
from firebase_admin import credentials, auth

# --- CONFIGURE THESE ---
SERVICE_ACCOUNT_FILE = "C:\\Users\\rehem\\OneDrive\\Desktop\\school\\4th year\\ICS Project II\\Stegasheild_1.5\\stegasheild-firebase-adminsdk-fbsvc-60a5da296f.json"
ADMIN_EMAIL_TO_SET = "rehema.kuria@strathmore.edu"
# -----------------------

cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
firebase_admin.initialize_app(cred)

try:
    # Look up the user by their email
    user = auth.get_user_by_email(ADMIN_EMAIL_TO_SET)

    # Set the custom claim. {'role': 'admin'} is the "tag" we are adding.
    auth.set_custom_user_claims(user.uid, {'role': 'admin'})

    print(f"✅ Successfully set 'admin' role for {ADMIN_EMAIL_TO_SET}")
    print("Log out and log back in on the website to see the change.")

except Exception as e:
    print(f"❌ Error: {e}")
    print("Make sure the email is correct and the user exists in Firebase Auth.")