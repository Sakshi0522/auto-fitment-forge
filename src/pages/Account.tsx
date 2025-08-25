import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Address, Order } from "@/types";
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
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    phone: profile?.phone || "",
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

          // Fetch orders
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("*, items")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (ordersError) throw ordersError;
          setOrders(ordersData as Order[]);

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
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: editData.firstName,
              last_name: editData.lastName,
              phone: editData.phone,
            }
          : null
      );
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAddress = async () => {
    if (!editedAddress) return;
    try {
      const { error } = await supabase
        .from("addresses")
        .update(editedAddress)
        .eq("id", editedAddress.id);

      if (error) throw error;
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === editedAddress.id ? editedAddress : addr))
      );
      setIsEditingAddress(null);
      setEditedAddress(null);
      toast({
        title: "Address updated!",
        description: "Your address has been saved.",
      });
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to update address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewAddress = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to add an address.",
        variant: "destructive",
      });
      return;
    }

    if (!newAddressData.firstName || !newAddressData.lastName || !newAddressData.addressLine1 || !newAddressData.city || !newAddressData.state || !newAddressData.postalCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          type: "shipping",
          first_name: newAddressData.firstName,
          last_name: newAddressData.lastName,
          phone: newAddressData.phone,
          address_line_1: newAddressData.addressLine1,
          address_line_2: newAddressData.addressLine2,
          city: newAddressData.city,
          state: newAddressData.state,
          postal_code: newAddressData.postalCode,
          country: newAddressData.country,
          is_default: addresses.length === 0,
        });

      if (error) {
        throw error;
      }

      // After successful insert, re-fetch data to get the new address with its ID
      const { data: addressesData, error: fetchError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id);

      if (fetchError) {
        throw fetchError;
      }

      setAddresses(addressesData as Address[]);
      setNewAddressData({
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
      setIsAddingAddress(false);

      toast({
        title: "Address added!",
        description: "Your new address has been saved.",
      });
    } catch (error: any) {
      console.error("Error adding new address:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add new address. Please try again.",
        variant: "destructive",
      });
    }
  };


  const renderProfile = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>View and manage your personal details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
