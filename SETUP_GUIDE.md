# POS System - Setup Guide

## Overview

A comprehensive Point of Sale (POS) system with complete inventory management, sales tracking, customer management, and business analytics. Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features Implemented

### Core Features
1. **Barcode Scanner Integration** - Built-in support for hardware barcode scanners (press F2 to focus)
2. **Thermal Printer Support** - Ready for thermal receipt printer integration
3. **Printer Management** - Configure and manage printing settings
4. **Receipt Management** - Auto-generate and track receipts for all sales
5. **Reports Management** - Comprehensive sales reports with date filtering and CSV export
6. **Inventory Management** - Real-time stock tracking with low-stock alerts
7. **Item Management** - Complete product catalog with pricing, taxes, and discounts

### Business Management
8. **Customer Management** - Track customers, credit limits, and purchase history
9. **Data Management** - Complete database with all business entities
10. **Login Management** - Role-based authentication (Admin, Manager, Cashier, Staff)
11. **Data Export System** - Export reports to CSV format
12. **Tax and Discount System** - Configurable tax rates and item-level discounts
13. **Staff Management** - Employee records with positions and salaries
14. **Payroll Management** - Track employee compensation
15. **Attendance Management** - Monitor employee attendance

### Financial Features
16. **Cost Management** - Track business expenses
17. **Tax and Discount Management** - Flexible pricing controls
18. **Credit/Debit Management** - Customer credit tracking and payment recovery
19. **Different Payment Options** - Cash, Card, Mobile Money, Credit
20. **Payment Management** - Complete payment processing and tracking
21. **Recovery Management** - Track outstanding balances

### Operations
22. **Stock Management** - Inventory adjustments and stock movements
23. **Vendor Management** - Supplier database and tracking
24. **Home Delivery Management** - Track delivery orders and status

## Getting Started

### Prerequisites
- Node.js and npm installed
- Supabase account with database configured

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. The database schema has been automatically created with all necessary tables

### First-Time Setup

1. Create your first admin user by signing up through the login screen
2. After signup, manually update the user's role in Supabase:
   - Go to Supabase Dashboard > Table Editor
   - Open the `profiles` table
   - Find your user and set `role` to `admin`

### Running the Application

The development server starts automatically. Access the application at the provided URL.

## Usage Guide

### Point of Sale (POS)
- Press F2 to quickly focus the barcode scanner input
- Scan items or browse the catalog manually
- Add customer information (optional)
- Select payment method (Cash, Card, Mobile, Credit)
- Complete the sale and print receipt

### Inventory Management
- View all stock levels in real-time
- Get alerts for low-stock items
- Adjust inventory with add/remove stock functions
- Track all stock movements and history

### Item Management
- Add new products with barcode, pricing, and tax info
- Set reorder levels for automatic alerts
- Organize items by categories
- Track cost and selling prices

### Customer Management
- Maintain customer database
- Set credit limits for regular customers
- Track purchase history and credit balances
- Search by name, phone, or email

### Reports & Analytics
- View sales performance by date range
- Export data to CSV for further analysis
- Track revenue, tax collected, and discounts
- Monitor top-selling items

### Staff Management
- Add employee records with positions and salaries
- Track hire dates and employment status
- Monitor attendance (placeholder - can be expanded)
- Process payroll (placeholder - can be expanded)

## Role-Based Access

- **Admin**: Full system access
- **Manager**: All operations except payroll and system settings
- **Cashier**: POS, customers, sales, receipts, deliveries
- **Staff**: Limited access based on specific needs

## Database Structure

The system uses a comprehensive database schema with:
- User profiles and authentication
- Staff and payroll records
- Customer and vendor management
- Product catalog with categories
- Inventory and stock movements
- Sales and payment transactions
- Receipts and delivery tracking
- Expense and credit management
- Tax and printer settings

All tables have Row Level Security (RLS) enabled for data protection.

## Technical Details

### Technologies Used
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Build Tool**: Vite

### Key Features
- Real-time data synchronization
- Responsive design for desktop and mobile
- Keyboard shortcuts for faster operations
- Auto-save functionality
- Transaction integrity with proper error handling

## Security

- Row Level Security (RLS) on all database tables
- Role-based access control
- Secure authentication with Supabase
- Protected routes based on user roles
- No sensitive data exposed in client code

## Future Enhancements

The system is designed to be extensible. Placeholder modules are included for:
- Advanced attendance tracking with biometric integration
- Automated payroll processing
- Detailed expense categorization
- Customer credit recovery workflows
- Advanced delivery routing
- Receipt printing automation
- Multi-location support

## Support

For issues or questions about the system, refer to the code documentation or contact your system administrator.
