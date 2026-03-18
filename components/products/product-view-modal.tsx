'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Product } from '@/lib/api/products';
import { Loader2, Package, DollarSign } from 'lucide-react';

interface ProductViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  loading?: boolean;
}

export function ProductViewModal({
  open,
  onOpenChange,
  product,
  loading = false,
}: ProductViewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Loading product...</p>
          </div>
        ) : product ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <DialogTitle>{product.name}</DialogTitle>
              </div>
              <DialogDescription>Product details</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">Description</h4>
                <p className="text-sm">{product.description || 'No description available'}</p>
              </div>
              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">Price</h4>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold">{product.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Product not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
