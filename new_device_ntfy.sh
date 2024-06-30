#!/bin/sh

# This script sends a notification via ntfy.sh when a device connects to the network.
#
# To use: add these two lines:
#   curl https://raw.githubusercontent.com/chromoxdor/DD-WRTiles/main/new_device_ntfy.sh -o /tmp/www/<your_ntfy_topic>.sh
#   chmod +x /tmp/www/<your_ntfy_topic>.sh
# to Administration > Commands and click "Save Startup" (to use it without restarting also click "Run Commands").
# Replace <your_ntfy_topic> with a unique topic to receive messages through ntfy (http://ntfy.sh/<your_ntfy_topic>).
# Put the following in Services > Dnsmasq > Additional Options: "dhcp-script=/tmp/www/<your_ntfy_topic>.sh" and click "Apply".

# DNSMasq arguments with defaults
action="${1:-act}"        # Default action is 'op' if not provided
mac="${2:-mac}"          # Default MAC address is 'mac' if not provided
ip="${3:-ip}"            # Default IP address is 'ip' if not provided
hostname="${4:-unknown}" # Default hostname is 'unknown' if not provided

# Current timestamp
timestamp="`date '+%d-%m-%Y %H:%M:%S'`"

# Extract script name without extension
script_name=$(basename "$0" .sh)

# Notification message for 'add' action
payload="
IP: ${ip}
Mac: ${mac:0:8}:00:00:00
Time: ${timestamp}"

# Check if the action is 'add'
if [ "$action" = "add" ]; then
    # Send notification
    curl \
        -H "Title: ${hostname} has connected to the network." \
        -d "${payload}" \
        https://ntfy.sh/${script_name}

# Uncomment the following block if you want to handle other actions
# else
#     payload2="
#     Action: $action"
#     curl \
#         -H "Title: ${hostname} has performed a different action on the network." \
#         -d "${payload2}" \
#         https://ntfy.sh/${script_name}

fi




