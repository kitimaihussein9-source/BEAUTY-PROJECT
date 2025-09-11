import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Star, Clock, MapPin, Users, Scissors, Sparkles } from "lucide-react"

export default function HomePage() {
  const featuredServices = [
    {
      id: 1,
      title: "Premium Hair Styling",
      provider: "Sarah's Salon",
      price: 85,
      duration: 90,
      rating: 4.9,
      reviews: 127,
      image: "/hair-styling-salon.png",
      category: "Hair",
    },
    {
      id: 2,
      title: "Luxury Manicure & Pedicure",
      provider: "Nail Artistry",
      price: 65,
      duration: 75,
      rating: 4.8,
      reviews: 89,
      image: "/nail-salon-manicure.jpg",
      category: "Nails",
    },
    {
      id: 3,
      title: "Bridal Makeup Package",
      provider: "Glam Studio",
      price: 150,
      duration: 120,
      rating: 5.0,
      reviews: 45,
      image: "/bridal-makeup-artist.jpg",
      category: "Makeup",
    },
  ]

  const stats = [
    { icon: Users, label: "Happy Customers", value: "2,500+" },
    { icon: Scissors, label: "Service Providers", value: "150+" },
    { icon: Sparkles, label: "Services Completed", value: "10,000+" },
    { icon: Star, label: "Average Rating", value: "4.9" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-900">BeautyBook</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/services" className="text-gray-600 hover:text-pink-600 transition-colors">
              Services
            </Link>
            <Link href="/providers" className="text-gray-600 hover:text-pink-600 transition-colors">
              Providers
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-pink-600 transition-colors">
              About
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-gray-900 mb-6 text-balance">
            Book Premium Beauty & Grooming Services
          </h2>
          <p className="text-xl text-gray-600 mb-8 text-pretty">
            Connect with verified professionals for hair, nails, makeup, skincare, and more. Quality services at your
            fingertips.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href="/auth/signup">Book a Service</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/provider-signup">Become a Provider</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 text-pink-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Featured Services</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most popular beauty and grooming services from top-rated providers
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative">
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-pink-600">{service.category}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600">{service.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{service.rating}</span>
                      <span className="text-gray-500">({service.reviews})</span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{service.duration}min</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-pink-600">${service.price}</span>
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700">
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-pink-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their beauty and grooming needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/signup">Sign Up Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-pink-600 bg-transparent"
              asChild
            >
              <Link href="/services">Browse Services</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-pink-400" />
                <span className="text-xl font-bold">BeautyBook</span>
              </div>
              <p className="text-gray-400">Your trusted platform for premium beauty and grooming services.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/services/hair" className="hover:text-white">
                    Hair
                  </Link>
                </li>
                <li>
                  <Link href="/services/nails" className="hover:text-white">
                    Nails
                  </Link>
                </li>
                <li>
                  <Link href="/services/makeup" className="hover:text-white">
                    Makeup
                  </Link>
                </li>
                <li>
                  <Link href="/services/skincare" className="hover:text-white">
                    Skincare
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p>Phone: 0614103439</p>
                <p>Email: hello@beautybook.com</p>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Available Nationwide</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BeautyBook. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
