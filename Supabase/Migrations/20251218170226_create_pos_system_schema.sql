/*
  # Complete POS System Database Schema
  
  ## Tables Created
  
  ### 1. User Management
    - `profiles` - Extended user profile information
      - id (uuid, references auth.users)
      - role (text) - admin, manager, cashier, staff
      - full_name (text)
      - phone (text)
      - created_at (timestamptz)
  
  ### 2. Staff Management
    - `staff` - Staff/employee records
      - id (uuid, primary key)
      - user_id (uuid, references profiles)
      - employee_code (text, unique)
      - position (text)
      - salary (decimal)
      - hire_date (date)
      - status (text) - active, inactive, terminated
      - created_at (timestamptz)
  
  ### 3. Attendance Management
    - `attendance` - Daily attendance tracking
      - id (uuid, primary key)
      - staff_id (uuid, references staff)
      - date (date)
      - check_in (timestamptz)
      - check_out (timestamptz)
      - status (text) - present, absent, late, half_day
      - notes (text)
      - created_at (timestamptz)
  
  ### 4. Payroll Management
    - `payroll` - Monthly payroll records
      - id (uuid, primary key)
      - staff_id (uuid, references staff)
      - period_start (date)
      - period_end (date)
      - base_salary (decimal)
      - bonus (decimal)
      - deductions (decimal)
      - net_salary (decimal)
      - status (text) - pending, paid
      - paid_at (timestamptz)
      - created_at (timestamptz)
  
  ### 5. Customer Management
    - `customers` - Customer records
      - id (uuid, primary key)
      - name (text)
      - email (text)
      - phone (text)
      - address (text)
      - credit_limit (decimal)
      - credit_balance (decimal)
      - total_purchases (decimal)
      - created_at (timestamptz)
  
  ### 6. Vendor Management
    - `vendors` - Supplier/vendor records
      - id (uuid, primary key)
      - name (text)
      - contact_person (text)
      - email (text)
      - phone (text)
      - address (text)
      - credit_balance (decimal)
      - created_at (timestamptz)
  
  ### 7. Categories
    - `categories` - Product categories
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - parent_id (uuid, references categories)
      - created_at (timestamptz)
  
  ### 8. Items/Products
    - `items` - Product inventory items
      - id (uuid, primary key)
      - barcode (text, unique)
      - name (text)
      - description (text)
      - category_id (uuid, references categories)
      - cost_price (decimal)
      - selling_price (decimal)
      - tax_rate (decimal)
      - discount_rate (decimal)
      - reorder_level (integer)
      - created_at (timestamptz)
  
  ### 9. Inventory/Stock Management
    - `inventory` - Stock tracking
      - id (uuid, primary key)
      - item_id (uuid, references items)
      - quantity (integer)
      - location (text)
      - last_updated (timestamptz)
  
    - `stock_movements` - Stock movement history
      - id (uuid, primary key)
      - item_id (uuid, references items)
      - type (text) - purchase, sale, adjustment, return
      - quantity (integer)
      - reference_id (uuid)
      - notes (text)
      - created_at (timestamptz)
  
  ### 10. Sales Management
    - `sales` - Sales transactions
      - id (uuid, primary key)
      - sale_number (text, unique)
      - customer_id (uuid, references customers)
      - staff_id (uuid, references staff)
      - subtotal (decimal)
      - tax_amount (decimal)
      - discount_amount (decimal)
      - total_amount (decimal)
      - status (text) - pending, completed, cancelled, refunded
      - created_at (timestamptz)
  
    - `sale_items` - Individual items in sales
      - id (uuid, primary key)
      - sale_id (uuid, references sales)
      - item_id (uuid, references items)
      - quantity (integer)
      - unit_price (decimal)
      - tax_rate (decimal)
      - discount_rate (decimal)
      - total (decimal)
  
  ### 11. Payment Management
    - `payments` - Payment records
      - id (uuid, primary key)
      - sale_id (uuid, references sales)
      - payment_method (text) - cash, card, mobile, bank_transfer, credit
      - amount (decimal)
      - reference_number (text)
      - status (text) - pending, completed, failed
      - created_at (timestamptz)
  
  ### 12. Receipt Management
    - `receipts` - Receipt records
      - id (uuid, primary key)
      - sale_id (uuid, references sales)
      - receipt_number (text, unique)
      - printed (boolean)
      - print_count (integer)
      - created_at (timestamptz)
  
  ### 13. Delivery Management
    - `deliveries` - Home delivery tracking
      - id (uuid, primary key)
      - sale_id (uuid, references sales)
      - customer_id (uuid, references customers)
      - delivery_address (text)
      - delivery_date (date)
      - delivery_time (text)
      - status (text) - pending, in_transit, delivered, cancelled
      - driver_name (text)
      - driver_phone (text)
      - notes (text)
      - created_at (timestamptz)
  
  ### 14. Expenses/Cost Management
    - `expenses` - Business expenses
      - id (uuid, primary key)
      - category (text)
      - description (text)
      - amount (decimal)
      - vendor_id (uuid, references vendors)
      - date (date)
      - reference_number (text)
      - created_at (timestamptz)
  
  ### 15. Credit/Debit Management
    - `credit_transactions` - Customer credit/debit tracking
      - id (uuid, primary key)
      - customer_id (uuid, references customers)
      - type (text) - credit, debit, payment
      - amount (decimal)
      - reference_id (uuid)
      - description (text)
      - balance_after (decimal)
      - created_at (timestamptz)
  
  ### 16. System Settings
    - `tax_settings` - Tax configuration
      - id (uuid, primary key)
      - name (text)
      - rate (decimal)
      - is_active (boolean)
      - created_at (timestamptz)
  
    - `printer_settings` - Printer configuration
      - id (uuid, primary key)
      - printer_name (text)
      - printer_type (text) - thermal, regular
      - paper_width (integer)
      - is_default (boolean)
      - settings (jsonb)
      - created_at (timestamptz)
  
  ## Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff',
  full_name text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  employee_code text UNIQUE NOT NULL,
  position text NOT NULL,
  salary decimal(10,2) DEFAULT 0,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own record"
  ON staff FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamptz,
  check_out timestamptz,
  status text DEFAULT 'present',
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = attendance.staff_id AND staff.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary decimal(10,2) DEFAULT 0,
  bonus decimal(10,2) DEFAULT 0,
  deductions decimal(10,2) DEFAULT 0,
  net_salary decimal(10,2) DEFAULT 0,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own payroll"
  ON payroll FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = payroll.staff_id AND staff.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can manage payroll"
  ON payroll FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  credit_limit decimal(10,2) DEFAULT 0,
  credit_balance decimal(10,2) DEFAULT 0,
  total_purchases decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  credit_balance decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text UNIQUE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  cost_price decimal(10,2) DEFAULT 0,
  selling_price decimal(10,2) NOT NULL,
  tax_rate decimal(5,2) DEFAULT 0,
  discount_rate decimal(5,2) DEFAULT 0,
  reorder_level integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage items"
  ON items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL UNIQUE,
  quantity integer DEFAULT 0,
  location text DEFAULT 'main',
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inventory"
  ON inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  quantity integer NOT NULL,
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  subtotal decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) DEFAULT 0,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can create sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

CREATE POLICY "Managers can manage sales"
  ON sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  tax_rate decimal(5,2) DEFAULT 0,
  discount_rate decimal(5,2) DEFAULT 0,
  total decimal(10,2) NOT NULL
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage sale items"
  ON sale_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  payment_method text NOT NULL,
  amount decimal(10,2) NOT NULL,
  reference_number text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL UNIQUE,
  receipt_number text UNIQUE NOT NULL,
  printed boolean DEFAULT false,
  print_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage receipts"
  ON receipts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  delivery_address text NOT NULL,
  delivery_date date NOT NULL,
  delivery_time text,
  status text DEFAULT 'pending',
  driver_name text,
  driver_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view deliveries"
  ON deliveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage deliveries"
  ON deliveries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  amount decimal(10,2) NOT NULL,
  reference_id uuid,
  description text,
  balance_after decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view credit transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage credit transactions"
  ON credit_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager', 'cashier')
    )
  );

-- Tax settings table
CREATE TABLE IF NOT EXISTS tax_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate decimal(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tax settings"
  ON tax_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tax settings"
  ON tax_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Printer settings table
CREATE TABLE IF NOT EXISTS printer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  printer_name text NOT NULL,
  printer_type text DEFAULT 'thermal',
  paper_width integer DEFAULT 80,
  is_default boolean DEFAULT false,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE printer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view printer settings"
  ON printer_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage printer settings"
  ON printer_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Insert default tax setting
INSERT INTO tax_settings (name, rate, is_active)
VALUES ('Standard VAT', 15.00, true)
ON CONFLICT DO NOTHING;