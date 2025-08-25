import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Wrench, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { VehicleSelector } from '@/components/vehicle/VehicleSelector';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load featured products and categories
        const [productsResult, categoriesResult] = await Promise.all([
          supabase
            .from('products')
            .select('*, brand:brands(name), category:categories(name)')
            .eq('is_featured', true)
            .eq('is_active', true)
            .limit(8),
          supabase
            .from('categories')
            .select('*')
            .is('parent_id', null)
            .limit(6)
        ]);

        if (!productsResult.error) {
          setFeaturedProducts((productsResult.data || []).map(product => ({
            ...product,
            images: Array.isArray(product.images) ? product.images : []
          })) as Product[]);
        }
        
        if (!categoriesResult.error) {
          setCategories(categoriesResult.data || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Quality Auto Parts 
                <span className="block text-accent-foreground">For Every Vehicle</span>
              </h1>
              <p className="text-xl opacity-90">
                Find the right parts for your car with our extensive catalog of genuine and aftermarket auto parts. 
                Fast shipping, expert support, and unbeatable prices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/categories">
                    Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Find Your Part
                </Button>
              </div>
            </div>
            
            <div className="lg:justify-self-end">
              <VehicleSelector />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center space-x-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Free Shipping</h3>
                <p className="text-sm text-muted-foreground">On orders over $75</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Lifetime Warranty</h3>
                <p className="text-sm text-muted-foreground">On select parts</p>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Expert Support</h3>
                <p className="text-sm text-muted-foreground">Professional advice</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-lg text-muted-foreground">
              Find parts for every system in your vehicle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Search className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.description || 'Quality parts and accessories'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/categories">
                View All Categories
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-lg text-muted-foreground">
              Top-rated parts from trusted brands
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="bg-muted h-48 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="bg-muted h-4 rounded w-3/4"></div>
                      <div className="bg-muted h-4 rounded w-1/2"></div>
                      <div className="bg-muted h-6 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <div className="bg-muted aspect-square rounded-lg flex items-center justify-center">
                        <Search className="h-12 w-12 text-muted-foreground" />
                      </div>
                      {product.sale_price && (
                        <Badge className="absolute top-2 right-2 bg-destructive">
                          Sale
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground">
                          ({product.rating_count})
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {product.sale_price ? (
                          <>
                            <span className="font-bold text-destructive">
                              ${product.sale_price.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      <Button size="sm" className="w-full">
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/products">
                View All Products
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Our parts specialists are here to help you find the right part for your vehicle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Call 1-800-AUTO-PARTS
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Live Chat Support
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
