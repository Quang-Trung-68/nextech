import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function collectEntries(specsJson) {
  if (!specsJson || typeof specsJson !== "object" || Array.isArray(specsJson)) {
    return [];
  }
  return Object.entries(specsJson).filter(
    ([, v]) => v != null && String(v).trim() !== "",
  );
}

/** Nút + dialog thông số kỹ thuật (specsJson từ API). Ẩn nếu không có dữ liệu. */
export function ProductSpecsButton({ specsJson, productName }) {
  const entries = collectEntries(specsJson);
  const [open, setOpen] = useState(false);

  if (entries.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 rounded-full border-dashed font-semibold text-foreground hover:bg-muted/80"
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="h-4 w-4 shrink-0 text-apple-blue" />
        Xem thông số kỹ thuật
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] gap-6 overflow-y-auto pt-6 sm:max-w-lg">
          <DialogHeader className="space-y-1 pb-1 text-left sm:text-left">
            <DialogTitle className="text-left leading-snug pr-10">
              Thông số kỹ thuật
              {productName ? (
                <span className="mt-2 block text-sm font-normal text-muted-foreground">
                  {productName}
                </span>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 rounded-xl border bg-muted/30">
            <table className="w-full text-sm">
              <tbody>
                {entries.map(([key, val]) => (
                  <tr
                    key={key}
                    className="border-b border-border/80 last:border-0"
                  >
                    <td className="w-[38%] max-w-[40%] py-2.5 pl-3 pr-2 align-top text-muted-foreground font-medium">
                      {key}
                    </td>
                    <td className="py-2.5 pr-3 align-top text-foreground">
                      {String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
