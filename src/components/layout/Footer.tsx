import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground p-2 rounded-lg">
                <span className="text-lg font-bold">AutoParts</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted source for quality auto parts. We provide genuine and aftermarket parts 
              for all makes and models with fast shipping and expert support.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                All Categories
              </Link>
              <Link to="/brands" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Shop by Brand
              </Link>
              <Link to="/featured" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Featured Products
              </Link>
              <Link to="/deals" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Special Deals
              </Link>
              <Link to="/track-order" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Track Your Order
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Service</h3>
            <nav className="flex flex-col space-y-2">
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link to="/warranty" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Warranty Information
              </Link>
              <Link to="/returns" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Returns & Exchanges
              </Link>
              <Link to="/shipping" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Shipping Information
              </Link>
            </nav>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Get in Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>1-800-AUTO-PARTS</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@autoparts.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Mon-Fri 8AM-8PM EST</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Newsletter</h4>
              <p className="text-xs text-muted-foreground">
                Get updates on new products and special offers
              </p>
              <div className="flex space-x-2">
                <Input placeholder="Enter email" className="text-sm" />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm text-muted-foreground">
              <span>&copy; 2024 AutoParts. All rights reserved.</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">We Accept:</span>
              <div className="flex space-x-2">
                <div className="bg-card border border-border rounded px-2 py-1">
                  <span className="text-xs font-medium">VISA</span>
                </div>
                <div className="bg-card border border-border rounded px-2 py-1">
                  <span className="text-xs font-medium">MC</span>
                </div>
                <div className="bg-card border border-border rounded px-2 py-1">
                  <span className="text-xs font-medium">AMEX</span>
                </div>
                <div className="bg-card border border-border rounded px-2 py-1">
                  <span className="text-xs font-medium">PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}