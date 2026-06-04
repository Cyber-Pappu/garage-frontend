export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;      // purchase / base cost price
  sellingPrice: number;   // selling price shown in the vehicle complaints table
  taxRate: number;        // e.g. 18% GST
  total: number;
}


export interface Invoice {
  id: string; // e.g., "GB-2026-0001"
  customerName: string;
  mobileNo: string;
  address: string;
  vehicleType: 'SUV' | '4x4' | 'Sedan' | 'Hatchback' | 'Motorcycle' | 'Other';
  brandName: string;
  modelType: string;
  vehicleNumber: string;
  kmsRun: number;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  labourCharge: number;
  partsProfit: number;
  discountAmount: number;
  grandTotal: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
  notes: string;
}

export interface ServicePreset {
  description: string;
  defaultPrice: number;        // unit / cost price
  defaultSellingPrice: number; // selling price to display
  defaultTaxRate: number;
}


export interface SparePart {
  id: string;
  name: string;
  category: 'Oil' | 'Filter' | 'Fuel' | 'Coolant' | 'Battery' | 'Brake' | 'Suspension' | 'Electrical' | 'Other';
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  sellingPrice: number;
  supplier: string;
  lastRestocked: string;
}

export const SERVICE_PRESETS: ServicePreset[] = [
  { description: 'Full Synthetic Engine Oil Change',                    defaultPrice: 3200,  defaultSellingPrice: 3950,  defaultTaxRate: 18 },
  { description: 'Front Brake Pads Replacement',                        defaultPrice: 2400,  defaultSellingPrice: 3050,  defaultTaxRate: 18 },
  { description: 'Rear Brake Pads Replacement',                         defaultPrice: 2200,  defaultSellingPrice: 2800,  defaultTaxRate: 18 },
  { description: 'Wheel Alignment, Balancing & Rotation',               defaultPrice: 1200,  defaultSellingPrice: 1500,  defaultTaxRate: 12 },
  { description: 'Air Conditioner Gas Refill & Filter Clean',           defaultPrice: 1800,  defaultSellingPrice: 2200,  defaultTaxRate: 18 },
  { description: 'Full Body Foam Wash & Vacuuming',                     defaultPrice: 800,   defaultSellingPrice: 1000,  defaultTaxRate: 18 },
  { description: 'Interior Detailing & Leather Conditioning',           defaultPrice: 3500,  defaultSellingPrice: 4350,  defaultTaxRate: 18 },
  { description: 'Amaron Battery Replacement (55AH - 5 Yr Warranty)',   defaultPrice: 5400,  defaultSellingPrice: 6850,  defaultTaxRate: 28 },
  { description: 'Spark Plugs Set Replacement',                         defaultPrice: 1500,  defaultSellingPrice: 1950,  defaultTaxRate: 18 },
  { description: 'Coolant Flush & Refill',                              defaultPrice: 900,   defaultSellingPrice: 1150,  defaultTaxRate: 18 },
  { description: 'Front Suspension Bushing Kit Replacement',            defaultPrice: 4800,  defaultSellingPrice: 6100,  defaultTaxRate: 18 },
  { description: 'Clutch Assembly Replacement (Labor Included)',         defaultPrice: 9500,  defaultSellingPrice: 11800, defaultTaxRate: 18 },
  { description: 'General Health Inspection Scan & Report',             defaultPrice: 600,   defaultSellingPrice: 750,   defaultTaxRate: 18 },
];


export const VEHICLE_TYPES = ['SUV', '4x4', 'Sedan', 'Hatchback', 'Motorcycle', 'Other'] as const;

export const BRANDS = [
  'Toyota',
  'Jeep',
  'Ford',
  'Land Rover',
  'Mahindra',
  'Tata',
  'Maruti Suzuki',
  'Hyundai',
  'Honda',
  'Kia',
  'Volkswagen',
  'Skoda',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Chevrolet',
  'Nissan',
  'Other'
];
