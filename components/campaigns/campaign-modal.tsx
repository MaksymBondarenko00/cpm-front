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
import { polishCities } from '@/lib/data/polishCities';

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

  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setErrors({})

  }, [campaign, open])



  const addKeyword = () => {

    const keyword = formData.keywordInput.trim()

    if (!keyword) return

    if (formData.keywords.includes(keyword)) return

    setFormData({
      ...formData,
      keywords: [...formData.keywords, keyword],
      keywordInput: '',
    })

  }

  const removeKeyword = (keyword: string) => {

    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword)
    })

  }

  const handleKeyDown = (e: React.KeyboardEvent) => {

    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }

  }

  const handleCityChange = (value: string) => {

    setFormData({ ...formData, town: value })

    if (!value) {
      setCitySuggestions([])
      return
    }

    const filtered = polishCities
      .filter(city => city.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 5)

    setCitySuggestions(filtered)

  }

  const selectCity = (city: string) => {

    setFormData({ ...formData, town: city })
    setCitySuggestions([])

  }


  const validate = () => {

    const newErrors: Record<string, string> = {}

    if (!isEdit && !formData.productId)
      newErrors.productId = 'Select a product'

    if (!formData.name.trim())
      newErrors.name = 'Campaign name is required'

    if (formData.keywords.length === 0)
      newErrors.keywords = 'Add at least one keyword'

    const bid = Number(formData.bidAmount)

    if (!bid || bid <= 0)
      newErrors.bidAmount = 'Bid must be greater than 0'

    const fund = Number(formData.campaignFund)

    if (!fund || fund <= 0)
      newErrors.campaignFund = 'Fund must be greater than 0'

    const radius = Number(formData.radiusInKm)

    if (!radius || radius <= 0)
      newErrors.radiusInKm = 'Radius must be positive'

    if (formData.town && !polishCities.includes(formData.town))
      newErrors.town = 'Select a valid Polish city'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0

  }



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    if (!validate()) return

    setErrors({})
    setLoading(true)

    try {

      if (isEdit && campaign) {

        const data: UpdateCampaignRequest = {
          name: formData.name,
          keywords: formData.keywords,
          bidAmount: parseFloat(formData.bidAmount),
          campaignFund: parseFloat(formData.campaignFund),
          town: formData.town || undefined,
          radiusInKm: parseInt(formData.radiusInKm)
        }

        await onSave(data, true)

      } else {

        const data: CreateCampaignRequest = {
          productId: parseInt(formData.productId),
          accountId,
          name: formData.name,
          keywords: formData.keywords,
          bidAmount: parseFloat(formData.bidAmount),
          campaignFund: parseFloat(formData.campaignFund),
          town: formData.town || undefined,
          radiusInKm: parseInt(formData.radiusInKm)
        }

        await onSave(data, false)

      }

      onOpenChange(false)

    } catch (error: any) {

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Campaign fund exceeds account balance"

      setErrors(prev => ({
        ...prev,
        campaignFund: message
      }))

    } finally {

      setLoading(false)

    }

  }



  return (

    <Dialog open={open} onOpenChange={onOpenChange}>

      <DialogContent className="sm:max-w-lg overflow-visible">
        <DialogHeader>

          <DialogTitle>
            {isEdit ? 'Edit Campaign' : 'Create Campaign'}
          </DialogTitle>

        </DialogHeader>



        <form onSubmit={handleSubmit} className="flex flex-col gap-4">


          {!isEdit && (

            <div className="flex flex-col gap-2">

              <Label>Product</Label>

              <Select
                value={formData.productId}
                onValueChange={(value) =>
                  setFormData({ ...formData, productId: value })
                }
              >
                <SelectTrigger className={errors.productId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>


                <SelectContent>

                  {products.map(product => (

                    <SelectItem
                      key={product.id}
                      value={product.id.toString()}
                    >
                      {product.name} - ${product.price.toFixed(2)}
                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

              {errors.productId &&
                <span className="text-sm text-red-500">{errors.productId}</span>
              }

            </div>

          )}



          <div className="flex flex-col gap-2">

            <Label>Campaign Name</Label>

            <Input
              className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              value={formData.name}
              onChange={e =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            {errors.name &&
              <span className="text-sm text-red-500">{errors.name}</span>
            }

          </div>



          <div className="flex flex-col gap-2">

            <Label>Keywords</Label>

            <div className="flex gap-2">

              <Input
                value={formData.keywordInput}
                onChange={e =>
                  setFormData({ ...formData, keywordInput: e.target.value })
                }
                onKeyDown={handleKeyDown}
                placeholder="Add keyword"
              />

              <Button type="button" variant="secondary" onClick={addKeyword}>
                Add
              </Button>

            </div>

            {errors.keywords &&
              <span className="text-sm text-red-500">{errors.keywords}</span>
            }

            <div className="flex flex-wrap gap-2 pt-2">

              {formData.keywords.map(keyword => (

                <span
                  key={keyword}
                  className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm"
                >

                  {keyword}

                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                  >
                    <X className="h-3 w-3" />
                  </button>

                </span>

              ))}

            </div>

          </div>



          <div className="grid grid-cols-2 gap-4">

            <div className="flex flex-col gap-2">

              <Label>Bid Amount ($)</Label>

              <Input
                type="number"
                step="0.01"
                className={errors.bidAmount ? "border-red-500 focus-visible:ring-red-500" : ""}
                value={formData.bidAmount}
                onChange={e =>
                  setFormData({ ...formData, bidAmount: e.target.value })
                }
              />

              {errors.bidAmount &&
                <span className="text-sm text-red-500">{errors.bidAmount}</span>
              }

            </div>



            <div className="flex flex-col gap-2">

              <Label>Campaign Fund ($)</Label>

              <Input
                type="number"
                step="0.01"
                className={errors.campaignFund ? "border-red-500 focus-visible:ring-red-500" : ""}
                value={formData.campaignFund}
                onChange={e =>
                  setFormData({ ...formData, campaignFund: e.target.value })
                }
              />

              {errors.campaignFund &&
                <span className="text-sm text-red-500">{errors.campaignFund}</span>
              }

            </div>

          </div>



          <div className="grid grid-cols-2 gap-4">

            <div className="flex flex-col gap-2">
              <Label>Town</Label>

              <div className="relative">

                <Input
                  className={errors.town ? "border-red-500 focus-visible:ring-red-500" : ""}
                  value={formData.town}
                  onFocus={() => setCitySuggestions(polishCities)}
                  onBlur={() => setTimeout(() => setCitySuggestions([]), 200)}
                  onChange={(e) => handleCityChange(e.target.value)}
                  placeholder="Warsaw"
                />

                {citySuggestions.length > 0 && (

                  <div className="absolute left-0 top-full mt-1 z-[999] w-full rounded-md border bg-background shadow-md max-h-[160px] overflow-y-auto">

                    {citySuggestions.map((city) => (

                      <div
                        key={city}
                        className="cursor-pointer px-3 py-2 hover:bg-muted"
                        onMouseDown={() => selectCity(city)}
                      >
                        {city}
                      </div>

                    ))}

                  </div>

                )}

              </div>

            </div>



            <div className="flex flex-col gap-2">

              <Label>Radius (km)</Label>

              <Input
                type="number"
                min="1"
                step="1"
                className={errors.radiusInKm ? "border-red-500 focus-visible:ring-red-500" : ""}
                value={formData.radiusInKm}
                onChange={(e) =>
                  setFormData({ ...formData, radiusInKm: e.target.value })
                }
              />

              {errors.radiusInKm &&
                <span className="text-sm text-red-500">{errors.radiusInKm}</span>
              }

            </div>

          </div>



          <DialogFooter>

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>

          </DialogFooter>

        </form>

      </DialogContent>

    </Dialog>

  )

}