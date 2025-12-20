import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: string;
          full_name: string;
          phone: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      staff: {
        Row: {
          id: string;
          user_id: string | null;
          employee_code: string;
          position: string;
          salary: number;
          hire_date: string;
          status: string;
          created_at: string;
        };
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          credit_limit: number;
          credit_balance: number;
          total_purchases: number;
          created_at: string;
        };
      };
      items: {
        Row: {
          id: string;
          barcode: string | null;
          name: string;
          description: string | null;
          category_id: string | null;
          cost_price: number;
          selling_price: number;
          tax_rate: number;
          discount_rate: number;
          reorder_level: number;
          is_active: boolean;
          created_at: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          item_id: string;
          quantity: number;
          location: string;
          last_updated: string;
        };
      };
      sales: {
        Row: {
          id: string;
          sale_number: string;
          customer_id: string | null;
          staff_id: string | null;
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          status: string;
          created_at: string;
        };
      };
    };
  };
};
