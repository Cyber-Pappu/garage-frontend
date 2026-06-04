/**
 * NETWORK SCANNER SERVICE
 * 
 * This service handles WiFi network device discovery and management.
 * It communicates with a backend API to scan for live devices on the network.
 * 
 * BACKEND SETUP REQUIRED:
 * 
 * The service expects a backend endpoint at: GET /api/network/scan-devices
 * 
 * Backend Implementation (Node.js/Express example):
 * 
 * import arp from 'node-arp';
 * import { execSync } from 'child_process';
 * 
 * app.get('/api/network/scan-devices', async (req, res) => {
 *   try {
 *     // Get all connected devices
 *     const arpCache = await arp.getMAC('255.255.255.255');
 *     const devices = [];
 *     
 *     for (const [ip, mac] of Object.entries(arpCache)) {
 *       try {
 *         // Resolve device name using reverse DNS or mDNS
 *         const name = await getDeviceName(ip, mac);
 *         const deviceType = detectDeviceType(name, mac);
 *         
 *         devices.push({
 *           id: mac,
 *           name: name,
 *           ip: ip,
 *           macAddress: mac,
 *           deviceType: deviceType,
 *           signal: calculateSignalStrength(ip),
 *           online: true
 *         });
 *       } catch (e) {
 *         console.error('Error processing device:', e);
 *       }
 *     }
 *     
 *     res.json(devices);
 *   } catch (error) {
 *     res.status(500).json({ error: 'Failed to scan network' });
 *   }
 * });
 * 
 * DEVICE TYPE DETECTION:
 * - Check device name patterns (contains 'iPhone', 'iPad', 'Android', 'printer', etc.)
 * - Check MAC address vendors
 * - Use reverse DNS and service discovery
 * 
 * SIGNAL STRENGTH:
 * - Use ping latency to estimate signal strength
 * - Or query WiFi router for connected device signal levels
 * - Return value between 0-100 (percentage)
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface NetworkDevice {
  id: string;
  name: string;
  ip: string;
  macAddress: string;
  deviceType: 'printer' | 'mobile' | 'laptop' | 'desktop' | 'tablet' | 'other';
  signal?: number;
  online: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkScannerService {
  constructor(private http: HttpClient) {}

  /**
   * Scans the local network for connected devices
   * Makes a request to the backend to perform ARP/network scanning
   */
  async scanNetworkDevices(): Promise<NetworkDevice[]> {
    try {
      // Try to call backend endpoint for network scanning
      const devices = await this.http.get<NetworkDevice[]>('/api/network/scan-devices').toPromise();
      return devices || [];
    } catch (error) {
      console.warn('Backend network scan not available, using alternative method');
      return this.getDevicesFromLocalStorage();
    }
  }

  /**
   * Gets previously discovered devices from local storage
   */
  getDevicesFromLocalStorage(): NetworkDevice[] {
    try {
      const stored = localStorage.getItem('discoveredNetworkDevices');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    return [];
  }

  /**
   * Saves discovered devices to local storage for future reference
   */
  saveDevicesToLocalStorage(devices: NetworkDevice[]): void {
    try {
      localStorage.setItem('discoveredNetworkDevices', JSON.stringify(devices));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  /**
   * Attempts to ping a device to verify it's online
   */
  async checkDeviceStatus(ip: string): Promise<boolean> {
    try {
      const result = await this.http.get(`/api/network/ping/${ip}`).toPromise();
      return !!result;
    } catch {
      return false;
    }
  }

  /**
   * Gets the WiFi signal strength using Network Information API (limited browser support)
   */
  getWiFiSignalStrength(): number {
    try {
      const navWithConnection = navigator as any;
      if (navWithConnection.connection?.type === 'wifi' && navWithConnection.connection?.downlink) {
        // Convert downlink speed to signal strength percentage (0-100)
        const downlink = navWithConnection.connection.downlink;
        const signalStrength = Math.min(100, Math.round((downlink / 10) * 100));
        return signalStrength;
      }
    } catch (e) {
      console.warn('WiFi signal strength API not available');
    }
    return 0;
  }
}
