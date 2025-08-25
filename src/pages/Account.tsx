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
    if (!user) return;

    try {
      const newAddress = {
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
        is_default: addresses.length === 0, // Set as default if it's the first address
      };

      const { data, error } = await supabase
        .from("addresses")
        .insert(newAddress)
        .select();

      if (error) throw error;

      if (data) {
        setAddresses((prev) => [...prev, data[0] as Address]);
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
      }
    } catch (error: any) {
      console.error("Error adding new address:", error);
      toast({
        title: "Error",
        description: "Failed to add new address. Please try again.",
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
        {loading ? (
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{profile?.first_name?.[0]}{profile?.last_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-medium">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={isEditing ? editData.firstName : profile?.first_name || ""}
                  onChange={(e) => setEditData((prev) => ({ ...prev, firstName: e.target.value }))}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={isEditing ? editData.lastName : profile?.last_name || ""}
                  onChange={(e) => setEditData((prev) => ({ ...prev, lastName: e.target.value }))}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={isEditing ? editData.phone : profile?.phone || ""}
                  onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      firstName: profile?.first_name || "",
                      lastName: profile?.last_name || "",
                      phone: profile?.phone || "",
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile}>Save</Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAddresses = () => (
    <Card>
      <CardHeader>
        <CardTitle>My Addresses</CardTitle>
        <CardDescription>Manage your shipping and billing addresses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setIsAddingAddress(!isAddingAddress)} variant={isAddingAddress ? "outline" : "default"}>
                {isAddingAddress ? "Cancel" : "Add New Address"}
              </Button>
            </div>
            {isAddingAddress && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddNewAddress(); }} className="space-y-4 border p-4 rounded-lg">
                <h4 className="font-semibold">New Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newFirstName">First Name</Label>
                    <Input id="newFirstName" value={newAddressData.firstName} onChange={(e) => setNewAddressData({ ...newAddressData, firstName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newLastName">Last Name</Label>
                    <Input id="newLastName" value={newAddressData.lastName} onChange={(e) => setNewAddressData({ ...newAddressData, lastName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newAddressLine1">Address Line 1</Label>
                  <Input id="newAddressLine1" value={newAddressData.addressLine1} onChange={(e) => setNewAddressData({ ...newAddressData, addressLine1: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newAddressLine2">Address Line 2 (Optional)</Label>
                  <Input id="newAddressLine2" value={newAddressData.addressLine2} onChange={(e) => setNewAddressData({ ...newAddressData, addressLine2: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newCity">City</Label>
                    <Input id="newCity" value={newAddressData.city} onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })} required />
