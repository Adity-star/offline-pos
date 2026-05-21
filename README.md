# SKT BILLING SYSTEM - PROJECT ARCHITECTURE

## 🏗️ Architecture Overview

This is a **fully offline desktop application** built with a modern tech stack designed for retail shop billing and inventory management.

### Architecture Type
**Electron + Next.js Desktop Application**
- Desktop runtime using Electron
- Frontend built with Next.js (exported as static files)
- Local SQLite database
- No cloud dependencies
- All data stored locally on user's machine

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON SHELL (Desktop)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              NEXT.JS FRONTEND (React)                 │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Pages & Components                             │ │  │
│  │  │  - Billing/POS                                  │ │  │
│  │  │  - Product Management                           │ │  │
│  │  │  - Customer Management                          │ │  │
│  │  │  - Sales History                                │ │  │
│  │  │  - Analytics Dashboard                          │ │  │
│  │  │  - Settings                                     │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  State Management (Zustand)                     │ │  │
│  │  │  - Billing Store                                │ │  │
│  │  │  - Settings Store                               │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  API Layer (Next.js API Routes)                 │ │  │
│  │  │  - /api/products                                │ │  │
│  │  │  - /api/sales                                   │ │  │
│  │  │  - /api/customers                               │ │  │
│  │  │  - /api/settings                                │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                              ↕                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           PRISMA ORM (Database Layer)                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                              ↕                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         SQLite DATABASE (Local Storage)               │  │
│  │  - Users, Products, Customers, Sales, Inventory       │  │
│  │  - Settings, Backups                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         ELECTRON APIs (Native Features)               │  │
│  │  - Printing (Thermal & A4)                            │  │
│  │  - File System (Backup/Restore)                       │  │
│  │  - Window Management                                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack

### **Frontend Layer**
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | React framework, routing, static export | 14.2.x |
| React | UI components | 18.3.x |
| TypeScript | Type safety | 5.4.x |
| TailwindCSS | Styling | 3.4.x |
| shadcn/ui | UI component library | Latest |

### **State Management**
| Technology | Purpose |
|------------|---------|
| Zustand | Global state (billing cart, settings) |
| React Hook Form | Form state management |
| Zod | Schema validation |

### **Desktop Runtime**
| Technology | Purpose |
|------------|---------|
| Electron | Desktop application wrapper |
| Electron Builder | Package & distribute Windows app |

### **Database Layer**
| Technology | Purpose |
|------------|---------|
| SQLite | Local database |
| Prisma | ORM, migrations, type safety |

### **Data Visualization**
| Technology | Purpose |
|------------|---------|
| Recharts | Dashboard charts |
| TanStack Table | Data tables with sorting/filtering |

### **Utilities**
| Technology | Purpose |
|------------|---------|
| xlsx | Excel import/export |
| lucide-react | Icons |
| date-fns | Date formatting |
| bcryptjs | Password hashing |

---

## 📁 Application Layers

### **1. Presentation Layer (Frontend)**
- **Location**: `src/app/` and `src/components/`
- **Responsibility**: User interface, user interactions
- **Technologies**: React, TailwindCSS, shadcn/ui

### **2. Business Logic Layer**
- **Location**: `src/lib/` and `src/store/`
- **Responsibility**: Application logic, calculations, state management
- **Technologies**: TypeScript, Zustand

### **3. Data Access Layer**
- **Location**: `src/app/api/`
- **Responsibility**: Database operations, CRUD operations
- **Technologies**: Prisma ORM, Next.js API Routes

### **4. Database Layer**
- **Location**: `prisma/` directory
- **Responsibility**: Data persistence
- **Technologies**: SQLite, Prisma

### **5. Native Layer**
- **Location**: `src/electron/`
- **Responsibility**: OS integration, printing, file system
- **Technologies**: Electron APIs

---

## 🗃️ Database Architecture

### **Tables & Relationships**

```
┌─────────────┐         ┌──────────────┐
│    User     │         │   Category   │
├─────────────┤         ├──────────────┤
│ id          │         │ id           │
│ username    │         │ name         │
│ password    │         └──────────────┘
│ fullName    │                │
│ role        │                │ 1
└─────────────┘                │
       │ 1                     │
       │                       │
       │                       │ *
       │ *           ┌─────────────────┐
       │             │    Product      │
       │             ├─────────────────┤
       │             │ id              │
       │             │ name            │
       │             │ sku             │
       │             │ categoryId      │─────┐
       │             │ costPrice       │     │
       │             │ sellingPrice    │     │
       │             │ currentStock    │     │
       │             │ minStockAlert   │     │
       │             └─────────────────┘     │
       │                     │ 1              │
       │                     │                │
       │                     │                │
       │                     │ *              │
┌──────┴──────┐      ┌──────────────┐        │
│    Sale     │      │  SaleItem    │        │
├─────────────┤      ├──────────────┤        │
│ id          │ 1    │ id           │        │
│ invoiceNo   │──────│ saleId       │        │
│ customerId  │─┐ *  │ productId    │────────┘
│ userId      │─┘    │ quantity     │
│ grandTotal  │      │ sellingPrice │
│ paymentMode │      │ profit       │
└─────────────┘      └──────────────┘
       │ 1
       │
       │ *
┌─────────────┐
│  Customer   │
├─────────────┤
│ id          │
│ name        │
│ mobile      │
│ address     │
│ pendingAmt  │
└─────────────┘
```

### **Key Database Features**
- ✅ Foreign key relationships
- ✅ Indexes on frequently queried columns
- ✅ Cascading deletes where appropriate
- ✅ Automatic timestamps (createdAt, updatedAt)
- ✅ Soft deletes for sales (isDeleted flag)

---

## 🔄 Data Flow Architecture

### **Billing/POS Flow**
```
User Input (Product Selection)
         ↓
Billing Store (Zustand)
         ↓
Calculate Totals (subtotal, tax, discount)
         ↓
Submit Sale API (/api/sales POST)
         ↓
Prisma Transaction:
  - Create Sale
  - Create Sale Items
  - Update Product Stock
  - Log Inventory Changes
  - Update Customer Stats
         ↓
Return Invoice Data
         ↓
Trigger Print (Thermal/A4)
         ↓
Clear Billing Store
```

### **Product Management Flow**
```
User Form Input
         ↓
Validation (Zod Schema)
         ↓
API Call (/api/products POST/PUT)
         ↓
Prisma Operation
         ↓
Update UI Table
         ↓
Show Toast Notification
```

---

## 🖨️ Printing Architecture

### **Thermal Printer (80mm)**
- Window.print() with custom CSS
- Monospace font for alignment
- Compact layout
- Auto-cut support

### **A4 Invoice**
- Professional layout
- Company letterhead
- Detailed itemization
- Terms & conditions

### **Print Flow**
```
Sale Completed
         ↓
Fetch Store Settings
         ↓
Generate HTML Template
         ↓
Open Print Dialog (or Silent Print)
         ↓
Electron Print API
         ↓
Send to Printer
```

---

## 💾 Backup & Restore Architecture

### **Backup Strategy**
```
Manual/Scheduled Backup
         ↓
Copy SQLite .db file
         ↓
Zip with metadata
         ↓
Save to user-selected location
         ↓
Log backup record in database
```

### **Restore Strategy**
```
User selects backup file
         ↓
Validate backup integrity
         ↓
Create current backup (safety)
         ↓
Replace current .db file
         ↓
Restart application
```

---

## 🔐 Security Architecture

### **Authentication**
- Local user authentication
- Bcrypt password hashing
- Session management (localStorage)
- Role-based access control (Admin/Cashier)

### **Data Security**
- No external API calls
- All data stays on local machine
- SQL injection prevention (Prisma parameterized queries)
- Input validation on all forms (Zod)

---

## 📈 Performance Optimization

### **Database Optimization**
- Indexes on: `sku`, `barcode`, `mobile`, `invoiceNumber`
- Pagination for large datasets
- Lazy loading of related data
- Connection pooling

### **Frontend Optimization**
- React component memoization
- Debounced search inputs
- Virtual scrolling for long lists
- Code splitting
- Image optimization

### **Offline Performance**
- No network latency
- Instant database queries
- Local state management
- Fast SQLite reads/writes

---

## 🚀 Deployment Architecture

### **Development Environment**
```
npm run dev (Next.js) + npm run electron:dev
         ↓
Hot reload enabled
Local SQLite database
Developer tools enabled
```

### **Production Build**
```
npm run build (Next.js static export)
         ↓
npm run electron:build
         ↓
Electron packages Next.js output
         ↓
Create Windows installer (.exe)
         ↓
Distribute to users
```

### **Installation on User Machine**
```
User runs installer.exe
         ↓
Install to Program Files
         ↓
Create desktop shortcut
         ↓
Initialize SQLite database
         ↓
Seed default settings
         ↓
Ready to use!
```

---

## 📦 File Storage Locations

### **Development**
- Database: `./prisma/dev.db`
- Uploads: `./public/uploads/`
- Backups: `./backups/`

### **Production (Windows)**
- Database: `%APPDATA%/skt-billing/database.db`
- Settings: `%APPDATA%/skt-billing/settings.json`
- Backups: `%USERPROFILE%/Documents/SKT Backups/`
- Logs: `%APPDATA%/skt-billing/logs/`

---

## 🎯 Key Architectural Decisions

### **Why SQLite?**
✅ Zero configuration
✅ Serverless architecture
✅ Perfect for single-user desktop apps
✅ ACID compliance
✅ Fast for <100GB data
✅ File-based (easy backup)

### **Why Next.js?**
✅ React framework with built-in routing
✅ Can export static files for Electron
✅ API routes for backend logic
✅ TypeScript support
✅ Fast development experience

### **Why Electron?**
✅ Cross-platform desktop apps
✅ Access to native OS features
✅ Printing capabilities
✅ File system access
✅ Mature ecosystem

### **Why Zustand?**
✅ Lightweight (3kb)
✅ No boilerplate like Redux
✅ TypeScript friendly
✅ Perfect for billing cart state

---

## 🔮 Scalability Considerations

### **Current Capacity**
- ✅ Up to 50,000 invoices
- ✅ Up to 10,000 products
- ✅ Up to 5,000 customers
- ✅ Single shop operation

### **If Scaling Needed**
- Migrate to PostgreSQL
- Add cloud sync (optional)
- Multi-shop support
- API-first architecture

---

This architecture is designed for **maximum reliability, speed, and offline capability** for retail shop operations.

