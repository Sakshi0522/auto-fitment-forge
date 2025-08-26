import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Address, Order, CartItem } from "@/types"; // Make sure CartItem is imported
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const Account = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState<string | null>(null);
  const [editedAddress, setEditedAddress] = useState<Address | null>(null);
  const [newAddressData, setNewAddressData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        setLoading(true);
        try {
          // Fetch profile data
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profileError) throw profileError;
          setProfile(profileData as Profile);
          setEditData({
            firstName: profileData.first_name || "",
            lastName: profileData.last_name || "",
            phone: profileData.phone || "",
          });

          // Fetch addresses
          const { data: addressesData, error: addressesError } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", user.id);

          if (addressesError) throw addressesError;
          setAddresses(addressesData as Address[]);

          // Fetch orders and correctly handle the 'items' type
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("*, items")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (ordersError) throw ordersError;
          
          // Fix: Safely convert the items from Json to CartItem[]
          const ordersWithItems = ordersData.map(order => ({
            ...order,
            items: order.items as unknown as CartItem[]
          }));
          
          setOrders(ordersWithItems as unknown as  Order[]);

        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editData.firstName,
          last_name: editData.lastName,
          phone: editData.phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Re-fetch profile to ensure UI is in sync with the database
      const { data: updatedProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      setProfile(updatedProfile as Profile);
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error) { // Fix: removed : any
      console.error("Error saving profile:", error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: `Failed to update profile: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveAddress = async () => {
    if (!editedAddress) return;
    try {
