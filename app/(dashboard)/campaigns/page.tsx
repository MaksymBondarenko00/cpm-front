'use client';

import { CampaignStatus } from '@/lib/api/campaigns';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth-context';
import {
  campaignService,
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@/lib/api/campaigns';
import { productService, Product } from '@/lib/api/products';
import { CampaignModal } from '@/components/campaigns/campaign-modal';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CampaignsPage() {
  const { account, refreshAccount } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  const fetchData = async () => {
    try {
      const [campaignsData, productsData] = await Promise.all([
        campaignService.getAll(),
        productService.getAll(),
      ]);
      setCampaigns(campaignsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setModalOpen(true);
  };

  const handleSave = async (
    data: CreateCampaignRequest | UpdateCampaignRequest,
    isEdit: boolean
  ) => {

    if (isEdit && editingCampaign) {

      await campaignService.update(
        editingCampaign.id,
        data as UpdateCampaignRequest
      )

    } else {

      await campaignService.create(
        data as CreateCampaignRequest
      )

    }

    await fetchData()
    await refreshAccount()

  }

  const handleDelete = async () => {
    if (campaignToDelete) {
      await campaignService.delete(campaignToDelete.id);
      await fetchData();
      await refreshAccount();
      setCampaignToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {

    const newStatus =
      campaign.status === CampaignStatus.ON
        ? CampaignStatus.OFF
        : CampaignStatus.ON;

    await campaignService.update(campaign.id, {
      status: newStatus,
    });

    await fetchData();
    await refreshAccount();

  };

  const confirmDelete = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Manage Campaigns</h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Bid Amount</TableHead>
                <TableHead>Fund</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Town</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No campaigns found. Create your first campaign!
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>{campaign.id}</TableCell>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.keywords.slice(0, 3).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-muted px-1.5 py-0.5 text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                        {campaign.keywords.length > 3 && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                            +{campaign.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${campaign.bidAmount.toFixed(2)}</TableCell>
                    <TableCell>${campaign.campaignFund.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${campaign.status === 'ON'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{campaign.town || '-'}</TableCell>
                    <TableCell>{campaign.radiusInKm} km</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(campaign)}
                          title={campaign.status === 'ON' ? 'Turn OFF' : 'Turn ON'}
                          className={
                            campaign.status === 'ON'
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(campaign)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(campaign)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <CampaignModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          campaign={editingCampaign}
          accountId={account?.id || 0}
          products={products}
          onSave={handleSave}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{campaignToDelete?.name}&quot;? The remaining
                campaign funds will be returned to your account balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
