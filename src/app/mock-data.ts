import { Invoice, SparePart } from './invoice.model';

export const MOCK_INVOICES: Invoice[] = [

];


export const MOCK_SPARE_PARTS: SparePart[] = [
  {
    id: 'sp-001',
    name: 'Castrol Magnatec Engine Oil 5W-30',
    category: 'Oil',
    quantity: 45,
    reorderLevel: 15,
    unitPrice: 850,
    sellingPrice: 1050,
    supplier: 'Castrol India Ltd',
    lastRestocked: '2026-05-15'
  },
  {
    id: 'sp-002',
    name: 'Shell Helix Ultra Engine Oil 10W-40',
    category: 'Oil',
    quantity: 32,
    reorderLevel: 12,
    unitPrice: 920,
    sellingPrice: 1150,
    supplier: 'Shell India',
    lastRestocked: '2026-05-10'
  },
  {
    id: 'sp-003',
    name: 'Mobil Super 3000 Diesel 15W-40',
    category: 'Oil',
    quantity: 28,
    reorderLevel: 10,
    unitPrice: 780,
    sellingPrice: 970,
    supplier: 'Mobil India',
    lastRestocked: '2026-05-12'
  },
  {
    id: 'sp-004',
    name: 'Mann Engine Oil Filter W67/1',
    category: 'Filter',
    quantity: 56,
    reorderLevel: 20,
    unitPrice: 320,
    sellingPrice: 420,
    supplier: 'Mann & Hummel',
    lastRestocked: '2026-05-14'
  },
  {
    id: 'sp-005',
    name: 'Bosch Air Filter BA 4675',
    category: 'Filter',
    quantity: 38,
    reorderLevel: 15,
    unitPrice: 450,
    sellingPrice: 580,
    supplier: 'Bosch India',
    lastRestocked: '2026-05-16'
  },
  {
    id: 'sp-006',
    name: 'Cabin Air Filter Charcoal Type',
    category: 'Filter',
    quantity: 24,
    reorderLevel: 10,
    unitPrice: 650,
    sellingPrice: 820,
    supplier: 'Donaldson',
    lastRestocked: '2026-05-13'
  },
  {
    id: 'sp-007',
    name: 'Apollo Fuel Filter Element',
    category: 'Fuel',
    quantity: 18,
    reorderLevel: 8,
    unitPrice: 580,
    sellingPrice: 750,
    supplier: 'Apollo Filters',
    lastRestocked: '2026-05-11'
  },
  {
    id: 'sp-008',
    name: 'Coolant Concentrate 5L - Blue',
    category: 'Coolant',
    quantity: 12,
    reorderLevel: 5,
    unitPrice: 2100,
    sellingPrice: 2680,
    supplier: 'Gulf Oil',
    lastRestocked: '2026-05-14'
  },
  {
    id: 'sp-009',
    name: 'Amaron Car Battery 55 AH DIN',
    category: 'Battery',
    quantity: 8,
    reorderLevel: 3,
    unitPrice: 5400,
    sellingPrice: 6850,
    supplier: 'Amaron',
    lastRestocked: '2026-05-18'
  },
  {
    id: 'sp-010',
    name: 'Exide 45AH 3 Year Battery',
    category: 'Battery',
    quantity: 11,
    reorderLevel: 4,
    unitPrice: 4200,
    sellingPrice: 5350,
    supplier: 'Exide Industries',
    lastRestocked: '2026-05-17'
  },
  {
    id: 'sp-011',
    name: 'Brembo Front Brake Pads Set',
    category: 'Brake',
    quantity: 22,
    reorderLevel: 8,
    unitPrice: 2400,
    sellingPrice: 3050,
    supplier: 'Brembo India',
    lastRestocked: '2026-05-15'
  },
  {
    id: 'sp-012',
    name: 'TRW Rear Brake Pads Set',
    category: 'Brake',
    quantity: 19,
    reorderLevel: 7,
    unitPrice: 2200,
    sellingPrice: 2800,
    supplier: 'TRW',
    lastRestocked: '2026-05-16'
  },
  {
    id: 'sp-013',
    name: 'Suspension Bushing Kit (Front)',
    category: 'Suspension',
    quantity: 5,
    reorderLevel: 2,
    unitPrice: 4800,
    sellingPrice: 6100,
    supplier: 'Suspension India',
    lastRestocked: '2026-05-14'
  },
  {
    id: 'sp-014',
    name: 'Shock Absorber Pair (Rear)',
    category: 'Suspension',
    quantity: 7,
    reorderLevel: 3,
    unitPrice: 8900,
    sellingPrice: 11300,
    supplier: 'Bilstein',
    lastRestocked: '2026-05-12'
  },
  {
    id: 'sp-015',
    name: 'Bosch Alternator 90A',
    category: 'Electrical',
    quantity: 4,
    reorderLevel: 2,
    unitPrice: 6800,
    sellingPrice: 8650,
    supplier: 'Bosch India',
    lastRestocked: '2026-05-10'
  },
  {
    id: 'sp-016',
    name: 'Starter Motor (12V 1.4 KW)',
    category: 'Electrical',
    quantity: 3,
    reorderLevel: 1,
    unitPrice: 8500,
    sellingPrice: 10800,
    supplier: 'Denso',
    lastRestocked: '2026-05-08'
  },
  {
    id: 'sp-017',
    name: 'Spark Plugs Set (4 pieces)',
    category: 'Electrical',
    quantity: 14,
    reorderLevel: 6,
    unitPrice: 1500,
    sellingPrice: 1950,
    supplier: 'NGK Spark Plugs',
    lastRestocked: '2026-05-19'
  },
  {
    id: 'sp-018',
    name: 'Windshield Wipers Pair',
    category: 'Other',
    quantity: 26,
    reorderLevel: 10,
    unitPrice: 420,
    sellingPrice: 550,
    supplier: 'Bosch Wipers',
    lastRestocked: '2026-05-13'
  },
  {
    id: 'sp-019',
    name: 'Power Steering Fluid 1L',
    category: 'Other',
    quantity: 16,
    reorderLevel: 6,
    unitPrice: 680,
    sellingPrice: 880,
    supplier: 'Castrol',
    lastRestocked: '2026-05-11'
  }
];
