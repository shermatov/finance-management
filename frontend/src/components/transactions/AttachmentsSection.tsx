import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Paperclip, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttachments, useCreateAttachment, useDeleteAttachment } from "@/hooks/useAttachments";
import { getErrorMessage } from "@/lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AttachmentsSection({ transactionId }: { transactionId: string }) {
  const { t } = useTranslation();
  const { data: attachments, isLoading } = useAttachments(transactionId);
  const createAttachment = useCreateAttachment();
  const deleteAttachment = useDeleteAttachment();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("transactions.attachments.invalidType"));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t("transactions.attachments.tooLarge"));
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await readFileAsDataUrl(file);
      await createAttachment.mutateAsync({ transactionId, fileName: file.name, fileUrl, mimeType: file.type, sizeBytes: file.size });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAttachment.mutateAsync({ id, transactionId });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("transactions.attachments.title")}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Paperclip className="mr-1.5 h-3.5 w-3.5" />}
          {t("transactions.attachments.add")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t("common.pleaseWait")}</p>
      ) : !attachments || attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("transactions.attachments.empty")}</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {attachments.map((att) => (
            <div key={att.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border/60">
              <img src={att.fileUrl} alt={att.fileName} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(att.id)}
                aria-label={t("common.delete") ?? undefined}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
