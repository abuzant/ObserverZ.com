import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Star, Pin, Wallet, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("journals");
  const [newJournalTitle, setNewJournalTitle] = useState("");

  // Fetch user journals
  const { data: journals, isLoading: journalsLoading, refetch: refetchJournals } = trpc.journals.list.useQuery();

  // Fetch user's starred articles
  const { data: starredArticles, isLoading: starsLoading } = trpc.stars.list.useQuery({ limit: 10 });

  // Fetch wallet balance
  const { data: wallet } = trpc.wallet.balance.useQuery();

  // Create journal mutation
  const createJournalMutation = trpc.journals.create.useMutation({
    onSuccess: () => {
      setNewJournalTitle("");
      refetchJournals();
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleCreateJournal = () => {
    if (newJournalTitle.trim()) {
      createJournalMutation.mutate({
        title: newJournalTitle,
        is_public: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{user.name}</span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{wallet?.oct_balance || "0"} OCT</div>
              <p className="text-xs text-slate-400 mt-1">≈ ${(parseFloat(wallet?.oct_balance || "0") * 0.1).toFixed(2)} USD</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Journals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{journals?.length || 0}</div>
              <p className="text-xs text-slate-400 mt-1">Personal collections</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Starred</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{starredArticles?.length || 0}</div>
              <p className="text-xs text-slate-400 mt-1">Favorite articles</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">$0.00</div>
              <p className="text-xs text-slate-400 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("journals")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "journals"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            My Journals
          </button>
          <button
            onClick={() => setActiveTab("starred")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "starred"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Starred Articles
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "wallet"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Wallet
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "settings"
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Settings
          </button>
        </div>

        {/* Journals Tab */}
        {activeTab === "journals" && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Create New Journal</CardTitle>
                <CardDescription className="text-slate-400">
                  Start a new collection of your favorite topics and interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Journal title..."
                    value={newJournalTitle}
                    onChange={(e) => setNewJournalTitle(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={handleCreateJournal}
                    disabled={createJournalMutation.isPending || !newJournalTitle.trim()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>
              </CardContent>
            </Card>

            {journalsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : journals && journals.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {journals.map((journal) => (
                  <Card key={journal.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-white">{journal.title}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {journal.is_public ? "🌍 Public" : "🔒 Private"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 text-sm mb-4">{journal.description || "No description"}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/journal/${journal.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-12">
                  <p className="text-slate-400">No journals yet. Create your first one!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Starred Articles Tab */}
        {activeTab === "starred" && (
          <div className="space-y-4">
            {starsLoading ? (
              <div className="flex justify-center">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : starredArticles && starredArticles.length > 0 ? (
              starredArticles.map((article) => (
                <Card key={article.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">{article.title}</CardTitle>
                    <CardDescription className="text-slate-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 text-sm mb-4">{article.excerpt}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Star className="w-4 h-4 mr-2" />
                        Unstar
                      </Button>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-12">
                  <p className="text-slate-400">No starred articles yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">OCT Wallet</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage your ObserverZ Content Tokens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-700 p-6 rounded-lg text-center">
                    <p className="text-slate-400 text-sm mb-2">Current Balance</p>
                    <p className="text-4xl font-bold text-white">{wallet?.oct_balance || "0"}</p>
                    <p className="text-slate-400 text-sm mt-2">OCT</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button className="w-full" size="lg">
                      <Plus className="w-4 h-4 mr-2" />
                      Buy OCT
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <Wallet className="w-4 h-4 mr-2" />
                      Withdraw USDT
                    </Button>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-4">Transaction History</h4>
                    <div className="space-y-2 text-sm text-slate-400">
                      <p>No transactions yet</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                    <Input
                      value={user.name || ""}
                      disabled
                      className="bg-slate-700 border-slate-600 text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <Input
                      value={user.email || ""}
                      disabled
                      className="bg-slate-700 border-slate-600 text-slate-400"
                    />
                  </div>
                  <Button>Update Profile</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">Unlimited Stars</p>
                      <p className="text-sm text-slate-400">$1.99/month</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Subscribe
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">Comments</p>
                      <p className="text-sm text-slate-400">$0.99/month</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Subscribe
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

