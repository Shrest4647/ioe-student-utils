"use client";

import { type ComponentProps, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RatingCategory } from "@/components/universities/rating-dialog";
import { RatingDialog } from "@/components/universities/rating-dialog";

export function RateButton({
  onSubmit,
  categories,
  entityName,
  children,
  isSubmitting = false,
  ...buttonProps
}: Omit<ComponentProps<typeof Button>, "onClick" | "onSubmit"> & {
  onSubmit: (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => Promise<void> | void;
  categories: RatingCategory[];
  entityName: string;
  children?: React.ReactNode;
  isSubmitting?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <RatingDialog
        open={open}
        onOpenChange={setOpen}
        entityName={entityName}
        categories={categories}
        onSubmit={async (data) => {
          await onSubmit(data);
          setOpen(false);
        }}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
