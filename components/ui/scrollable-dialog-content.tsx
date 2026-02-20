import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const ScrollableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Header content (DialogTitle, DialogDescription, etc.) */
    header?: React.ReactNode;
    /** Footer content (buttons, etc.) - rendered outside scroll area */
    footer?: React.ReactNode;
  }
>(({ className, children, header, footer, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 flex max-h-[90vh] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] flex-col border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Close button */}
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm bg-background/80 p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>

      {/* Header - fixed at top with padding */}
      {header && (
        <div className="flex-shrink-0 border-b px-6 pt-6 pb-4">
          {header}
        </div>
      )}

      {/* Scrollable content area with consistent padding */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          {children}
        </div>
      </ScrollArea>

      {/* Footer - fixed at bottom with padding */}
      {footer && (
        <div className="flex-shrink-0 border-t bg-background px-6 py-4">
          {footer}
        </div>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
ScrollableDialogContent.displayName = "ScrollableDialogContent";

export { ScrollableDialogContent };
