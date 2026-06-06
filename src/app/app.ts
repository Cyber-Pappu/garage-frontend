import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { Invoice, InvoiceItem, ServicePreset, SERVICE_PRESETS, VEHICLE_TYPES, BRANDS, SparePart } from './invoice.model';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('garage-billing-system');

  // Core database state
  readonly invoices = signal<Invoice[]>([]);
  readonly spareParts = signal<SparePart[]>([]);

  // Navigation / View states
  readonly activeView = signal<'dashboard' | 'create' | 'view' | 'edit' | 'inventory' | 'restock' | 'restock-confirmation' | 'report'>('create');
  readonly selectedInvoice = signal<Invoice | null>(null);

  // Filters & Search
  readonly searchQuery = signal<string>('');
  readonly inventorySearchQuery = signal<string>('');
  readonly filterVehicleType = signal<string>('All');
  readonly filterPaymentStatus = signal<string>('All');

  // Report filters
  readonly reportFromDate = signal<string>('');
  readonly reportToDate = signal<string>('');

  // Form Fields
  readonly formId = signal<string>('');
  readonly formCustomerName = signal<string>('');
  readonly formMobileNo = signal<string>('');
  readonly formAddress = signal<string>('');
  readonly formVehicleType = signal<'SUV' | '4x4' | 'Sedan' | 'Hatchback' | 'Motorcycle' | 'Other'>('SUV');
  readonly formBrandName = signal<string>('Toyota');
  readonly formModelType = signal<string>('');
  readonly formVehicleNumber = signal<string>('');
  readonly formKmsRun = signal<number | null>(null);
  readonly formDate = signal<string>('');
  readonly formDueDate = signal<string>('');
  readonly formItems = signal<InvoiceItem[]>([]);
  readonly formLabourCharge = signal<number>(0);
  readonly formPaymentStatus = signal<'Paid' | 'Unpaid' | 'Pending'>('Paid');
  readonly formPaymentMethod = signal<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('UPI');
  readonly formNotes = signal<string>('');

  // Restock form fields
  readonly formRestockItemName = signal<string>('');
  readonly formRestockUnits = signal<number>(1);
  readonly formRestockUnitPrice = signal<number | null>(null);
  readonly formRestockSellingPrice = signal<number | null>(null);

  // Restock field touched flags (show validation only after user interacts)
  readonly formRestockItemTouched = signal<boolean>(false);
  readonly formRestockUnitsTouched = signal<boolean>(false);
  readonly formRestockUnitPriceTouched = signal<boolean>(false);
  readonly formRestockSellingPriceTouched = signal<boolean>(false);

  // Restock confirmation state
  readonly restockConfirmationMessage = signal<string>('');
  readonly restockConfirmationDetail = signal<string>('');

  // Restock form validation
  readonly restockFormValid = computed(() => {
    const name = this.formRestockItemName().trim();
    const units = this.formRestockUnits() || 0;
    const unitPrice = this.formRestockUnitPrice();
    const sellingPrice = this.formRestockSellingPrice();

    // Require non-empty name, at least 1 unit, and unit/selling price >= 1
    return name.length > 0 && units >= 1 && unitPrice !== null && unitPrice >= 1 && sellingPrice !== null && sellingPrice >= 1;
  });

  // Dropdown list accessors for template
  readonly vehicleTypes = VEHICLE_TYPES;
  readonly brandsList = BRANDS;
  readonly servicePresets = SERVICE_PRESETS;

  // Form calculations using computed signals
  readonly formSubtotal = computed(() => {
    return this.formItems().reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  });

  readonly formTaxAmount = computed(() => {
    return this.formItems().reduce((acc, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return acc + (itemSubtotal * (item.taxRate / 100));
    }, 0);
  });

  // Spare parts total = sum of (sellingPrice × quantity) per line item  -- must be BEFORE formGrandTotal
  readonly formSpareTotal = computed(() => {
    return this.formItems().reduce((acc, item) => acc + (item.quantity * (item.sellingPrice || 0)), 0);
  });

  // GST amount computed from sellingPrice × taxRate  -- must be BEFORE formGrandTotal
  readonly formGstAmount = computed(() => {
    return this.formItems().reduce((acc, item) => {
      const itemSubtotal = item.quantity * (item.sellingPrice || 0);
      return acc + (itemSubtotal * (item.taxRate / 100));
    }, 0);
  });

  readonly formGrandTotal = computed(() => {
    const total = this.formSpareTotal() + this.formLabourCharge();
    return total > 0 ? total : 0;
  });



  // Inventory - Low Stock Items
  readonly lowStockItems = computed(() => {
    return this.spareParts()
      .filter(part => part.quantity <= part.reorderLevel)
      .sort((a, b) => (a.quantity - a.reorderLevel) - (b.quantity - b.reorderLevel));
  });

  readonly totalInventoryValue = computed(() => {
    return this.spareParts().reduce((acc, part) => acc + (part.quantity * part.unitPrice), 0);
  });

  // Filtered spare parts based on inventory search
  readonly filteredSpareParts = computed(() => {
    const query = this.inventorySearchQuery().toLowerCase().trim();
    if (!query) return this.spareParts();
    return this.spareParts().filter(part =>
      part.name.toLowerCase().includes(query) ||
      part.category.toLowerCase().includes(query)
    );
  });

  // KPI Computations
  readonly totalRevenue = computed(() => {
    return this.invoices()
      .filter(inv => inv.paymentStatus === 'Paid')
      .reduce((acc, inv) => acc + inv.grandTotal, 0);
  });

  readonly pendingAmount = computed(() => {
    return this.invoices()
      .filter(inv => inv.paymentStatus !== 'Paid')
      .reduce((acc, inv) => acc + inv.grandTotal, 0);
  });

  readonly totalInvoicesCount = computed(() => this.invoices().length);

  readonly averageInvoiceValue = computed(() => {
    const total = this.totalInvoicesCount();
    if (total === 0) return 0;
    const sum = this.invoices().reduce((acc, inv) => acc + inv.grandTotal, 0);
    return sum / total;
  });

  // Time-based income summaries for reports
  readonly thisWeekIncome = computed(() => {
    const from = this.reportFromDate();
    const to = this.reportToDate();
    let list = this.invoices();

    if (from) {
      list = list.filter(inv => inv.date >= from);
    }
    if (to) {
      list = list.filter(inv => inv.date <= to);
    }

    return list
      .filter(inv => inv.paymentStatus === 'Paid')
      .reduce((acc, inv) => acc + inv.grandTotal, 0);
  });

  readonly monthlyIncome = computed(() => {
    const from = this.reportFromDate();
    const to = this.reportToDate();
    let list = this.invoices();

    if (from) {
      list = list.filter(inv => inv.date >= from);
    }
    if (to) {
      list = list.filter(inv => inv.date <= to);
    }

    return list
      .filter(inv => inv.paymentStatus === 'Paid')
      .reduce((acc, inv) => acc + inv.grandTotal, 0);
  });

  readonly labourChargeThisMonth = computed(() => {
    const from = this.reportFromDate();
    const to = this.reportToDate();
    let list = this.invoices();

    if (from) {
      list = list.filter(inv => inv.date >= from);
    }
    if (to) {
      list = list.filter(inv => inv.date <= to);
    }

    return list.reduce((acc, inv) => acc + inv.labourCharge, 0);
  });

  readonly profitFromParts = computed(() => {

  const from = this.reportFromDate();
  const to = this.reportToDate();

  let list = this.invoices();

  if (from) {
    list = list.filter(inv => inv.date >= from);
  }

  if (to) {
    list = list.filter(inv => inv.date <= to);
  }

  return list.reduce(
    (acc, inv) => acc + Number(inv.partsProfit || 0),
    0
  );

});

  // Statistics for Charts
  readonly vehicleTypeStats = computed(() => {
    const counts = { SUV: 0, '4x4': 0, Sedan: 0, Hatchback: 0, Motorcycle: 0, Other: 0 };
    this.invoices().forEach(inv => {
      if (counts[inv.vehicleType] !== undefined) {
        counts[inv.vehicleType]++;
      } else {
        counts.Other++;
      }
    });

    const total = this.invoices().length || 1;
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  });

  // Sparkline Chart points for recent revenue growth
  readonly sparklinePoints = computed(() => {
    const sorted = [...this.invoices()].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return '0,50 300,50';
    if (sorted.length === 1) return `0,${50 - (sorted[0].grandTotal / 20000) * 40} 300,${50 - (sorted[0].grandTotal / 20000) * 40}`;
    
    const maxVal = Math.max(...sorted.map(i => i.grandTotal), 5000);
    const width = 300;
    const height = 50;
    const padding = 10;
    
    return sorted.map((inv, idx) => {
      const x = (idx / (sorted.length - 1)) * width;
      const y = height - padding - (inv.grandTotal / maxVal) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  // Filtered/Searched Invoice Listing
  readonly filteredInvoices = computed(() => {
    let list = this.invoices();
    const query = this.searchQuery().toLowerCase().trim();
    const vehicleType = this.filterVehicleType();
    const paymentStatus = this.filterPaymentStatus();

    if (query) {
      list = list.filter(inv =>
        inv.customerName.toLowerCase().includes(query) ||
        inv.vehicleNumber.toLowerCase().includes(query) ||
        inv.id.toLowerCase().includes(query) ||
        inv.brandName.toLowerCase().includes(query) ||
        inv.modelType.toLowerCase().includes(query) ||
        inv.mobileNo.includes(query)
      );
    }

    if (vehicleType !== 'All') {
      list = list.filter(inv => inv.vehicleType === vehicleType);
    }

    if (paymentStatus !== 'All') {
      list = list.filter(inv => inv.paymentStatus === paymentStatus);
    }

    // Sort by Date descending and then by ID descending
    return list.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  });

  // Reported invoices within date range
  readonly reportInvoices = computed(() => {
    const from = this.reportFromDate();
    const to = this.reportToDate();
    let list = this.invoices();

    if (from) {
      list = list.filter(inv => inv.date >= from);
    }
    if (to) {
      list = list.filter(inv => inv.date <= to);
    }

    return list.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  });

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadInvoices();
    this.loadSpareParts();
    this.resetForm();
    const nextId = this.generateInvoiceId();
    this.formId.set(nextId);
  }

  loadSpareParts() {

  this.http.get<any[]>(
    'https://garage-backend-production-c702.up.railway.app/api/inventory'
  ).subscribe({

    next: (data) => {

      const mapped: SparePart[] = data.map(item => ({
        id: String(item.id),
        name: item.part_name,
        category: item.category,
        quantity: item.current_stock,
        reorderLevel: item.min_stock,
        unitPrice: item.unit_price,
        sellingPrice: item.selling_price,
        supplier: 'Unknown',
        lastRestocked: item.created_at
      }));

      this.spareParts.set(mapped);
    },

    error: (err) => {
      console.error('Failed to load inventory', err);
    }
  });
}

  // Report View helpers
  showReportView() {

  const today = new Date();

  this.reportToDate.set(
    today.toISOString().split('T')[0]
  );

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const year = firstDay.getFullYear();
  const month = String(firstDay.getMonth() + 1).padStart(2, '0');
  const day = String(firstDay.getDate()).padStart(2, '0');

  this.reportFromDate.set(
    `${year}-${month}-${day}`
  );
  

  this.loadInvoices();
  this.activeView.set('report');
  this.selectedInvoice.set(null);
}
  refreshReport() {
    this.loadInvoices();
  }

  // Database Management
  loadInvoices() {
 
  this.http.get<any[]>(
    'https://garage-backend-production-c702.up.railway.app/api/invoices'
  ).subscribe({

    next: (data) => {


      const mapped: Invoice[] = data.map(inv => ({

        id: inv.invoice_id,

        customerName: inv.customer_name,
        mobileNo: inv.customer_phone,

        address: '',

        vehicleType: 'Other',
        brandName: inv.vehicle_name,
        modelType: '',

        vehicleNumber: inv.vehicle_number,

        kmsRun: Number(inv.odometer),

       date: inv.invoice_date.split('T')[0],
       dueDate: inv.invoice_date.split('T')[0],

        items: [],

        subtotal: Number(inv.grand_total),
        taxAmount: 0,

        labourCharge: Number(inv.labour_charge || 0),

        partsProfit: Number(inv.parts_profit || 0),

        discountAmount: 0,

        grandTotal: Number(inv.grand_total),

        paymentStatus: inv.status,
        paymentMethod: 'Cash',

        notes: ''
      }));

      this.invoices.set(mapped);
    },

    error: (err) => {
      console.error('Failed to load invoices', err);
    }

  });
}
  saveSparePartsToStorage(list: SparePart[]) {
    try {
      localStorage.setItem('garage_spare_parts', JSON.stringify(list));
      this.spareParts.set(list);
    } catch (e) {
      console.error('Failed to save spare parts to localStorage', e);
      this.spareParts.set(list);
    }
  }

  saveInvoicesToStorage(list: Invoice[]) {
    try {
      localStorage.setItem('garage_invoices', JSON.stringify(list));
      this.invoices.set(list);
    } catch (e) {
      console.error('Failed to write invoices to localStorage', e);
    }
  }

  // Navigation
  showCreateView() {
    this.resetForm();
    const nextId = this.generateInvoiceId();
    this.formId.set(nextId);
    this.activeView.set('create');
  }

  showDashboard() {
    this.activeView.set('dashboard');
    this.selectedInvoice.set(null);
  }

  showInventory() {
    this.activeView.set('inventory');
    this.selectedInvoice.set(null);
  }

  showRestockView() {
    this.resetRestockForm();
    this.activeView.set('restock');
    this.selectedInvoice.set(null);
  }

  showRestockConfirmation() {
    this.activeView.set('restock-confirmation');
  }

  completeRestockConfirmation() {
    this.showInventory();
  }

  resetRestockForm() {
    this.formRestockItemName.set('');
    this.formRestockUnits.set(1);
    this.formRestockUnitPrice.set(null);
    this.formRestockSellingPrice.set(null);
    this.formRestockItemTouched.set(false);
    this.formRestockUnitsTouched.set(false);
    this.formRestockUnitPriceTouched.set(false);
    this.formRestockSellingPriceTouched.set(false);
  }

  saveRestockDetails() {
    const itemName = this.formRestockItemName().trim();
    const units = Math.max(1, this.formRestockUnits() || 1);
    const unitPrice = this.formRestockUnitPrice() ?? 0;
    const sellingPrice = this.formRestockSellingPrice() ?? 0;

    if (!itemName) {
      return;
    }

    if (unitPrice < 1 || sellingPrice < 1) {
      return;
    }

      const payload = {
        part_name: itemName,
        category: 'Other',
        quantity: units,
        unit_price: unitPrice,
        selling_price: sellingPrice
      };

      this.http.post(
        'https://garage-backend-production-c702.up.railway.app/api/inventory/restock',
        payload
      ).subscribe({
        next: (response: any) => {

          this.loadSpareParts();

          this.restockConfirmationMessage.set(
            'Stock successfully updated'
          );

          this.restockConfirmationDetail.set(
            `"${itemName}" was restocked with ${units} unit(s).`
          );

          this.activeView.set('restock-confirmation');
        },

        error: (error) => {
          console.error(error);
          alert('Failed to update inventory');
        }
      });
  }

  // Form Operations
  generateInvoiceId(): string {
    const list = this.invoices();
    if (list.length === 0) return 'GB-2026-0001';
    
    // Find highest invoice number suffix
    let maxNum = 0;
    list.forEach(inv => {
      const match = inv.id.match(/GB-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    const currentYear = new Date().getFullYear();
    const nextNumString = String(maxNum + 1).padStart(4, '0');
    return `GB-${currentYear}-${nextNumString}`;
  }

  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    
    // Set due date to today + 7 days
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueDateStr = due.toISOString().split('T')[0];

    this.formId.set('');
    this.formCustomerName.set('');
    this.formMobileNo.set('');
    this.formAddress.set('');
    this.formVehicleType.set('SUV');
    this.formBrandName.set('Toyota');
    this.formModelType.set('');
    this.formVehicleNumber.set('');
    this.formKmsRun.set(null);
    this.formDate.set(today);
    this.formDueDate.set(dueDateStr);
    this.formLabourCharge.set(0);
    this.formPaymentStatus.set('Paid');
    this.formPaymentMethod.set('UPI');
    this.formNotes.set('');
    
    // Initialize form with one empty row
    this.formItems.set([this.createEmptyItem()]);
  }

  createEmptyItem(): InvoiceItem {
    return {
      id: 'item_' + Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      sellingPrice: 0,
      taxRate: 18,
      total: 0
    };
  }


  addNewItem() {
    this.formItems.update(items => [...items, this.createEmptyItem()]);
  }

  removeItem(index: number) {
    if (this.formItems().length <= 1) {
      // Keep at least one item, just clear it
      this.formItems.set([this.createEmptyItem()]);
      return;
    }
    this.formItems.update(items => items.filter((_, i) => i !== index));
  }

  updateItem(index: number, key: keyof InvoiceItem, value: any) {
    this.formItems.update(items => {
      const updated = [...items];
      const item = { ...updated[index] };

      if (key === 'description') {
        item.description = value;
        // Check if description matches a service preset and auto-fill price/tax/sellingPrice
        const preset = this.servicePresets.find(p => p.description === value);
        if (preset) {
          item.unitPrice = preset.defaultPrice;
          item.sellingPrice = preset.defaultSellingPrice;
          item.taxRate = preset.defaultTaxRate;
        } else {
          // Try to match against spare parts inventory by name
          const part = this.spareParts().find(p => p.name === value);
          if (part) {
            item.unitPrice = part.unitPrice;
            item.sellingPrice = part.sellingPrice;
          }
        }
      } else if (key === 'quantity') {
        item.quantity = Math.max(1, parseInt(value, 10) || 1);
      } else if (key === 'unitPrice') {
        item.unitPrice = Math.max(0, parseFloat(value) || 0);
      } else if (key === 'sellingPrice') {
        item.sellingPrice = Math.max(0, parseFloat(value) || 0);
      } else if (key === 'taxRate') {
        item.taxRate = Math.max(0, parseFloat(value) || 0);
      }

      // Total = qty × sellingPrice (no tax)
      const subtotal = item.quantity * item.sellingPrice;
      item.total = Math.round(subtotal * 100) / 100;

      updated[index] = item;
      return updated;
    });
  }


  // Pre-fill a row using service preset
  applyServicePreset(index: number, preset: ServicePreset) {
    this.formItems.update(items => {
      const updated = [...items];
      const item = { ...updated[index] };
      item.description = preset.description;
      item.unitPrice = preset.defaultPrice;
      item.sellingPrice = preset.defaultSellingPrice;
      item.taxRate = preset.defaultTaxRate;
      
      const subtotal = item.quantity * item.sellingPrice;
      item.total = Math.round(subtotal * 100) / 100;

      updated[index] = item;
      return updated;
    });
  }


  saveInvoice() {
    // Basic Form Validations
    if (!this.formCustomerName().trim()) {
      alert('Please enter Customer Name.');
      return;
    }
    if (!this.formVehicleNumber().trim()) {
      alert('Please enter Vehicle Number.');
      return;
    }
    if (!this.formMobileNo().trim() || this.formMobileNo().length < 8) {
      alert('Please enter a valid Mobile Number.');
      return;
    }
    if (this.formKmsRun() === null || this.formKmsRun()! < 0) {
      alert('Please enter valid Vehicle KMs run.');
      return;
    }

    // Filter out rows with empty descriptions
    const validItems = this.formItems().filter(item => item.description.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one valid invoice item description.');
      return;
    }
    const partsProfit = validItems.reduce((acc, item) => {
  return acc + (
    (item.sellingPrice - item.unitPrice) * item.quantity
  );
}, 0);

    const newInvoice: Invoice = {
      id: this.formId(),
      customerName: this.formCustomerName().trim(),
      mobileNo: this.formMobileNo().trim(),
      address: this.formAddress().trim() || 'Not Provided',
      vehicleType: this.formVehicleType(),
      brandName: this.formBrandName(),
      modelType: this.formModelType().trim() || 'Standard Model',
      vehicleNumber: this.formVehicleNumber().trim().toUpperCase(),
      kmsRun: this.formKmsRun() || 0,
      date: this.formDate(),
      dueDate: this.formDueDate() || this.formDate(),
      items: validItems,
      subtotal: this.formSpareTotal(),
      taxAmount: 0,
      labourCharge: this.formLabourCharge(),
      partsProfit: partsProfit,
      discountAmount: 0,
      grandTotal: this.formGrandTotal(),
      paymentStatus: this.formPaymentStatus(),
      paymentMethod: this.formPaymentMethod(),
      notes: this.formNotes().trim() || 'Thank you for choosing our service!'
    };


    let updatedList: Invoice[];
    const isEditing = this.activeView() === 'edit';
    const previousInvoice = isEditing ? this.invoices().find(inv => inv.id === newInvoice.id) : undefined;

    if (isEditing) {
      updatedList = this.invoices().map(inv => inv.id === newInvoice.id ? newInvoice : inv);
    } else {
      updatedList = [...this.invoices(), newInvoice];
    }

    validItems.forEach(item => {
      this.http.post(
        'https://garage-backend-production-c702.up.railway.app/api/inventory/consume',
        {
          part_name: item.description,
          quantity: item.quantity
        }
      ).subscribe({
        next: (res) => {
          
        },
        error: (err) => {
          console.error('Consume failed', err);
        }
      });
    });
    this.http.post(
      'https://garage-backend-production-c702.up.railway.app/api/invoices',
      {
      ...newInvoice,
      partsProfit: partsProfit,
      labourCharge: newInvoice.labourCharge
      }
      ).subscribe({
       next: (res) => {
         
    },  
       error: (err) => {
          
  }
});
    this.viewInvoice(newInvoice);
    this.saveInvoicesToStorage(updatedList);

    setTimeout(() => {
  this.loadSpareParts();
}, 500);

    this.viewInvoice(newInvoice);
  }

  editInvoice(invoice: Invoice) {
    this.formId.set(invoice.id);
    this.formCustomerName.set(invoice.customerName);
    this.formMobileNo.set(invoice.mobileNo);
    this.formAddress.set(invoice.address);
    this.formVehicleType.set(invoice.vehicleType);
    this.formBrandName.set(invoice.brandName);
    this.formModelType.set(invoice.modelType);
    this.formVehicleNumber.set(invoice.vehicleNumber);
    this.formKmsRun.set(invoice.kmsRun);
    this.formDate.set(invoice.date);
    this.formDueDate.set(invoice.dueDate);
    this.formItems.set(invoice.items.map(item => ({ ...item })));
    this.formLabourCharge.set(invoice.labourCharge || 0);
    this.formPaymentStatus.set(invoice.paymentStatus);
    this.formPaymentMethod.set(invoice.paymentMethod);
    this.formNotes.set(invoice.notes);

    this.activeView.set('edit');
  }

  viewInvoice(invoice: Invoice) {

  this.http.get<any[]>(
    `https://garage-backend-production-c702.up.railway.app/api/invoices/${invoice.id}/items`
  ).subscribe({

    next: (items) => {

      invoice.items = items.map(item => ({

        id: String(item.id),

        description: item.description,

        quantity: item.quantity,

        unitPrice: item.unit_price,

        sellingPrice: item.total / item.quantity,

        taxRate: 0,

        total: item.total

      }));

      this.selectedInvoice.set(invoice);

      this.activeView.set('view');

    },

    error: (err) => {

      console.error(err);

    }

  });

}

  adjustInventoryForInvoice(newInvoice: Invoice, previousInvoice?: Invoice | undefined) {
    const quantityDelta = new Map<string, number>();

    // Subtract quantities used by the new invoice
    newInvoice.items.forEach(item => {
      const name = item.description.trim();
      if (!name) return;

      quantityDelta.set(name, (quantityDelta.get(name) || 0) - item.quantity);
    });

    // Add back quantities from the previous invoice when editing
    if (previousInvoice) {
      previousInvoice.items.forEach(item => {
        const name = item.description.trim();
        if (!name) return;

        quantityDelta.set(name, (quantityDelta.get(name) || 0) + item.quantity);
      });
    }

    this.spareParts.update(parts => {
      const updated = parts.map(part => {
        const delta = quantityDelta.get(part.name);
        if (!delta) return part;

        const newQuantity = part.quantity + delta;
        return {
          ...part,
          quantity: newQuantity >= 0 ? newQuantity : 0,
          lastRestocked: part.lastRestocked
        };
      });

      this.saveSparePartsToStorage(updated);
      return updated;
    });
  }

  deleteInvoice(id: string, event?: Event) {
    if (event) {
      event.stopPropagation(); // Avoid triggering details card click
    }

    if (confirm(`Are you sure you want to delete Invoice ${id}?`)) {
      const updated = this.invoices().filter(inv => inv.id !== id);
      this.saveInvoicesToStorage(updated);
      
      // If we are currently viewing the deleted invoice, go back to reports
      if (this.selectedInvoice()?.id === id) {
        this.showReportView();
      }
    }
  }

  printInvoice() {
    window.print();
  }
}
