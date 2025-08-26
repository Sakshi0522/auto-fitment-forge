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
      console.error("Error adding new address:", error);
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      toast({
        title: "Error",
        description: `Failed to add address: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Account</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  View and update your personal details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {profile?.first_name ? profile.first_name[0] : 'U'}
                          {profile?.last_name ? profile.last_name[0] : 'N'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">
                          {profile?.first_name} {profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={editData.firstName}
                            onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={editData.lastName}
                            onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => {
                            setIsEditing(false);
                            // Reset editData to the current profile values on cancel
                            if (profile) {
                              setEditData({
                                firstName: profile.first_name || "",
                                lastName: profile.last_name || "",
                                phone: profile.phone || "",
                              });
                            }
                          }}>Cancel</Button>
                          <Button onClick={handleSaveProfile}>Save</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <p className="border rounded-md p-2 bg-muted text-muted-foreground">
                            {profile?.first_name || "Not set"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <p className="border rounded-md p-2 bg-muted text-muted-foreground">
                            {profile?.last_name || "Not set"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <p className="border rounded-md p-2 bg-muted text-muted-foreground">
                            {profile?.phone || "Not set"}
                          </p>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="addresses" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Addresses</h2>
              <Button onClick={() => setIsAddingAddress(true)}>Add New Address</Button>
            </div>
            {isAddingAddress && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Add New Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-firstName">First Name</Label>
                      <Input
                        id="new-firstName"
                        value={newAddressData.firstName}
                        onChange={(e) => setNewAddressData({ ...newAddressData, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-lastName">Last Name</Label>
                      <Input
                        id="new-lastName"
                        value={newAddressData.lastName}
                        onChange={(e) => setNewAddressData({ ...newAddressData, lastName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-addressLine1">Address Line 1</Label>
                      <Input
                        id="new-addressLine1"
                        value={newAddressData.addressLine1}
                        onChange={(e) => setNewAddressData({ ...newAddressData, addressLine1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-addressLine2">Address Line 2 (Optional)</Label>
                      <Input
                        id="new-addressLine2"
                        value={newAddressData.addressLine2}
                        onChange={(e) => setNewAddressData({ ...newAddressData, addressLine2: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-city">City</Label>
                      <Input
                        id="new-city"
                        value={newAddressData.city}
                        onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-state">State</Label>
                      <Input
                        id="new-state"
                        value={newAddressData.state}
                        onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-postalCode">Postal Code</Label>
                      <Input
                        id="new-postalCode"
                        value={newAddressData.postalCode}
                        onChange={(e) => setNewAddressData({ ...newAddressData, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-phone">Phone (Optional)</Label>
                      <Input
                        id="new-phone"
                        value={newAddressData.phone}
                        onChange={(e) => setNewAddressData({ ...newAddressData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" onClick={() => setIsAddingAddress(false)}>Cancel</Button>
                    <Button onClick={handleAddNewAddress}>Save Address</Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <p className="text-muted-foreground text-center mt-8">
                You have not added any addresses yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <Card key={address.id}>
                    <CardContent className="p-4">
                      {isEditingAddress === address.id ? (
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-firstName`}>First Name</Label>
                              <Input
                                id={`edit-${address.id}-firstName`}
                                value={editedAddress?.first_name || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, first_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-lastName`}>Last Name</Label>
                              <Input
                                id={`edit-${address.id}-lastName`}
                                value={editedAddress?.last_name || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, last_name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-addressLine1`}>Address Line 1</Label>
                              <Input
                                id={`edit-${address.id}-addressLine1`}
                                value={editedAddress?.address_line_1 || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, address_line_1: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-addressLine2`}>Address Line 2 (Optional)</Label>
                              <Input
                                id={`edit-${address.id}-addressLine2`}
                                value={editedAddress?.address_line_2 || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, address_line_2: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-city`}>City</Label>
                              <Input
                                id={`edit-${address.id}-city`}
                                value={editedAddress?.city || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, city: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-state`}>State</Label>
                              <Input
                                id={`edit-${address.id}-state`}
                                value={editedAddress?.state || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, state: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-postalCode`}>Postal Code</Label>
                              <Input
                                id={`edit-${address.id}-postalCode`}
                                value={editedAddress?.postal_code || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, postal_code: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`edit-${address.id}-phone`}>Phone (Optional)</Label>
                              <Input
                                id={`edit-${address.id}-phone`}
                                value={editedAddress?.phone || ""}
                                onChange={(e) => setEditedAddress({ ...editedAddress!, phone: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button variant="outline" onClick={() => setIsEditingAddress(null)}>Cancel</Button>
                            <Button onClick={handleSaveAddress}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold">
                              {address.first_name} {address.last_name}
                            </h4>
                            <div className="flex space-x-2">
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
                            </div>
                          </div>
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
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <h2 className="text-2xl font-bold mb-4">My Orders</h2>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/6" />
                      </div>
                      <Skeleton className="h-4 w-1/3" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-center mt-8">
                You have not placed any orders yet.
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-base font-medium">
                        Order #{order.order_number}
                      </CardTitle>
                      <Badge variant="secondary">
                        {order.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xl font-bold mt-2">
                        Total: ${order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Items: {order.items.length}
                      </p>
                      <Button asChild variant="link" className="p-0 mt-2">
                        <Link to={`/orders/${order.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
};

export default Account;
