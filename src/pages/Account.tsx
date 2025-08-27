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
      // Build an update payload with only the changed values
      const updatePayload: Partial<Profile> = {};
      if (editData.firstName !== (profile?.first_name || "")) {
        updatePayload.first_name = editData.firstName;
      }
      if (editData.lastName !== (profile?.last_name || "")) {
        updatePayload.last_name = editData.lastName;
      }
      if (editData.phone !== (profile?.phone || "")) {
        updatePayload.phone = editData.phone;
      }

      // Only perform an update if there are changes
      if (Object.keys(updatePayload).length > 0) {
        const { data, error } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", user.id)
          .select();

        if (error) {
          throw error;
        }

        setProfile(data[0] as Profile);
        toast({
          title: "Profile updated!",
          description: "Your profile information has been saved.",
        });
      } else {
        toast({
          title: "No changes detected",
          description: "Your profile is already up-to-date.",
        });
      }

      setIsEditing(false);
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
        prev.map((addr) => (addr.id === editedAddress.id ? editedAddress : addr))
      );
      setIsEditingAddress(null);
      setEditedAddress(null);
      toast({
        title: "Address updated!",
        description: "Your address has been saved.",
      });
    } catch (error) {
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
    } catch (error) {
      console.error("Error adding new address:", error);
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message || "Failed to add new address. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;

      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
      toast({
        title: "Address deleted!",
        description: "The address has been removed from your account.",
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: "Failed to delete address. Please try again.",
          variant: "destructive",
        });
      }
    }
  }
  function renderProfile() {
    return (
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
                    className={!isEditing ? "bg-muted" : ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={isEditing ? editData.lastName : profile?.last_name || ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, lastName: e.target.value }))}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted" : ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={isEditing ? editData.phone : profile?.phone || ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted" : ""} />
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
                    } }>
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
  }

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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newState">State</Label>
                    <Input id="newState" value={newAddressData.state} onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPostalCode">Postal Code</Label>
                    <Input id="newPostalCode" value={newAddressData.postalCode} onChange={(e) => setNewAddressData({ ...newAddressData, postalCode: e.target.value })} required />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Save Address</Button>
                </div>
              </form>
            )}
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <div key={address.id} className="border p-4 rounded-lg space-y-1">
                  {isEditingAddress === address.id ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`addressLine1-${address.id}`}>Address Line 1</Label>
                        <Input
                          id={`addressLine1-${address.id}`}
                          value={editedAddress?.address_line_1 || ""}
                          onChange={(e) => setEditedAddress((prev) => prev ? { ...prev, address_line_1: e.target.value } : null)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`city-${address.id}`}>City</Label>
                          <Input
                            id={`city-${address.id}`}
                            value={editedAddress?.city || ""}
                            onChange={(e) => setEditedAddress((prev) => prev ? { ...prev, city: e.target.value } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`state-${address.id}`}>State</Label>
                          <Input
                            id={`state-${address.id}`}
                            value={editedAddress?.state || ""}
                            onChange={(e) => setEditedAddress((prev) => prev ? { ...prev, state: e.target.value } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`postalCode-${address.id}`}>Postal Code</Label>
                          <Input
                            id={`postalCode-${address.id}`}
                            value={editedAddress?.postal_code || ""}
                            onChange={(e) => setEditedAddress((prev) => prev ? { ...prev, postal_code: e.target.value } : null)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => {
                          setIsEditingAddress(null);
                          setEditedAddress(null);
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveAddress}>Save</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">{address.first_name} {address.last_name}</p>
                      <p>{address.address_line_1}</p>
                      {address.address_line_2 && <p>{address.address_line_2}</p>}
                      <p>{address.city}, {address.state} {address.postal_code}</p>
                      <p>{address.country}</p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setIsEditingAddress(address.id);
                          setEditedAddress(address);
                        }}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          disabled={addresses.length === 1}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No addresses found.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderOrderHistory = () => (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>View your past orders and their status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Order #{order.order_number}</h4>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Total: ${order.total.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Date: {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">No orders found.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Account</h1>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">{renderProfile()}</TabsContent>
          <TabsContent value="addresses">{renderAddresses()}</TabsContent>
          <TabsContent value="orders">{renderOrderHistory()}</TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
