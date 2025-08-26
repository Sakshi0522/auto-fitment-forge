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
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: `Failed to update address: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          type: 'shipping',
          first_name: newAddressData.firstName,
          last_name: newAddressData.lastName,
          phone: newAddressData.phone,
          address_line_1: newAddressData.addressLine1,
          address_line_2: newAddressData.addressLine2,
          city: newAddressData.city,
          state: newAddressData.state,
          postal_code: newAddressData.postalCode,
          country: newAddressData.country,
        });

      if (error) throw error;
      
      // Refresh addresses
      const { data: addressesData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id);
      
      setAddresses(addressesData as Address[]);
      setIsAddingAddress(false);
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
      toast({
        title: "Address added!",
        description: "Your new address has been saved.",
      });
    } catch (error) {
      console.error("Error adding address:", error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: `Failed to add address: ${errorMessage}`,
        variant: "destructive",
      });
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
        description: "Your address has been removed.",
      });
    } catch (error) {
      console.error("Error deleting address:", error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: `Failed to delete address: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your account</h1>
            <Link to="/auth" className="text-primary hover:underline">
              Go to Sign In
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">My Account</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl">Profile Information</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={editData.firstName}
                            onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={editData.lastName}
                            onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile}>Save Changes</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <p className="text-sm text-muted-foreground">
                            {profile?.first_name || "Not set"}
                          </p>
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <p className="text-sm text-muted-foreground">
                            {profile?.last_name || "Not set"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <p className="text-sm text-muted-foreground">
                          {profile?.phone || "Not set"}
                        </p>
                      </div>
                      <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Saved Addresses</span>
                    <Button onClick={() => setIsAddingAddress(true)}>
                      Add New Address
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No addresses saved yet
                    </p>
                  ) : (
                    addresses.map((address) => (
                      <Card key={address.id} className="p-4">
                        {isEditingAddress === address.id ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>First Name</Label>
                                <Input
                                  value={editedAddress?.first_name || ""}
                                  onChange={(e) => setEditedAddress(prev => prev ? {...prev, first_name: e.target.value} : null)}
                                />
                              </div>
                              <div>
                                <Label>Last Name</Label>
                                <Input
                                  value={editedAddress?.last_name || ""}
                                  onChange={(e) => setEditedAddress(prev => prev ? {...prev, last_name: e.target.value} : null)}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Address Line 1</Label>
                              <Input
                                value={editedAddress?.address_line_1 || ""}
                                onChange={(e) => setEditedAddress(prev => prev ? {...prev, address_line_1: e.target.value} : null)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveAddress}>Save</Button>
                              <Button variant="outline" onClick={() => {
                                setIsEditingAddress(null);
                                setEditedAddress(null);
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {address.first_name} {address.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.address_line_1}
                                </p>
                                {address.address_line_2 && (
                                  <p className="text-sm text-muted-foreground">
                                    {address.address_line_2}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {address.city}, {address.state} {address.postal_code}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.country}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setIsEditingAddress(address.id);
                                    setEditedAddress(address);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAddress(address.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                  
                  {isAddingAddress && (
                    <Card className="p-4">
                      <div className="space-y-4">
                        <h3 className="font-medium">Add New Address</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <Input
                              value={newAddressData.firstName}
                              onChange={(e) => setNewAddressData({...newAddressData, firstName: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input
                              value={newAddressData.lastName}
                              onChange={(e) => setNewAddressData({...newAddressData, lastName: e.target.value})}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={newAddressData.phone}
                            onChange={(e) => setNewAddressData({...newAddressData, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Address Line 1</Label>
                          <Input
                            value={newAddressData.addressLine1}
                            onChange={(e) => setNewAddressData({...newAddressData, addressLine1: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Address Line 2 (Optional)</Label>
                          <Input
                            value={newAddressData.addressLine2}
                            onChange={(e) => setNewAddressData({...newAddressData, addressLine2: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>City</Label>
                            <Input
                              value={newAddressData.city}
                              onChange={(e) => setNewAddressData({...newAddressData, city: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>State</Label>
                            <Input
                              value={newAddressData.state}
                              onChange={(e) => setNewAddressData({...newAddressData, state: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>Postal Code</Label>
                            <Input
                              value={newAddressData.postalCode}
                              onChange={(e) => setNewAddressData({...newAddressData, postalCode: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddAddress}>Add Address</Button>
                          <Button variant="outline" onClick={() => setIsAddingAddress(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View your past orders and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No orders found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()}
                              </p>
                              <div className="mt-2">
                                <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.total}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.items?.length || 0} items
                              </p>
                            </div>
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{item.product?.title || `Product ${item.product_id}`}</span>
                                  <span>{item.quantity} × ${item.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
