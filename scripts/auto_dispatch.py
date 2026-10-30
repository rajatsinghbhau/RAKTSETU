"""
RAKTSETU - 100% Free Automated WhatsApp Emergency Dispatcher
============================================================
Dispatches emergency blood mobilization alerts to all matched donors
automatically without sending them one-by-one.

How it works:
1. Uses `pywhatkit` or `requests` (Meta WhatsApp Cloud API Free Tier).
2. Reads emergency request details and list of donor phone numbers.
3. Automatically dispatches the WhatsApp alert to every number in sequence.

Install free dependency:
  pip install pywhatkit

Usage:
  python scripts/auto_dispatch.py
"""

import time
import urllib.parse

# List of matched verified donor phone numbers with distance to emergency hospital
# Sorted dynamically by location (Nearest First!)
MATCHED_DONORS = [
    {"name": "Rohan Mehta", "phone": "+916006853510", "blood_group": "A+", "location": "Kuvempunagar, Mysuru", "distance_km": 1.8, "eta_mins": 6},
    {"name": "Ananya Rao", "phone": "+919876543210", "blood_group": "A+", "location": "Saraswathipuram, Mysuru", "distance_km": 2.6, "eta_mins": 9},
    {"name": "Priya Nair", "phone": "+919888877777", "blood_group": "A+", "location": "Jayalakshmipuram, Mysuru", "distance_km": 4.2, "eta_mins": 13},
    {"name": "Vikram Patil", "phone": "+919123456789", "blood_group": "A+", "location": "Vijayanagar, Mysuru", "distance_km": 6.3, "eta_mins": 19},
]

EMERGENCY_DETAILS = {
    "request_id": "REQ-AIIMS-1001",
    "hospital": "JSS Hospital, Mysuru",
    "blood_group": "A+",
    "component": "PRBC (Packed Red Blood Cells)",
    "deficit": 4,
    "urgency": "CRITICAL (< 2 Hours)",
    "destination": "JSS Hospital Emergency Trauma Centre, Ramanuja Rd, Mysuru",
    "portal_url": "https://raktsetu.network"
}

def create_emergency_message(donor_name: str) -> str:
    return f"""🚨 *RAKTSETU EMERGENCY BLOOD MOBILIZATION* 🚨
Dear {donor_name},

A critical emergency blood requirement matching your blood group (*{EMERGENCY_DETAILS['blood_group']}*) has been logged:

🏥 *Hospital*: {EMERGENCY_DETAILS['hospital']}
🩸 *Blood Needed*: {EMERGENCY_DETAILS['blood_group']} ({EMERGENCY_DETAILS['component']})
⚡ *Urgency*: {EMERGENCY_DETAILS['urgency']}
🎯 *Outstanding Deficit*: {EMERGENCY_DETAILS['deficit']} Unit(s)
📍 *Location*: {EMERGENCY_DETAILS['destination']}

⚠️ *Clinical Protocol*:
Your response alerts the triage team. Blood is marked SECURED only after clinical screening.

👉 *Reply YES to accept or open*:
{EMERGENCY_DETAILS['portal_url']}"""

def dispatch_all_donors():
    print("=" * 60)
    print("RAKTSETU AUTOMATED WHATSAPP MASS DISPATCHER")
    print(f"Hospital: {EMERGENCY_DETAILS['hospital']} | Deficit: {EMERGENCY_DETAILS['deficit']} Units")
    print(f"Target Donors: {len(MATCHED_DONORS)} matched volunteers")
    print("=" * 60)

    try:
        import pywhatkit as kit
        USE_PYWHATKIT = True
    except ImportError:
        USE_PYWHATKIT = False
        print("\n[NOTE] 'pywhatkit' library not installed.")
        print("To send automatically in the background without clicking, run: pip install pywhatkit")
        print("Falling back to generating direct dispatch links for each donor:\n")

    # Sort donors strictly by proximity distance (Nearest First)
    sorted_donors = sorted(MATCHED_DONORS, key=lambda d: d.get("distance_km", 99.0))

    for idx, donor in enumerate(sorted_donors, 1):
        msg = create_emergency_message(donor["name"]) + f"\n\n📍 *Proximity Alert*: Registered in {donor['location']} (~{donor['distance_km']} km away, ~{donor['eta_mins']} mins ETA). Prioritized as #{idx} closest responder."
        clean_phone = donor["phone"].replace(" ", "").replace("-", "")
        
        print(f"[#{idx} NEAREST - {donor['distance_km']} km] Dispatching alert to {donor['name']} ({clean_phone} in {donor['location']})...")

        if USE_PYWHATKIT:
            try:
                # kit.sendwhatmsg_instantly opens WhatsApp web and presses enter automatically
                kit.sendwhatmsg_instantly(clean_phone, msg, wait_time=15, tab_close=True, close_time=3)
                print(f"    ✅ Sent successfully to {donor['name']}")
                time.sleep(4)
            except Exception as e:
                print(f"    ❌ Error sending to {clean_phone}: {e}")
        else:
            encoded = urllib.parse.quote(msg)
            wa_link = f"https://wa.me/{clean_phone.replace('+', '')}?text={encoded}"
            print(f"    👉 Instant Link: {wa_link}")

    print("\n" + "=" * 60)
    print("✅ All emergency dispatch alerts queued / processed.")
    print("=" * 60)

if __name__ == "__main__":
    dispatch_all_donors()

