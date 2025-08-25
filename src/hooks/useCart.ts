import { useState, useEffect } from 'react';
import { CartItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Get cart ID from localStorage for guest users
  const getSessionCartId = () => {
    return localStorage.getItem('cart_session_id') || crypto.randomUUID();
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // Load user cart
        const { data, error } = await supabase
          .from('carts')
          .select('items')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setItems((data?.items as unknown as CartItem[]) || []);
      } else {
        // Load session cart
        const sessionId = getSessionCartId();
        localStorage.setItem('cart_session_id', sessionId);
        
        const { data, error } = await supabase
          .from('carts')
          .select('items')
          .eq('session_id', sessionId)
          .is('user_id', null)
          .maybeSingle();

        if (error) throw error;
        
        setItems((data?.items as unknown as CartItem[]) || []);
      }
    } catch (error: any) {
      console.error('Error loading cart:', error);
      // Don't show error toast for cart loading failures
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    try {
      if (user) {
        // Save user cart
        const { error } = await supabase
          .from('carts')
          .upsert({
            user_id: user.id,
            items: newItems as any,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });

        if (error) throw error;
      } else {
        // Save session cart
        const sessionId = getSessionCartId();
        localStorage.setItem('cart_session_id', sessionId);
        
        const { error } = await supabase
          .from('carts')
          .upsert({
            session_id: sessionId,
            user_id: null,
            items: newItems as any,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'session_id',
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Error saving cart:', error);
      toast({
        title: "Cart sync failed",
        description: "Your cart changes may not be saved.",
        variant: "destructive",
      });
    }
  };

  const addItem = async (productId: string, quantity: number = 1, price: number) => {
    const newItems = [...items];
    const existingIndex = newItems.findIndex(item => item.product_id === productId);
    
    if (existingIndex >= 0) {
      newItems[existingIndex].quantity += quantity;
    } else {
      newItems.push({
        product_id: productId,
        quantity,
        price,
      });
    }
    
    setItems(newItems);
    await saveCart(newItems);
    
    toast({
      title: "Added to cart",
      description: "Item has been added to your cart.",
    });
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return removeItem(productId);
    }
    
    const newItems = items.map(item =>
      item.product_id === productId
        ? { ...item, quantity }
        : item
    );
    
    setItems(newItems);
    await saveCart(newItems);
  };

  const removeItem = async (productId: string) => {
    const newItems = items.filter(item => item.product_id !== productId);
    setItems(newItems);
    await saveCart(newItems);
    
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const clearCart = async () => {
    setItems([]);
    await saveCart([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Load cart when component mounts or user changes
  useEffect(() => {
    loadCart();
  }, [user]);

  return {
    items,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };
}