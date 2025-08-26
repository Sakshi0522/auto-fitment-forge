import { Link } from "react-router-dom";

const Account = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">My Account</h1>
        <p className="text-xl text-muted-foreground mb-4">
          Welcome to your account page.
        </p>
        <Link to="/" className="text-primary hover:underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default Account;