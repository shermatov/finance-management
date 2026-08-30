import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Attachment } from "@/types";

export function useAttachments(transactionId: string | null) {
  return useQuery({
    queryKey: ["attachments", transactionId],
    queryFn: async () =>
      (await api.get<{ attachments: Attachment[] }>("/attachments", { params: { transactionId } })).data.attachments,
    enabled: !!transactionId,
  });
}

export interface AttachmentInput {
  transactionId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export function useCreateAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttachmentInput) =>
      (await api.post<{ attachment: Attachment }>("/attachments", input)).data.attachment,
    onSuccess: (_, input) => queryClient.invalidateQueries({ queryKey: ["attachments", input.transactionId] }),
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; transactionId: string }) => {
      await api.delete(`/attachments/${id}`);
    },
    onSuccess: (_, { transactionId }) => queryClient.invalidateQueries({ queryKey: ["attachments", transactionId] }),
  });
}
