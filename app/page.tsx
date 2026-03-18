'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { campaignService, Campaign, PageResponse } from '@/lib/api/campaigns';
import { accountService, AccountResponse } from '@/lib/api/accounts';
import { productService, Product } from '@/lib/api/products';
import { AuthModal } from '@/components/auth/auth-modal';
import { ProductViewModal } from '@/components/products/product-view-modal';
import { MousePointer, LogIn, LayoutDashboard, Search, MapPin, Loader2 } from 'lucide-react';
import { isAuthenticated } from '@/lib/api/client';

const PAGE_SIZE = 12;

export default function Home() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [clickingCampaignId, setClickingCampaignId] = useState<number | null>(null);
  const [currentAccount, setCurrentAccount] = useState<AccountResponse | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [townFilter, setTownFilter] = useState('');
  const [radiusFilter, setRadiusFilter] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const applyPageData = useCallback((response: PageResponse<Campaign>) => {
    setCampaigns(Array.isArray(response.content) ? response.content : []);
    setCurrentPage(response.number ?? 0);
    setTotalPages(response.totalPages ?? 0);
    setTotalElements(response.totalElements ?? 0);
  }, []);

  const fetchCurrentAccount = async () => {
    try {
      const account = await accountService.getByUser();
      setCurrentAccount(account);
    } catch (error) {
      console.error('Failed to fetch current account:', error);
      setCurrentAccount(null);
    }
  };

  const fetchCampaigns = useCallback(async (page = 0) => {
    try {
      setError(null);
      const data = await campaignService.getAllPublic({ page, size: PAGE_SIZE });
      applyPageData(data);
      setIsSearchMode(false);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Unable to connect to the API server. Make sure your backend is running on the configured API_URL.');
      setCampaigns([]);
      setCurrentPage(0);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [applyPageData]);

  const fetchCampaignsForUser = useCallback(async (page = 0) => {
    try {
      setError(null);
      const data = await campaignService.getAllForUser({ page, size: PAGE_SIZE });
      applyPageData(data);
      setIsSearchMode(false);
    } catch (err) {
      console.error('Failed to fetch campaigns for user, falling back to public:', err);
      try {
        const publicData = await campaignService.getAllPublic({ page, size: PAGE_SIZE });
        applyPageData(publicData);
        setIsSearchMode(false);
      } catch (publicErr) {
        console.error('Failed to fetch public campaigns:', publicErr);
        setError('Unable to connect to the API server. Make sure your backend is running on the configured API_URL.');
        setCampaigns([]);
        setCurrentPage(0);
        setTotalPages(0);
        setTotalElements(0);
      }
    } finally {
      setLoading(false);
    }
  }, [applyPageData]);

  const handleSearch = useCallback(async (page = 0) => {
    if (!searchQuery.trim()) {
      setCurrentPage(0);
      if (isLoggedIn) {
        await fetchCampaignsForUser(0);
      } else {
        await fetchCampaigns(0);
      }
      return;
    }

    setSearching(true);

    try {
      const params: { query: string; town?: string; radius?: number; page: number; size: number } = {
        query: searchQuery.trim(),
        page,
        size: PAGE_SIZE,
      };

      if (townFilter.trim()) {
        params.town = townFilter.trim();
      }

      if (radiusFilter && parseInt(radiusFilter, 10) > 0) {
        params.radius = parseInt(radiusFilter, 10);
      }

      const response: PageResponse<Campaign> = await campaignService.search(params);
      applyPageData(response);
      setIsSearchMode(true);
      setError(null);
    } catch (error) {
      console.error('Search failed:', error);
      setCampaigns([]);
      setCurrentPage(page);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, [searchQuery, townFilter, radiusFilter, isLoggedIn, fetchCampaigns, fetchCampaignsForUser, applyPageData]);

  useEffect(() => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);

    if (authenticated) {
      fetchCurrentAccount();
      fetchCampaignsForUser(0);
    } else {
      fetchCampaigns(0);
    }
  }, [fetchCampaigns, fetchCampaignsForUser]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setTownFilter('');
    setRadiusFilter('');
    setCurrentPage(0);

    if (isLoggedIn) {
      fetchCampaignsForUser(0);
    } else {
      fetchCampaigns(0);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchCurrentAccount();
    router.push('/dashboard');
  };

  const handleClick = async (campaign: Campaign) => {
    if (!isLoggedIn || !currentAccount) {
      alert('Please login to click on campaigns');
      return;
    }

    if (currentAccount.id === campaign.accountId) {
      alert('You cannot click on your own campaign');
      return;
    }

    setClickingCampaignId(campaign.id);

    try {
      await campaignService.registerClick(campaign.id);

      if (isSearchMode && searchQuery.trim()) {
        await handleSearch(currentPage);
      } else if (isLoggedIn) {
        await fetchCampaignsForUser(currentPage);
      } else {
        await fetchCampaigns(currentPage);
      }
    } catch (error) {
      console.error('Failed to register click:', error);
    } finally {
      setClickingCampaignId(null);
    }
  };

  const handleViewProduct = async (productId: number) => {
    setLoadingProduct(true);
    setProductModalOpen(true);

    try {
      const product = await productService.getById(productId);
      setSelectedProduct(product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setProductModalOpen(false);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 0 || page >= totalPages || page === currentPage || loading || searching) {
      return;
    }

    setLoading(true);

    if (isSearchMode) {
      handleSearch(page);
      return;
    }

    if (isLoggedIn) {
      fetchCampaignsForUser(page);
    } else {
      fetchCampaigns(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) {
      return null;
    }

    const pages = Array.from({ length: totalPages }, (_, index) => index);

    return (
      <div className="mt-8 space-y-2">
        <p className="text-center text-sm text-muted-foreground">
          Page {currentPage + 1} of {totalPages} · {totalElements} campaign{totalElements === 1 ? '' : 's'}
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#campaign-pagination"
                onClick={(event) => {
                  event.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className={currentPage === 0 ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>

            {pages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#campaign-pagination"
                  isActive={page === currentPage}
                  onClick={(event) => {
                    event.preventDefault();
                    handlePageChange(page);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#campaign-pagination"
                onClick={(event) => {
                  event.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className={currentPage >= totalPages - 1 ? 'pointer-events-none opacity-50' : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">Campaign Manager Platform</h1>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <Button onClick={() => router.push('/dashboard')}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => setAuthModalOpen(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                Login / Register
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="mb-2 text-3xl font-bold">Active Campaigns</h2>
        <p className="mb-6 text-muted-foreground">Browse all available advertising campaigns</p>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">Search keywords</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(0)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2 sm:w-auto">
                  <div className="flex-1 sm:w-40">
                    <Label htmlFor="town" className="sr-only">Town</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="town"
                        placeholder="Town (optional)"
                        value={townFilter}
                        onChange={(e) => setTownFilter(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-32">
                    <Label htmlFor="radius" className="sr-only">Radius</Label>
                    <Input
                      id="radius"
                      type="number"
                      placeholder="Radius km"
                      value={radiusFilter}
                      onChange={(e) => setRadiusFilter(e.target.value)}
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleSearch(0)} disabled={searching}>
                  {searching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>

                {isSearchMode && (
                  <Button variant="outline" onClick={handleClearSearch}>
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoggedIn && currentAccount && (
          <p className="mb-4 text-sm text-muted-foreground">
            Logged in. Click on campaigns to interact (you cannot click your own campaigns).
          </p>
        )}

        {!isLoggedIn && (
          <p className="mb-4 text-sm text-muted-foreground">
            Login to click on campaigns.
          </p>
        )}

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex-1">
                <p className="font-medium text-destructive">Connection Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  isLoggedIn
                    ? fetchCampaignsForUser(currentPage)
                    : fetchCampaigns(currentPage)
                }
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
          </div>
        ) : !error && campaigns.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {isSearchMode ? 'No campaigns found for your search.' : 'No active campaigns found.'}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => {
                const isOwnCampaign = currentAccount?.id === campaign.accountId;

                return (
                  <Card key={campaign.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>

                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            campaign.status === 'ON'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>

                      <CardDescription>
                        Bid: ${campaign.bidAmount.toFixed(2)} | Fund: ${campaign.campaignFund.toFixed(2)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-3">
                      <p className="text-sm text-muted-foreground">
                        Location: {campaign.town || 'Any'} ({campaign.radiusInKm} km)
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {campaign.keywords.slice(0, 5).map((keyword, idx) => (
                          <span key={idx} className="rounded-md bg-muted px-2 py-1 text-xs">
                            {keyword}
                          </span>
                        ))}

                        {campaign.keywords.length > 5 && (
                          <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            +{campaign.keywords.length - 5} more
                          </span>
                        )}
                      </div>

                      <div className="mt-auto flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(campaign.productId)}
                        >
                          View Product
                        </Button>

                        <Button
                          onClick={() => handleClick(campaign)}
                          disabled={
                            campaign.status !== 'ON' ||
                            clickingCampaignId === campaign.id ||
                            !isLoggedIn ||
                            isOwnCampaign
                          }
                          className="w-full"
                          variant={isOwnCampaign ? 'secondary' : 'default'}
                        >
                          <MousePointer className="mr-2 h-4 w-4" />

                          {clickingCampaignId === campaign.id
                            ? 'Clicking...'
                            : isOwnCampaign
                            ? 'Your Campaign'
                            : !isLoggedIn
                            ? 'Login to Click'
                            : 'Click'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div id="campaign-pagination">{renderPagination()}</div>
          </>
        )}
      </main>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      <ProductViewModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={selectedProduct}
        loading={loadingProduct}
      />
    </div>
  );
}
