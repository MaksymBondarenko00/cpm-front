'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '@/lib/api/campaigns';
import { Product } from '@/lib/api/products';
import { X } from 'lucide-react';

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: Campaign | null;
  accountId: number;
  products: Product[];
  onSave: (data: CreateCampaignRequest | UpdateCampaignRequest, isEdit: boolean) => Promise<void>;
}

export function CampaignModal({
  open,
  onOpenChange,
  campaign,
  accountId,
  products,
  onSave,
}: CampaignModalProps) {
  const isEdit = !!campaign;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    keywords: [] as string[],
    keywordInput: '',
    bidAmount: '',
    campaignFund: '',
    town: '',
    radiusInKm: '10',
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        productId: campaign.productId.toString(),
        name: campaign.name,
        keywords: campaign.keywords,
        keywordInput: '',
        bidAmount: campaign.bidAmount.toString(),
        campaignFund: campaign.campaignFund.toString(),
        town: campaign.town || '',
        radiusInKm: campaign.radiusInKm.toString(),
      });
    } else {
      setFormData({
        productId: '',
        name: '',
        keywords: [],
        keywordInput: '',
        bidAmount: '',
        campaignFund: '',
        town: '',
        radiusInKm: '10',
      });
    }
  }, [campaign, open]);

  const addKeyword = () => {
    const keyword = formData.keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword],
        keywordInput: '',
      });
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const data: UpdateCampaignRequest = {
          name: formData.name,
          keywords: formData.keywords,
          bidAmount: parseFloat(formData.bidAmount),
          campaignFund: parseFloat(formData.campaignFund),
          town: formData.town || undefined,
          radiusInKm: parseInt(formData.radiusInKm),
        };
        await onSave(data, true);
      } else {
        const data: CreateCampaignRequest = {
          productId: parseInt(formData.productId),
          accountId,
          name: formData.name,
          keywords: formData.keywords,
          bidAmount: parseFloat(formData.bidAmount),
          campaignFund: parseFloat(formData.campaignFund),
          town: formData.town || undefined,
          radiusInKm: parseInt(formData.radiusInKm),
        };
        await onSave(data, false);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - ${product.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="keywords">Keywords</Label>
            <div className="flex gap-2">
              <Input
                id="keywords"
                value={formData.keywordInput}
                onChange={(e) => setFormData({ ...formData, keywordInput: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="Add keyword and press Enter"
              />
              <Button type="button" variant="secondary" onClick={addKeyword}>
                Add
              </Button>
            </div>
            {formData.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="bidAmount">Bid Amount ($)</Label>
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.bidAmount}
                onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="campaignFund">Campaign Fund ($)</Label>
              <Input
                id="campaignFund"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.campaignFund}
                onChange={(e) => setFormData({ ...formData, campaignFund: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="town">Town (optional)</Label>
              <Input
                id="town"
                value={formData.town}
                onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                placeholder="e.g. New York"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="radius">Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                value={formData.radiusInKm}
                onChange={(e) => setFormData({ ...formData, radiusInKm: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
