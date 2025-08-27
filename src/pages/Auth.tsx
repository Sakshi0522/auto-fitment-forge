import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast"; // Import toast for feedback

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState(searchParams.get("mode") === "signup" ? "signup" : "signin");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (isAdmin: boolean) => {
    setLoading(true);
    try {
      await signIn(formData.email, formData.password, isAdmin);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone
      );
      if (!error) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  // New function to handle admin sign up
  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // You'll need to create a new function in `useAuth.ts` for this purpose
      // For now, we will simulate it with a toast message and the existing signUp function.
      toast({
        title: "Admin sign up is not yet implemented.",
        description: "Please use the regular sign up for now.",
        variant: "destructive"
      });
      // In a real application, you would have a separate backend function
      // that not only creates the user but also assigns them the 'admin' role.
      // await signUpAsAdmin(formData.email, formData.password, formData.firstName, formData.lastName, formData.phone);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{mode === "signup" ? "Create Account" : "Sign In"}</CardTitle>
          <CardDescription>
            {mode === "signup"
              ? "Create your account to start shopping"
              : "Welcome back! Sign in to your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
              />
            </div>
            
            {mode === "signin" ? (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => handleLogin(false)}
                  disabled={loading || !formData.email || !formData.password}
                >
                  {loading ? "Signing In..." : "User Sign In"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleLogin(true)}
                  disabled={loading || !formData.email || !formData.password}
                >
                  {loading ? "Signing In..." : "Admin Sign In"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button type="submit" onClick={handleSignUp} className="w-full" disabled={loading}>
                  {loading ? "Creating User..." : "User Sign Up"}
                </Button>
                <Button type="submit" variant="outline" onClick={handleAdminSignUp} className="w-full" disabled={loading}>
                  {loading ? "Creating Admin..." : "Admin Sign Up"}
                </Button>
              </div>
            )}
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "Don't have an account?"}
              <Button
                variant="link"
                className="p-0"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Sign in" : "Sign up"}
              </Button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
