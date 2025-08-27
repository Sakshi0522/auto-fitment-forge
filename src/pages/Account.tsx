const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // First, update the profile data in the database
      const { data, error } = await supabase
        .from("profiles")
        .update({
          first_name: editData.firstName,
          last_name: editData.lastName,
          phone: editData.phone,
          updated_at: new Date().toISOString(), // Ensure updated_at is set
        })
        .eq("id", user.id)
        .select();

      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // If the database update is successful, update the local profile state with the new data
        setProfile(data[0] as Profile);
        
        // Reset the editData state to match the new profile data
        setEditData({
          firstName: data[0].first_name || "",
          lastName: data[0].last_name || "",
          phone: data[0].phone || "",
        });
        
        setIsEditing(false);
        toast({
          title: "Profile updated!",
          description: "Your profile information has been saved.",
        });
      }

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
