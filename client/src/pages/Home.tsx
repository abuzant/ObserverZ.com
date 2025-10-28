import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, TrendingUp, Zap, Globe, Users, DollarSign, Sparkles } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch trending tags
  const { data: trendingTags, isLoading: tagsLoading } = trpc.tags.trending.useQuery({
    window: "72h",
    limit: 12,
  });

  // Fetch articles for selected tag
  const { data: articles, isLoading: articlesLoading } = trpc.articles.search.useQuery(
    { q: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8 rounded" />}
            <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-300">Welcome, {user?.name || "User"}</span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Observe the World, Your Way
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Stay updated with trending topics, build your personal journal, and earn rewards by sharing your interests with the world.
          </p>

          {/* Search Bar */}
          <div className="flex gap-2 mb-8">
            <Input
              placeholder="Search articles, tags, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder-slate-400"
            />
            <Button>Search</Button>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            {!isAuthenticated && (
              <>
                <Button size="lg" asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/explore">Explore Topics</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <TrendingUp className="w-6 h-6 text-blue-400 mb-2" />
              <CardTitle className="text-white">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Discover what's trending across topics you care about in real-time.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <Sparkles className="w-6 h-6 text-purple-400 mb-2" />
              <CardTitle className="text-white">Personal Journal</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Curate your own collection of interests and share with your community.
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <DollarSign className="w-6 h-6 text-green-400 mb-2" />
              <CardTitle className="text-white">Earn Rewards</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300">
              Get paid $1 per 1000 views on your shared interests and journals.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trending Tags Section */}
      <section className="bg-slate-800/50 border-y border-slate-700 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-white mb-8">Trending Topics</h3>

          {tagsLoading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingTags?.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.slug)}
                  className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors text-center"
                >
                  <div className="font-semibold">{tag.display}</div>
                  <div className="text-xs text-slate-400 mt-1">#{tag.slug}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search Results or Featured Articles */}
      {searchQuery && (
        <section className="container mx-auto px-4 py-16">
          <h3 className="text-2xl font-bold text-white mb-8">Search Results</h3>

          {articlesLoading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-white">{article.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      By {article.author || "Unknown"} • {new Date(article.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 mb-4">{article.excerpt}</p>
                    {article.image_url && (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <Button variant="outline" size="sm">
                      Read More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>No articles found. Try a different search.</p>
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-white mb-12 text-center">Powerful Features</h3>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Globe className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white">Global Coverage</h4>
                <p className="text-slate-400">
                  Access trending content from around the world across any topic you care about.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Users className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white">Social Sharing</h4>
                <p className="text-slate-400">
                  Build social walls of your interests and share with your community.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white">Real-time Updates</h4>
                <p className="text-slate-400">
                  Get instant notifications about trending topics in your areas of interest.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Sparkles className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white">Smart Curation</h4>
                <p className="text-slate-400">
                  AI-powered tag extraction and content ranking to show you what matters most.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <DollarSign className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white">Monetization</h4>
                <p className="text-slate-400">
                  Earn OCT tokens and cash out via USDT for every 1000 views on your content.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <TrendingUp className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white">Analytics</h4>
                <p className="text-slate-400">
                  Track your engagement, views, and earnings with detailed analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-slate-800/50 border-y border-slate-700 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-white mb-12 text-center">Simple Pricing</h3>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Free</CardTitle>
                <CardDescription className="text-slate-300">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-white">$0</div>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>✓ Personal journal</li>
                    <li>✓ Browse trending topics</li>
                    <li>✓ Star articles</li>
                    <li>✗ Comments</li>
                    <li>✗ Messaging</li>
                  </ul>
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-600 border-blue-500 ring-2 ring-blue-400">
              <CardHeader>
                <CardTitle className="text-white">Pro</CardTitle>
                <CardDescription className="text-blue-100">Most popular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-white">$4.99<span className="text-lg">/mo</span></div>
                  <ul className="space-y-2 text-blue-50 text-sm">
                    <li>✓ Everything in Free</li>
                    <li>✓ Unlimited stars</li>
                    <li>✓ Comments ($0.99/mo)</li>
                    <li>✓ Messaging ($0.99/mo)</li>
                    <li>✓ Custom avatar</li>
                  </ul>
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Developer</CardTitle>
                <CardDescription className="text-slate-300">For API access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-white">$0.01<span className="text-lg">/query</span></div>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>✓ Full API access</li>
                    <li>✓ Widget builder</li>
                    <li>✓ Webhooks</li>
                    <li>✓ Custom widgets</li>
                    <li>✓ Priority support</li>
                  </ul>
                  <Button className="w-full" variant="outline">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Social</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Twitter</a></li>
                <li><a href="#" className="hover:text-white">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

