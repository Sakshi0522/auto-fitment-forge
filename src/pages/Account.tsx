import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Profile, Address, Order, CartItem } from "@/types";
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
            .maybeSingle(); // Use maybeSingle to handle cases where a profile might not exist

          if (profileError) throw profileError;

          let currentProfile = profileData as Profile | null;

          if (!currentProfile) {
            // If no profile found, create a new one
            const { data: newProfileData, error: newProfileError } = await supabase
              .from("profiles")
              .insert({ id: user.id })
              .select()
              .single();

            if (newProfileError) throw newProfileError;
            currentProfile = newProfileData as Profile;
          }
          
          setProfile(currentProfile);
          setEditData({
            firstName: currentProfile?.first_name || "",
            lastName: currentProfile?.last_name || "",
            phone: currentProfile?.phone || "",
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
          
          // Safely convert the items from Json to CartItem[]
          const ordersWithItems = ordersData.map(order => ({
            ...order,
            items: order.items as unknown as CartItem[]
          }));
          
          setOrders(ordersWithItems as unknown as Order[]);

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
      const updatePayload: Partial<Profile> = {
        first_name: editData.firstName,
        last_name: editData.lastName,
        phone: editData.phone,
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id)
        .select();

      if (error) {
        throw error;
      }

      setProfile(data[0] as Profile);
      setIsEditing(false);
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });

    } catch (error) {
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
      const { error } = await supabase
        .from("addresses")
        .update(editedAddress)
        .eq("id", editedAddress.id);

      if (error) throw error;
      setAddresses((prev) =>
        prev.map((addr) => (addr.id === editedAddress.id ? editedAddress
