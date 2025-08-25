export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  description?: string;
  brand_id?: string;
  category_id?: string;
  price: number;
  sale_price?: number;
  stock: number;
  images: string[];
  specs: Record<string, any>;
  rating: number;
  rating_count: number;
  is_featured: boolean;
  is_active: boolean;
  weight?: number;
  dimensions?: Record<string, any>;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  category?: Category;
}

export interface Fitment {
  id: string;
  product_id: string;
  year_from: number;
  year_to: number;
  make: string;
  model: string;
  engine?: string;
  trim?: string;
  notes?: string;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  items: CartItem[];
  shipping_address: Address;
  billing_address: Address;
  payment_method?: string;
  payment_reference?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  body?: string;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  saved_vehicle?: {
    year?: number;
    make?: string;
    model?: string;
    engine?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  year: number;
  make: string;
  model: string;
  engine?: string;
}

export interface FilterState {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  inStock: boolean;
  rating: number;
  search: string;
  vehicle?: Vehicle;
}