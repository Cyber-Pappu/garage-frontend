# Network Device Scanning Setup Guide

## Overview
The garage billing system now includes live WiFi device discovery. To enable this feature, you need to set up a backend API endpoint that performs network scanning.

## Backend Setup

### Requirements
- Node.js backend (Express, Fastify, or similar)
- Network scanning library (e.g., `node-arp`, `ping`, or system commands)

### Required API Endpoint
The frontend expects this endpoint:
```
GET /api/network/scan-devices
```

### Response Format
The endpoint should return an array of devices:
```json
[
  {
    "id": "00:1A:2B:3C:4D:5E",
    "name": "Canon LBP-6030",
    "ip": "192.168.1.100",
    "macAddress": "00:1A:2B:3C:4D:5E",
    "deviceType": "printer",
    "signal": 95,
    "online": true
  },
  {
    "id": "00:1B:2C:3D:4E:5F",
    "name": "John's iPhone",
    "ip": "192.168.1.105",
    "macAddress": "00:1B:2C:3D:4E:5F",
    "deviceType": "mobile",
    "signal": 88,
    "online": true
  }
]
```

### Implementation Example (Node.js + Express)

```bash
npm install node-arp reverse-dns-lookup
```

```javascript
import express from 'express';
import arp from 'node-arp';
import { execSync } from 'child_process';

const app = express();

// Device type detection based on hostname/MAC patterns
function detectDeviceType(name, mac) {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('printer') || nameLower.includes('hp') || nameLower.includes('canon')) {
    return 'printer';
  } else if (nameLower.includes('iphone') || nameLower.includes('android')) {
    return 'mobile';
  } else if (nameLower.includes('ipad') || nameLower.includes('tablet')) {
    return 'tablet';
  } else if (nameLower.includes('macbook') || nameLower.includes('laptop')) {
    return 'laptop';
  } else if (nameLower.includes('desktop') || nameLower.includes('pc')) {
    return 'desktop';
  }
  
  return 'other';
}

// Get device signal strength based on ping
function getSignalStrength(ip) {
  try {
    // This is a simplified example - implement actual WiFi signal strength detection
    const pingResult = execSync(`ping -c 1 -W 1 ${ip}`, { encoding: 'utf-8' });
    // Parse and calculate signal strength (0-100)
    return Math.random() * 40 + 60; // Placeholder: 60-100%
  } catch {
    return 0;
  }
}

// Get device hostname using reverse DNS
async function getDeviceName(ip) {
  try {
    const { execSync } = require('child_process');
    const hostname = execSync(`hostname -f ${ip}`, { encoding: 'utf-8' }).trim();
    return hostname || `Device (${ip})`;
  } catch {
    return `Device (${ip})`;
  }
}

app.get('/api/network/scan-devices', async (req, res) => {
  try {
    // Get gateway IP to scan the network
    const gatewayIP = '192.168.1.1'; // Set based on your network
    const broadcastAddr = '192.168.1.255';
    
    // Scan network using ARP
    const devices = [];
    
    try {
      const arpResult = execSync(`arp-scan -l --localnet`, { encoding: 'utf-8' });
      const lines = arpResult.split('\n');
      
      for (const line of lines) {
        if (line.includes('\t')) {
          const [ip, mac, vendor] = line.split('\t');
          
          if (ip && mac) {
            const name = await getDeviceName(ip);
            const deviceType = detectDeviceType(name, mac);
            
            devices.push({
              id: mac,
              name: name,
              ip: ip,
              macAddress: mac,
              deviceType: deviceType,
              signal: getSignalStrength(ip),
              online: true
            });
          }
        }
      }
    } catch (e) {
      console.error('Error running arp-scan:', e);
    }
    
    res.json(devices);
  } catch (error) {
    console.error('Network scan error:', error);
    res.status(500).json({ error: 'Failed to scan network', devices: [] });
  }
});

// Optional: Ping endpoint to check if device is online
app.get('/api/network/ping/:ip', async (req, res) => {
  try {
    const { ip } = req.params;
    const pingResult = execSync(`ping -c 1 -W 2 ${ip}`, { encoding: 'utf-8' });
    res.json({ online: true });
  } catch {
    res.json({ online: false });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Alternative: Using Network Discovery Libraries

### Option 1: `bonjour` (mDNS Discovery)
```bash
npm install bonjour
```

```javascript
import Bonjour from 'bonjour';

const bonjour = new Bonjour();

app.get('/api/network/scan-devices', async (req, res) => {
  const devices = [];
  
  const browser = bonjour.find({ type: '_printer' });
  
  browser.on('up', (service) => {
    devices.push({
      id: service.addresses[0],
      name: service.name,
      ip: service.addresses[0],
      macAddress: 'N/A',
      deviceType: 'printer',
      signal: 85,
      online: true
    });
  });
  
  setTimeout(() => {
    browser.stop();
    res.json(devices);
  }, 3000);
});
```

### Option 2: `ping` and `arp` command-line tools
```javascript
import { execSync } from 'child_process';

app.get('/api/network/scan-devices', (req, res) => {
  const devices = [];
  
  // Scan subnet: 192.168.1.0/24
  for (let i = 1; i <= 254; i++) {
    const ip = `192.168.1.${i}`;
    
    try {
      // Quick ping to check online status
      execSync(`ping -c 1 -W 1 ${ip}`, { stdio: 'ignore' });
      
      // Get MAC address
      const arpResult = execSync(`arp ${ip}`, { encoding: 'utf-8' });
      // Parse MAC from arp output...
      
      devices.push({
        id: ip,
        name: `Device (${ip})`,
        ip: ip,
        macAddress: 'N/A',
        deviceType: 'other',
        signal: 75,
        online: true
      });
    } catch {
      // Device not online
    }
  }
  
  res.json(devices);
});
```

## Frontend Integration

The frontend will:
1. Call `GET /api/network/scan-devices` when user clicks "Refresh Devices"
2. Display all returned devices with their:
   - Device name and type icon
   - IP address and MAC address
   - WiFi signal strength
   - Online/Offline status
3. Allow connecting to any device for printing

## Device Types Supported

- **printer** - Network printers
- **mobile** - Mobile phones (iPhone, Android)
- **laptop** - Laptop computers
- **tablet** - Tablets (iPad, Android tablets)
- **desktop** - Desktop computers
- **other** - Unknown devices

## Fallback Behavior

If the backend endpoint is not available:
1. The service will check `localStorage` for previously discovered devices
2. Users can manually add devices by IP address
3. Display helpful setup instructions

## Security Considerations

- ✅ Restrict this endpoint to authenticated users only
- ✅ Implement rate limiting to prevent abuse
- ✅ Run network scanning on background workers to avoid blocking
- ✅ Cache results to avoid excessive network scanning
- ✅ Only scan on the local network, never external IPs

## Testing

To test the backend:

```bash
# Direct API call
curl http://localhost:3000/api/network/scan-devices

# Expected response
[
  {
    "id": "00:1A:2B:3C:4D:5E",
    "name": "Canon LBP-6030",
    "ip": "192.168.1.100",
    "macAddress": "00:1A:2B:3C:4D:5E",
    "deviceType": "printer",
    "signal": 95,
    "online": true
  }
]
```

## Troubleshooting

**No devices found?**
- Ensure devices are on the same network
- Check firewall settings allow ARP traffic
- Verify network scanning tool permissions (may need `sudo`)

**Wrong device type detected?**
- Improve hostname/MAC detection in `detectDeviceType()` function
- Add specific vendor MAC lookups

**Signal strength not working?**
- Implement WiFi router API integration for real signal levels
- Or use packet loss percentage from ping as proxy

